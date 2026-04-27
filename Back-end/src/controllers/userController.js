const { validationResult } = require('express-validator');
const userService = require('../services/userService');
const { log, getIp } = require('../services/logService');

const getProfile = async (req, res) => {
    try {
        const user = await userService.getUserById(req.user.userId);
        res.json({ message: 'Profil récupéré avec succès', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { nom, prenom, organisation, telephone } = req.body;
        const user = await userService.updateUser(req.user.userId, { nom, prenom, organisation, telephone });
        res.json({ message: 'Profil mis à jour', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAdminZone = (_req, res) => {
    res.json({ message: 'Bienvenue dans la zone admin !' });
};

const createUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const user = await userService.createUser(req.body);
        log(req.user.userId, 'CREATE_USER', 'user', user.id, `${user.prenom} ${user.nom} (${user.role})`, getIp(req));
        res.status(201).json({ message: 'Utilisateur créé avec succès', user });
    } catch (error) {
        const status = error.message.includes('existe déjà') ? 409 : 500;
        res.status(status).json({ message: error.message });
    }
};

const getAllUsers = async (_req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await userService.getUserById(req.params.id);
        res.json({ user });
    } catch (error) {
        const status = error.message.includes('non trouvé') ? 404 : 500;
        res.status(status).json({ message: error.message });
    }
};

const updateUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const user = await userService.updateUser(req.params.id, req.body);
        log(req.user.userId, 'UPDATE_USER', 'user', user.id, `${user.prenom} ${user.nom}`, getIp(req));
        res.json({ message: 'Utilisateur modifié avec succès', user });
    } catch (error) {
        const status = error.message.includes('non trouvé') ? 404
            : error.message.includes('déjà utilisé') ? 409 : 500;
        res.status(status).json({ message: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const result = await userService.deleteUser(req.params.id);
        log(req.user.userId, 'DELETE_USER', 'user', parseInt(req.params.id), null, getIp(req));
        res.json(result);
    } catch (error) {
        const status = error.message.includes('non trouvé') ? 404 : 500;
        res.status(status).json({ message: error.message });
    }
};

const changePassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const result = await userService.changePassword(
            req.user.userId,
            req.body.old_password,
            req.body.new_password
        );
        res.json(result);
    } catch (error) {
        const status = error.message.includes('incorrect') ? 401
            : error.message.includes('différent') ? 400 : 500;
        res.status(status).json({ message: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const result = await userService.resetPassword(req.params.id);
        log(req.user.userId, 'RESET_PASSWORD', 'user', parseInt(req.params.id), null, getIp(req));
        res.json(result);
    } catch (error) {
        const status = error.message.includes('non trouvé') ? 404 : 500;
        res.status(status).json({ message: error.message });
    }
};

module.exports = {
    getProfile, updateProfile, getAdminZone, createUser, getAllUsers,
    getUserById, updateUser, deleteUser, changePassword, resetPassword,
};
