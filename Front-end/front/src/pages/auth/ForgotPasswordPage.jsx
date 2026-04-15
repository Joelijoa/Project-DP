import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { forgotPassword } from '../../services/endpoints/authService';

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
                    {emailSent ? (
                        /* Confirmation */
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                Email envoyé
                            </h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation valable 1 heure.
                            </p>
                            <Link
                                to="/login"
                                className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium transition"
                            >
                                Retour à la connexion
                            </Link>
                        </div>
                    ) : (
                        /* Formulaire */
                        <>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                Mot de passe oublié
                            </h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Saisissez votre adresse email. Vous recevrez un lien pour réinitialiser votre mot de passe.
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
                                        className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                                            errors.email ? 'border-red-400' : 'border-gray-300'
                                        }`}
                                        placeholder="votre.email@organisme.ma"
                                    />
                                    {errors.email && (
                                        <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                                </button>
                            </form>

                            <div className="text-center mt-6">
                                <Link
                                    to="/login"
                                    className="text-sm text-gray-500 hover:text-gray-700 transition"
                                >
                                    Retour à la connexion
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
