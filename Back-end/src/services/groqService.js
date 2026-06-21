const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = 'llama-3.1-8b-instant';
const MAX_TEXT = 200;
const BATCH_SIZE = 15;
const MAX_CONCURRENCY = 5;

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

    return `Tu es auditeur senior en sécurité des systèmes d'information. Référentiel : ${referentielNom}.

Pour chaque élément, reformule le constat et la recommandation en phrases complètes, formelles et professionnelles (style rapport d'audit officiel). Utilise des phrases déclaratives. N'utilise pas de tirets ou listes. 1 à 2 phrases maximum par champ.

Réponds UNIQUEMENT avec ce JSON (rien d'autre) :
[{"id":1,"constat":"Phrase formelle complète.","recommandation":"Phrase formelle complète."},...]

Données :
${JSON.stringify(data)}`;
}

function parseResponse(raw) {
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) {
        console.error('[Groq] Réponse non parseable :', raw.slice(0, 200));
        return {};
    }
    try {
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
    } catch {
        console.error('[Groq] JSON.parse échoué sur :', match[0].slice(0, 200));
        return {};
    }
}

// Un appel Groq — retourne {} en cas d'erreur (ne propage pas)
async function callGroq(batch, referentielNom) {
    try {
        const response = await groq.chat.completions.create({
            model: MODEL,
            messages: [{ role: 'user', content: buildPrompt(batch, referentielNom) }],
            temperature: 0.2,
            max_tokens: 3500,
        });
        return parseResponse(response.choices[0]?.message?.content || '');
    } catch (err) {
        console.error('[Groq] Erreur batch :', err.message);
        return {};
    }
}

async function reformulerConstats(items, referentielNom = 'référentiel de sécurité') {
    const toProcess = items.filter(i => i.commentaire || i.recommandation);
    if (toProcess.length === 0) return {};

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
