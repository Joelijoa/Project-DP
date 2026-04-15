const { Audit, SoA } = require('../models');

// GET /api/audits/:id/soa
const getSoA = async (req, res) => {
    const audit = await Audit.findByPk(req.params.id);
    if (!audit) return res.status(404).json({ message: 'Audit introuvable' });

    const entries = await SoA.findAll({ where: { audit_id: req.params.id } });
    res.json({ soa: entries });
};

// PUT /api/audits/:id/soa  — bulk upsert
const saveSoA = async (req, res) => {
    const { entries } = req.body;
    if (!Array.isArray(entries)) {
        return res.status(400).json({ message: 'Le champ "entries" doit être un tableau' });
    }

    const audit = await Audit.findByPk(req.params.id);
    if (!audit) return res.status(404).json({ message: 'Audit introuvable' });

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
