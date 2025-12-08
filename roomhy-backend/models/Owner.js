const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
    loginId: { type: String, required: true, unique: true },
    name: String,
    email: String,
    phone: String,
    address: String,
    locationCode: String, // e.g. area code like 'KO', 'IN'
    area: String, // human-friendly area name (Koramangala, Indiranagar)
    credentials: {
        password: String,
        firstTime: { type: Boolean, default: false }
    },
    kyc: {
        status: { type: String, default: 'pending' },
        aadharNumber: String,
        documentImage: String,
        verifiedAt: Date
    },
    isActive: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Owner', ownerSchema);
