const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const VisitReport = require('../models/VisitReport'); // Ensure model is imported

// Route to fetch visits (used by Enquiry page)
router.get('/visits', async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        const visits = await VisitReport.find(filter).populate('areaManager', 'name');
        res.json(visits);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route to approve visit
router.post('/approve-visit/:id', adminController.approveVisit);

// Route to reject visit
router.post('/reject-visit/:id', adminController.rejectVisit);

module.exports = router;