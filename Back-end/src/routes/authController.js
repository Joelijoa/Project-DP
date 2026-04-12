const {loginUser}= require('../services/authService');
const {validationResult} = require('express-validator');

const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { email, password } = req.body;
        const { token, user } = await loginUser(email, password);
        res.status(200).json({ token, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
module.exports = { login };