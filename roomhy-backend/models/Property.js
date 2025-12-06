const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
	title: { type: String, required: true },
	description: { type: String },
	address: { type: String },
	locationCode: { type: String, required: true },
	owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	ownerLoginId: { type: String },
	status: { type: String, enum: ['inactive','active','blocked'], default: 'inactive' },
	isPublished: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Property', PropertySchema);
