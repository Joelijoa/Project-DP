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
const { getSoA, saveSoA } = require('../controllers/soaController');
const { getPlanActions, createPlanAction, updatePlanAction, deletePlanAction } = require('../controllers/planActionController');

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

// Déclaration d'Applicabilité (ISO 27001)
router.get('/:id/soa', verifyToken, getSoA);
router.put('/:id/soa', verifyToken, saveSoA);

// Plans d'actions
router.get('/:id/plans-actions', verifyToken, getPlanActions);
router.post('/:id/plans-actions', verifyToken, createPlanAction);
router.put('/:id/plans-actions/:planId', verifyToken, updatePlanAction);
router.delete('/:id/plans-actions/:planId', verifyToken, deletePlanAction);

module.exports = router;
