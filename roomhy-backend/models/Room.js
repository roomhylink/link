const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
	property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
	title: { type: String, required: true },
	type: { type: String, enum: ['single','double','suite','shared'], default: 'single' },
	beds: { type: Number, default: 1 },
	price: { type: Number, default: 0 },
	createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	status: { type: String, enum: ['inactive','active'], default: 'inactive' },
	createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', RoomSchema);
