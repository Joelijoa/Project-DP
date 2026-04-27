const { loginUser, forgotPassword, resetPasswordWithToken } = require('../services/authService');
const { validationResult } = require('express-validator');
const { log, getIp } = require('../services/logService');

const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { email, password } = req.body;
        const result = await loginUser(email, password);
        log(result.user?.id, 'LOGIN', 'user', result.user?.id, email, getIp(req));
        res.status(200).json(result);
    } catch (error) {
        log(null, 'LOGIN_FAILED', 'user', null, req.body.email, getIp(req));
        const status = error.message.includes('désactivé') ? 403 : 401;
        res.status(status).json({ message: error.message });
    }
};

const forgot = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const result = await forgotPassword(req.body.email);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const resetPassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const result = await resetPasswordWithToken(req.body.token, req.body.new_password);
        res.json(result);
    } catch (error) {
        const status = error.message.includes('invalide') || error.message.includes('expiré') ? 400 : 500;
        res.status(status).json({ message: error.message });
    }
};

module.exports = { login, forgot, resetPassword };
