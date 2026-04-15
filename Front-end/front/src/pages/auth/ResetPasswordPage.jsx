import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { resetPassword } from '../../services/endpoints/authService';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const token = searchParams.get('token');

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm();

    const newPassword = watch('newPassword');

    // Pas de token dans l'URL
    if (!token) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Lien invalide</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Ce lien de réinitialisation est invalide ou a expiré.
                        </p>
                        <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            Demander un nouveau lien
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            await resetPassword(token, data.newPassword);
            setSuccess(true);
            toast.success('Mot de passe réinitialisé !');
        } catch (error) {
            const message = error.response?.data?.message || 'Erreur lors de la réinitialisation';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white">
                        <span className="text-blue-400">GRC</span> Audit
                    </h1>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {success ? (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                Mot de passe modifié
                            </h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition cursor-pointer"
                            >
                                Se connecter
                            </button>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                Nouveau mot de passe
                            </h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Choisissez un nouveau mot de passe pour votre compte.
                            </p>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Nouveau mot de passe
                                    </label>
                                    <input
                                        type="password"
                                        {...register('newPassword', {
                                            required: 'Ce champ est requis',
                                            minLength: { value: 8, message: '8 caractères minimum' },
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

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Confirmer le mot de passe
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
                                        placeholder="Retapez le mot de passe"
                                    />
                                    {errors.confirmPassword && (
                                        <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
