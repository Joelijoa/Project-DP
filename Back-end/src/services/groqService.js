const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = 'llama-3.1-8b-instant';
const MAX_TEXT = 200;       // réduit l'input tokens
const SINGLE_CALL_MAX = 25; // sous ce seuil : 1 seul appel API
const BATCH_SIZE = 20;      // au-delà : batchs de 20 en parallèle
const MAX_CONCURRENCY = 4;

function trunc(str) {
    if (!str) return '';
    return str.length > MAX_TEXT ? str.slice(0, MAX_TEXT) + '…' : str;
}

function buildPrompt(batch, referentielNom) {
    const data = batch.map(i => ({
        id: i.mesure_id,
        code: trunc(`${i.mesureCode || ''} ${i.mesureDescription || ''}`),
        conformite: i.conformite || '',
        constat: trunc(i.commentaire),
        reco: trunc(i.recommandation),
    }));

    return `Auditeur SSI, référentiel ${referentielNom}. Reformule chaque constat et recommandation en 1-2 phrases professionnelles concises.
Réponds UNIQUEMENT JSON : [{"id":1,"constat":"...","recommandation":"..."},...]

${JSON.stringify(data)}`;
}

function parseResponse(raw) {
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) {
        console.error('[Groq] Réponse non parseable :', raw.slice(0, 200));
        return {};
    }
    const arr = JSON.parse(match[0]);
    const result = {};
    for (const item of arr) {
        if (item.id != null) {
            result[item.id] = {
                constat: item.constat || '',
                recommandation: item.recommandation || '',
            };
        }
    }
    return result;
}

async function callGroq(batch, referentielNom) {
    const response = await groq.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: buildPrompt(batch, referentielNom) }],
        temperature: 0.2,
        max_tokens: 1500,
    });
    return parseResponse(response.choices[0]?.message?.content || '');
}

async function reformulerConstats(items, referentielNom = 'référentiel de sécurité') {
    const toProcess = items.filter(i => i.commentaire || i.recommandation);
    if (toProcess.length === 0) return {};

    // Cas rapide : tout en un seul appel
    if (toProcess.length <= SINGLE_CALL_MAX) {
        return callGroq(toProcess, referentielNom);
    }

    // Cas grand volume : batchs parallèles
    const batches = [];
    for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
        batches.push(toProcess.slice(i, i + BATCH_SIZE));
    }

    const result = {};
    for (let i = 0; i < batches.length; i += MAX_CONCURRENCY) {
        const chunk = batches.slice(i, i + MAX_CONCURRENCY);
        const results = await Promise.all(chunk.map(b => callGroq(b, referentielNom)));
        results.forEach(r => Object.assign(result, r));
    }
    return result;
}

module.exports = { reformulerConstats };
