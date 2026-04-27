import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../../store/auth/AuthContext';
import { login } from '../../services/endpoints/authService';
import logo from '../../assets/images/Logo.png';

const LoginPage = () => {
    const { loginSuccess } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const onSubmit = async (data) => {
        setIsLoading(true);
        setErrorMsg('');
        try {
            const result = await login(data.email, data.password);
            loginSuccess(result);

            if (result.must_change_password) {
                navigate('/change-password');
            } else {
                toast.success(`Bienvenue, ${result.user.prenom} !`);
                navigate('/dashboard');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erreur de connexion';
            setErrorMsg(message);
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
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">Connexion</h2>
                    <p className="text-sm text-gray-400 mb-6">Accès réservé aux agents autorisés</p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Email */}
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
                                    onChange: () => setErrorMsg(''),
                                })}
                                className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition ${
                                    errors.email ? 'border-red-400 focus:ring-red-300' : 'border-gray-300'
                                }`}
                                style={!errors.email ? { '--tw-ring-color': 'var(--brand-red)' } : {}}
                                onFocus={e => { if (!errors.email) e.target.style.boxShadow = '0 0 0 2px rgba(204,0,0,0.25)'; }}
                                onBlur={e => { e.target.style.boxShadow = ''; }}
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
                                    minLength: { value: 6, message: '6 caractères minimum' },
                                    onChange: () => setErrorMsg(''),
                                })}
                                className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition ${
                                    errors.password ? 'border-red-400 focus:ring-red-300' : 'border-gray-300'
                                }`}
                                onFocus={e => { if (!errors.password) e.target.style.boxShadow = '0 0 0 2px rgba(204,0,0,0.25)'; }}
                                onBlur={e => { e.target.style.boxShadow = ''; }}
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
                                className="text-sm font-medium transition"
                                style={{ color: 'var(--brand-red)' }}
                            >
                                Mot de passe oublié ?
                            </a>
                        </div>

                        {/* Erreur inline */}
                        {errorMsg && (
                            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                                <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                </svg>
                                <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full text-white py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            style={{ backgroundColor: 'var(--brand-red)' }}
                            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.opacity = '0.88'; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                        >
                            {isLoading ? 'Connexion...' : 'Se connecter'}
                        </button>
                    </form>

                    <p className="text-xs text-gray-400 text-center mt-6">
                        Contactez votre administrateur pour obtenir un compte.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
