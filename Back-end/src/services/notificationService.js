const { Notification, User } = require('../models');
const { sendNotificationEmail } = require('./emailService');

const _send = async (user, titre, message, type, auditId, planActionId) => {
    await Notification.create({
        user_id: user.id,
        type,
        titre,
        message,
        audit_id: auditId || null,
        plan_action_id: planActionId || null,
    });
    sendNotificationEmail(user.email, user.nom, user.prenom, titre, message).catch(() => {});
};

// Notifie un seul utilisateur par son id
const notifier = async (userId, type, titre, message, auditId = null, planActionId = null) => {
    try {
        const user = await User.findByPk(userId, { attributes: ['id', 'email', 'nom', 'prenom', 'actif'] });
        if (user && user.actif) await _send(user, titre, message, type, auditId, planActionId);
    } catch (err) {
        console.error('[Notification] notifier:', err.message);
    }
};

// Notifie plusieurs utilisateurs par leurs ids
const notifierUsers = async (userIds, type, titre, message, auditId = null, planActionId = null) => {
    try {
        const users = await User.findAll({ where: { id: userIds, actif: true }, attributes: ['id', 'email', 'nom', 'prenom'] });
        for (const user of users) await _send(user, titre, message, type, auditId, planActionId);
    } catch (err) {
        console.error('[Notification] notifierUsers:', err.message);
    }
};

// Notifie tous les utilisateurs ayant l'un des rôles donnés
const notifierRole = async (roles, type, titre, message, auditId = null, planActionId = null) => {
    try {
        const users = await User.findAll({ where: { role: roles, actif: true }, attributes: ['id', 'email', 'nom', 'prenom'] });
        for (const user of users) await _send(user, titre, message, type, auditId, planActionId);
    } catch (err) {
        console.error('[Notification] notifierRole:', err.message);
    }
};

module.exports = { notifier, notifierUsers, notifierRole };
