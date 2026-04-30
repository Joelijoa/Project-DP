const { Notification, User, Setting } = require('../models');
const { sendNotificationEmail } = require('./emailService');

const _send = async (user, titre, message, type, auditId, planActionId) => {
    // Toujours créer la notification en base
    await Notification.create({
        user_id: user.id,
        type,
        titre,
        message,
        audit_id: auditId || null,
        plan_action_id: planActionId || null,
    });

    // Vérifier le paramètre global emails_enabled
    const emailSetting = await Setting.findByPk('emails_enabled');
    if (emailSetting && emailSetting.value === 'false') return;

    // Vérifier la préférence individuelle de l'utilisateur
    const prefs = user.notification_prefs;
    if (prefs && prefs[type] === false) return;

    sendNotificationEmail(user.email, user.nom, user.prenom, titre, message).catch(() => {});
};

// Notifie un seul utilisateur par son id
const notifier = async (userId, type, titre, message, auditId = null, planActionId = null) => {
    try {
        const user = await User.findByPk(userId, {
            attributes: ['id', 'email', 'nom', 'prenom', 'actif', 'notification_prefs'],
        });
        if (user && user.actif) await _send(user, titre, message, type, auditId, planActionId);
    } catch (err) {
        console.error('[Notification] notifier:', err.message);
    }
};

// Notifie plusieurs utilisateurs par leurs ids
const notifierUsers = async (userIds, type, titre, message, auditId = null, planActionId = null) => {
    try {
        const users = await User.findAll({
            where: { id: userIds, actif: true },
            attributes: ['id', 'email', 'nom', 'prenom', 'notification_prefs'],
        });
        for (const user of users) await _send(user, titre, message, type, auditId, planActionId);
    } catch (err) {
        console.error('[Notification] notifierUsers:', err.message);
    }
};

// Notifie tous les utilisateurs ayant l'un des rôles donnés
const notifierRole = async (roles, type, titre, message, auditId = null, planActionId = null) => {
    try {
        const users = await User.findAll({
            where: { role: roles, actif: true },
            attributes: ['id', 'email', 'nom', 'prenom', 'notification_prefs'],
        });
        for (const user of users) await _send(user, titre, message, type, auditId, planActionId);
    } catch (err) {
        console.error('[Notification] notifierRole:', err.message);
    }
};

module.exports = { notifier, notifierUsers, notifierRole };
