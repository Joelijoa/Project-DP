const path = require('path');
const fs   = require('fs');
const Document = require('../models/Document');
const Audit    = require('../models/Audit');
const { log }  = require('../services/logService');

const getIp = req => req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';

const UPLOADS_DIR = path.join(__dirname, '../../uploads/documents');

const getDocuments = async (req, res) => {
    try {
        const { id } = req.params;
        const docs = await Document.findAll({
            where: { audit_id: id },
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
        const audit = await Audit.findByPk(id);
        if (!audit) return res.status(404).json({ message: 'Audit non trouvé.' });

        const files = req.files;
        if (!files || files.length === 0)
            return res.status(400).json({ message: 'Aucun fichier fourni.' });

        const docs = await Promise.all(files.map(f => Document.create({
            audit_id:     id,
            nom_original: f.originalname,
            nom_fichier:  f.filename,
            type_mime:    f.mimetype,
            taille:       f.size,
            uploaded_by:  req.user.userId,
        })));

        await log('doc_upload', `${files.length} document(s) déposé(s) pour l'audit "${audit.nom}"`, req.user.userId, getIp(req));
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
        if (doc.uploaded_by !== req.user.userId && !['admin', 'auditeur_senior'].includes(role))
            return res.status(403).json({ message: 'Non autorisé.' });

        const filePath = path.join(UPLOADS_DIR, doc.nom_fichier);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await doc.destroy();
        await log('doc_delete', `Document "${doc.nom_original}" supprimé`, req.user.userId, getIp(req));
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

module.exports = { getDocuments, uploadDocuments, deleteDocument, downloadDocument };
