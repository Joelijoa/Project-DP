const { Op } = require('sequelize');
const { Log, User } = require('../models');

// GET /api/logs
const getLogs = async (req, res) => {
    try {
        const {
            page      = 1,
            limit     = 50,
            action    = '',
            user_id   = '',
            resource  = '',
            date_from = '',
            date_to   = '',
        } = req.query;

        const where = {};

        if (action)    where.action   = { [Op.iLike]: `%${action}%` };
        if (resource)  where.resource = resource;
        if (user_id)   where.user_id  = parseInt(user_id);

        if (date_from || date_to) {
            where.createdAt = {};
            if (date_from) where.createdAt[Op.gte] = new Date(date_from);
            if (date_to)   where.createdAt[Op.lte] = new Date(date_to + 'T23:59:59');
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Log.findAndCountAll({
            where,
            include: [{
                model: User,
                as:    'user',
                attributes: ['id', 'nom', 'prenom', 'role'],
                required: false,
            }],
            order:  [['createdAt', 'DESC']],
            limit:  parseInt(limit),
            offset,
        });

        res.json({
            logs:  rows,
            total: count,
            page:  parseInt(page),
            pages: Math.ceil(count / parseInt(limit)),
        });
    } catch (error) {
        console.error('[Log] getLogs:', error.message);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getLogs };
