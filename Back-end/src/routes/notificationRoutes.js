const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');

router.get('/', verifyToken, getNotifications);
router.put('/lu', verifyToken, markAllAsRead);
router.put('/:id/lu', verifyToken, markAsRead);

module.exports = router;
