const express = require('express');
const router = express.Router();
const Owner = require('../models/Owner');
const Property = require('../models/Property');
const Room = require('../models/Room');

// Create new owner (from enquiry approval)
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

// List all owners (for admin interfaces)
router.get('/', async (req, res) => {
    try {
        // Support query params for filtering: ?kyc=pending|verified, ?locationCode=KO, ?search=term
        const q = {};
        if (req.query.kyc) q['kyc.status'] = req.query.kyc;
        if (req.query.locationCode) q.locationCode = { $regex: `^${req.query.locationCode}`, $options: 'i' };
        if (req.query.search) {
            const term = req.query.search;
            q.$or = [ { loginId: { $regex: term, $options: 'i' } }, { name: { $regex: term, $options: 'i' } }, { 'profile.name': { $regex: term, $options: 'i' } } ];
        }

        const owners = await Owner.find(q).lean();
        res.json(owners);
    } catch (err) {
        console.error('❌ Owner LIST error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Get owner by loginId
router.get('/:loginId', async (req, res) => {
    try {
        console.log('🔍 Owner GET request for:', req.params.loginId);
        console.log('📌 Searching in database...');
        const owner = await Owner.findOne({ loginId: req.params.loginId });
        if (!owner) {
            console.log('⚠️ Owner not found in DB for loginId:', req.params.loginId);
            // Also check if there are any owners at all
            const allOwners = await Owner.find({});
            console.log('📊 Total owners in DB:', allOwners.length);
            if (allOwners.length > 0) {
                console.log('🔎 First few owners:', allOwners.slice(0, 3).map(o => ({ loginId: o.loginId, id: o._id })));
            }
            return res.status(404).json({ error: 'Owner not found', loginId: req.params.loginId });
        }
        console.log('✅ Owner found:', owner.loginId, 'with ID:', owner._id);
        res.json(owner);
    } catch (err) {
        console.error('❌ Owner GET error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Update owner by loginId (PATCH for password updates)
router.patch('/:loginId', async (req, res) => {
    try {
        console.log('✏️ Owner PATCH request for:', req.params.loginId, 'payload:', JSON.stringify(req.body));
        console.log('📌 Attempting upsert (update or create) in database...');

        // Prepare update payload and ensure loginId is set for inserts
        let updatePayload = { ...req.body };
        updatePayload.loginId = req.params.loginId;

        // If password is being updated, ensure credentials.firstTime is set to false and passwordSet is set to true
        if (updatePayload.credentials && updatePayload.credentials.password) {
            updatePayload.credentials.firstTime = false;
            updatePayload.passwordSet = true;
        }

        // Use findOneAndUpdate with upsert so missing owners are created automatically
        const owner = await Owner.findOneAndUpdate(
            { loginId: req.params.loginId },
            { $set: updatePayload, $setOnInsert: { createdAt: new Date() } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        
        if (!owner) {
            console.error('❌ PATCH: findOneAndUpdate returned null (should not happen)');
            return res.status(500).json({ error: 'Update failed to return document' });
        }

        console.log('✅ PATCH/UPSERT: Owner updated or created successfully. New state:', JSON.stringify(owner, null, 2));
        res.json(owner);
    } catch (err) {
        console.error('❌ Owner PATCH error:', err.message, err.code);
        res.status(500).json({ error: err.message, errorCode: err.code });
    }
});

// Get rooms for owner by loginId
router.get('/:loginId/rooms', async (req, res) => {
    try {
        const loginId = req.params.loginId;
        console.log('🔍 Fetching rooms for owner loginId:', loginId);

        // Find properties owned by this owner (by ownerLoginId)
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
