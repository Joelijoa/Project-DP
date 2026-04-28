const { Notification } = require('../models');

// GET /api/notifications
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { user_id: req.user.userId },
            order: [['createdAt', 'DESC']],
            limit: 50,
        });
        const nonLues = await Notification.count({ where: { user_id: req.user.userId, lu: false } });
        res.json({ notifications, non_lues: nonLues });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/notifications/:id/lu
const markAsRead = async (req, res) => {
    try {
        const notif = await Notification.findOne({ where: { id: req.params.id, user_id: req.user.userId } });
        if (!notif) return res.status(404).json({ message: 'Notification introuvable' });
        await notif.update({ lu: true });
        res.json({ message: 'Notification marquée comme lue' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/notifications/lu  (marquer toutes comme lues)
const markAllAsRead = async (req, res) => {
    try {
        await Notification.update({ lu: true }, { where: { user_id: req.user.userId, lu: false } });
        res.json({ message: 'Toutes les notifications marquées comme lues' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
