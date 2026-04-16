import api from '../api/axios';

export const getAllEntites  = ()           => api.get('/entites');
export const getEntiteById  = (id)         => api.get(`/entites/${id}`);
export const createEntite   = (data)       => api.post('/entites', data);
export const updateEntite   = (id, data)   => api.put(`/entites/${id}`, data);
export const deleteEntite   = (id)         => api.delete(`/entites/${id}`);
