const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');
const {
    getAllAudits,
    getAuditById,
    createAudit,
    updateAudit,
    deleteAudit,
    getEvaluations,
    saveEvaluations,
} = require('../controllers/auditController');
const { getSoA, saveSoA } = require('../controllers/soaController');
const { getPlanActions, createPlanAction, updatePlanAction, deletePlanAction } = require('../controllers/planActionController');

/**
 * @swagger
 * tags:
 *   name: Audits
 *   description: Gestion des audits et de leurs sous-ressources
 */

// Liste tous les audits
router.get('/', verifyToken, getAllAudits);

// Créer un audit (admin + auditeurs seniors)
router.post('/', verifyToken, verifyRole('admin', 'auditeur_senior'), createAudit);

// Détail d'un audit
router.get('/:id', verifyToken, getAuditById);

// Modifier un audit
router.put('/:id', verifyToken, verifyRole('admin', 'auditeur_senior'), updateAudit);

// Supprimer un audit
router.delete('/:id', verifyToken, verifyRole('admin'), deleteAudit);

// Récupérer les évaluations d'un audit
router.get('/:id/evaluations', verifyToken, getEvaluations);

// Sauvegarder (bulk upsert) les évaluations
router.put('/:id/evaluations', verifyToken, saveEvaluations);

// Déclaration d'Applicabilité (ISO 27001)
router.get('/:id/soa', verifyToken, getSoA);
router.put('/:id/soa', verifyToken, saveSoA);

// ─── Plans d'actions ────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/audits/{id}/plans-actions:
 *   get:
 *     summary: Lister les plans d'actions d'un audit
 *     tags: [Plans d'actions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'audit
 *     responses:
 *       200:
 *         description: Liste des plans d'actions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plans_actions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PlanAction'
 *       404:
 *         description: Audit introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/:id/plans-actions', verifyToken, getPlanActions);

/**
 * @swagger
 * /api/audits/{id}/plans-actions:
 *   post:
 *     summary: Créer un plan d'action pour un audit
 *     tags: [Plans d'actions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'audit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePlanActionRequest'
 *     responses:
 *       201:
 *         description: Plan d'action créé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plan_action:
 *                   $ref: '#/components/schemas/PlanAction'
 *       404:
 *         description: Audit introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/:id/plans-actions', verifyToken, createPlanAction);

/**
 * @swagger
 * /api/audits/{id}/plans-actions/{planId}:
 *   put:
 *     summary: Modifier un plan d'action
 *     tags: [Plans d'actions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'audit
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du plan d'action
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePlanActionRequest'
 *     responses:
 *       200:
 *         description: Plan d'action mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plan_action:
 *                   $ref: '#/components/schemas/PlanAction'
 *       404:
 *         description: Plan d'action introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/plans-actions/:planId', verifyToken, updatePlanAction);

/**
 * @swagger
 * /api/audits/{id}/plans-actions/{planId}:
 *   delete:
 *     summary: Supprimer un plan d'action
 *     tags: [Plans d'actions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'audit
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du plan d'action
 *     responses:
 *       200:
 *         description: Plan d'action supprimé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Plan d'action supprimé"
 *       404:
 *         description: Plan d'action introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/:id/plans-actions/:planId', verifyToken, deletePlanAction);

module.exports = router;
