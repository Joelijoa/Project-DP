import api from '../api/axios';

export const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
};

export const changePassword = async (oldPassword, newPassword) => {
    const response = await api.post('/users/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
    });
    return response.data;
};

export const forgotPassword = async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
};

export const resetPassword = async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', {
        token,
        new_password: newPassword,
    });
    return response.data;
};
