const Audit = require('../models/Audit');
const { log, getIp } = require('../services/logService');
const { notifierUsers, notifierRole } = require('../services/notificationService');
const { User } = require('../models');

// Helper : notifie le(s) client(s) lié(s) à l'entité de l'audit
const notifierClient = async (audit, type, titre, message) => {
    if (!audit.entite_id) return;
    const clients = await User.findAll({ where: { entite_id: audit.entite_id, role: 'client' }, attributes: ['id'] });
    const ids = clients.map(u => u.id);
    if (ids.length > 0) notifierUsers(ids, type, titre, message, audit.id).catch(() => {});
};

// ─── Planning (fin Cadrage) ────────────────────────────────────────────────────

// PUT /api/audits/:id/validation-planning/soumettre  (admin/senior)
const soumettreValidationPlanning = async (req, res) => {
    try {
        const audit = await Audit.findByPk(req.params.id);
        if (!audit) return res.status(404).json({ message: 'Audit non trouvé.' });

        await audit.update({
            validation_planning: { statut: 'en_attente', commentaire: null, date: new Date().toISOString() },
        });

        await notifierClient(audit, 'AUDIT_ASSIGNE',
            `Planning d'audit à valider : ${audit.nom}`,
            `Le planning de l'audit "${audit.nom}" a été soumis pour votre validation.`
        );
        log(req.user.userId, 'validation_planning_soumettre', 'audit', audit.id, audit.nom, getIp(req));

        const updated = await Audit.findByPk(audit.id);
        res.json({ audit: updated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/audits/:id/validation-planning/repondre  (client)
const repondreValidationPlanning = async (req, res) => {
    try {
        if (req.user.role !== 'client')
            return res.status(403).json({ message: 'Réservé au rôle client.' });

        const { action, commentaire } = req.body;
        if (!['valider', 'demander_modification'].includes(action))
            return res.status(400).json({ message: 'Action invalide.' });
        if (action === 'demander_modification' && !commentaire)
            return res.status(400).json({ message: 'Un commentaire est requis pour demander une modification.' });

        const audit = await Audit.findByPk(req.params.id);
        if (!audit) return res.status(404).json({ message: 'Audit non trouvé.' });

        if (audit.entite_id !== req.user.entite_id)
            return res.status(403).json({ message: 'Accès refusé.' });

        const statut = action === 'valider' ? 'valide' : 'modification_demandee';
        await audit.update({
            validation_planning: { statut, commentaire: commentaire || null, date: new Date().toISOString() },
        });

        const msgTitre = action === 'valider'
            ? `Planning validé par le client : ${audit.nom}`
            : `Modification demandée sur le planning : ${audit.nom}`;
        const msgBody = action === 'valider'
            ? `Le client a validé le planning de l'audit "${audit.nom}".`
            : `Le client demande des modifications sur le planning de l'audit "${audit.nom}". Motif : ${commentaire}`;

        notifierRole(['admin', 'auditeur_senior'], 'AUDIT_VALIDE', msgTitre, msgBody, audit.id).catch(() => {});
        log(req.user.userId, `validation_planning_${action}`, 'audit', audit.id, audit.nom, getIp(req));

        const updated = await Audit.findByPk(audit.id);
        res.json({ audit: updated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Rapport final (phase Terminé) ────────────────────────────────────────────

// PUT /api/audits/:id/validation-rapport/soumettre  (admin/senior)
const soumettreValidationRapport = async (req, res) => {
    try {
        const audit = await Audit.findByPk(req.params.id);
        if (!audit) return res.status(404).json({ message: 'Audit non trouvé.' });

        await audit.update({
            validation_rapport: { statut: 'en_attente', commentaire: null, date: new Date().toISOString() },
        });

        await notifierClient(audit, 'AUDIT_ASSIGNE',
            `Rapport final à valider : ${audit.nom}`,
            `Le rapport final de l'audit "${audit.nom}" a été soumis pour votre validation.`
        );
        log(req.user.userId, 'validation_rapport_soumettre', 'audit', audit.id, audit.nom, getIp(req));

        const updated = await Audit.findByPk(audit.id);
        res.json({ audit: updated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/audits/:id/validation-rapport/repondre  (client)
const repondreValidationRapport = async (req, res) => {
    try {
        if (req.user.role !== 'client')
            return res.status(403).json({ message: 'Réservé au rôle client.' });

        const { action, commentaire } = req.body;
        if (!['valider', 'demander_modification'].includes(action))
            return res.status(400).json({ message: 'Action invalide.' });
        if (action === 'demander_modification' && !commentaire)
            return res.status(400).json({ message: 'Un commentaire est requis pour demander une modification.' });

        const audit = await Audit.findByPk(req.params.id);
        if (!audit) return res.status(404).json({ message: 'Audit non trouvé.' });

        if (audit.entite_id !== req.user.entite_id)
            return res.status(403).json({ message: 'Accès refusé.' });

        const statut = action === 'valider' ? 'valide' : 'modification_demandee';
        await audit.update({
            validation_rapport: { statut, commentaire: commentaire || null, date: new Date().toISOString() },
        });

        const msgTitre = action === 'valider'
            ? `Rapport validé par le client : ${audit.nom}`
            : `Modification demandée sur le rapport : ${audit.nom}`;
        const msgBody = action === 'valider'
            ? `Le client a validé le rapport final de l'audit "${audit.nom}".`
            : `Le client demande des modifications sur le rapport de l'audit "${audit.nom}". Motif : ${commentaire}`;

        notifierRole(['admin', 'auditeur_senior'], 'AUDIT_VALIDE', msgTitre, msgBody, audit.id).catch(() => {});
        log(req.user.userId, `validation_rapport_${action}`, 'audit', audit.id, audit.nom, getIp(req));

        const updated = await Audit.findByPk(audit.id);
        res.json({ audit: updated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/audits/:id/validation-planning/annuler  (admin/senior)
const annulerValidationPlanning = async (req, res) => {
    try {
        const audit = await Audit.findByPk(req.params.id);
        if (!audit) return res.status(404).json({ message: 'Audit non trouvé.' });

        await audit.update({ validation_planning: null });
        log(req.user.userId, 'validation_planning_annuler', 'audit', audit.id, audit.nom, getIp(req));

        const updated = await Audit.findByPk(audit.id);
        res.json({ audit: updated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/audits/:id/validation-rapport/annuler  (admin/senior)
const annulerValidationRapport = async (req, res) => {
    try {
        const audit = await Audit.findByPk(req.params.id);
        if (!audit) return res.status(404).json({ message: 'Audit non trouvé.' });

        await audit.update({ validation_rapport: null });
        log(req.user.userId, 'validation_rapport_annuler', 'audit', audit.id, audit.nom, getIp(req));

        const updated = await Audit.findByPk(audit.id);
        res.json({ audit: updated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    soumettreValidationPlanning,
    repondreValidationPlanning,
    annulerValidationPlanning,
    soumettreValidationRapport,
    repondreValidationRapport,
    annulerValidationRapport,
};
