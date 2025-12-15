const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');

/**
 * POST /api/chat/send
 * Send a message from one user to another
 * Body: { from, to, message, type, isEscalated, metadata }
 */
router.post('/send', async (req, res) => {
    try {
        const { from, to, message, type = 'text', isEscalated = false, metadata = null } = req.body;

        if (!from || !to || !message) {
            return res.status(400).json({ 
                error: 'Missing required fields: from, to, message' 
            });
        }

        const chatMessage = await ChatMessage.create({
            from,
            to,
            message,
            type,
            isEscalated,
            metadata,
            timestamp: new Date()
        });

        // Emit via Socket.IO if available so recipients get real-time updates
        try {
            const io = req.app && req.app.get && req.app.get('io');
            if (io) {
                // Broadcast to BOTH users' rooms
                io.to(from).emit('chat:message', chatMessage);
                io.to(to).emit('chat:message', chatMessage);
                console.log('Socket broadcast sent to rooms:', from, 'and', to);
            } else {
                console.warn('Socket.IO not available for broadcast');
            }
        } catch (e) { console.warn('Socket emit failed:', e && e.message); }

        return res.status(201).json({ success: true, data: chatMessage });
    } catch (err) {
        console.error('Chat send error:', err);
        return res.status(500).json({ 
            error: 'Failed to send message',
            details: err.message
        });
    }
});

/**
 * GET /api/chat/messages
 * Retrieve messages between two users
 * Query params: from, to, limit (default 100), skip (default 0)
 */
router.get('/messages', async (req, res) => {
    try {
        const { from, to, limit = 100, skip = 0 } = req.query;

        if (!from || !to) {
            return res.status(400).json({ 
                error: 'Missing required query params: from, to' 
            });
        }

        const messages = await ChatMessage.find({
            $or: [
                { from: from, to: to },
                { from: to, to: from }
            ]
        })
            .sort({ timestamp: 1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        return res.status(200).json({
            success: true,
            data: messages,
            count: messages.length
        });
    } catch (err) {
        console.error('Chat messages retrieval error:', err);
        return res.status(500).json({ 
            error: 'Failed to retrieve messages',
            details: err.message
        });
    }
});

/**
 * GET /api/chat/user/:userId
 * Get all conversation partners for a user (for contact list)
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Get all unique users this person has chatted with
        const conversations = await ChatMessage.aggregate([
            {
                $match: {
                    $or: [
                        { from: userId },
                        { to: userId }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$from', userId] },
                            '$to',
                            '$from'
                        ]
                    },
                    lastMessage: { $last: '$message' },
                    lastTimestamp: { $last: '$timestamp' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$to', userId] },
                                        { $eq: ['$read', false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $sort: { lastTimestamp: -1 }
            }
        ]);

        return res.status(200).json({
            success: true,
            data: conversations
        });
    } catch (err) {
        console.error('User conversations error:', err);
        return res.status(500).json({ 
            error: 'Failed to retrieve conversations',
            details: err.message
        });
    }
});

/**
 * POST /api/chat/read
 * Mark a message or conversation as read
 * Body: { from, to } - marks all messages from 'from' to 'to' as read
 */
router.post('/read', async (req, res) => {
    try {
        const { from, to } = req.body;

        if (!from || !to) {
            return res.status(400).json({ 
                error: 'Missing required fields: from, to' 
            });
        }

        const result = await ChatMessage.updateMany(
            { from: from, to: to, read: false },
            { read: true }
        );

        return res.status(200).json({
            success: true,
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        console.error('Mark read error:', err);
        return res.status(500).json({ 
            error: 'Failed to mark messages as read',
            details: err.message
        });
    }
});

/**
 * DELETE /api/chat/:messageId
 * Delete a specific message
 */
router.delete('/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;

        const result = await ChatMessage.findByIdAndDelete(messageId);

        if (!result) {
            return res.status(404).json({ 
                error: 'Message not found' 
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Message deleted'
        });
    } catch (err) {
        console.error('Delete message error:', err);
        return res.status(500).json({ 
            error: 'Failed to delete message',
            details: err.message
        });
    }
});

module.exports = router;

// Development-only: test reply endpoint to simulate messages from superadmin
router.post('/test-reply', async (req, res) => {
    try {
        const { to, message } = req.body;
        if (!to) return res.status(400).json({ error: 'Missing `to` in body' });

        const chatMessage = await ChatMessage.create({
            from: 'superadmin',
            to,
            message: message || 'Test reply from superadmin',
            type: 'text',
            timestamp: new Date()
        });

        // emit to recipient
        try {
            const io = req.app && req.app.get && req.app.get('io');
            if (io) io.to(to).emit('chat:message', chatMessage);
        } catch (e) { console.warn('Socket emit failed:', e && e.message); }

        return res.status(201).json({ success: true, data: chatMessage });
    } catch (err) {
        console.error('Test reply error:', err);
        return res.status(500).json({ error: 'Failed to create test reply', details: err.message });
    }
});
