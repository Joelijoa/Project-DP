import api from '../api/axios';

export const getAllPlanActions = () => api.get('/audits/plans-actions');
export const getPlanActions    = (auditId) => api.get(`/audits/${auditId}/plans-actions`);
export const createPlanAction  = (auditId, data) => api.post(`/audits/${auditId}/plans-actions`, data);
export const updatePlanAction  = (auditId, planId, data) => api.put(`/audits/${auditId}/plans-actions/${planId}`, data);
export const deletePlanAction  = (auditId, planId) => api.delete(`/audits/${auditId}/plans-actions/${planId}`);
