const Notification = require('../models/Notification');

exports.listNotifications = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Auth required' });
        const notes = await Notification.find({ recipient: user._id }).sort({ createdAt: -1 }).lean();
        res.json({ success: true, notifications: notes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
