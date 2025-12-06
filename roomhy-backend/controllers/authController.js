const User = require('../models/user');
const Tenant = require('../models/Tenant');
const jwt = require('jsonwebtoken');

function generateToken(user) {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
}

// Login using email or loginId
exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body; // identifier = email or loginId
        if (!identifier || !password) return res.status(400).json({ message: 'Missing credentials' });
        const user = await User.findOne({ $or: [{ email: identifier }, { loginId: identifier }] });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        // Owners must login only using their generated loginId — disallow email-based login for owners
        if (user.role === 'owner' && identifier !== user.loginId) {
            return res.status(403).json({ message: 'Owners must login using their Owner ID' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = generateToken(user);
        res.json({ token, user: { id: user._id, name: user.name, role: user.role, loginId: user.loginId } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Verify owner temporary password (used by owner login UI)
exports.verifyOwnerTemp = async (req, res) => {
    try {
        const { loginId, tempPassword } = req.body;
        if (!loginId || !tempPassword) return res.status(400).json({ message: 'Missing fields' });

        const user = await User.findOne({ loginId });
        if (!user || user.role !== 'owner') return res.status(404).json({ message: 'Owner not found' });

        const ok = await user.matchPassword(tempPassword);
        if (!ok) return res.status(401).json({ message: 'Invalid temporary password' });

        // Verified — return success (no token yet)
        res.json({ success: true, message: 'Verified' });
    } catch (err) {
        console.error('verifyOwnerTemp error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Set new password for owner after verifying temp password
exports.setOwnerPassword = async (req, res) => {
    try {
        const { loginId, tempPassword, newPassword } = req.body;
        if (!loginId || !tempPassword || !newPassword) return res.status(400).json({ message: 'Missing fields' });

        const user = await User.findOne({ loginId });
        if (!user || user.role !== 'owner') return res.status(404).json({ message: 'Owner not found' });

        const ok = await user.matchPassword(tempPassword);
        if (!ok) return res.status(401).json({ message: 'Invalid temporary password' });

        user.password = newPassword; // will be hashed by pre-save hook
        await user.save();

        // Auto-login: return JWT on successful password set
        const token = generateToken(user);
        res.json({ success: true, token, user: { id: user._id, name: user.name, role: user.role, loginId: user.loginId } });
    } catch (err) {
        console.error('setOwnerPassword error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Verify tenant temporary password (used by tenant login UI)
exports.verifyTenantTemp = async (req, res) => {
    try {
        const { loginId, tempPassword } = req.body;
        if (!loginId || !tempPassword) return res.status(400).json({ message: 'Missing fields' });

        const user = await User.findOne({ loginId, role: 'tenant' });
        if (!user) return res.status(404).json({ success: false, message: 'Tenant not found' });

        const ok = await user.matchPassword(tempPassword);
        if (!ok) return res.status(401).json({ success: false, message: 'Invalid temporary password' });

        // Get tenant record for additional info
        const tenant = await Tenant.findOne({ loginId });

        res.json({ 
            success: true, 
            message: 'Verified',
            tenant: {
                id: tenant ? tenant._id : null,
                loginId: user.loginId,
                name: user.name,
                email: user.email,
                phone: user.phone
            }
        });
    } catch (err) {
        console.error('verifyTenantTemp error', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Set new password for tenant after verifying temp password
exports.setTenantPassword = async (req, res) => {
    try {
        const { loginId, tempPassword, newPassword } = req.body;
        if (!loginId || !tempPassword || !newPassword) return res.status(400).json({ success: false, message: 'Missing fields' });

        const user = await User.findOne({ loginId, role: 'tenant' });
        if (!user) return res.status(404).json({ success: false, message: 'Tenant not found' });

        const ok = await user.matchPassword(tempPassword);
        if (!ok) return res.status(401).json({ success: false, message: 'Invalid temporary password' });

        user.password = newPassword; // will be hashed by pre-save hook
        await user.save();

        // Auto-login: return JWT on successful password set
        const token = generateToken(user);
        res.json({ 
            success: true, 
            token, 
            user: { id: user._id, name: user.name, role: user.role, loginId: user.loginId } 
        });
    } catch (err) {
        console.error('setTenantPassword error', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Simple register (for testing). Admin should create owners in approval flow.
exports.register = async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;
        if (!name || !phone || !password) return res.status(400).json({ message: 'Missing fields' });
        const existing = await User.findOne({ $or: [{ email }, { phone }] });
        if (existing) return res.status(400).json({ message: 'User exists' });

        const user = await User.create({ name, email, phone, password, role: role || 'tenant' });
        const token = generateToken(user);
        res.status(201).json({ token, user: { id: user._id, name: user.name, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
