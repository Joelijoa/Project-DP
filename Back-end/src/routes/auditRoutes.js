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
 *   - name: Audits
 *     description: Gestion des audits
 *   - name: Évaluations
 *     description: Niveaux de maturité par mesure
 *   - name: SoA
 *     description: Déclaration d'Applicabilité (ISO 27001)
 *   - name: Validation audits
 *     description: Workflow soumettre / valider / rejeter un audit
 */

/**
 * @swagger
 * /api/audits:
 *   get:
 *     summary: Lister tous les audits
 *     tags: [Audits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des audits
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 audits:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Audit'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', verifyToken, getAllAudits);

/**
 * @swagger
 * /api/audits/plans-actions:
 *   get:
 *     summary: Lister tous les plans d'actions (tous audits confondus)
 *     tags: [Plans d'actions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste globale des plans d'actions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plans_actions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PlanAction'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/plans-actions', verifyToken, getAllPlanActions);

/**
 * @swagger
 * /api/audits:
 *   post:
 *     summary: Créer un audit
 *     tags: [Audits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAuditRequest'
 *     responses:
 *       201:
 *         description: Audit créé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 audit:
 *                   $ref: '#/components/schemas/Audit'
 *       400:
 *         description: Champs requis manquants
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', verifyToken, verifyRole('admin', 'auditeur_senior'), createAudit);

/**
 * @swagger
 * /api/audits/{id}:
 *   get:
 *     summary: Détail d'un audit
 *     tags: [Audits]
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
 *         description: Audit trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 audit:
 *                   $ref: '#/components/schemas/Audit'
 *       404:
 *         description: Audit introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/:id', verifyToken, getAuditById);

/**
 * @swagger
 * /api/audits/{id}:
 *   put:
 *     summary: Modifier un audit
 *     description: |
 *       - **admin / auditeur_senior** : tous les champs + auditeurs_ids
 *       - **auditeur_junior** : uniquement `identification` et `indicateurs` (doit être assigné)
 *     tags: [Audits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom: { type: string }
 *               client: { type: string }
 *               perimetre: { type: string }
 *               date_debut: { type: string, format: date }
 *               date_fin: { type: string, format: date }
 *               identification: { type: object }
 *               indicateurs: { type: object }
 *               auditeurs_ids: { type: array, items: { type: integer } }
 *     responses:
 *       200:
 *         description: Audit mis à jour
 *       404:
 *         description: Audit introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id', verifyToken, updateAudit);

/**
 * @swagger
 * /api/audits/{id}:
 *   delete:
 *     summary: Supprimer un audit (admin uniquement)
 *     tags: [Audits]
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
 *         description: Audit supprimé
 *       404:
 *         description: Audit introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/:id', verifyToken, verifyRole('admin'), deleteAudit);

/**
 * @swagger
 * /api/audits/{id}/evaluations:
 *   get:
 *     summary: Récupérer les évaluations d'un audit
 *     tags: [Évaluations]
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
 *         description: Liste des évaluations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 evaluations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Evaluation'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/:id/evaluations', verifyToken, getEvaluations);

/**
 * @swagger
 * /api/audits/{id}/evaluations:
 *   put:
 *     summary: Sauvegarder les évaluations d'un audit (bulk upsert)
 *     description: Crée ou met à jour les évaluations. Passe le statut de `brouillon` à `en_cours` si nécessaire.
 *     tags: [Évaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SaveEvaluationsRequest'
 *     responses:
 *       200:
 *         description: Évaluations sauvegardées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 count: { type: integer }
 *       404:
 *         description: Audit introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/evaluations', verifyToken, saveEvaluations);

/**
 * @swagger
 * /api/audits/{id}/soa:
 *   get:
 *     summary: Récupérer la Déclaration d'Applicabilité (SoA)
 *     tags: [SoA]
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
 *         description: Entrées SoA
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 soa:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SoAEntry'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/:id/soa', verifyToken, getSoA);

/**
 * @swagger
 * /api/audits/{id}/soa:
 *   put:
 *     summary: Sauvegarder la Déclaration d'Applicabilité
 *     tags: [SoA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entries:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/SoAEntry'
 *     responses:
 *       200:
 *         description: SoA sauvegardée
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/soa', verifyToken, saveSoA);

/**
 * @swagger
 * /api/audits/{id}/soumettre:
 *   put:
 *     summary: Soumettre un audit pour validation
 *     description: Réservé aux auditeurs assignés. Passe `statut_validation` à `en_attente` et notifie les seniors/admins.
 *     tags: [Validation audits]
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
 *         description: Audit soumis pour validation
 *       400:
 *         description: Audit déjà en attente
 *       403:
 *         description: Non assigné à cet audit
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/soumettre', verifyToken, soumettreAudit);

/**
 * @swagger
 * /api/audits/{id}/valider:
 *   put:
 *     summary: Valider un audit (admin / auditeur_senior)
 *     description: Passe `statut_validation` à `valide` et `statut` à `termine`. Notifie les auditeurs assignés.
 *     tags: [Validation audits]
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
 *         description: Audit validé et clôturé
 *       404:
 *         description: Audit introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/valider', verifyToken, verifyRole('admin', 'auditeur_senior'), validerAudit);

/**
 * @swagger
 * /api/audits/{id}/rejeter:
 *   put:
 *     summary: Rejeter un audit (admin / auditeur_senior)
 *     description: Passe `statut_validation` à `rejete`. Un commentaire de rejet est obligatoire.
 *     tags: [Validation audits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [commentaire]
 *             properties:
 *               commentaire:
 *                 type: string
 *                 example: "Les évaluations de la section 5 sont incomplètes."
 *     responses:
 *       200:
 *         description: Audit rejeté
 *       400:
 *         description: Commentaire manquant
 *       404:
 *         description: Audit introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
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

/**
 * @swagger
 * tags:
 *   name: Validation plans
 *   description: Workflow soumettre / valider / rejeter un plan d'action
 */

/**
 * @swagger
 * /api/audits/{id}/plans-actions/{planId}/soumettre:
 *   put:
 *     summary: Soumettre un plan d'action pour validation
 *     tags: [Validation plans]
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
 *         description: Plan soumis pour validation
 *       400:
 *         description: Déjà en attente
 *       404:
 *         description: Plan introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/plans-actions/:planId/soumettre', verifyToken, soumettreValidationPlan);

/**
 * @swagger
 * /api/audits/{id}/plans-actions/{planId}/valider:
 *   put:
 *     summary: Valider un plan d'action (admin / auditeur_senior)
 *     tags: [Validation plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Plan validé
 *       404:
 *         description: Plan introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/plans-actions/:planId/valider', verifyToken, verifyRole('admin', 'auditeur_senior'), validerPlanAction);

/**
 * @swagger
 * /api/audits/{id}/plans-actions/{planId}/rejeter:
 *   put:
 *     summary: Rejeter un plan d'action (admin / auditeur_senior)
 *     tags: [Validation plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [commentaire]
 *             properties:
 *               commentaire:
 *                 type: string
 *                 example: "Action corrective insuffisante."
 *     responses:
 *       200:
 *         description: Plan rejeté
 *       400:
 *         description: Commentaire manquant
 *       404:
 *         description: Plan introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/plans-actions/:planId/rejeter', verifyToken, verifyRole('admin', 'auditeur_senior'), rejeterPlanAction);

module.exports = router;
