const { Log } = require('../models');

const getIp = (req) =>
    (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();

// Fire-and-forget — ne bloque jamais la réponse
const log = (userId, action, resource, resourceId, details, ip) => {
    Log.create({
        user_id:     userId     || null,
        action,
        resource:    resource   || null,
        resource_id: resourceId || null,
        details:     details    || null,
        ip:          ip         || null,
    }).catch(err => console.error('[LOG ERROR]', err.message));
};

module.exports = { log, getIp };
