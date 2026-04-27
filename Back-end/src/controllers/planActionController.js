const { PlanAction, Audit, Mesure, User } = require('../models');
const { log, getIp } = require('../services/logService');

// GET /api/audits/:id/plans-actions
const getPlanActions = async (req, res) => {
    try {
        const audit = await Audit.findByPk(req.params.id);
        if (!audit) return res.status(404).json({ message: 'Audit introuvable' });

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
        const plans = await PlanAction.findAll({
            include: [
                { model: Mesure, as: 'mesure', attributes: ['id', 'code', 'description'] },
                { model: Audit,  as: 'audit',  attributes: ['id', 'nom', 'client'],
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

module.exports = { getPlanActions, createPlanAction, updatePlanAction, deletePlanAction, getAllPlanActions };
