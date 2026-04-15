const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');
const {
    getAllAudits,
    getAuditById,
    createAudit,
    updateAudit,
    deleteAudit,
    getEvaluations,
    saveEvaluations,
} = require('../controllers/auditController');

// Liste tous les audits
router.get('/', verifyToken, getAllAudits);

// Créer un audit (admin + auditeurs seniors)
router.post('/', verifyToken, verifyRole('admin', 'auditeur_senior'), createAudit);

// Détail d'un audit
router.get('/:id', verifyToken, getAuditById);

// Modifier un audit
router.put('/:id', verifyToken, verifyRole('admin', 'auditeur_senior'), updateAudit);

// Supprimer un audit
router.delete('/:id', verifyToken, verifyRole('admin'), deleteAudit);

// Récupérer les évaluations d'un audit
router.get('/:id/evaluations', verifyToken, getEvaluations);

// Sauvegarder (bulk upsert) les évaluations
router.put('/:id/evaluations', verifyToken, saveEvaluations);

module.exports = router;
