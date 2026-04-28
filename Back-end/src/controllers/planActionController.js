const { PlanAction, Audit, Mesure, User, AuditAuditeur } = require('../models');
const { log, getIp } = require('../services/logService');
const { notifierUsers, notifierRole } = require('../services/notificationService');

// GET /api/audits/:id/plans-actions
const getPlanActions = async (req, res) => {
    try {
        const audit = await Audit.findByPk(req.params.id);
        if (!audit) return res.status(404).json({ message: 'Audit introuvable' });
        if (req.user.role === 'client' && audit.entite_id !== req.user.entite_id) {
            return res.status(403).json({ message: 'Accès refusé.' });
        }
        const plans = await PlanAction.findAll({
            where: { audit_id: req.params.id },
            include: [{ model: Mesure, as: 'mesure', attributes: ['id', 'code', 'description'] }],
            order: [['createdAt', 'DESC']],
        });
        res.json({ plans_actions: plans });
    } catch (error) {
        console.error('[PlanAction] getPlanActions:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// POST /api/audits/:id/plans-actions
const createPlanAction = async (req, res) => {
    try {
        const audit = await Audit.findByPk(req.params.id);
        if (!audit) return res.status(404).json({ message: 'Audit introuvable' });

        const { mesure_id, description_nc, action_corrective, responsable, delai, priorite, kpi } = req.body;
        const plan = await PlanAction.create({
            audit_id: parseInt(req.params.id),
            mesure_id, description_nc, action_corrective, responsable, delai, priorite, kpi,
            statut: 'a_faire',
        });
        log(req.user?.userId, 'CREATE_PLAN_ACTION', 'plan_action', plan.id, `Audit #${req.params.id}`, getIp(req));
        res.status(201).json({ plan_action: plan });
    } catch (error) {
        console.error('[PlanAction] createPlanAction:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/audits/:id/plans-actions/:planId
const updatePlanAction = async (req, res) => {
    try {
        const plan = await PlanAction.findByPk(req.params.planId);
        if (!plan) return res.status(404).json({ message: "Plan d'action introuvable" });

        const { description_nc, action_corrective, responsable, delai, priorite, statut, kpi } = req.body;
        await plan.update({ description_nc, action_corrective, responsable, delai, priorite, statut, kpi });
        log(req.user?.userId, 'UPDATE_PLAN_ACTION', 'plan_action', plan.id, `statut: ${statut || plan.statut}`, getIp(req));
        res.json({ plan_action: plan });
    } catch (error) {
        console.error('[PlanAction] updatePlanAction:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/audits/:id/plans-actions/:planId
const deletePlanAction = async (req, res) => {
    try {
        const plan = await PlanAction.findByPk(req.params.planId);
        if (!plan) return res.status(404).json({ message: "Plan d'action introuvable" });

        await plan.destroy();
        log(req.user?.userId, 'DELETE_PLAN_ACTION', 'plan_action', parseInt(req.params.planId), null, getIp(req));
        res.json({ message: "Plan d'action supprimé" });
    } catch (error) {
        console.error('[PlanAction] deletePlanAction:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// GET /api/audits/plans-actions  (vue globale tous audits)
const getAllPlanActions = async (req, res) => {
    try {
        const auditWhere = {};
        if (req.user.role === 'client') {
            if (!req.user.entite_id) return res.json({ plans_actions: [] });
            auditWhere.entite_id = req.user.entite_id;
        }
        const plans = await PlanAction.findAll({
            include: [
                { model: Mesure, as: 'mesure', attributes: ['id', 'code', 'description'] },
                { model: Audit,  as: 'audit',  where: Object.keys(auditWhere).length ? auditWhere : undefined,
                  attributes: ['id', 'nom', 'client'],
                  include: [{ model: User, as: 'auditeurs', attributes: ['id'], through: { attributes: [] } }] },
            ],
            order: [['createdAt', 'DESC']],
        });
        res.json({ plans_actions: plans });
    } catch (error) {
        console.error('[PlanAction] getAllPlanActions:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/audits/:id/plans-actions/:planId/soumettre
const soumettreValidationPlan = async (req, res) => {
    try {
        const plan = await PlanAction.findByPk(req.params.planId, {
            include: [{ model: Audit, as: 'audit', attributes: ['id', 'nom'] }],
        });
        if (!plan) return res.status(404).json({ message: "Plan d'action introuvable" });

        if (plan.statut_validation === 'en_attente') {
            return res.status(400).json({ message: 'Déjà en attente de validation.' });
        }

        await plan.update({ statut_validation: 'en_attente', commentaire_rejet: null });

        notifierRole(
            ['admin', 'auditeur_senior'],
            'PLAN_EN_ATTENTE',
            `Plan d'action en attente : ${plan.audit?.nom}`,
            `Un plan d'action de l'audit "${plan.audit?.nom}" est en attente de validation.`,
            plan.audit_id,
            plan.id
        ).catch(() => {});

        log(req.user?.userId, 'SOUMETTRE_PLAN', 'plan_action', plan.id, `Audit #${plan.audit_id}`, getIp(req));
        res.json({ message: "Plan d'action soumis pour validation." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/audits/:id/plans-actions/:planId/valider
const validerPlanAction = async (req, res) => {
    try {
        const plan = await PlanAction.findByPk(req.params.planId);
        if (!plan) return res.status(404).json({ message: "Plan d'action introuvable" });

        await plan.update({ statut_validation: 'valide', commentaire_rejet: null });

        const auditeurs = await AuditAuditeur.findAll({ where: { audit_id: plan.audit_id } });
        const ids = auditeurs.map(a => a.user_id);
        if (ids.length > 0) {
            notifierUsers(ids, 'PLAN_VALIDE', "Plan d'action validé", `Un plan d'action de l'audit #${plan.audit_id} a été validé.`, plan.audit_id, plan.id).catch(() => {});
        }

        log(req.user?.userId, 'VALIDER_PLAN', 'plan_action', plan.id, null, getIp(req));
        res.json({ message: "Plan d'action validé." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/audits/:id/plans-actions/:planId/rejeter
const rejeterPlanAction = async (req, res) => {
    try {
        const { commentaire } = req.body;
        if (!commentaire) return res.status(400).json({ message: 'Un commentaire de rejet est requis.' });

        const plan = await PlanAction.findByPk(req.params.planId);
        if (!plan) return res.status(404).json({ message: "Plan d'action introuvable" });

        await plan.update({ statut_validation: 'rejete', commentaire_rejet: commentaire });

        const auditeurs = await AuditAuditeur.findAll({ where: { audit_id: plan.audit_id } });
        const ids = auditeurs.map(a => a.user_id);
        if (ids.length > 0) {
            notifierUsers(ids, 'PLAN_REJETE', "Plan d'action rejeté", `Un plan d'action a été rejeté. Motif : ${commentaire}`, plan.audit_id, plan.id).catch(() => {});
        }

        log(req.user?.userId, 'REJETER_PLAN', 'plan_action', plan.id, null, getIp(req));
        res.json({ message: "Plan d'action rejeté." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getPlanActions, createPlanAction, updatePlanAction, deletePlanAction, getAllPlanActions, soumettreValidationPlan, validerPlanAction, rejeterPlanAction };
