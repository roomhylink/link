const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String }, // Optional for Owners/Tenants who use ID
    phone: { type: String, required: true },
    password: { type: String, required: true },
    
    role: { 
        type: String, 
        enum: ['superadmin', 'areamanager', 'owner', 'tenant'], 
        default: 'tenant' 
    },

    // Special Login IDs (e.g., KO01, RHY-8821)
    loginId: { type: String, unique: true, sparse: true },
    
    // For Area Managers & Owners (e.g., "KO" for Kota)
    locationCode: { type: String }, 
    
    // For Owners created via Visit
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
    
    profilePic: { type: String },
    createdAt: { type: Date, default: Date.now }
});

// Encrypt password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Check password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);