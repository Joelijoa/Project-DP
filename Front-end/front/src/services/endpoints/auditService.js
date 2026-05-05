import api from '../api/axios';

export const getAllAudits = () => api.get('/audits');
export const getAuditById = (id) => api.get(`/audits/${id}`);
export const createAudit = (data) => api.post('/audits', data);
export const updateAudit = (id, data) => api.put(`/audits/${id}`, data);
export const deleteAudit = (id) => api.delete(`/audits/${id}`);
export const getEvaluations = (id) => api.get(`/audits/${id}/evaluations`);
export const saveEvaluations = (id, evaluations) => api.put(`/audits/${id}/evaluations`, { evaluations });
export const getSoA = (id) => api.get(`/audits/${id}/soa`);
export const saveSoA = (id, entries) => api.put(`/audits/${id}/soa`, { entries });
export const soumettreAudit = (id) => api.put(`/audits/${id}/soumettre`);
export const validerAudit   = (id) => api.put(`/audits/${id}/valider`);
export const rejeterAudit   = (id, commentaire) => api.put(`/audits/${id}/rejeter`, { commentaire });
export const changerPhase   = (id, phase) => api.put(`/audits/${id}/phase`, { phase });
export const getDocuments    = (id) => api.get(`/audits/${id}/documents`);
export const uploadDocuments = (id, formData) => api.post(`/audits/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteDocument  = (id, docId) => api.delete(`/audits/${id}/documents/${docId}`);
export const downloadDocument = (id, docId) => api.get(`/audits/${id}/documents/${docId}/download`, { responseType: 'blob' });
