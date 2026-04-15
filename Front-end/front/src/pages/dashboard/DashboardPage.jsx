import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/auth/AuthContext';
import { getAllAudits } from '../../services/endpoints/auditService';
import { getAllPlanActions } from '../../services/endpoints/planActionService';
import { getAllReferentiels } from '../../services/endpoints/referentielService';

const STATUT_CONFIG = {
    brouillon: { label: 'Brouillon', bg: 'bg-gray-100',   text: 'text-gray-600' },
    en_cours:  { label: 'En cours',  bg: 'bg-blue-50',    text: 'text-blue-700' },
    termine:   { label: 'Terminé',   bg: 'bg-green-50',   text: 'text-green-700' },
    archive:   { label: 'Archivé',   bg: 'bg-yellow-50',  text: 'text-yellow-700' },
};

const DashboardPage = () => {
    const { user } = useAuth();
    const [audits, setAudits] = useState([]);
    const [plans, setPlans] = useState([]);
    const [referentiels, setReferentiels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getAllAudits(), getAllPlanActions(), getAllReferentiels()])
            .then(([a, p, r]) => {
                setAudits(a.data.audits || []);
                setPlans(p.data.plans_actions || []);
                setReferentiels(r.data.referentiels || []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const enCours   = audits.filter(a => a.statut === 'en_cours').length;
    const termines  = audits.filter(a => a.statut === 'termine').length;
    const actionsOuvertes = plans.filter(p => p.statut === 'a_faire' || p.statut === 'en_cours').length;
    const recents   = [...audits].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);

    const stats = [
        {
            label: 'Audits en cours',
            value: loading ? '—' : String(enCours),
            description: `${audits.length} audit(s) au total`,
            accent: true,
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>,
        },
        {
            label: 'Actions ouvertes',
            value: loading ? '—' : String(actionsOuvertes),
            description: `${plans.length} action(s) au total`,
            accent: false,
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>,
        },
        {
            label: 'Référentiels',
            value: loading ? '—' : String(referentiels.length),
            description: referentiels.map(r => r.type).join(', ') || 'Aucun',
            accent: false,
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
        },
        {
            label: 'Audits terminés',
            value: loading ? '—' : String(termines),
            description: 'Évaluations complètes',
            accent: false,
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        },
    ];

    const quickLinks = [
        { label: 'Lancer un nouvel audit', to: '/audits/nouveau', primary: true },
        { label: 'Voir tous les audits',   to: '/audits',         primary: false },
        { label: 'Plans d\'actions',       to: '/plans-actions',  primary: false },
        { label: 'Gérer les utilisateurs', to: '/utilisateurs',   primary: false },
    ];

    return (
        <div>
            {/* En-tête */}
            <div className="mb-8">
                <h1 className="text-xl font-semibold text-gray-900">
                    Bonjour, {user?.prenom} {user?.nom}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Bienvenue sur la plateforme d'audit GRC — DNSSI & ISO 27001
                </p>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3"
                        style={stat.accent ? { borderTopWidth: '3px', borderTopColor: 'var(--brand-red)' } : {}}>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
                            <div className="p-1.5 rounded-lg"
                                style={{ backgroundColor: stat.accent ? 'var(--brand-red-light)' : '#F3F4F6', color: stat.accent ? 'var(--brand-red)' : '#6B7280' }}>
                                {stat.icon}
                            </div>
                        </div>
                        <div>
                            <p className="text-2xl font-bold" style={{ color: stat.accent ? 'var(--brand-red)' : '#111827' }}>
                                {stat.value}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{stat.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Accès rapides */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Accès rapides</h3>
                    <div className="flex flex-col gap-2">
                        {quickLinks.map((link, i) => (
                            <Link key={i} to={link.to}
                                className="flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                                style={link.primary ? { backgroundColor: 'var(--brand-red)', color: 'white' } : { backgroundColor: '#F9FAFB', color: '#374151' }}
                                onMouseEnter={e => { if (!link.primary) e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
                                onMouseLeave={e => { if (!link.primary) e.currentTarget.style.backgroundColor = '#F9FAFB'; }}>
                                <span>{link.label}</span>
                                <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Activité récente */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-800">Audits récents</h3>
                        <Link to="/audits" className="text-xs text-gray-400 hover:text-gray-600">Voir tout →</Link>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-5 h-5 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
                        </div>
                    ) : recents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                                style={{ backgroundColor: 'var(--brand-red-light)' }}>
                                <svg className="w-5 h-5" style={{ color: 'var(--brand-red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-sm text-gray-500">Aucun audit pour le moment</p>
                            <p className="text-xs text-gray-400 mt-1">Créez votre premier audit pour commencer</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recents.map(audit => {
                                const cfg = STATUT_CONFIG[audit.statut] ?? STATUT_CONFIG.brouillon;
                                return (
                                    <Link key={audit.id} to={`/audits/${audit.id}`}
                                        className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition group">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate group-hover:text-gray-900">{audit.nom}</p>
                                            <p className="text-xs text-gray-400 truncate">{audit.client} — {audit.referentiel?.nom}</p>
                                        </div>
                                        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                                            <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                            </svg>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
