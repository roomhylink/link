const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    loginId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        lowercase: true
    },
    phone: String,
    password: String,
    role: {
        type: String,
        enum: ['Marketing Team', 'Accounts Department', 'Maintenance Team', 'Customer Support', 'Custom'],
        default: 'Custom'
    },
    customRole: String, // For custom roles
    area: String,
    areaCode: String,
    city: String,
    locationCode: String,
    permissions: [String], // Array of permission strings
    parentLoginId: String, // For sub-employees
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

employeeSchema.index({ loginId: 1 });
employeeSchema.index({ area: 1, areaCode: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
