const express = require('express');
const router = express.Router();
const path = require('path');
const fs   = require('fs');
const multer = require('multer');
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');
const { getDocuments, uploadDocuments, deleteDocument, downloadDocument, updateDocumentStatut } = require('../controllers/documentController');

// ─── Multer config ────────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename:    (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
});

const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg', 'image/png', 'text/plain',
];

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) =>
        ALLOWED_TYPES.includes(file.mimetype)
            ? cb(null, true)
            : cb(new Error('Type de fichier non autorisé (PDF, Word, Excel, image, txt).'), false),
});

const {
    getAllAudits,
    getAuditById,
    createAudit,
    updateAudit,
    deleteAudit,
    getEvaluations,
    saveEvaluations,
    soumettreAudit,
    validerAudit,
    rejeterAudit,
    changerPhase,
} = require('../controllers/auditController');
const { getSoA, saveSoA } = require('../controllers/soaController');
const { getPlanActions, createPlanAction, updatePlanAction, deletePlanAction, getAllPlanActions, soumettreValidationPlan, validerPlanAction, rejeterPlanAction } = require('../controllers/planActionController');

/**
 * @swagger
 * tags:
 *   - name: Audits
 *     description: Gestion des audits
 *   - name: Évaluations
 *     description: Niveaux de maturité par mesure
 *   - name: SoA
 *     description: Déclaration d'Applicabilité (ISO 27001)
 *   - name: Validation audits
 *     description: Workflow soumettre / valider / rejeter un audit
 */

