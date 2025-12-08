const Owner = require('../models/Owner');
const Notification = require('../models/Notification');

// List Owners with Filtering (Area, KYC Status)
exports.getAllOwners = async (req, res) => {
    try {
        const { locationCode, kycStatus, search } = req.query;
        let query = {};

        // Area Based Filtering
        if (locationCode) {
            query.locationCode = { $regex: `^${locationCode}`, $options: 'i' };
        }

        // Status Filtering
        if (kycStatus) {
            query['kyc.status'] = kycStatus;
        }

        // Search
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { loginId: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { 'profile.name': { $regex: search, $options: 'i' } }
            ];
        }

        const owners = await Owner.find(query).sort({ createdAt: -1 }).lean();
        res.json({ success: true, owners });
    } catch (err) {
        console.error('Get Owners Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update Owner KYC Status (Super Admin Action)
exports.updateOwnerKyc = async (req, res) => {
    try {
        const { id } = req.params; // Can be _id or loginId
        const { status, rejectionReason } = req.body; // 'verified' or 'rejected'

        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const owner = await Owner.findOne({ $or: [{ _id: id }, { loginId: id }] });
        if (!owner) return res.status(404).json({ message: 'Owner not found' });

        owner.kyc.status = status;
        if (status === 'verified') {
            owner.kyc.verifiedAt = new Date();
            owner.isActive = true; // Activate owner on verification
        } else {
            owner.isActive = false;
        }

        await owner.save();

        // Send Notification to Owner (assuming Notification model exists)
        // Note: recipient needs to be the User _id associated if decoupled, 
        // but often Owner model implies a User. Adjust recipient as needed.
        // For now, we assume a notification system integration:
        // await Notification.create({
        //    recipient: owner.userId, // field linking to User model
        //    type: 'kyc_update',
        //    message: `Your KYC has been ${status}.`
        // });

        res.json({ success: true, message: `Owner KYC ${status}`, owner });
    } catch (err) {
        console.error('KYC Update Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get Single Owner
exports.getOwnerById = async (req, res) => {
    try {
        const owner = await Owner.findOne({ loginId: req.params.loginId });
        if (!owner) return res.status(404).json({ message: 'Owner not found' });
        res.json(owner);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};