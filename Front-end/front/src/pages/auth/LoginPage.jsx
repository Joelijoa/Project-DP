import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../../store/auth/AuthContext';
import { login } from '../../services/endpoints/authService';

const LoginPage = () => {
    const { loginSuccess } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const result = await login(data.email, data.password);
            loginSuccess(result);

            if (result.must_change_password) {
                toast.info('Veuillez changer votre mot de passe temporaire.');
                navigate('/change-password');
            } else {
                toast.success(`Bienvenue, ${result.user.prenom} !`);
                navigate('/dashboard');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erreur de connexion';
            toast.error(message);
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
                    <p className="text-slate-400 mt-2 text-sm">
                        Plateforme d'audit de conformité DNSSI & ISO 27001
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        Connexion
                    </h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Adresse email
                            </label>
                            <input
                                type="email"
                                {...register('email', {
                                    required: 'L\'email est requis',
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

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                {...register('password', {
                                    required: 'Le mot de passe est requis',
                                    minLength: {
                                        value: 6,
                                        message: '6 caractères minimum',
                                    },
                                })}
                                className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                                    errors.password ? 'border-red-400' : 'border-gray-300'
                                }`}
                                placeholder="Votre mot de passe"
                            />
                            {errors.password && (
                                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Mot de passe oublié */}
                        <div className="text-right">
                            <a
                                href="/forgot-password"
                                className="text-sm text-blue-600 hover:text-blue-800 transition"
                            >
                                Mot de passe oublié ?
                            </a>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isLoading ? 'Connexion...' : 'Se connecter'}
                        </button>
                    </form>

                    <p className="text-xs text-gray-400 text-center mt-6">
                        Accès réservé aux agents autorisés.
                        <br />
                        Contactez votre administrateur pour obtenir un compte.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
