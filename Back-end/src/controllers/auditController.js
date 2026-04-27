const { Audit, User, Referentiel, Mesure, Evaluation, AuditAuditeur } = require('../models');
const { log, getIp } = require('../services/logService');

const NIVEAUX_LABELS = ['Aucun', 'Initial', 'Reproductible', 'Défini', 'Maitrisé', 'Optimisé'];

const calcConformite = (niveau) => {
    if (niveau === null || niveau === undefined) return 'na';
    if (niveau <= 1) return 'non_conforme';
    if (niveau <= 3) return 'partiel';
    return 'conforme';
};

// GET /api/audits
const getAllAudits = async (req, res) => {
    try {
        const audits = await Audit.findAll({
            include: [
                { model: Referentiel, as: 'referentiel', attributes: ['id', 'nom', 'type'] },
                { model: User, as: 'createur', attributes: ['id', 'nom', 'prenom'] },
                { model: User, as: 'auditeurs', attributes: ['id', 'nom', 'prenom'], through: { attributes: [] } },
            ],
            order: [['createdAt', 'DESC']],
        });
        res.json({ audits });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/audits/:id
const getAuditById = async (req, res) => {
    try {
        const audit = await Audit.findByPk(req.params.id, {
            include: [
                { model: Referentiel, as: 'referentiel', attributes: ['id', 'nom', 'type'] },
                { model: User, as: 'createur', attributes: ['id', 'nom', 'prenom'] },
                { model: User, as: 'auditeurs', attributes: ['id', 'nom', 'prenom', 'email'], through: { attributes: [] } },
            ],
        });
        if (!audit) return res.status(404).json({ message: 'Audit non trouvé' });
        res.json({ audit });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/audits
const createAudit = async (req, res) => {
    try {
        const { nom, client, perimetre, date_debut, date_fin, referentiel_id, auditeurs_ids, identification } = req.body;
        if (!nom || !client || !referentiel_id) {
            return res.status(400).json({ message: 'nom, client et referentiel_id sont requis' });
        }
        const audit = await Audit.create({
            nom,
            client,
            perimetre,
            date_debut: date_debut || null,
            date_fin: date_fin || null,
            referentiel_id,
            identification: identification || null,
            created_by: req.user.userId,
            statut: 'brouillon',
        });
        if (auditeurs_ids && auditeurs_ids.length > 0) {
            await AuditAuditeur.bulkCreate(
                auditeurs_ids.map(uid => ({ audit_id: audit.id, user_id: uid }))
            );
        }
        log(req.user.userId, 'CREATE_AUDIT', 'audit', audit.id, audit.nom, getIp(req));
        res.status(201).json({ message: 'Audit créé avec succès', audit });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/audits/:id
const updateAudit = async (req, res) => {
    try {
        const audit = await Audit.findByPk(req.params.id);
        if (!audit) return res.status(404).json({ message: 'Audit non trouvé' });

        const { nom, client, perimetre, date_debut, date_fin, statut, identification, indicateurs, auditeurs_ids } = req.body;
        await audit.update({
            ...(nom !== undefined && { nom }),
            ...(client !== undefined && { client }),
            ...(perimetre !== undefined && { perimetre }),
            ...(date_debut !== undefined && { date_debut }),
            ...(date_fin !== undefined && { date_fin }),
            ...(statut !== undefined && { statut }),
            ...(identification !== undefined && { identification }),
            ...(indicateurs !== undefined && { indicateurs }),
        });

        if (auditeurs_ids !== undefined) {
            await AuditAuditeur.destroy({ where: { audit_id: audit.id } });
            if (auditeurs_ids.length > 0) {
                await AuditAuditeur.bulkCreate(
                    auditeurs_ids.map(uid => ({ audit_id: audit.id, user_id: uid }))
                );
            }
        }
        log(req.user.userId, 'UPDATE_AUDIT', 'audit', audit.id, audit.nom, getIp(req));
        res.json({ message: 'Audit mis à jour', audit });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/audits/:id
const deleteAudit = async (req, res) => {
    try {
        const audit = await Audit.findByPk(req.params.id);
        if (!audit) return res.status(404).json({ message: 'Audit non trouvé' });
        const nom = audit.nom;
        await audit.destroy();
        log(req.user.userId, 'DELETE_AUDIT', 'audit', parseInt(req.params.id), nom, getIp(req));
        res.json({ message: 'Audit supprimé' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/audits/:id/evaluations
const getEvaluations = async (req, res) => {
    try {
        const evaluations = await Evaluation.findAll({
            where: { audit_id: req.params.id },
            include: [{ model: Mesure, as: 'mesure', attributes: ['id', 'code', 'description', 'niveau_cible', 'objectif_id'] }],
        });
        res.json({ evaluations });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/audits/:id/evaluations  — bulk upsert
const saveEvaluations = async (req, res) => {
    try {
        const audit_id = parseInt(req.params.id);
        const audit = await Audit.findByPk(audit_id);
        if (!audit) return res.status(404).json({ message: 'Audit non trouvé' });

        const { evaluations } = req.body;
        if (!Array.isArray(evaluations)) {
            return res.status(400).json({ message: 'evaluations doit être un tableau' });
        }

        for (const ev of evaluations) {
            const conformite = calcConformite(ev.niveau_maturite);
            const [evaluation, created] = await Evaluation.findOrCreate({
                where: { audit_id, mesure_id: ev.mesure_id },
                defaults: {
                    audit_id,
                    mesure_id: ev.mesure_id,
                    niveau_maturite: ev.niveau_maturite,
                    conformite,
                    commentaire: ev.commentaire || null,
                    preuve: ev.preuve || null,
                    updated_by: req.user.userId,
                },
            });
            if (!created) {
                await evaluation.update({
                    niveau_maturite: ev.niveau_maturite,
                    conformite,
                    commentaire: ev.commentaire || null,
                    preuve: ev.preuve || null,
                    updated_by: req.user.userId,
                });
            }
        }

        // Passer statut en_cours si brouillon
        if (audit.statut === 'brouillon') {
            await audit.update({ statut: 'en_cours' });
        }

        res.json({ message: 'Évaluations sauvegardées', count: evaluations.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllAudits, getAuditById, createAudit, updateAudit, deleteAudit, getEvaluations, saveEvaluations };
