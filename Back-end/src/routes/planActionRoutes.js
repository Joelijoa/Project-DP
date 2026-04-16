const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { getAllPlanActions } = require('../controllers/planActionController');

/**
 * @swagger
 * tags:
 *   name: Plans d'actions
 *   description: Gestion des plans d'actions correctives (par audit ou vue globale)
 */

/**
 * @swagger
 * /api/audits/plans-actions:
 *   get:
 *     summary: Lister tous les plans d'actions (tous audits confondus)
 *     description: >
 *       Vue globale cross-audits. Cette route est enregistrée avant `/:id` dans auditRoutes
 *       pour éviter que le paramètre dynamique ne capte le segment "plans-actions".
 *     tags: [Plans d'actions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste complète des plans d'actions avec audit et mesure associés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plans_actions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PlanAction'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

module.exports = router;
