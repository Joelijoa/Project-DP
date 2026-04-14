const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');
const { getProfile, getAdminZone } = require('../controllers/userController');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestion des utilisateurs (nécessite un token JWT)
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Récupérer le profil de l'utilisateur connecté
 *     description: Retourne les informations du token JWT décodé (id, email, role). Accessible à tout utilisateur authentifié.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profil récupéré avec succès
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: jean@example.com
 *                     role:
 *                       type: string
 *                       example: admin
 *       401:
 *         description: Token manquant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Token invalide ou expiré
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/profile', verifyToken, getProfile);

/**
 * @swagger
 * /api/users/admin:
 *   get:
 *     summary: Zone réservée aux administrateurs
 *     description: Endpoint protégé accessible uniquement aux utilisateurs avec le rôle "admin".
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Accès admin accordé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bienvenue dans la zone admin !
 *       401:
 *         description: Token manquant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Token invalide, expiré, ou rôle insuffisant (non admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/admin', verifyToken, verifyRole('admin'), getAdminZone);

module.exports = router;
