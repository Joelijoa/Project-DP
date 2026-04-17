import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../../store/auth/AuthContext';
import { changePassword } from '../../services/endpoints/authService';
import ConfirmModal from '../../components/common/ConfirmModal';
import logo from '../../assets/images/Logo.png';

const ChangePasswordPage = () => {
    const { isAuthenticated, mustChangePassword, passwordChanged, logout } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm();

    const newPassword = watch('newPassword');

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

    const handleLogoutConfirmed = () => {
        logout();
        navigate('/login');
    };

    const inputFocus = (e) => { e.target.style.boxShadow = '0 0 0 2px rgba(204,0,0,0.25)'; };
    const inputBlur = (e) => { e.target.style.boxShadow = ''; };

    return (
        <>
            <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--brand-dark)' }}>
                <div className="w-full max-w-md">
                    {/* Logo */}
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

                    {/* Card */}
                    <div className="bg-white rounded-2xl shadow-2xl p-8">
                        {mustChangePassword && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 flex items-start gap-2">
                                <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                                <p className="text-amber-800 text-sm">
                                    Votre mot de passe est temporaire. Vous devez le changer avant de continuer.
                                </p>
                            </div>
                        )}

                        <h2 className="text-xl font-semibold text-gray-900 mb-1">Changer le mot de passe</h2>
                        <p className="text-sm text-gray-400 mb-6">
                            {mustChangePassword
                                ? 'Définissez un nouveau mot de passe sécurisé.'
                                : 'Mettez à jour votre mot de passe de connexion.'}
                        </p>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {mustChangePassword ? 'Mot de passe temporaire' : 'Ancien mot de passe'}
                                </label>
                                <input
                                    type="password"
                                    {...register('oldPassword', { required: 'Ce champ est requis' })}
                                    className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none transition ${
                                        errors.oldPassword ? 'border-red-400' : 'border-gray-300'
                                    }`}
                                    onFocus={inputFocus}
                                    onBlur={inputBlur}
                                    placeholder={mustChangePassword ? 'Le mot de passe reçu par email' : 'Votre mot de passe actuel'}
                                />
                                {errors.oldPassword && (
                                    <p className="text-red-500 text-xs mt-1">{errors.oldPassword.message}</p>
                                )}
                            </div>

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
                                    onFocus={inputFocus}
                                    onBlur={inputBlur}
                                    placeholder="Minimum 8 caractères"
                                />
                                {errors.newPassword && (
                                    <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>
                                )}
                            </div>

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
                                    className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none transition ${
                                        errors.confirmPassword ? 'border-red-400' : 'border-gray-300'
                                    }`}
                                    onFocus={inputFocus}
                                    onBlur={inputBlur}
                                    placeholder="Retapez le nouveau mot de passe"
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
                                {isLoading ? 'Modification...' : 'Modifier le mot de passe'}
                            </button>
                        </form>

                        {mustChangePassword && (
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600 transition cursor-pointer"
                            >
                                Se déconnecter
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={showLogoutConfirm}
                title="Se déconnecter ?"
                message="Vous serez redirigé vers la page de connexion."
                confirmLabel="Se déconnecter"
                cancelLabel="Annuler"
                danger
                onConfirm={handleLogoutConfirmed}
                onCancel={() => setShowLogoutConfirm(false)}
            />
        </>
    );
};

export default ChangePasswordPage;
