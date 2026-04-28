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
