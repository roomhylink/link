const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    from: { 
        type: String, 
        required: true, 
        index: true
    },
    to: { 
        type: String, 
        required: true, 
        index: true
    },
    message: { 
        type: String, 
        required: true
    },
    timestamp: { 
        type: Date, 
        default: Date.now,
        index: true
    },
    type: {
        type: String,
        enum: ['text', 'system', 'call', 'video', 'meeting'],
        default: 'text'
    },
    isEscalated: {
        type: Boolean,
        default: false
    },
    read: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, { timestamps: true });

// Index for efficient querying between two users
chatMessageSchema.index({ from: 1, to: 1, timestamp: -1 });
chatMessageSchema.index({ to: 1, timestamp: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
