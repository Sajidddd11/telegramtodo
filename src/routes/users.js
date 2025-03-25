const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all user routes
router.use(authMiddleware);

// GET /api/users/profile
router.get('/profile', userController.getUserProfile);

// PUT /api/users/profile
router.put('/profile', userController.updateUserProfile);

// PUT /api/users/change-password
router.put('/change-password', userController.changePassword);

module.exports = router; 