const VisitReport = require('../models/VisitReport');
const Notification = require('../models/Notification');
const User = require('../models/user');

// 1. Submit a visit report (Area Manager)
exports.submitVisit = async (req, res) => {
    try {
        const { name, address, locationCode, contactPhone, notes } = req.body;
        
        // Use authenticated user ID if available
        const areaManagerId = req.user ? req.user._id : (req.body.areaManager || null);

        if (!areaManagerId) {
             return res.status(401).json({ success: false, message: 'Unauthorized: Area Manager ID required' });
        }

        const report = await VisitReport.create({
            areaManager: areaManagerId,
            propertyInfo: { name, address, locationCode, contactPhone },
            notes,
            submittedToAdmin: true, 
            status: 'submitted',
            submittedAt: new Date()
        });

        return res.status(201).json({ success: true, report });
    } catch (err) {
        console.error("Submit Visit Error:", err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// 2. Get Pending Visits (Super Admin)
exports.getPendingVisits = async (req, res) => {
    try {
        const visits = await VisitReport.find({ status: 'submitted' })
            .populate('areaManager', 'name email') 
            .sort({ submittedAt: 1 })
            .lean();
        res.json({ success: true, visits });
    } catch (err) {
        console.error("Pending Visits Error:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// 3. Get My Reports (Area Manager)
exports.getMyVisits = async (req, res) => {
    try {
        // If auth middleware is used, req.user is set
        const visits = await VisitReport.find({ areaManager: req.user._id }).sort({ submittedAt: -1 });
        res.json({ success: true, visits });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Public fallbacks (for demo without auth middleware)
exports.submitVisitPublic = async (req, res) => {
    // Logic for demo submission without strict auth
    // ... (Implementation same as standard submit but relaxed checks)
    res.json({ success: true, message: "Demo submission received" }); 
};