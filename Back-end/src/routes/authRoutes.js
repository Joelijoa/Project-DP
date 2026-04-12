const express = require('express');
const router = express.Router();
const { login } = require('./authController');
const { body } = require('express-validator');

router.post('/login', [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 6 }).withMessage('Mot de passe doit contenir au moins 6 caractères'),
], login);

module.exports = router;
