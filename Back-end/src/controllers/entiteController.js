const { Entite, Audit, Referentiel } = require('../models');

// GET /api/entites
const getAllEntites = async (req, res) => {
    try {
        const entites = await Entite.findAll({
            include: [{
                model: Audit,
                as: 'audits',
                attributes: ['id', 'nom', 'statut', 'date_debut', 'date_fin'],
            }],
            order: [['nom', 'ASC']],
        });
        res.json({ entites });
    } catch (error) {
        console.error('[Entite] getAllEntites:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// GET /api/entites/:id
const getEntiteById = async (req, res) => {
    try {
        const entite = await Entite.findByPk(req.params.id, {
            include: [{
                model: Audit,
                as: 'audits',
                attributes: ['id', 'nom', 'statut', 'date_debut', 'date_fin', 'perimetre'],
                include: [{ model: Referentiel, as: 'referentiel', attributes: ['id', 'nom', 'type'] }],
            }],
        });
        if (!entite) return res.status(404).json({ message: 'Entité introuvable' });
        res.json({ entite });
    } catch (error) {
        console.error('[Entite] getEntiteById:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// POST /api/entites
const createEntite = async (req, res) => {
    try {
        const { nom, secteur, adresse, ville, pays, telephone, email, site_web, description } = req.body;
        if (!nom) return res.status(400).json({ message: 'Le nom est requis' });
        const entite = await Entite.create({ nom, secteur, adresse, ville, pays, telephone, email, site_web, description });
        res.status(201).json({ entite });
    } catch (error) {
        console.error('[Entite] createEntite:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/entites/:id
const updateEntite = async (req, res) => {
    try {
        const entite = await Entite.findByPk(req.params.id);
        if (!entite) return res.status(404).json({ message: 'Entité introuvable' });
        const { nom, secteur, adresse, ville, pays, telephone, email, site_web, description } = req.body;
        await entite.update({ nom, secteur, adresse, ville, pays, telephone, email, site_web, description });
        res.json({ entite });
    } catch (error) {
        console.error('[Entite] updateEntite:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/entites/:id
const deleteEntite = async (req, res) => {
    try {
        const entite = await Entite.findByPk(req.params.id);
        if (!entite) return res.status(404).json({ message: 'Entité introuvable' });
        await entite.destroy();
        res.json({ message: 'Entité supprimée' });
    } catch (error) {
        console.error('[Entite] deleteEntite:', error.message);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllEntites, getEntiteById, createEntite, updateEntite, deleteEntite };
