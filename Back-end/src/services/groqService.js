const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = 'llama-3.1-8b-instant'; // 30 000 TPM gratuit
const BATCH_SIZE = 5;
const MAX_TEXT = 400; // tronque les textes longs pour économiser les tokens

function trunc(str) {
    if (!str) return '';
    return str.length > MAX_TEXT ? str.slice(0, MAX_TEXT) + '…' : str;
}

async function reformulerBatch(batch, referentielNom) {
    const prompt = `Tu es un auditeur senior en sécurité des systèmes d'information. Référentiel : ${referentielNom}.

Pour chaque évaluation, reformule le constat et la recommandation de façon professionnelle et détaillée pour un rapport d'audit officiel (2-4 phrases chacun).
Réponds UNIQUEMENT avec un tableau JSON : [{"mesure_id": 1, "constat": "...", "recommandation": "..."}, ...]

${JSON.stringify(batch.map(i => ({
    mesure_id: i.mesure_id,
    mesure: trunc(`${i.mesureCode || ''} ${i.mesureDescription || ''}`),
    conformite: i.conformite || '',
    note: trunc(i.note),
    constat_brut: trunc(i.commentaire),
    reco_brute: trunc(i.recommandation),
})), null, 2)}`;

    const response = await groq.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
    });

    const raw = response.choices[0]?.message?.content || '';
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) {
        console.error('[Groq] Réponse non parseable :', raw.slice(0, 200));
        return {};
    }

    const arr = JSON.parse(match[0]);
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

async function reformulerConstats(items, referentielNom = 'référentiel de sécurité') {
    const toProcess = items.filter(i => i.commentaire || i.recommandation);
    if (toProcess.length === 0) return {};

    const result = {};

    // Traitement par lots
    for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
        const batch = toProcess.slice(i, i + BATCH_SIZE);
        const batchResult = await reformulerBatch(batch, referentielNom);
        Object.assign(result, batchResult);
    }

    return result;
}

module.exports = { reformulerConstats };