/**
 * @swagger
 * /api/audits:
 *   get:
 *     summary: Lister tous les audits
 *     tags: [Audits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des audits
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 audits:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Audit'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', verifyToken, getAllAudits);

/**
 * @swagger
 * /api/audits/plans-actions:
 *   get:
 *     summary: Lister tous les plans d'actions (tous audits confondus)
 *     tags: [Plans d'actions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste globale des plans d'actions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plans_actions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PlanAction'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/plans-actions', verifyToken, getAllPlanActions);

/**
 * @swagger
 * /api/audits:
 *   post:
 *     summary: Créer un audit
 *     tags: [Audits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAuditRequest'
 *     responses:
 *       201:
 *         description: Audit créé. Si le nom client ne correspond à aucune entité existante, une entité est créée automatiquement.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 audit:
 *                   $ref: '#/components/schemas/Audit'
 *                 entite_created:
 *                   type: boolean
 *                   description: true si une nouvelle entité a été créée automatiquement depuis le nom client
 *                   example: true
 *       400:
 *         description: Champs requis manquants
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', verifyToken, verifyRole('admin', 'auditeur_senior'), createAudit);

/**
 * @swagger
 * /api/audits/{id}:
 *   get:
 *     summary: Détail d'un audit
 *     tags: [Audits]
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
 *         description: Audit trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 audit:
 *                   $ref: '#/components/schemas/Audit'
 *       404:
 *         description: Audit introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/:id', verifyToken, getAuditById);

/**
 * @swagger
 * /api/audits/{id}:
 *   put:
 *     summary: Modifier un audit
 *     description: |
 *       - **admin / auditeur_senior** : tous les champs + auditeurs_ids
 *       - **auditeur_junior** : uniquement `identification` et `indicateurs` (doit être assigné)
 *     tags: [Audits]
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
 *             type: object
 *             properties:
 *               nom: { type: string }
 *               client: { type: string }
 *               perimetre: { type: string }
 *               date_debut: { type: string, format: date }
 *               date_fin: { type: string, format: date }
 *               statut: { type: string, enum: [brouillon, en_cours, termine, archive] }
 *               phase: { type: string, enum: [cadrage, prerequis, revue_documentaire, realisation, termine] }
 *               identification: { type: object }
 *               indicateurs: { type: object }
 *               auditeurs_ids: { type: array, items: { type: integer } }
 *     responses:
 *       200:
 *         description: Audit mis à jour
 *       404:
 *         description: Audit introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id', verifyToken, updateAudit);

/**
 * @swagger
 * /api/audits/{id}:
 *   delete:
 *     summary: Supprimer un audit (admin uniquement)
 *     tags: [Audits]
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
 *         description: Audit supprimé
 *       404:
 *         description: Audit introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/:id', verifyToken, verifyRole('admin'), deleteAudit);

/**
 * @swagger
 * /api/audits/{id}/evaluations:
 *   get:
 *     summary: Récupérer les évaluations d'un audit
 *     tags: [Évaluations]
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
 *         description: Liste des évaluations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 evaluations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Evaluation'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/:id/evaluations', verifyToken, getEvaluations);

/**
 * @swagger
 * /api/audits/{id}/evaluations:
 *   put:
 *     summary: Sauvegarder les évaluations d'un audit (bulk upsert)
 *     description: Crée ou met à jour les évaluations. Passe le statut de `brouillon` à `en_cours` si nécessaire.
 *     tags: [Évaluations]
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
 *             $ref: '#/components/schemas/SaveEvaluationsRequest'
 *     responses:
 *       200:
 *         description: Évaluations sauvegardées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 count: { type: integer }
 *       404:
 *         description: Audit introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/evaluations', verifyToken, saveEvaluations);

/**
 * @swagger
 * /api/audits/{id}/soa:
 *   get:
 *     summary: Récupérer la Déclaration d'Applicabilité (SoA)
 *     tags: [SoA]
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
 *         description: Entrées SoA
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 soa:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SoAEntry'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/:id/soa', verifyToken, getSoA);

/**
 * @swagger
 * /api/audits/{id}/soa:
 *   put:
 *     summary: Sauvegarder la Déclaration d'Applicabilité
 *     tags: [SoA]
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
 *             type: object
 *             properties:
 *               entries:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/SoAEntry'
 *     responses:
 *       200:
 *         description: SoA sauvegardée
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/soa', verifyToken, saveSoA);

/**
 * @swagger
 * /api/audits/{id}/soumettre:
 *   put:
 *     summary: Soumettre un audit pour validation
 *     description: Réservé aux auditeurs assignés. Passe `statut_validation` à `en_attente` et notifie les seniors/admins.
 *     tags: [Validation audits]
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
 *         description: Audit soumis pour validation
 *       400:
 *         description: Audit déjà en attente
 *       403:
 *         description: Non assigné à cet audit
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/soumettre', verifyToken, soumettreAudit);

/**
 * @swagger
 * /api/audits/{id}/valider:
 *   put:
 *     summary: Valider un audit (admin / auditeur_senior)
 *     description: Passe `statut_validation` à `valide` et `statut` à `termine`. Notifie les auditeurs assignés.
 *     tags: [Validation audits]
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
 *         description: Audit validé et clôturé
 *       404:
 *         description: Audit introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/valider', verifyToken, verifyRole('admin', 'auditeur_senior'), validerAudit);

/**
 * @swagger
 * /api/audits/{id}/rejeter:
 *   put:
 *     summary: Rejeter un audit (admin / auditeur_senior)
 *     description: Passe `statut_validation` à `rejete`. Un commentaire de rejet est obligatoire.
 *     tags: [Validation audits]
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
 *             type: object
 *             required: [commentaire]
 *             properties:
 *               commentaire:
 *                 type: string
 *                 example: "Les évaluations de la section 5 sont incomplètes."
 *     responses:
 *       200:
 *         description: Audit rejeté
 *       400:
 *         description: Commentaire manquant
 *       404:
 *         description: Audit introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/rejeter', verifyToken, verifyRole('admin', 'auditeur_senior'), rejeterAudit);

/**
 * @swagger
 * /api/audits/{id}/phase:
 *   put:
 *     summary: Changer la phase d'un audit (admin / auditeur_senior)
 *     description: Avance ou recule la phase du workflow. Ordre — cadrage → prerequis → revue_documentaire → realisation → termine.
 *     tags: [Audits]
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
 *             type: object
 *             required: [direction]
 *             properties:
 *               direction:
 *                 type: integer
 *                 enum: [1, -1]
 *                 description: 1 = avancer, -1 = reculer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Phase mise à jour
 *       400:
 *         description: Phase déjà première ou dernière
 *       404:
 *         description: Audit introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/phase', verifyToken, verifyRole('admin', 'auditeur_senior'), changerPhase);

// ─── Validation client ───────────────────────────────────────────────────────
const { soumettreValidationPlanning, repondreValidationPlanning, soumettreValidationRapport, repondreValidationRapport } = require('../controllers/validationClientController');

/**
 * @swagger
 * tags:
 *   name: Validation client
 *   description: Validation planning et rapport final par le client
 */

