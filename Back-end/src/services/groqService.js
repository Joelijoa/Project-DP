const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Reformule les constats et recommandations d'un audit via Groq (Llama 3.3 70B).
 * @param {Array} items — [{ mesure_id, mesureCode, mesureDescription, conformite, note, commentaire, recommandation }]
 * @param {string} referentielNom — nom du référentiel (ex: "DNSSI", "ISO 27001:2022")
 * @returns {Object} map mesure_id → { constat, recommandation }
 */
async function reformulerConstats(items, referentielNom = 'référentiel de sécurité') {
    // Filtrer les items qui ont au moins un constat ou une recommandation
    const toProcess = items.filter(i => i.commentaire || i.recommandation);
    if (toProcess.length === 0) return {};

    const prompt = `Tu es un auditeur senior en sécurité des systèmes d'information.
Référentiel audité : ${referentielNom}

Pour chaque évaluation ci-dessous, reformule le constat et la recommandation de façon professionnelle, claire et détaillée, comme dans un rapport d'audit officiel remis à la direction.
- Le constat doit être factuel, précis et objectif (2-4 phrases).
- La recommandation doit être concrète et actionnable (2-4 phrases).
- Si le constat ou la recommandation bruts sont vides, génère un texte cohérent basé sur le niveau de conformité et la mesure auditée.
- Réponds UNIQUEMENT en JSON valide, sans texte autour : un tableau d'objets avec les champs "mesure_id", "constat", "recommandation".

Évaluations :
${JSON.stringify(toProcess.map(i => ({
    mesure_id: i.mesure_id,
    mesure: `${i.mesureCode || ''} — ${i.mesureDescription || ''}`.trim(),
    conformite: i.conformite || 'non_evalue',
    note_auditeur: i.note || '',
    constat_brut: i.commentaire || '',
    recommandation_brute: i.recommandation || '',
})), null, 2)}`;

    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);

    // Groq peut retourner { "evaluations": [...] } ou directement [...]
    const arr = Array.isArray(parsed) ? parsed : (parsed.evaluations || parsed.reformulations || Object.values(parsed)[0] || []);

    const result = {};
    for (const item of arr) {
        if (item.mesure_id != null) {
            result[item.mesure_id] = {
                constat: item.constat || '',
                recommandation: item.recommandation || '',
            };
        }
    }
    return result;
}

module.exports = { reformulerConstats };
