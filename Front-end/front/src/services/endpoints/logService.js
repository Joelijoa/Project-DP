import api from '../api/axios';

export const getLogs = (params) => api.get('/logs', { params });