/**
 * @swagger
 * /api/audits/{id}/validation-planning/soumettre:
 *   put:
 *     summary: Soumettre le planning pour validation client (admin / senior)
 *     tags: [Validation client]
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
 *         description: Planning soumis au client
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/validation-planning/soumettre', verifyToken, verifyRole('admin', 'auditeur_senior'), soumettreValidationPlanning);

/**
 * @swagger
 * /api/audits/{id}/validation-planning/repondre:
 *   put:
 *     summary: Répondre à la validation planning (client)
 *     tags: [Validation client]
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
 *             type: object
 *             required: [statut]
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [valide, modifications_demandees]
 *                 example: valide
 *               commentaire:
 *                 type: string
 *                 example: "Planning approuvé, merci."
 *     responses:
 *       200:
 *         description: Réponse enregistrée
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/validation-planning/repondre',  verifyToken, repondreValidationPlanning);

/**
 * @swagger
 * /api/audits/{id}/validation-rapport/soumettre:
 *   put:
 *     summary: Soumettre le rapport final pour validation client (admin / senior)
 *     tags: [Validation client]
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
 *         description: Rapport soumis au client
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/validation-rapport/soumettre',  verifyToken, verifyRole('admin', 'auditeur_senior'), soumettreValidationRapport);

/**
 * @swagger
 * /api/audits/{id}/validation-rapport/repondre:
 *   put:
 *     summary: Répondre à la validation rapport (client)
 *     tags: [Validation client]
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
 *             type: object
 *             required: [statut]
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [valide, modifications_demandees]
 *                 example: valide
 *               commentaire:
 *                 type: string
 *                 example: "Rapport validé."
 *     responses:
 *       200:
 *         description: Réponse enregistrée
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/validation-rapport/repondre',   verifyToken, repondreValidationRapport);

// ─── Documents ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Dépôt et gestion des documents d'audit
 */

