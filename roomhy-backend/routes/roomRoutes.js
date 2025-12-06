const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Owners add rooms
router.post('/', protect, authorize('owner'), roomController.createRoom);

module.exports = router;
