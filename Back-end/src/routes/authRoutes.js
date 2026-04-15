const express = require('express');
const router = express.Router();
const { login, forgot, resetPassword } = require('../controllers/authController');
const { body } = require('express-validator');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentification et gestion des tokens JWT
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     description: Authentifie un utilisateur avec son email et mot de passe, retourne un token JWT valable 24h.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Connexion réussie — token JWT retourné
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Email ou mot de passe incorrect
 */
router.post('/login', [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 6 }).withMessage('Mot de passe doit contenir au moins 6 caractères'),
], login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Demander une réinitialisation de mot de passe
 *     description: Envoie un email avec un lien de réinitialisation valable 1 heure. Ne révèle pas si l'email existe.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jean@example.com
 *     responses:
 *       200:
 *         description: Message générique (ne révèle pas si l'email existe)
 */
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Email invalide'),
], forgot);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Réinitialiser le mot de passe avec un token
 *     description: Utilise le token reçu par email pour définir un nouveau mot de passe.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, new_password]
 *             properties:
 *               token:
 *                 type: string
 *                 example: abc123def456...
 *               new_password:
 *                 type: string
 *                 minLength: 8
 *                 example: MonNouveauMdp!2024
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
 *       400:
 *         description: Lien invalide ou expiré
 */
router.post('/reset-password', [
    body('token').notEmpty().withMessage('Token requis'),
    body('new_password').isLength({ min: 8 }).withMessage('8 caractères minimum'),
], resetPassword);

module.exports = router;
