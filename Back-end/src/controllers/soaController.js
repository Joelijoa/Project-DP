const { Audit, SoA, User } = require('../models');

// GET /api/audits/:id/soa
const getSoA = async (req, res) => {
    const audit = await Audit.findByPk(req.params.id, {
        include: [{ model: User, as: 'auditeurs', attributes: ['id'], through: { attributes: [] } }],
    });
    if (!audit) return res.status(404).json({ message: 'Audit introuvable' });

    if (req.user.role === 'client' && audit.entite_id !== req.user.entite_id) {
        return res.status(403).json({ message: 'Accès refusé.' });
    }
    if (req.user.role === 'auditeur_junior') {
        const isAssigned = audit.auditeurs?.some(a => a.id === req.user.userId)
            || audit.created_by === req.user.userId;
        if (!isAssigned) return res.status(403).json({ message: 'Vous n\'êtes pas assigné à cet audit.' });
    }

    const entries = await SoA.findAll({ where: { audit_id: req.params.id } });
    res.json({ soa: entries });
};

// PUT /api/audits/:id/soa  — bulk upsert
const saveSoA = async (req, res) => {
    const { entries } = req.body;
    if (!Array.isArray(entries)) {
        return res.status(400).json({ message: 'Le champ "entries" doit être un tableau' });
    }

    const audit = await Audit.findByPk(req.params.id, {
        include: [{ model: User, as: 'auditeurs', attributes: ['id'], through: { attributes: [] } }],
    });
    if (!audit) return res.status(404).json({ message: 'Audit introuvable' });

    if (req.user.role === 'client') return res.status(403).json({ message: 'Accès refusé.' });
    if (req.user.role === 'auditeur_junior') {
        const isAssigned = audit.auditeurs?.some(a => a.id === req.user.userId)
            || audit.created_by === req.user.userId;
        if (!isAssigned) return res.status(403).json({ message: 'Vous n\'êtes pas assigné à cet audit.' });
    }

    for (const entry of entries) {
        const [record, created] = await SoA.findOrCreate({
            where: { audit_id: audit.id, mesure_id: entry.mesure_id },
            defaults: {
                audit_id: audit.id,
                mesure_id: entry.mesure_id,
                applicable: entry.applicable ?? null,
                raisons_inclusion: entry.raisons_inclusion ?? [],
                justification_exclusion: entry.justification_exclusion ?? null,
                statut_implementation: entry.statut_implementation ?? null,
                reference_document: entry.reference_document ?? null,
            },
        });
        if (!created) {
            await record.update({
                applicable: entry.applicable ?? null,
                raisons_inclusion: entry.raisons_inclusion ?? [],
                justification_exclusion: entry.justification_exclusion ?? null,
                statut_implementation: entry.statut_implementation ?? null,
                reference_document: entry.reference_document ?? null,
            });
        }
    }

    // Passer l'audit en "en_cours" si encore brouillon
    if (audit.statut === 'brouillon') {
        await audit.update({ statut: 'en_cours' });
    }

    const updated = await SoA.findAll({ where: { audit_id: audit.id } });
    res.json({ message: 'Déclaration d\'applicabilité sauvegardée', soa: updated });
};

module.exports = { getSoA, saveSoA };
