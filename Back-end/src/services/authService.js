const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');
const { sendResetPasswordEmail } = require('./emailService');

const loginUser = async (email, password) => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new Error('Utilisateur non trouvé');
    }

    if (!user.actif) {
        throw new Error('Compte désactivé. Contactez l\'administrateur.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Email ou mot de passe incorrect');
    }

    const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role, entite_id: user.entite_id ?? null },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return {
        token,
        must_change_password: user.must_change_password,
        user: {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            role: user.role,
            organisation: user.organisation,
            entite_id: user.entite_id ?? null,
        },
    };
};

const forgotPassword = async (email) => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
        // Ne pas révéler si l'email existe ou non (sécurité)
        return { message: 'Si cette adresse existe, un email de réinitialisation a été envoyé.' };
    }

    if (!user.actif) {
        return { message: 'Si cette adresse existe, un email de réinitialisation a été envoyé.' };
    }

    // Générer un token de reset (valable 1h)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    await user.update({
        reset_token: resetTokenHash,
        reset_token_expires: new Date(Date.now() + 3600000), // 1 heure
    });

    try {
        await sendResetPasswordEmail(user.email, user.nom, user.prenom, resetToken);
    } catch (emailError) {
        console.error('Erreur envoi email reset :', emailError.message);
    }

    return { message: 'Si cette adresse existe, un email de réinitialisation a été envoyé.' };
};

const resetPasswordWithToken = async (token, newPassword) => {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        where: {
            reset_token: tokenHash,
            reset_token_expires: { [Op.gt]: new Date() },
        },
    });

    if (!user) {
        throw new Error('Lien invalide ou expiré');
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await user.update({
        password: hash,
        must_change_password: false,
        reset_token: null,
        reset_token_expires: null,
    });

    return { message: 'Mot de passe réinitialisé avec succès' };
};

module.exports = { loginUser, forgotPassword, resetPasswordWithToken };
