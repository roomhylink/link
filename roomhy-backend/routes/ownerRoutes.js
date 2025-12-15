const express = require('express');
const router = express.Router();
const Owner = require('../models/Owner');
const Message = require('../models/Message');
const Property = require('../models/Property');
const Room = require('../models/Room');
const { protect, authorize } = require('../middleware/authMiddleware');
const ownerController = require('../controllers/ownercontroller');

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
router.get('/', protect, ownerController.getAllOwners);

// 3. Get owner by loginId (Preserved)
router.get('/:loginId', protect, ownerController.getOwnerById);

// 4. Update Owner KYC Status (NEW - Super Admin Only)
router.patch('/:id/kyc', protect, authorize('superadmin'), ownerController.updateOwnerKyc);

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

// POST /owners/:loginId/request-head
// Called by an authenticated owner to request escalation to Super Admin (head).
router.post('/:loginId/request-head', protect, async (req, res) => {
    try {
        const loginId = req.params.loginId;
        // only owner role should be allowed here
        if (!req.user || req.user.role !== 'owner' || req.user.loginId !== loginId) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const text = req.body.text || 'Owner requests to chat with Super Admin.';
        const time = req.body.time || new Date().toISOString();

        let convo = await Message.findOne({ participant: `owner:${loginId}` });
        if (!convo) {
            convo = new Message({ participant: `owner:${loginId}`, messages: [] });
        }

        // mark conversation as headOnly so only superadmin can reply
        convo.headOnly = true;
        convo.messages.push({ from: `owner:${loginId}`, text, time, createdAt: new Date() });
        convo.updatedAt = new Date();
        await convo.save();

        return res.json({ participant: convo.participant, messages: convo.messages });
    } catch (err) {
        console.error('Error in request-head:', err);
        res.status(500).json({ message: err.message });
    }
});