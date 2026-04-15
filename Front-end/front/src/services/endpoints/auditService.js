import api from '../api/axios';

export const getAllAudits = () => api.get('/audits');
export const getAuditById = (id) => api.get(`/audits/${id}`);
export const createAudit = (data) => api.post('/audits', data);
export const updateAudit = (id, data) => api.put(`/audits/${id}`, data);
export const deleteAudit = (id) => api.delete(`/audits/${id}`);
export const getEvaluations = (id) => api.get(`/audits/${id}/evaluations`);
export const saveEvaluations = (id, evaluations) => api.put(`/audits/${id}/evaluations`, { evaluations });
