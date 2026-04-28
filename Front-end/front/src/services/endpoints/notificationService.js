import api from '../api/axios';

export const getNotifications  = ()        => api.get('/notifications');
export const markAsRead        = (id)       => api.put(`/notifications/${id}/lu`);
export const markAllAsRead     = ()         => api.put('/notifications/lu');
