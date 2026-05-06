const path = require('path');
const fs   = require('fs');
const Document = require('../models/Document');
const Audit    = require('../models/Audit');
const { User } = require('../models');
const { log }  = require('../services/logService');
const { notifierUsers } = require('../services/notificationService');

const getIp = req => req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';

const UPLOADS_DIR = path.join(__dirname, '../../uploads/documents');

const UPLOADER_ATTRS = ['id', 'nom', 'prenom', 'role'];

const getDocuments = async (req, res) => {
    try {
        const { id } = req.params;
        const docs = await Document.findAll({
            where: { audit_id: id },
            include: [{ model: User, as: 'uploader', attributes: UPLOADER_ATTRS }],
            order: [['createdAt', 'DESC']],
        });
        res.json({ documents: docs });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const uploadDocuments = async (req, res) => {
    try {
        const { id } = req.params;
        const isCorrection = req.body.is_correction === 'true' || req.body.is_correction === true;

        const audit = await Audit.findByPk(id, {
            include: isCorrection ? [{ model: User, as: 'auditeurs', attributes: ['id'] }] : [],
        });
        if (!audit) return res.status(404).json({ message: 'Audit non trouvé.' });

        const files = req.files;
        if (!files || files.length === 0)
            return res.status(400).json({ message: 'Aucun fichier fourni.' });

        const docs = await Promise.all(files.map(f => Document.create({
            audit_id:      id,
            nom_original:  f.originalname,
            nom_fichier:   f.filename,
            type_mime:     f.mimetype,
            taille:        f.size,
            uploaded_by:   req.user.userId,
            is_correction: isCorrection,
        })));

        log(req.user.userId, 'doc_upload', 'audit', id, `${files.length} document(s) déposés — audit "${audit.nom}"`, getIp(req));

        if (isCorrection && audit.auditeurs?.length > 0) {
            const ids = audit.auditeurs.map(u => u.id);
            const nomFichier = files[0].originalname;
            notifierUsers(ids, 'DOC_CORRECTION',
                `Document corrigé — ${audit.nom}`,
                `Le client a déposé une correction pour "${nomFichier}". Veuillez le re-examiner.`,
                Number(id)
            ).catch(() => {});
        }

        res.status(201).json({ documents: docs });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const deleteDocument = async (req, res) => {
    try {
        const { id, docId } = req.params;
        const doc = await Document.findOne({ where: { id: docId, audit_id: id } });
        if (!doc) return res.status(404).json({ message: 'Document non trouvé.' });

        const role = req.user.role;
        if (Number(doc.uploaded_by) !== Number(req.user.userId) && !['admin', 'auditeur_senior'].includes(role))
            return res.status(403).json({ message: 'Non autorisé.' });

        const filePath = path.join(UPLOADS_DIR, doc.nom_fichier);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await doc.destroy();
        log(req.user.userId, 'doc_delete', 'document', doc.id, doc.nom_original, getIp(req));
        res.json({ message: 'Document supprimé.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const downloadDocument = async (req, res) => {
    try {
        const { id, docId } = req.params;
        const doc = await Document.findOne({ where: { id: docId, audit_id: id } });
        if (!doc) return res.status(404).json({ message: 'Document non trouvé.' });

        const filePath = path.join(UPLOADS_DIR, doc.nom_fichier);
        if (!fs.existsSync(filePath))
            return res.status(404).json({ message: 'Fichier introuvable sur le serveur.' });

        res.download(filePath, doc.nom_original);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateDocumentStatut = async (req, res) => {
    try {
        const { id, docId } = req.params;
        const { statut, constat } = req.body;

        if (!['valide', 'refuse'].includes(statut))
            return res.status(400).json({ message: 'Statut invalide.' });
        if (statut === 'refuse' && !constat?.trim())
            return res.status(400).json({ message: 'Un constat est requis en cas de refus.' });

        const doc = await Document.findOne({ where: { id: docId, audit_id: id } });
        if (!doc) return res.status(404).json({ message: 'Document non trouvé.' });

        await doc.update({ statut, constat: statut === 'refuse' ? constat.trim() : null });

        const updated = await Document.findByPk(doc.id, {
            include: [{ model: User, as: 'uploader', attributes: UPLOADER_ATTRS }],
        });

        log(req.user.userId, `doc_${statut}`, 'document', doc.id, doc.nom_original, getIp(req));

        if (statut === 'refuse') {
            const audit = await Audit.findByPk(id);
            if (audit?.entite_id) {
                const clients = await User.findAll({ where: { entite_id: audit.entite_id, role: 'client' }, attributes: ['id'] });
                const ids = clients.map(u => u.id);
                if (ids.length > 0) notifierUsers(ids, 'DOC_REFUSE',
                    `Document refusé — ${audit.nom}`,
                    `Le document "${doc.nom_original}" a été refusé. Constat : ${constat}`,
                    audit.id
                ).catch(() => {});
            }
        }

        res.json({ document: updated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getDocuments, uploadDocuments, deleteDocument, downloadDocument, updateDocumentStatut };
