const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {findUserByEmail} = require('../models/userModel');

const loginUser = async (email, password) => {
    const user = await findUserByEmail(email);
    if (!user) {
        throw new Error('Utilisateur non trouvé');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Email ou Mot de passe incorrect');
    }
    const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN });
    return {
        token,
        user: {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            role: user.role,
        },
    }
};
module.exports = { loginUser };