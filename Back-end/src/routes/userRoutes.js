const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');
const {
    getProfile,
    updateProfile,
    getAdminZone,
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    changePassword,
    resetPassword,
} = require('../controllers/userController');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestion des utilisateurs (nécessite un token JWT)
 */

// ========== Validation ==========
const createValidation = [
    body('nom').notEmpty().withMessage('Le nom est requis'),
    body('prenom').notEmpty().withMessage('Le prénom est requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('role').isIn(['admin', 'auditeur_senior', 'auditeur_junior', 'client']).withMessage('Rôle invalide'),
];

const updateValidation = [
    body('email').optional().isEmail().withMessage('Email invalide'),
    body('role').optional().isIn(['admin', 'auditeur_senior', 'auditeur_junior', 'client']).withMessage('Rôle invalide'),
];

const changePasswordValidation = [
    body('old_password').notEmpty().withMessage('Ancien mot de passe requis'),
    body('new_password').isLength({ min: 8 }).withMessage('Nouveau mot de passe : 8 caractères minimum'),
];

// ========== Routes ==========

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Récupérer le profil de l'utilisateur connecté
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil récupéré avec succès
 *       401:
 *         description: Token manquant
 *       403:
 *         description: Token invalide ou expiré
 */
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);

/**
 * @swagger
 * /api/users/change-password:
 *   post:
 *     summary: Changer son mot de passe
 *     description: Obligatoire à la première connexion (mot de passe temporaire). Accessible à tout utilisateur authentifié.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [old_password, new_password]
 *             properties:
 *               old_password:
 *                 type: string
 *                 example: tempABC123xy
 *               new_password:
 *                 type: string
 *                 minLength: 8
 *                 example: MonNouveauMdp!2024
 *     responses:
 *       200:
 *         description: Mot de passe modifié avec succès
 *       400:
 *         description: Le nouveau mot de passe doit être différent de l'ancien
 *       401:
 *         description: Ancien mot de passe incorrect
 */
router.post('/change-password', verifyToken, changePasswordValidation, changePassword);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lister tous les utilisateurs
 *     description: Accessible aux admins et auditeurs seniors.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       403:
 *         description: Droits insuffisants
 */
router.get('/', verifyToken, verifyRole('admin', 'auditeur_senior'), getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Récupérer un utilisateur par ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/:id', verifyToken, verifyRole('admin', 'auditeur_senior'), getUserById);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Créer un utilisateur (admin uniquement)
 *     description: >
 *       L'admin fournit nom, prénom, email et rôle.
 *       Le système génère un mot de passe temporaire et l'envoie par email.
 *       L'utilisateur devra changer ce mot de passe à sa première connexion.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: Utilisateur créé, mot de passe temporaire généré et envoyé par email
 *       400:
 *         description: Erreur de validation
 *       409:
 *         description: Email déjà utilisé
 */
router.post('/', verifyToken, verifyRole('admin'), createValidation, createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Modifier un utilisateur (admin uniquement)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: Utilisateur modifié avec succès
 *       404:
 *         description: Utilisateur non trouvé
 *       409:
 *         description: Email déjà utilisé
 */
router.put('/:id', verifyToken, verifyRole('admin'), updateValidation, updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur (admin uniquement)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Utilisateur supprimé avec succès
 *       404:
 *         description: Utilisateur non trouvé
 */
router.delete('/:id', verifyToken, verifyRole('admin'), deleteUser);

/**
 * @swagger
 * /api/users/{id}/reset-password:
 *   post:
 *     summary: Réinitialiser le mot de passe d'un utilisateur (admin uniquement)
 *     description: Génère un nouveau mot de passe temporaire et l'envoie par email. L'utilisateur devra le changer à sa prochaine connexion.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé et envoyé par email
 *       404:
 *         description: Utilisateur non trouvé
 */
router.post('/:id/reset-password', verifyToken, verifyRole('admin'), resetPassword);

/**
 * @swagger
 * /api/users/admin:
 *   get:
 *     summary: Zone réservée aux administrateurs
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Accès admin accordé
 *       403:
 *         description: Droits insuffisants
 */
router.get('/admin', verifyToken, verifyRole('admin'), getAdminZone);

module.exports = router;
