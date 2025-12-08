const VisitReport = require('../models/VisitReport');
const Property = require('../models/Property');
const User = require('../models/user');
const Owner = require('../models/Owner');
const generateOwnerId = require('../utils/generateOwnerId');

exports.approveVisit = async (req, res) => {
    try {
        const visitId = req.params.id;
        const visit = await VisitReport.findById(visitId);
        
        if (!visit) return res.status(404).json({ success: false, message: 'Visit report not found' });
        if (visit.status === 'approved') return res.status(400).json({ success: false, message: 'Already approved' });

        const info = visit.propertyInfo || {};
        
        // 1. Generate Credentials
        const loginId = await generateOwnerId(info.locationCode || 'GEN');
        const tempPassword = Math.random().toString(36).slice(-8);

        // 2. Create User & Owner Profile
        const user = await User.create({
            name: info.ownerName || 'Owner',
            phone: info.contactPhone || '0000000000',
            password: tempPassword,
            role: 'owner',
            loginId: loginId,
            locationCode: info.locationCode,
            status: 'active'
        });

        await Owner.create({
            loginId: loginId,
            name: info.ownerName,
            phone: info.contactPhone,
            address: info.address,
            locationCode: info.locationCode,
            credentials: { password: tempPassword, firstTime: true },
            kyc: { status: 'pending' }
        });

        // 3. Create Property
        const property = await Property.create({
            title: info.name,
            address: info.address,
            locationCode: info.locationCode,
            status: 'inactive',
            owner: user._id,
            ownerLoginId: loginId
        });

        // 4. Update Visit Report (Crucial step for workflow)
        visit.status = 'approved';
        visit.generatedCredentials = { loginId, tempPassword };
        visit.property = property._id;
        await visit.save();

        return res.status(200).json({ 
            success: true, 
            message: 'Approved',
            loginId, 
            tempPassword 
        });

    } catch (err) {
        console.error("Approval Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Import localStorage JSON into MongoDB (owners, visits, tenants, properties)
exports.importLocalData = async (req, res) => {
    try {
        // Allow if request has valid import secret OR authenticated superadmin
        const importSecret = req.headers['x-import-secret'];
        const allowed = (importSecret && importSecret === process.env.IMPORT_SECRET) || (req.user && req.user.role === 'superadmin');
        if (!allowed) return res.status(401).json({ success: false, message: 'Not authorized to import data' });

        const payload = req.body || {};
        const Owner = require('../models/Owner');
        const VisitReport = require('../models/VisitReport');
        const Tenant = require('../models/Tenant');
        const Property = require('../models/Property');

        let ownersInserted = 0, visitsInserted = 0, tenantsInserted = 0, propertiesInserted = 0;

        // 1) Owners (expect object mapping loginId -> ownerData)
        const ownersDb = payload.roomhy_owners_db || {};
        for (const loginId of Object.keys(ownersDb)) {
            const o = ownersDb[loginId];
            const upsert = {
                loginId: loginId,
                name: o.profile?.name || o.name || o.profile?.ownerName || '',
                phone: o.profile?.phone || o.phone || '',
                address: o.profile?.address || o.address || '',
                locationCode: o.locationCode || o.profile?.locationCode || o.ownerArea || '',
                credentials: o.credentials || { password: o.password || '', firstTime: !!o.credentials?.firstTime },
                kyc: o.kyc || {},
                isActive: !!o.isActive
            };
            await Owner.findOneAndUpdate({ loginId }, { $set: upsert, $setOnInsert: { createdAt: new Date() } }, { upsert: true, new: true, setDefaultsOnInsert: true });
            ownersInserted++;
        }

        // 2) Visits (array)
        const visits = payload.roomhy_visits || [];
        for (const v of visits) {
            // prefer unique key generatedCredentials.loginId
            const filter = (v.generatedCredentials && v.generatedCredentials.loginId) ? { 'generatedCredentials.loginId': v.generatedCredentials.loginId } : { 'propertyInfo.name': v.propertyInfo?.name || '', 'propertyInfo.locationCode': v.propertyInfo?.locationCode || '' };
            await VisitReport.findOneAndUpdate(filter, { $set: v, $setOnInsert: { submittedAt: v.submittedAt || new Date() } }, { upsert: true, new: true });
            visitsInserted++;
        }

        // 3) Tenants (array)
        const tenants = payload.roomhy_tenants || payload.tenants || [];
        for (const t of tenants) {
            const tenantId = t.tenantId || t.id || t.loginId || t._id;
            if (!tenantId) continue;
            await Tenant.findOneAndUpdate({ $or: [{ tenantId }, { loginId: tenantId }] }, { $set: t, $setOnInsert: { createdAt: new Date() } }, { upsert: true, new: true });
            tenantsInserted++;
        }

        // 4) Properties (array)
        const properties = payload.roomhy_properties || payload.properties || [];
        for (const p of properties) {
            const filter = p._id ? { _id: p._id } : { title: p.title || p.name || '', locationCode: p.locationCode || p.location || '' };
            await Property.findOneAndUpdate(filter, { $set: p, $setOnInsert: { createdAt: new Date() } }, { upsert: true, new: true });
            propertiesInserted++;
        }

        return res.json({ success: true, ownersInserted, visitsInserted, tenantsInserted, propertiesInserted });
    } catch (err) {
        console.error('Import Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.rejectVisit = async (req, res) => {
    try {
        const visitId = req.params.id;
        const visit = await VisitReport.findById(visitId);
        if (!visit) return res.status(404).json({ success: false, message: 'Not found' });
        
        visit.status = 'rejected';
        await visit.save();
        
        return res.json({ success: true, message: 'Rejected' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Dashboard / Stats endpoint
exports.getStats = async (req, res) => {
    try {
        const areaCode = req.query.areaCode;

        const propFilter = {};
        const ownerFilter = {};
        const visitFilter = {};
        const tenantFilter = {};

        if (areaCode) {
            propFilter.locationCode = { $regex: `^${areaCode}`, $options: 'i' };
            ownerFilter.locationCode = { $regex: `^${areaCode}`, $options: 'i' };
            visitFilter['propertyInfo.locationCode'] = { $regex: `^${areaCode}`, $options: 'i' };
            tenantFilter.locationCode = { $regex: `^${areaCode}`, $options: 'i' };
        }

        const totalProperties = await Property.countDocuments(propFilter);
        const pendingApprovals = await VisitReport.countDocuments({ status: 'submitted', ...visitFilter });
        const activeOwners = await Owner.countDocuments({ 'kyc.status': 'verified', ...ownerFilter });
        const pendingOwners = await Owner.countDocuments({ 'kyc.status': 'pending', ...ownerFilter });
        const activeTenants = await require('../models/Tenant').countDocuments(tenantFilter);
        const enquiryCount = await VisitReport.countDocuments(visitFilter);

        // Area-wise breakdown (simple aggregation)
        const areaAggregation = await Property.aggregate([
            { $match: propFilter },
            { $group: { _id: '$locationCode', properties: { $sum: 1 } } }
        ]);

        res.json({
            totalProperties,
            pendingApprovals,
            activeOwners,
            pendingOwners,
            activeTenants,
            enquiryCount,
            areaAggregation
        });
    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Create a user (employee) - Super Admin only
exports.createUser = async (req, res) => {
    try {
        const { name, email, phone, password, role, loginId, locationCode } = req.body;
        if (!name || !phone || !password || !role) return res.status(400).json({ message: 'Missing fields' });

        // Check duplicates
        const existing = await User.findOne({ $or: [{ email }, { phone }, { loginId }] });
        if (existing) return res.status(409).json({ message: 'User already exists' });

        const user = await User.create({ name, email, phone, password, role, loginId, locationCode });
        const safeUser = { id: user._id, name: user.name, role: user.role, loginId: user.loginId, locationCode: user.locationCode };
        return res.status(201).json({ success: true, user: safeUser });
    } catch (err) {
        console.error('createUser error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Update user by loginId (Super Admin only)
exports.updateUser = async (req, res) => {
    try {
        const loginId = req.params.loginId;
        const payload = { ...req.body };
        // Prevent password being set directly here unless necessary
        if (payload.password) {
            // let mongoose pre-save hook hash if using save; otherwise set directly
        }
        const user = await User.findOneAndUpdate({ loginId }, { $set: payload }, { new: true });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        const safeUser = { id: user._id, name: user.name, role: user.role, loginId: user.loginId, locationCode: user.locationCode };
        return res.json({ success: true, user: safeUser });
    } catch (err) {
        console.error('updateUser error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};