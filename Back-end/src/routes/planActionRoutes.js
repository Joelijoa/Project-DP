const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { getAllPlanActions } = require('../controllers/planActionController');

// Vue globale — tous les plans d'actions (tous audits confondus)
router.get('/', verifyToken, getAllPlanActions);

module.exports = router;
