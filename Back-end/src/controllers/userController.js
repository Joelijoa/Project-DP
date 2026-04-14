const getProfile = (req, res) => {
    res.json({
        message: 'Profil récupéré avec succès',
        user: req.user,
    });
};

const getAdminZone = (_req, res) => {
    res.json({ message: 'Bienvenue dans la zone admin !' });
};

module.exports = { getProfile, getAdminZone };
