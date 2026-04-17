import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { forgotPassword } from '../../services/endpoints/authService';
import logo from '../../assets/images/Logo.png';

const ForgotPasswordPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            await forgotPassword(data.email);
            setEmailSent(true);
            toast.success('Email envoyé !');
        } catch (error) {
            toast.error('Une erreur est survenue. Réessayez.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
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
                    {emailSent ? (
                        <div className="text-center">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(204,0,0,0.08)' }}>
                                <svg className="w-7 h-7" style={{ color: 'var(--brand-red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Email envoyé</h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation valable 1 heure.
                            </p>
                            <Link
                                to="/login"
                                className="inline-block text-sm font-medium transition"
                                style={{ color: 'var(--brand-red)' }}
                            >
                                Retour à la connexion
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-xl font-semibold text-gray-900 mb-1">Mot de passe oublié</h2>
                            <p className="text-sm text-gray-400 mb-6">
                                Saisissez votre adresse email pour recevoir un lien de réinitialisation.
                            </p>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Adresse email
                                    </label>
                                    <input
                                        type="email"
                                        {...register('email', {
                                            required: "L'email est requis",
                                            pattern: {
                                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                message: 'Email invalide',
                                            },
                                        })}
                                        className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none transition ${
                                            errors.email ? 'border-red-400' : 'border-gray-300'
                                        }`}
                                        onFocus={e => { if (!errors.email) e.target.style.boxShadow = '0 0 0 2px rgba(204,0,0,0.25)'; }}
                                        onBlur={e => { e.target.style.boxShadow = ''; }}
                                        placeholder="votre.email@organisme.ma"
                                    />
                                    {errors.email && (
                                        <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
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
                                    {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                                </button>
                            </form>

                            <div className="text-center mt-6">
                                <Link
                                    to="/login"
                                    className="text-sm text-gray-400 hover:text-gray-600 transition"
                                >
                                    ← Retour à la connexion
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
