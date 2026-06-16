const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { reformulerConstats } = require('../services/groqService');

// POST /api/groq/reformuler
router.post('/reformuler', verifyToken, async (req, res) => {
    try {
        if (!process.env.GROQ_API_KEY) {
            return res.status(503).json({ message: 'Clé API Groq non configurée (GROQ_API_KEY manquante).' });
        }
        const { items, referentielNom } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'items est requis (tableau).' });
        }
        const reformulations = await reformulerConstats(items, referentielNom);
        res.json({ reformulations });
    } catch (err) {
        console.error('[Groq] Erreur reformulation :', err.message);
        res.status(500).json({ message: 'Erreur lors de la reformulation IA.', detail: err.message });
    }
});

module.exports = router;
