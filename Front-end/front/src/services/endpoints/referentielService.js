import api from '../api/axios';

export const getAllReferentiels = () => api.get('/referentiels');
export const getReferentielById = (id) => api.get(`/referentiels/${id}`);
export const getReferentielStats = (id) => api.get(`/referentiels/${id}/stats`);
