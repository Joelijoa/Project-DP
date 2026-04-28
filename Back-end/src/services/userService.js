const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { sendTempPasswordEmail } = require('./emailService');

const generateTempPassword = () => {
    // 12 caractères alphanumériques
    return crypto.randomBytes(9).toString('base64url').slice(0, 12);
};

const createUser = async (data) => {
    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) {
        throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Génération du mot de passe temporaire
    const tempPassword = generateTempPassword();
    const hash = await bcrypt.hash(tempPassword, 12);

    const user = await User.create({
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        password: hash,
        role: data.role,
        organisation: data.organisation || null,
        telephone: data.telephone || null,
        entite_id: data.entite_id || null,
        must_change_password: true,
    });

    // Envoi de l'email avec le mot de passe temporaire
    try {
        await sendTempPasswordEmail(user.email, user.nom, user.prenom, tempPassword);
    } catch (emailError) {
        console.error('Erreur envoi email :', emailError.message);
        // On ne bloque pas la création si l'email échoue
        // L'admin pourra relancer l'envoi ou communiquer le MDP manuellement
    }

    const { password, ...userWithoutPassword } = user.toJSON();
    return { ...userWithoutPassword, tempPassword };
};

const getAllUsers = async () => {
    const users = await User.findAll({
        attributes: { exclude: ['password'] },
        order: [['created_at', 'DESC']],
    });
    return users;
};

const getUserById = async (id) => {
    const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
    });
    if (!user) {
        throw new Error('Utilisateur non trouvé');
    }
    return user;
};

const updateUser = async (id, data) => {
    const user = await User.findByPk(id);
    if (!user) {
        throw new Error('Utilisateur non trouvé');
    }
    if (data.email && data.email !== user.email) {
        const existing = await User.findOne({ where: { email: data.email } });
        if (existing) {
            throw new Error('Cet email est déjà utilisé');
        }
    }
    const { password, must_change_password, ...updateData } = data;
    await user.update(updateData);
    const { password: pw, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
};

const deleteUser = async (id) => {
    const user = await User.findByPk(id);
    if (!user) {
        throw new Error('Utilisateur non trouvé');
    }
    await user.destroy();
    return { message: 'Utilisateur supprimé avec succès' };
};

const changePassword = async (userId, oldPassword, newPassword) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error('Utilisateur non trouvé');
    }

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
        throw new Error('Ancien mot de passe incorrect');
    }

    if (oldPassword === newPassword) {
        throw new Error('Le nouveau mot de passe doit être différent de l\'ancien');
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await user.update({ password: hash, must_change_password: false });

    return { message: 'Mot de passe modifié avec succès' };
};

const resetPassword = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error('Utilisateur non trouvé');
    }

    const tempPassword = generateTempPassword();
    const hash = await bcrypt.hash(tempPassword, 12);
    await user.update({ password: hash, must_change_password: true });

    try {
        await sendTempPasswordEmail(user.email, user.nom, user.prenom, tempPassword);
    } catch (emailError) {
        console.error('Erreur envoi email :', emailError.message);
    }

    return { message: 'Mot de passe réinitialisé', tempPassword };
};

module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    changePassword,
    resetPassword,
};
