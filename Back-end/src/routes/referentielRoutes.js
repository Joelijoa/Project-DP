const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { getAllReferentiels, getReferentielById, getReferentielStats } = require('../controllers/referentielController');

/**
 * @swagger
 * tags:
 *   name: Referentiels
 *   description: Gestion des référentiels (ISO 27001, DNSSI)
 */

/**
 * @swagger
 * /api/referentiels:
 *   get:
 *     summary: Lister tous les référentiels
 *     tags: [Referentiels]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des référentiels
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 referentiels:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nom:
 *                         type: string
 *                       version:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [ISO27001, DNSSI]
 */
router.get('/', verifyToken, getAllReferentiels);

/**
 * @swagger
 * /api/referentiels/{id}:
 *   get:
 *     summary: Détail d'un référentiel avec domaines, objectifs et mesures
 *     tags: [Referentiels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Référentiel avec arborescence complète
 *       404:
 *         description: Référentiel non trouvé
 */
router.get('/:id', verifyToken, getReferentielById);

/**
 * @swagger
 * /api/referentiels/{id}/stats:
 *   get:
 *     summary: Statistiques d'un référentiel (nombre de domaines, objectifs, mesures)
 *     tags: [Referentiels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Statistiques du référentiel
 *       404:
 *         description: Référentiel non trouvé
 */
router.get('/:id/stats', verifyToken, getReferentielStats);

module.exports = router;
