const { Referentiel, Domaine, Objectif, Mesure } = require('../models');

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
            include: [{ model: Domaine, as: 'domaine', where: { referentiel_id: req.params.id }, attributes: [] }],
        });
        const mesures = await Mesure.count({
            include: [{ model: Objectif, as: 'objectif', include: [{ model: Domaine, as: 'domaine', where: { referentiel_id: req.params.id }, attributes: [] }] }],
        });
        res.json({
            referentiel: { id: referentiel.id, nom: referentiel.nom, type: referentiel.type },
            stats: { domaines, objectifs, mesures },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllReferentiels, getReferentielById, getReferentielStats };
