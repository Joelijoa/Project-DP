const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');
const { getAllReferentiels, getReferentielById, getReferentielStats, createReferentiel, deleteReferentiel } = require('../controllers/referentielController');

/**
 * @swagger
 * tags:
 *   name: Referentiels
 *   description: Gestion des référentiels (ISO 27001, DNSSI, personnalisés)
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
 *                         example: "NIS2"
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

/**
 * @swagger
 * /api/referentiels:
 *   post:
 *     summary: Créer un référentiel personnalisé avec sa structure complète
 *     description: Crée un référentiel avec ses domaines, objectifs et mesures en une seule transaction. Réservé aux administrateurs.
 *     tags: [Referentiels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom, type, domaines]
 *             properties:
 *               nom:
 *                 type: string
 *                 example: "NIS2"
 *               type:
 *                 type: string
 *                 example: "NIS2"
 *               version:
 *                 type: string
 *                 example: "2022"
 *               description:
 *                 type: string
 *                 example: "Directive européenne sur la cybersécurité"
 *               evaluation_config:
 *                 type: object
 *                 properties:
 *                   champs:
 *                     type: array
 *                     items: { type: string }
 *                     example: ["conformite", "maturite", "commentaire", "recommandation"]
 *                   conformite_options:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         value: { type: string }
 *                         label: { type: string }
 *                   maturite_max:
 *                     type: integer
 *                     example: 5
 *               domaines:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [code, nom]
 *                   properties:
 *                     code: { type: string, example: "1" }
 *                     nom:  { type: string, example: "Gouvernance" }
 *                     objectifs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         required: [code, description]
 *                         properties:
 *                           code:        { type: string, example: "1.1" }
 *                           description: { type: string, example: "Politique de sécurité" }
 *                           mesures:
 *                             type: array
 *                             items:
 *                               type: object
 *                               required: [code, description]
 *                               properties:
 *                                 code:        { type: string, example: "1.1.a" }
 *                                 description: { type: string, example: "Politique de sécurité des SI" }
 *     responses:
 *       201:
 *         description: Référentiel créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 id:      { type: integer }
 *       400:
 *         description: Paramètres manquants (nom, type ou domaines)
 *       403:
 *         description: Accès refusé — rôle admin requis
 *       500:
 *         description: Erreur lors de la création
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', verifyToken, verifyRole('admin'), createReferentiel);

/**
 * @swagger
 * /api/referentiels/{id}:
 *   delete:
 *     summary: Supprimer un référentiel personnalisé
 *     description: Supprime un référentiel personnalisé (is_custom = true) et toute sa structure. Les référentiels natifs (ISO 27001, DNSSI) ne peuvent pas être supprimés.
 *     tags: [Referentiels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du référentiel à supprimer
 *     responses:
 *       200:
 *         description: Référentiel supprimé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       403:
 *         description: Tentative de suppression d'un référentiel natif
 *       404:
 *         description: Référentiel non trouvé
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/:id', verifyToken, verifyRole('admin'), deleteReferentiel);

module.exports = router;
