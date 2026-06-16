import api from '../api/axios';

/**
 * Reformule les constats et recommandations via Groq (backend).
 * @param {Array} items - [{ mesure_id, mesureCode, mesureDescription, conformite, note, commentaire, recommandation }]
 * @param {string} referentielNom
 * @returns {Object} map mesure_id → { constat, recommandation }
 */
export const reformulerConstats = async (items, referentielNom) => {
    const res = await api.post('/groq/reformuler', { items, referentielNom });
    return res.data.reformulations || {};
};
