const Notification = require('../models/Notification');

exports.createNotification = async (req, res) => {
  try {
    const { toRole, toLoginId, from, type, meta } = req.body || {};
    if (!from || !type) return res.status(400).json({ message: 'from and type required' });

    const n = await Notification.create({ toRole: toRole || '', toLoginId: toLoginId || '', from, type, meta: meta || {}, read: false });
    return res.status(201).json({ success: true, notification: n });
  } catch (err) {
    console.error('createNotification error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    // Only allow Super Admin to fetch all notifications, optionally filter by unread
    const onlyUnread = req.query.unread === '1' || req.query.unread === 'true';
    const filter = {};
    if (onlyUnread) filter.read = false;
    // If user provided toLoginId query, filter for that
    if (req.query.toLoginId) filter.toLoginId = req.query.toLoginId;
    const notifs = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json(notifs);
  } catch (err) {
    console.error('getNotifications error', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'id required' });
    await Notification.findByIdAndUpdate(id, { read: true });
    res.json({ success: true });
  } catch (err) {
    console.error('markRead error', err);
    res.status(500).json({ success: false, message: err.message });
  }
};


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
