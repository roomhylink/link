const mongoose = require('mongoose');

const VisitReportSchema = new mongoose.Schema({
    areaManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    propertyInfo: {
        name: { type: String, required: true },
        address: { type: String },
        locationCode: { type: String, required: true },
        contactPhone: { type: String }
    },
    photos: [{ type: String }],
    notes: { type: String },
    
    // Status of the report
    status: { type: String, enum: ['submitted','pending','approved','rejected'], default: 'submitted' },
    
    // Store Generated Owner Credentials here
    generatedCredentials: {
        loginId: { type: String },
        tempPassword: { type: String }
    },
    // Link to created Property (if approved)
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },

    submittedAt: { type: Date, default: Date.now },
    submittedToAdmin: { type: Boolean, default: false }
});

module.exports = mongoose.model('VisitReport', VisitReportSchema);