/**
 * @swagger
 * /api/audits/{id}/documents:
 *   get:
 *     summary: Lister les documents d'un audit
 *     tags: [Documents]
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
 *         description: Liste des documents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 documents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Document'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get   ('/:id/documents',                    verifyToken, getDocuments);

/**
 * @swagger
 * /api/audits/{id}/documents:
 *   post:
 *     summary: Déposer des documents sur un audit (multipart, max 10 fichiers, 10 Mo chacun)
 *     description: Types autorisés — PDF, Word, Excel, image (JPEG/PNG), texte. Envoyer `is_correction=true` si c'est une correction d'un refus.
 *     tags: [Documents]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fichiers:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               is_correction:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Documents déposés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 documents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Document'
 *       400:
 *         description: Aucun fichier fourni ou type non autorisé
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post  ('/:id/documents',                    verifyToken, upload.array('fichiers', 10), uploadDocuments);

/**
 * @swagger
 * /api/audits/{id}/documents/{docId}:
 *   delete:
 *     summary: Supprimer un document
 *     description: L'auteur du document peut le supprimer. Admin et auditeur_senior peuvent supprimer n'importe quel document.
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: docId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Document supprimé
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Document introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/:id/documents/:docId',             verifyToken, deleteDocument);

/**
 * @swagger
 * /api/audits/{id}/documents/{docId}/download:
 *   get:
 *     summary: Télécharger un document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: docId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Fichier binaire
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Document ou fichier introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get   ('/:id/documents/:docId/download',    verifyToken, downloadDocument);

/**
 * @swagger
 * /api/audits/{id}/documents/{docId}/statut:
 *   put:
 *     summary: Valider ou refuser un document
 *     description: |
 *       - **Client** peut valider/refuser les documents déposés par les auditeurs
 *       - **Auditeur** peut valider/refuser les documents déposés par le client
 *       Le statut `refuse` nécessite un `constat`.
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: docId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [statut]
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [valide, refuse]
 *                 example: valide
 *               constat:
 *                 type: string
 *                 example: "Document illisible, veuillez renvoyer en PDF."
 *     responses:
 *       200:
 *         description: Statut mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 document:
 *                   $ref: '#/components/schemas/Document'
 *       400:
 *         description: Statut invalide ou constat manquant
 *       403:
 *         description: Vous ne pouvez pas valider vos propres documents
 *       404:
 *         description: Document introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put   ('/:id/documents/:docId/statut',      verifyToken, verifyRole('admin', 'auditeur_senior', 'auditeur_junior', 'client'), updateDocumentStatut);

// ─── Plans d'actions ────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/audits/{id}/plans-actions:
 *   get:
 *     summary: Lister les plans d'actions d'un audit
 *     tags: [Plans d'actions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'audit
 *     responses:
 *       200:
 *         description: Liste des plans d'actions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plans_actions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PlanAction'
 *       404:
 *         description: Audit introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/:id/plans-actions', verifyToken, getPlanActions);

/**
 * @swagger
 * /api/audits/{id}/plans-actions:
 *   post:
 *     summary: Créer un plan d'action pour un audit
 *     tags: [Plans d'actions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'audit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePlanActionRequest'
 *     responses:
 *       201:
 *         description: Plan d'action créé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plan_action:
 *                   $ref: '#/components/schemas/PlanAction'
 *       404:
 *         description: Audit introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/:id/plans-actions', verifyToken, createPlanAction);

/**
 * @swagger
 * /api/audits/{id}/plans-actions/{planId}:
 *   put:
 *     summary: Modifier un plan d'action
 *     tags: [Plans d'actions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'audit
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du plan d'action
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePlanActionRequest'
 *     responses:
 *       200:
 *         description: Plan d'action mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plan_action:
 *                   $ref: '#/components/schemas/PlanAction'
 *       404:
 *         description: Plan d'action introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/plans-actions/:planId', verifyToken, updatePlanAction);

/**
 * @swagger
 * /api/audits/{id}/plans-actions/{planId}:
 *   delete:
 *     summary: Supprimer un plan d'action
 *     tags: [Plans d'actions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'audit
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du plan d'action
 *     responses:
 *       200:
 *         description: Plan d'action supprimé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Plan d'action supprimé"
 *       404:
 *         description: Plan d'action introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/:id/plans-actions/:planId', verifyToken, deletePlanAction);

/**
 * @swagger
 * tags:
 *   name: Validation plans
 *   description: Workflow soumettre / valider / rejeter un plan d'action
 */

/**
 * @swagger
 * /api/audits/{id}/plans-actions/{planId}/soumettre:
 *   put:
 *     summary: Soumettre un plan d'action pour validation
 *     tags: [Validation plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'audit
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du plan d'action
 *     responses:
 *       200:
 *         description: Plan soumis pour validation
 *       400:
 *         description: Déjà en attente
 *       404:
 *         description: Plan introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/plans-actions/:planId/soumettre', verifyToken, soumettreValidationPlan);

/**
 * @swagger
 * /api/audits/{id}/plans-actions/{planId}/valider:
 *   put:
 *     summary: Valider un plan d'action (admin / auditeur_senior)
 *     tags: [Validation plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Plan validé
 *       404:
 *         description: Plan introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/plans-actions/:planId/valider', verifyToken, verifyRole('admin', 'auditeur_senior'), validerPlanAction);

/**
 * @swagger
 * /api/audits/{id}/plans-actions/{planId}/rejeter:
 *   put:
 *     summary: Rejeter un plan d'action (admin / auditeur_senior)
 *     tags: [Validation plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [commentaire]
 *             properties:
 *               commentaire:
 *                 type: string
 *                 example: "Action corrective insuffisante."
 *     responses:
 *       200:
 *         description: Plan rejeté
 *       400:
 *         description: Commentaire manquant
 *       404:
 *         description: Plan introuvable
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/plans-actions/:planId/rejeter', verifyToken, verifyRole('admin', 'auditeur_senior'), rejeterPlanAction);

module.exports = router;
