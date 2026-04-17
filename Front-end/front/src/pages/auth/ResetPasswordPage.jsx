import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { resetPassword } from '../../services/endpoints/authService';
import logo from '../../assets/images/Logo.png';

const AuthShell = ({ children }) => (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--brand-dark)' }}>
        <div className="w-full max-w-md">
            <div className="flex flex-col items-center mb-8">
                <img src={logo} alt="ZeroGap logo" className="w-16 h-16 object-contain mb-3" />
                <h1 className="text-xl font-bold tracking-tight">
                    <span className="text-white">Zero</span><span style={{ color: 'var(--brand-red)' }}>Gap</span>
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">GRC audit platform</p>
                <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider border border-gray-600 rounded px-1.5 py-px">DNSSI</span>
                    <span className="text-[9px] text-gray-600">·</span>
                    <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider border border-gray-600 rounded px-1.5 py-px">ISO 27001</span>
                </div>
            </div>
            <div className="bg-white rounded-2xl shadow-2xl p-8">
                {children}
            </div>
        </div>
    </div>
);

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

    if (!token) {
        return (
            <AuthShell>
                <div className="text-center">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(204,0,0,0.08)' }}>
                        <svg className="w-7 h-7" style={{ color: 'var(--brand-red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Lien invalide</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Ce lien de réinitialisation est invalide ou a expiré.
                    </p>
                    <Link
                        to="/forgot-password"
                        className="text-sm font-medium transition"
                        style={{ color: 'var(--brand-red)' }}
                    >
                        Demander un nouveau lien
                    </Link>
                </div>
            </AuthShell>
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
        <AuthShell>
            {success ? (
                <div className="text-center">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(204,0,0,0.08)' }}>
                        <svg className="w-7 h-7" style={{ color: 'var(--brand-red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Mot de passe modifié</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Votre mot de passe a été réinitialisé avec succès.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="text-white px-6 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer"
                        style={{ backgroundColor: 'var(--brand-red)' }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                    >
                        Se connecter
                    </button>
                </div>
            ) : (
                <>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">Nouveau mot de passe</h2>
                    <p className="text-sm text-gray-400 mb-6">
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
                                className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none transition ${
                                    errors.newPassword ? 'border-red-400' : 'border-gray-300'
                                }`}
                                onFocus={e => { if (!errors.newPassword) e.target.style.boxShadow = '0 0 0 2px rgba(204,0,0,0.25)'; }}
                                onBlur={e => { e.target.style.boxShadow = ''; }}
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
                                className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none transition ${
                                    errors.confirmPassword ? 'border-red-400' : 'border-gray-300'
                                }`}
                                onFocus={e => { if (!errors.confirmPassword) e.target.style.boxShadow = '0 0 0 2px rgba(204,0,0,0.25)'; }}
                                onBlur={e => { e.target.style.boxShadow = ''; }}
                                placeholder="Retapez le mot de passe"
                            />
                            {errors.confirmPassword && (
                                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full text-white py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            style={{ backgroundColor: 'var(--brand-red)' }}
                            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.opacity = '0.88'; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                        >
                            {isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                        </button>
                    </form>
                </>
            )}
        </AuthShell>
    );
};

export default ResetPasswordPage;
