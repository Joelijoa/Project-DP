// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');

// Route accessible à tous les utilisateurs connectés
router.get('/profile', verifyToken, (req, res) => {
  res.json({
    message: 'Profil récupéré avec succès',
    user: req.user // contient id, email, role
  });
});

// Route accessible uniquement aux admins
router.get('/admin', verifyToken, verifyRole('admin'), (req, res) => {
  res.json({ message: 'Bienvenue dans la zone admin !' });
});

module.exports = router;