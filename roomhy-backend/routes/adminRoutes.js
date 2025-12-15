const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const chatController = require('../controllers/chatController');
const agoraController = require('../controllers/agoraController');
const recordingController = require('../controllers/recordingController');
const notificationController = require('../controllers/notificationController');
const VisitReport = require('../models/VisitReport'); // Ensure model is imported
const { protect, authorize } = require('../middleware/authMiddleware');

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

// Dashboard stats
router.get('/stats', adminController.getStats);

// Import localStorage JSON -> MongoDB (protected). Accepts x-import-secret header OR superadmin auth
router.post('/import-local', adminController.importLocalData);

// Admin: Create a user (employee) - Super Admin only
router.post('/users', protect, authorize('superadmin'), adminController.createUser);

// Admin: Update a user by loginId - Super Admin only
router.patch('/users/:loginId', protect, authorize('superadmin'), adminController.updateUser);

// Chat endpoints: store/retrieve admin <-> employee chats
// Allow superadmin and area managers to access chats; controller will enforce area checks
router.get('/chats/:loginId', protect, authorize('superadmin','areamanager'), chatController.getConversation);
router.post('/chats/:loginId', protect, authorize('superadmin','areamanager'), chatController.postMessage);

// Upload recordings (meeting blobs). Protected route.
router.post('/recordings', protect, authorize('superadmin','areamanager'), recordingController.uploadRecording);

// Agora token endpoint (authenticated)
router.post('/agora/token', protect, agoraController.getToken);

// Notifications: create (managers) and list (superadmin)
router.post('/notifications', protect, notificationController.createNotification);
router.get('/notifications', protect, authorize('superadmin'), notificationController.getNotifications);
router.post('/notifications/:id/read', protect, authorize('superadmin'), notificationController.markRead);

module.exports = router;