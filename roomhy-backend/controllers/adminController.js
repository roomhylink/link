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