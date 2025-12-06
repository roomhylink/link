const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
    loginId: { type: String, required: true, unique: true },
    name: String,
    email: String,
    phone: String,
    address: String,
    locationCode: String,
    credentials: {
        password: String,
        firstTime: { type: Boolean, default: false }
    },
    kyc: {
        status: { type: String, default: 'pending' }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Owner', ownerSchema);
