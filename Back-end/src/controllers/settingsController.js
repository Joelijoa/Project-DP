const { Setting } = require('../models');
const { log, getIp } = require('../services/logService');

const ALLOWED_KEYS = ['org_nom', 'org_email', 'emails_enabled'];

const getSettings = async (req, res) => {
    try {
        const rows = await Setting.findAll({
            where: { key: ALLOWED_KEYS },
        });
        const settings = {};
        for (const key of ALLOWED_KEYS) {
            settings[key] = null;
        }
        for (const row of rows) {
            settings[row.key] = row.value;
        }
        res.json({ settings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateSettings = async (req, res) => {
    try {
        const { settings } = req.body;
        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ message: 'Corps invalide : { settings: { key: value } } attendu' });
        }
        for (const [key, value] of Object.entries(settings)) {
            if (!ALLOWED_KEYS.includes(key)) continue;
            await Setting.upsert({ key, value: value === null ? null : String(value) });
        }
        log(req.user.userId, 'UPDATE_SETTINGS', 'settings', null, JSON.stringify(settings), getIp(req));
        res.json({ message: 'Paramètres mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getSettings, updateSettings };
