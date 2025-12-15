const Message = require('../models/Message');
const Tenant = require('../models/Tenant');
const Owner = require('../models/Owner');
const Property = require('../models/Property');
const User = require('../models/user');

// GET conversation for a given participant (employee loginId)
exports.getConversation = async (req, res) => {
  try {
    const participant = req.params.loginId;
    if (!participant) return res.status(400).json({ message: 'loginId required' });

    // Authorization checks for area managers: allow superadmin full access,
    // areamanager only for group:{theirArea}, their own personal chats, or tenant/owner within their area.
    const requester = req.user; // set by protect middleware
    if (requester && requester.role === 'areamanager') {
      const parts = participant.split(':');
      const kind = parts[0];
      const idPart = parts.slice(1).join(':');

      if (kind === 'group') {
        const area = idPart;
        if (!area || area !== requester.locationCode) {
          return res.status(403).json({ message: 'Forbidden: not allowed to access this group' });
        }
      } else if (kind === 'tenant') {
        const tenantId = idPart;
        const tenant = await Tenant.findById(tenantId).populate('property');
        if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
        const prop = tenant.property;
        if (!prop || (prop.locationCode !== requester.locationCode)) {
          return res.status(403).json({ message: 'Forbidden: tenant not in your area' });
        }
      } else if (kind === 'owner') {
        const ownerId = idPart;
        let owner = null;
        try { owner = await Owner.findById(ownerId); } catch(e) { }
        if (!owner) {
          // try lookup by loginId
          owner = await Owner.findOne({ loginId: ownerId });
        }
        if (!owner) return res.status(404).json({ message: 'Owner not found' });
        if (owner.locationCode !== requester.locationCode) {
          return res.status(403).json({ message: 'Forbidden: owner not in your area' });
        }
      } else {
        // treat as personal chat id (loginId). Allow if requested user is in manager's area
        const other = await User.findOne({ loginId: participant });
        if (!other) return res.status(404).json({ message: 'User not found' });
        // allow communicating with superadmin regardless of area
        if (other.role !== 'superadmin' && other.locationCode !== requester.locationCode) {
          return res.status(403).json({ message: 'Forbidden: user not in your area' });
        }
      }
    }

    let convo = await Message.findOne({ participant });
    if (!convo) {
      convo = new Message({ participant, messages: [] });
      await convo.save();
    }

    // If the conversation has been marked as headOnly (owner/tenant requested head),
    // only Super Admin should be allowed to read it.
    if (convo.headOnly && (!req.user || req.user.role !== 'superadmin')) {
      return res.status(403).json({ message: 'Conversation reserved for Super Admin only.' });
    }

    res.json({ participant: convo.participant, messages: convo.messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// POST a message to a participant conversation
exports.postMessage = async (req, res) => {
  try {
    const participant = req.params.loginId;
    const payload = req.body || {};
    const from = payload.from;
    if (!participant || !from) return res.status(400).json({ message: 'participant and from required' });

    // Authorization checks (same rules as GET)
    const requester = req.user;
    if (requester && requester.role === 'areamanager') {
      const parts = participant.split(':');
      const kind = parts[0];
      const idPart = parts.slice(1).join(':');

      if (kind === 'group') {
        const area = idPart;
        if (!area || area !== requester.locationCode) {
          return res.status(403).json({ message: 'Forbidden: not allowed to post to this group' });
        }
      } else if (kind === 'tenant') {
        const tenantId = idPart;
        const tenant = await Tenant.findById(tenantId).populate('property');
        if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
        const prop = tenant.property;
        if (!prop || (prop.locationCode !== requester.locationCode)) {
          return res.status(403).json({ message: 'Forbidden: tenant not in your area' });
        }
      } else if (kind === 'owner') {
        const ownerId = idPart;
        let owner = null;
        try { owner = await Owner.findById(ownerId); } catch(e) { }
        if (!owner) {
          owner = await Owner.findOne({ loginId: ownerId });
        }
        if (!owner) return res.status(404).json({ message: 'Owner not found' });
        if (owner.locationCode !== requester.locationCode) {
          return res.status(403).json({ message: 'Forbidden: owner not in your area' });
        }
      } else {
        const other = await User.findOne({ loginId: participant });
        if (!other) return res.status(404).json({ message: 'User not found' });
        if (other.role !== 'superadmin' && other.locationCode !== requester.locationCode) {
          return res.status(403).json({ message: 'Forbidden: user not in your area' });
        }
      }
    }

    let convo = await Message.findOne({ participant });
    if (!convo) {
      convo = new Message({ participant, messages: [] });
    }

    // If the conversation has been marked as headOnly, only Super Admin can post replies
    if (convo.headOnly && (!requester || requester.role !== 'superadmin')) {
      return res.status(403).json({ message: 'Conversation reserved for Super Admin only.' });
    }

    // Accept arbitrary payloads for messages (type, meta, etc.)
    const msg = Object.assign({}, payload, { createdAt: new Date(), type: payload.type || (payload.text ? 'text' : 'system') });
    convo.messages.push(msg);
    convo.updatedAt = new Date();
    await convo.save();

    res.json({ participant: convo.participant, messages: convo.messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
