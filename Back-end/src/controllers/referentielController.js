const { Referentiel, Domaine, Objectif, Mesure, sequelize } = require('../models');

const getAllReferentiels = async (_req, res) => {
    try {
        const referentiels = await Referentiel.findAll({
            order: [['type', 'ASC']],
        });
        res.json({ referentiels });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getReferentielById = async (req, res) => {
    try {
        const referentiel = await Referentiel.findByPk(req.params.id, {
            include: [{
                model: Domaine,
                as: 'domaines',
                include: [{
                    model: Objectif,
                    as: 'objectifs',
                    include: [{
                        model: Mesure,
                        as: 'mesures',
                    }],
                }],
            }],
            order: [
                [{ model: Domaine, as: 'domaines' }, 'code', 'ASC'],
                [{ model: Domaine, as: 'domaines' }, { model: Objectif, as: 'objectifs' }, 'code', 'ASC'],
                [{ model: Domaine, as: 'domaines' }, { model: Objectif, as: 'objectifs' }, { model: Mesure, as: 'mesures' }, 'code', 'ASC'],
            ],
        });
        if (!referentiel) {
            return res.status(404).json({ message: 'Référentiel non trouvé' });
        }
        res.json({ referentiel });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getReferentielStats = async (req, res) => {
    try {
        const referentiel = await Referentiel.findByPk(req.params.id);
        if (!referentiel) {
            return res.status(404).json({ message: 'Référentiel non trouvé' });
        }
        const domaines = await Domaine.count({ where: { referentiel_id: req.params.id } });
        const objectifs = await Objectif.count({
            include: [{ model: Domaine, as: 'domaine', where: { referentiel_id: req.params.id }, attributes: [], required: true }],
        });
        const mesures = await Mesure.count({
            include: [{
                model: Objectif, as: 'objectif', required: true,
                include: [{ model: Domaine, as: 'domaine', where: { referentiel_id: req.params.id }, attributes: [], required: true }],
            }],
        });
        res.json({
            referentiel: { id: referentiel.id, nom: referentiel.nom, type: referentiel.type },
            stats: { domaines, objectifs, mesures },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createReferentiel = async (req, res) => {
    const { nom, type, version, description, evaluation_config, domaines = [] } = req.body;
    if (!nom || !type) return res.status(400).json({ message: 'nom et type sont requis.' });
    if (!Array.isArray(domaines) || domaines.length === 0)
        return res.status(400).json({ message: 'Au moins un domaine est requis.' });

    const t = await sequelize.transaction();
    try {
        const ref = await Referentiel.create(
            { nom, type, version: version || null, description: description || null, evaluation_config: evaluation_config || null, is_custom: true },
            { transaction: t }
        );

        for (const d of domaines) {
            const domaine = await Domaine.create(
                { referentiel_id: ref.id, code: d.code, nom: d.nom, description: d.description || null },
                { transaction: t }
            );
            for (const o of (d.objectifs || [])) {
                const objectif = await Objectif.create(
                    { domaine_id: domaine.id, code: o.code, description: o.description },
                    { transaction: t }
                );
                for (const m of (o.mesures || [])) {
                    await Mesure.create(
                        { objectif_id: objectif.id, code: m.code, description: m.description },
                        { transaction: t }
                    );
                }
            }
        }

        await t.commit();
        res.status(201).json({ message: 'Référentiel créé avec succès.', id: ref.id });
    } catch (err) {
        await t.rollback();
        console.error('[Référentiel] Erreur création :', err.message);
        res.status(500).json({ message: err.message });
    }
};

const deleteReferentiel = async (req, res) => {
    const ref = await Referentiel.findByPk(req.params.id);
    if (!ref) return res.status(404).json({ message: 'Référentiel non trouvé.' });
    if (!ref.is_custom) return res.status(403).json({ message: 'Seuls les référentiels personnalisés peuvent être supprimés.' });
    try {
        await ref.destroy();
        res.json({ message: 'Référentiel supprimé.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getAllReferentiels, getReferentielById, getReferentielStats, createReferentiel, deleteReferentiel };
