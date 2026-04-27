const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');
const { getLogs } = require('../controllers/logController');

router.get('/', verifyToken, verifyRole('admin'), getLogs);

module.exports = router;
