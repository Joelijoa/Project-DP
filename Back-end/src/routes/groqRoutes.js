const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { reformulerConstats } = require('../services/groqService');

/**
 * @swagger
 * tags:
 *   name: IA
 *   description: Reformulation des constats d'audit via IA (Groq)
 */

/**
 * @swagger
 * /api/groq/reformuler:
 *   post:
 *     summary: Reformuler les constats et recommandations d'un audit via Groq IA
 *     description: |
 *       Envoie les évaluations à Groq (modèle llama-3.1-8b-instant) pour reformuler
 *       les constats et recommandations de façon professionnelle. Traitement par lots de 5.
 *       Nécessite la variable d'environnement GROQ_API_KEY.
 *     tags: [IA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               referentielNom:
 *                 type: string
 *                 example: "ISO 27001:2022"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [mesure_id]
 *                   properties:
 *                     mesure_id:     { type: integer, example: 42 }
 *                     mesureCode:    { type: string,  example: "A.5.1" }
 *                     mesureDescription: { type: string, example: "Politiques de sécurité" }
 *                     conformite:    { type: string,  example: "nc_mineure" }
 *                     note:          { type: string,  example: "Document absent lors de la revue" }
 *                     commentaire:   { type: string,  example: "Aucune politique formalisée" }
 *                     recommandation: { type: string, example: "Rédiger une politique SSI" }
 *     responses:
 *       200:
 *         description: Reformulations générées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reformulations:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       constat:        { type: string }
 *                       recommandation: { type: string }
 *                   example:
 *                     "42":
 *                       constat: "Aucune politique de sécurité formalisée n'a été identifiée..."
 *                       recommandation: "Il est recommandé de rédiger et approuver une politique..."
 *       400:
 *         description: Paramètre items manquant ou invalide
 *       503:
 *         description: Clé API Groq non configurée
 *       500:
 *         description: Erreur lors de la reformulation
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

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
