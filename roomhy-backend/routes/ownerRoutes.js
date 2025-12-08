const express = require('express');
const router = express.Router();
const Owner = require('../models/Owner');
const Property = require('../models/Property');
const Room = require('../models/Room');
const { protect, authorize } = require('../middleware/authMiddleware');

// 1. Create new owner (Preserved from original - used by enquiry approval/import)
router.post('/', async (req, res) => {
    try {
        console.log('📝 Owner POST request:', req.body);
        const owner = new Owner(req.body);
        await owner.save();
        console.log('✅ Owner created:', owner.loginId);
        res.status(201).json(owner);
    } catch (err) {
        console.error('❌ Owner POST error:', err.message);
        if (err.code === 11000) {
            // Duplicate key error - return existing owner to make POST idempotent
            try {
                const existing = await Owner.findOne({ loginId: req.body.loginId }).lean();
                if (existing) {
                    console.log('ℹ️ Owner POST duplicate detected; returning existing owner for', req.body.loginId);
                    return res.status(200).json(existing);
                }
            } catch (e) {
                console.error('❌ Error retrieving existing owner after duplicate:', e && e.message);
            }
            return res.status(409).json({ error: 'Owner ID already exists', code: 'DUPLICATE' });
        } else {
            res.status(400).json({ error: err.message });
        }
    }
});

// 2. List all owners (Updated for Dashboard & Area Manager Filtering)
// Supports: ?locationCode=KO (prefix match), ?kycStatus=verified, ?search=...
router.get('/', protect, async (req, res) => {
    try {
        const { locationCode, kycStatus, kyc, search } = req.query;
        let query = {};

        // Support both query param names for backward compatibility
        const statusFilter = kycStatus || kyc;

        // Area Based Filtering (Regex for prefix match, e.g., 'KO' matches 'KO01')
        if (locationCode) {
            query.locationCode = { $regex: `^${locationCode}`, $options: 'i' };
        }

        // KYC Status Filtering
        if (statusFilter) {
            query['kyc.status'] = statusFilter;
        }

        // Search functionality
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { loginId: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { 'profile.name': { $regex: search, $options: 'i' } }
            ];
        }

        const owners = await Owner.find(query).sort({ createdAt: -1 }).lean();
        // Wrap in object to match some frontend expectations, or return array if legacy
        res.json({ success: true, owners }); 
    } catch (err) {
        console.error('❌ Owner LIST error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 3. Get owner by loginId (Preserved)
router.get('/:loginId', protect, async (req, res) => {
    try {
        const owner = await Owner.findOne({ loginId: req.params.loginId });
        if (!owner) {
            return res.status(404).json({ error: 'Owner not found', loginId: req.params.loginId });
        }
        res.json(owner);
    } catch (err) {
        console.error('❌ Owner GET error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 4. Update Owner KYC Status (NEW - Super Admin Only)
router.patch('/:id/kyc', protect, authorize('superadmin'), async (req, res) => {
    try {
        const { id } = req.params; // Can be _id or loginId
        const { status } = req.body; // 'verified' or 'rejected'

        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Find by either Mongo ID or custom Login ID
        const owner = await Owner.findOne({ $or: [{ _id: id }, { loginId: id }] });
        if (!owner) return res.status(404).json({ message: 'Owner not found' });

        // Update Status
        if (!owner.kyc) owner.kyc = {};
        owner.kyc.status = status;
        
        if (status === 'verified') {
            owner.kyc.verifiedAt = new Date();
            owner.isActive = true; // Activate owner on verification
        } else {
            owner.isActive = false;
        }

        await owner.save();

        res.json({ success: true, message: `Owner KYC ${status}`, owner });
    } catch (err) {
        console.error('KYC Update Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 5. Update owner by loginId (Preserved - Used for Password Updates)
router.patch('/:loginId', async (req, res) => {
    try {
        console.log('✏️ Owner PATCH request for:', req.params.loginId);

        // Prepare update payload
        let updatePayload = { ...req.body };
        updatePayload.loginId = req.params.loginId;

        // If password is being updated, ensure flags are set correctly
        if (updatePayload.credentials && updatePayload.credentials.password) {
            updatePayload.credentials.firstTime = false;
            updatePayload.passwordSet = true;
        }

        // Use findOneAndUpdate with upsert so missing owners (from legacy local storage) are created
        const owner = await Owner.findOneAndUpdate(
            { loginId: req.params.loginId },
            { $set: updatePayload, $setOnInsert: { createdAt: new Date() } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        
        res.json(owner);
    } catch (err) {
        console.error('❌ Owner PATCH error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 6. Get rooms for owner by loginId (Preserved - Used by Dashboard)
router.get('/:loginId/rooms', async (req, res) => {
    try {
        const loginId = req.params.loginId;
        // Find properties owned by this owner
        const properties = await Property.find({ ownerLoginId: loginId }).select('_id title');
        const propertyIds = properties.map(p => p._id);

        // Find rooms that belong to those properties
        const rooms = await Room.find({ property: { $in: propertyIds } }).populate('property', 'title ownerLoginId');

        return res.json({ properties, rooms });
    } catch (err) {
        console.error('❌ Error fetching owner rooms:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;