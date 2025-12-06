const Tenant = require('../models/Tenant');
const User = require('../models/user');
const Property = require('../models/Property');
const generateTenantId = require('../utils/generateTenantId');
const crypto = require('crypto');

/**
 * Assign a tenant to a room
 * POST /api/tenants/assign
 * Body: { name, phone, email, propertyId, roomNo, bedNo, moveInDate, agreedRent }
 */
exports.assignTenant = async (req, res) => {
    try {
        const { name, phone, email, propertyId, roomNo, bedNo, moveInDate, agreedRent } = req.body;

        // Validation
        if (!name || !phone || !propertyId || !agreedRent) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Check if property exists
        const property = await Property.findById(propertyId).populate('owner');
        if (!property) {
            return res.status(404).json({ success: false, message: 'Property not found' });
        }

        // Get location code from property
        const locationCode = property.locationCode || 'GEN';

        // Generate unique tenant login ID
        const loginId = await generateTenantId(locationCode);

        // Generate temporary password (8 chars: mix of alphanumeric)
        const tempPassword = crypto.randomBytes(4).toString('hex').toUpperCase();

        // Create User record for tenant (role: 'tenant')
        const user = await User.create({
            name,
            email,
            phone,
            password: tempPassword, // Will be hashed by pre-save hook
            role: 'tenant',
            loginId,
            locationCode,
            status: 'active'
        });

        // Create Tenant record
        const tenant = await Tenant.create({
            name,
            phone,
            email,
            property: propertyId,
            roomNo,
            bedNo,
            moveInDate: moveInDate ? new Date(moveInDate) : null,
            agreedRent: parseInt(agreedRent),
            loginId,
            tempPassword, // Store for now; will be displayed once, then forgotten
            user: user._id,
            assignedBy: req.user ? req.user.id : property.owner._id, // Owner who assigned
            status: 'pending',
            kycStatus: 'pending'
        });

        // Populate for response
        await tenant.populate('property', 'title roomType');

        // Log notification for super admin
        console.log(`[TENANT ASSIGNED] ${name} (${loginId}) assigned to ${property.title}, Room ${roomNo}`);

        // TODO: Send email/SMS to tenant with loginId & tempPassword
        // For now, we return credentials in response for testing

        res.status(201).json({
            success: true,
            message: 'Tenant assigned successfully',
            tenant: {
                id: tenant._id,
                name: tenant.name,
                loginId: tenant.loginId,
                tempPassword: tenant.tempPassword, // Return once for display
                phone: tenant.phone,
                email: tenant.email,
                property: tenant.property,
                roomNo: tenant.roomNo,
                bedNo: tenant.bedNo,
                moveInDate: tenant.moveInDate,
                agreedRent: tenant.agreedRent
            }
        });

    } catch (error) {
        console.error('assignTenant error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

/**
 * Get all tenants (Super Admin)
 * GET /api/tenants
 */
exports.getAllTenants = async (req, res) => {
    try {
        const tenants = await Tenant.find()
            .populate('property', 'title locationCode')
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 });

        res.json({ success: true, tenants });
    } catch (error) {
        console.error('getAllTenants error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get tenants for owner (owned properties)
 * GET /api/tenants/owner/:ownerId
 */
exports.getTenantsByOwner = async (req, res) => {
    try {
        const { ownerId } = req.params;

        // Get all properties owned by this owner
        const properties = await Property.find({ owner: ownerId });
        const propertyIds = properties.map(p => p._id);

        // Get tenants assigned to these properties
        const tenants = await Tenant.find({ property: { $in: propertyIds } })
            .populate('property', 'title roomType')
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 });

        res.json({ success: true, tenants });
    } catch (error) {
        console.error('getTenantsByOwner error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get single tenant details
 * GET /api/tenants/:tenantId
 */
exports.getTenant = async (req, res) => {
    try {
        const { tenantId } = req.params;

        const tenant = await Tenant.findById(tenantId)
            .populate('property', 'title roomType locationCode owner')
            .populate('user', 'name email phone')
            .populate('assignedBy', 'name')
            .populate('verifiedBy', 'name');

        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }

        res.json({ success: true, tenant });
    } catch (error) {
        console.error('getTenant error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Verify tenant (Super Admin action)
 * POST /api/tenants/:tenantId/verify
 * Body: { kycApproved }
 */
exports.verifyTenant = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { kycApproved } = req.body;

        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }

        tenant.status = kycApproved ? 'active' : 'inactive';
        tenant.kycStatus = kycApproved ? 'verified' : 'rejected';
        tenant.verifiedBy = req.user ? req.user.id : null;
        tenant.verifiedAt = new Date();
        await tenant.save();

        res.json({
            success: true,
            message: `Tenant ${kycApproved ? 'verified' : 'rejected'} successfully`,
            tenant
        });
    } catch (error) {
        console.error('verifyTenant error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Update tenant KYC
 * POST /api/tenants/:tenantId/kyc
 * Body: { aadhar, idProofFile, addressProofFile }
 */
exports.updateTenantKyc = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { aadhar, idProofFile, addressProofFile } = req.body;

        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }

        if (!tenant.kyc) tenant.kyc = {};

        tenant.kyc.aadhar = aadhar || tenant.kyc.aadhar;
        tenant.kyc.idProofFile = idProofFile || tenant.kyc.idProofFile;
        tenant.kyc.addressProofFile = addressProofFile || tenant.kyc.addressProofFile;
        tenant.kyc.uploadedAt = new Date();
        tenant.kycStatus = 'submitted';

        await tenant.save();

        console.log(`[TENANT KYC UPLOADED] ${tenant.name} (${tenant.loginId})`);

        res.json({
            success: true,
            message: 'KYC updated successfully',
            tenant
        });
    } catch (error) {
        console.error('updateTenantKyc error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
