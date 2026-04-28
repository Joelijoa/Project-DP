const { Audit, User, Referentiel, Mesure, Evaluation, AuditAuditeur, Entite } = require('../models');
const { log, getIp } = require('../services/logService');
const { notifierUsers, notifierRole } = require('../services/notificationService');

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
        const where = {};
        if (req.user.role === 'client') {
            if (!req.user.entite_id) return res.json({ audits: [] });
            where.entite_id = req.user.entite_id;
        }
        const audits = await Audit.findAll({
            where,
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
        if (req.user.role === 'client' && audit.entite_id !== req.user.entite_id) {
            return res.status(403).json({ message: 'Accès refusé.' });
        }
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
        // Auto-create or find entity from client name
        const [entite] = await Entite.findOrCreate({
            where: { nom: client.trim() },
            defaults: { nom: client.trim() },
        });
        const audit = await Audit.create({
            nom,
            client,
            perimetre,
            date_debut: date_debut || null,
            date_fin: date_fin || null,
            referentiel_id,
            entite_id: entite.id,
            identification: identification || null,
            created_by: req.user.userId,
            statut: 'brouillon',
        });
        if (auditeurs_ids && auditeurs_ids.length > 0) {
            await AuditAuditeur.bulkCreate(
                auditeurs_ids.map(uid => ({ audit_id: audit.id, user_id: uid }))
            );
            notifierUsers(
                auditeurs_ids,
                'AUDIT_ASSIGNE',
                `Nouvel audit assigné : ${audit.nom}`,
                `Vous avez été assigné à l'audit "${audit.nom}" (client : ${audit.client}).`,
                audit.id
            ).catch(() => {});
        }
        log(req.user.userId, 'CREATE_AUDIT', 'audit', audit.id, audit.nom, getIp(req));
        res.status(201).json({ message: 'Audit créé avec succès', audit, entite_created: created });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/audits/:id
const updateAudit = async (req, res) => {
    try {
        const role   = req.user.role;
        const userId = req.user.userId;

        // auditeur_junior : uniquement identification et indicateurs, seulement si assigné
        if (role === 'auditeur_junior') {
            const auditJr = await Audit.findByPk(req.params.id, {
                include: [{ model: User, as: 'auditeurs', attributes: ['id'], through: { attributes: [] } }],
            });
            if (!auditJr) return res.status(404).json({ message: 'Audit non trouvé' });
            const isAssigned = auditJr.auditeurs.some(a => a.id === userId) || auditJr.created_by === userId;
            if (!isAssigned) return res.status(403).json({ message: 'Vous n\'êtes pas assigné à cet audit.' });
            const { identification, indicateurs } = req.body;
            await auditJr.update({
                ...(identification !== undefined && { identification }),
                ...(indicateurs    !== undefined && { indicateurs    }),
            });
            log(userId, 'UPDATE_AUDIT', 'audit', auditJr.id, auditJr.nom, getIp(req));
            return res.json({ message: 'Audit mis à jour', audit: auditJr });
        }

        // client : aucune modification autorisée
        if (role === 'client') return res.status(403).json({ message: 'Droits insuffisants.' });

        const audit = await Audit.findByPk(req.params.id);
        if (!audit) return res.status(404).json({ message: 'Audit non trouvé' });

        const { nom, client, perimetre, date_debut, date_fin, statut, identification, indicateurs, entite_id, auditeurs_ids } = req.body;
        await audit.update({
            ...(nom !== undefined && { nom }),
            ...(client !== undefined && { client }),
            ...(perimetre !== undefined && { perimetre }),
            ...(date_debut !== undefined && { date_debut }),
            ...(date_fin !== undefined && { date_fin }),
            ...(statut !== undefined && { statut }),
            ...(identification !== undefined && { identification }),
            ...(indicateurs !== undefined && { indicateurs }),
            ...(entite_id !== undefined && { entite_id: entite_id || null }),
        });

        if (auditeurs_ids !== undefined) {
            const anciens = await AuditAuditeur.findAll({ where: { audit_id: audit.id } });
            const anciensIds = anciens.map(a => a.user_id);
            const nouveauxIds = auditeurs_ids.filter(id => !anciensIds.includes(id));

            await AuditAuditeur.destroy({ where: { audit_id: audit.id } });
            if (auditeurs_ids.length > 0) {
                await AuditAuditeur.bulkCreate(
                    auditeurs_ids.map(uid => ({ audit_id: audit.id, user_id: uid }))
                );
            }
            if (nouveauxIds.length > 0) {
                notifierUsers(
                    nouveauxIds,
                    'AUDIT_ASSIGNE',
                    `Nouvel audit assigné : ${audit.nom}`,
                    `Vous avez été assigné à l'audit "${audit.nom}" (client : ${audit.client}).`,
                    audit.id
                ).catch(() => {});
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

// PUT /api/audits/:id/soumettre — auditeur junior soumet pour validation
const soumettreAudit = async (req, res) => {
    try {
        const audit = await Audit.findByPk(req.params.id, {
            include: [{ model: User, as: 'auditeurs', attributes: ['id'], through: { attributes: [] } }],
        });
        if (!audit) return res.status(404).json({ message: 'Audit non trouvé' });

        const isAssigned = audit.auditeurs.some(a => a.id === req.user.userId) || audit.created_by === req.user.userId;
        if (!isAssigned) return res.status(403).json({ message: 'Vous n\'êtes pas assigné à cet audit.' });

        if (audit.statut_validation === 'en_attente') {
            return res.status(400).json({ message: 'Audit déjà en attente de validation.' });
        }

        await audit.update({ statut_validation: 'en_attente', commentaire_rejet: null });

        notifierRole(
            ['admin', 'auditeur_senior'],
            'AUDIT_EN_ATTENTE',
            `Audit en attente de validation : ${audit.nom}`,
            `L'audit "${audit.nom}" a été soumis pour validation et attend votre approbation.`,
            audit.id
        ).catch(() => {});

        log(req.user.userId, 'SOUMETTRE_AUDIT', 'audit', audit.id, audit.nom, getIp(req));
        res.json({ message: 'Audit soumis pour validation.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/audits/:id/valider — admin/senior valide
const validerAudit = async (req, res) => {
    try {
        const audit = await Audit.findByPk(req.params.id, {
            include: [{ model: User, as: 'auditeurs', attributes: ['id'], through: { attributes: [] } }],
        });
        if (!audit) return res.status(404).json({ message: 'Audit non trouvé' });

        await audit.update({ statut_validation: 'valide', statut: 'termine', commentaire_rejet: null });

        const auditeurIds = audit.auditeurs.map(a => a.id);
        if (auditeurIds.length > 0) {
            notifierUsers(
                auditeurIds,
                'AUDIT_VALIDE',
                `Audit validé : ${audit.nom}`,
                `L'audit "${audit.nom}" a été validé et marqué comme terminé.`,
                audit.id
            ).catch(() => {});
        }

        log(req.user.userId, 'VALIDER_AUDIT', 'audit', audit.id, audit.nom, getIp(req));
        res.json({ message: 'Audit validé et clôturé.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/audits/:id/rejeter — admin/senior rejette avec commentaire
const rejeterAudit = async (req, res) => {
    try {
        const { commentaire } = req.body;
        if (!commentaire) return res.status(400).json({ message: 'Un commentaire de rejet est requis.' });

        const audit = await Audit.findByPk(req.params.id, {
            include: [{ model: User, as: 'auditeurs', attributes: ['id'], through: { attributes: [] } }],
        });
        if (!audit) return res.status(404).json({ message: 'Audit non trouvé' });

        await audit.update({ statut_validation: 'rejete', commentaire_rejet: commentaire });

        const auditeurIds = audit.auditeurs.map(a => a.id);
        if (auditeurIds.length > 0) {
            notifierUsers(
                auditeurIds,
                'AUDIT_REJETE',
                `Audit rejeté : ${audit.nom}`,
                `L'audit "${audit.nom}" a été rejeté. Motif : ${commentaire}`,
                audit.id
            ).catch(() => {});
        }

        log(req.user.userId, 'REJETER_AUDIT', 'audit', audit.id, audit.nom, getIp(req));
        res.json({ message: 'Audit rejeté.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllAudits, getAuditById, createAudit, updateAudit, deleteAudit, getEvaluations, saveEvaluations, soumettreAudit, validerAudit, rejeterAudit };
