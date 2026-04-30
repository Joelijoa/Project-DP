const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');
const { getSettings, updateSettings } = require('../controllers/settingsController');

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Paramètres de l'application
 */

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Récupérer les paramètres de l'application
 *     description: Accessible à tous les utilisateurs authentifiés. Retourne org_nom, org_email et emails_enabled.
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Paramètres récupérés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 settings:
 *                   $ref: '#/components/schemas/Setting'
 *       401:
 *         description: Token manquant ou invalide
 */
router.get('/', verifyToken, getSettings);

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Mettre à jour les paramètres de l'application (admin uniquement)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               settings:
 *                 $ref: '#/components/schemas/Setting'
 *     responses:
 *       200:
 *         description: Paramètres mis à jour avec succès
 *       400:
 *         description: Corps invalide
 *       403:
 *         description: Droits insuffisants
 */
router.put('/', verifyToken, verifyRole('admin'), updateSettings);

module.exports = router;
