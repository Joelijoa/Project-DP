const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notifications in-app de l'utilisateur connecté
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Récupérer les notifications de l'utilisateur connecté
 *     description: Retourne les 50 dernières notifications, triées par date décroissante.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 non_lues:
 *                   type: integer
 *                   description: Nombre de notifications non lues
 *                   example: 3
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', verifyToken, getNotifications);

/**
 * @swagger
 * /api/notifications/lu:
 *   put:
 *     summary: Marquer toutes les notifications comme lues
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Toutes les notifications marquées comme lues
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/lu', verifyToken, markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}/lu:
 *   put:
 *     summary: Marquer une notification comme lue
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la notification
 *     responses:
 *       200:
 *         description: Notification marquée comme lue
 *       404:
 *         description: Notification introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/lu', verifyToken, markAsRead);

module.exports = router;
