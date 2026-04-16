const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');
const { getAllEntites, getEntiteById, createEntite, updateEntite, deleteEntite } = require('../controllers/entiteController');

/**
 * @swagger
 * tags:
 *   name: Entités
 *   description: Gestion des entités / organismes audités
 */

/**
 * @swagger
 * /api/entites:
 *   get:
 *     summary: Lister toutes les entités auditées
 *     tags: [Entités]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des entités avec leurs audits associés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entites:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Entite'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', verifyToken, getAllEntites);

/**
 * @swagger
 * /api/entites:
 *   post:
 *     summary: Créer une nouvelle entité
 *     tags: [Entités]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEntiteRequest'
 *     responses:
 *       201:
 *         description: Entité créée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entite:
 *                   $ref: '#/components/schemas/Entite'
 *       400:
 *         description: Nom requis
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', verifyToken, verifyRole('admin', 'auditeur_senior'), createEntite);

/**
 * @swagger
 * /api/entites/{id}:
 *   get:
 *     summary: Détail d'une entité avec ses audits
 *     tags: [Entités]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'entité
 *     responses:
 *       200:
 *         description: Entité avec audits et référentiels associés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entite:
 *                   $ref: '#/components/schemas/Entite'
 *       404:
 *         description: Entité introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/:id', verifyToken, getEntiteById);

/**
 * @swagger
 * /api/entites/{id}:
 *   put:
 *     summary: Modifier une entité
 *     tags: [Entités]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'entité
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEntiteRequest'
 *     responses:
 *       200:
 *         description: Entité mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entite:
 *                   $ref: '#/components/schemas/Entite'
 *       404:
 *         description: Entité introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id', verifyToken, verifyRole('admin', 'auditeur_senior'), updateEntite);

/**
 * @swagger
 * /api/entites/{id}:
 *   delete:
 *     summary: Supprimer une entité
 *     tags: [Entités]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'entité
 *     responses:
 *       200:
 *         description: Entité supprimée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Entité supprimée
 *       404:
 *         description: Entité introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/:id', verifyToken, verifyRole('admin'), deleteEntite);

module.exports = router;
