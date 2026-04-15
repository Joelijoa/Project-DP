import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../../store/auth/AuthContext';
import { changePassword } from '../../services/endpoints/authService';

const ChangePasswordPage = () => {
    const { isAuthenticated, mustChangePassword, passwordChanged, logout } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm();

    const newPassword = watch('newPassword');

    // Si pas authentifié, rediriger vers login
    if (!isAuthenticated) {
        navigate('/login');
        return null;
    }

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            await changePassword(data.oldPassword, data.newPassword);
            passwordChanged();
            toast.success('Mot de passe modifié avec succès !');
            navigate('/dashboard');
        } catch (error) {
            const message = error.response?.data?.message || 'Erreur lors du changement de mot de passe';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white">
                        <span className="text-blue-400">GRC</span> Audit
                    </h1>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {mustChangePassword && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                            <p className="text-amber-800 text-sm">
                                Votre mot de passe est temporaire. Vous devez le changer avant de continuer.
                            </p>
                        </div>
                    )}

                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        Changer le mot de passe
                    </h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Ancien MDP */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                {mustChangePassword ? 'Mot de passe temporaire' : 'Ancien mot de passe'}
                            </label>
                            <input
                                type="password"
                                {...register('oldPassword', {
                                    required: 'Ce champ est requis',
                                })}
                                className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                                    errors.oldPassword ? 'border-red-400' : 'border-gray-300'
                                }`}
                                placeholder={mustChangePassword ? 'Le mot de passe reçu par email' : 'Votre mot de passe actuel'}
                            />
                            {errors.oldPassword && (
                                <p className="text-red-500 text-xs mt-1">{errors.oldPassword.message}</p>
                            )}
                        </div>

                        {/* Nouveau MDP */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Nouveau mot de passe
                            </label>
                            <input
                                type="password"
                                {...register('newPassword', {
                                    required: 'Ce champ est requis',
                                    minLength: {
                                        value: 8,
                                        message: '8 caractères minimum',
                                    },
                                })}
                                className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                                    errors.newPassword ? 'border-red-400' : 'border-gray-300'
                                }`}
                                placeholder="Minimum 8 caractères"
                            />
                            {errors.newPassword && (
                                <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>
                            )}
                        </div>

                        {/* Confirmer */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Confirmer le nouveau mot de passe
                            </label>
                            <input
                                type="password"
                                {...register('confirmPassword', {
                                    required: 'Ce champ est requis',
                                    validate: (value) =>
                                        value === newPassword || 'Les mots de passe ne correspondent pas',
                                })}
                                className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                                    errors.confirmPassword ? 'border-red-400' : 'border-gray-300'
                                }`}
                                placeholder="Retapez le nouveau mot de passe"
                            />
                            {errors.confirmPassword && (
                                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isLoading ? 'Modification...' : 'Modifier le mot de passe'}
                        </button>
                    </form>

                    {mustChangePassword && (
                        <button
                            onClick={handleLogout}
                            className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer"
                        >
                            Se déconnecter
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordPage;
