const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');
const { getLogs } = require('../controllers/logController');

/**
 * @swagger
 * tags:
 *   name: Journaux
 *   description: Journaux d'activité (admin uniquement)
 */

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Récupérer les journaux d'activité
 *     description: Accessible uniquement aux administrateurs. Retourne les actions effectuées par tous les utilisateurs.
 *     tags: [Journaux]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filtrer par type d'action (ex. CREATE_AUDIT)
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *         description: Filtrer par ressource (ex. audit, user)
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filtrer par utilisateur
 *     responses:
 *       200:
 *         description: Liste des logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Log'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Accès réservé à l'admin
 */
router.get('/', verifyToken, verifyRole('admin'), getLogs);

module.exports = router;
