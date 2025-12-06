const Room = require('../models/Room');
const Property = require('../models/Property');
const Notification = require('../models/Notification');
const User = require('../models/user');

// Owner adds a room to their property. Room is created with status 'inactive'.
exports.createRoom = async (req, res) => {
    try {
        const { propertyId, title, type, beds, price } = req.body;
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Auth required' });
        if (user.role !== 'owner') return res.status(403).json({ message: 'Only owners can add rooms' });

        const property = await Property.findById(propertyId);
        if (!property) return res.status(404).json({ message: 'Property not found' });
        if (!property.owner || property.owner.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'You can only add rooms to your assigned property' });
        }

        const room = await Room.create({ property: propertyId, title, type, beds, price, createdBy: user._id, status: 'inactive' });

        // Notify superadmins and area manager
        const notifications = [];
        const superAdmins = await User.find({ role: 'superadmin' }).lean();
        superAdmins.forEach(sa => notifications.push(Notification.create({ recipient: sa._id, type: 'room_added', message: `New room added to ${property.title}`, meta: { roomId: room._id, propertyId } })));
        if (property.owner) {
            // Also notify area manager(s) via VisitReport areaManager if available (best effort)
            // For simplicity, notify property.owner as well (owner will see their own action)
            notifications.push(Notification.create({ recipient: property.owner, type: 'room_added_owner', message: `Room added: ${title}`, meta: { roomId: room._id } }));
        }
        await Promise.all(notifications);

        return res.status(201).json({ success: true, room });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};
