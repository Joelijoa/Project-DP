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
    soumettreAudit,
    validerAudit,
    rejeterAudit,
} = require('../controllers/auditController');
const { getSoA, saveSoA } = require('../controllers/soaController');
const { getPlanActions, createPlanAction, updatePlanAction, deletePlanAction, getAllPlanActions, soumettreValidationPlan, validerPlanAction, rejeterPlanAction } = require('../controllers/planActionController');

/**
 * @swagger
 * tags:
 *   name: Audits
 *   description: Gestion des audits et de leurs sous-ressources
 */

// Liste tous les audits
router.get('/', verifyToken, getAllAudits);

// Vue globale de tous les plans d'actions (avant /:id pour éviter le conflit)
router.get('/plans-actions', verifyToken, getAllPlanActions);

// Créer un audit (admin + auditeurs seniors)
router.post('/', verifyToken, verifyRole('admin', 'auditeur_senior'), createAudit);

// Détail d'un audit
router.get('/:id', verifyToken, getAuditById);

// Modifier un audit
router.put('/:id', verifyToken, updateAudit);

// Supprimer un audit
router.delete('/:id', verifyToken, verifyRole('admin'), deleteAudit);

// Récupérer les évaluations d'un audit
router.get('/:id/evaluations', verifyToken, getEvaluations);

// Sauvegarder (bulk upsert) les évaluations
router.put('/:id/evaluations', verifyToken, saveEvaluations);

// Déclaration d'Applicabilité (ISO 27001)
router.get('/:id/soa', verifyToken, getSoA);
router.put('/:id/soa', verifyToken, saveSoA);

// Workflow de validation
router.put('/:id/soumettre', verifyToken, soumettreAudit);
router.put('/:id/valider', verifyToken, verifyRole('admin', 'auditeur_senior'), validerAudit);
router.put('/:id/rejeter', verifyToken, verifyRole('admin', 'auditeur_senior'), rejeterAudit);

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

// Validation des plans d'actions
router.put('/:id/plans-actions/:planId/soumettre', verifyToken, soumettreValidationPlan);
router.put('/:id/plans-actions/:planId/valider', verifyToken, verifyRole('admin', 'auditeur_senior'), validerPlanAction);
router.put('/:id/plans-actions/:planId/rejeter', verifyToken, verifyRole('admin', 'auditeur_senior'), rejeterPlanAction);

module.exports = router;
