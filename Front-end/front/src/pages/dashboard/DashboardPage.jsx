import { useAuth } from '../../store/auth/AuthContext';

const stats = [
    {
        label: 'Audits en cours',
        value: '0',
        description: 'Aucun audit actif',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
        ),
        accent: true,
    },
    {
        label: 'Actions ouvertes',
        value: '0',
        description: 'Plans d\'action en attente',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
        ),
        accent: false,
    },
    {
        label: 'Referentiels',
        value: '1',
        description: 'DNSSI importé',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
        ),
        accent: false,
    },
    {
        label: 'Mesures evaluees',
        value: '0 / 104',
        description: 'Sur le référentiel DNSSI',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
        ),
        accent: false,
    },
];

const quickLinks = [
    { label: 'Lancer un nouvel audit', href: '/audits/nouveau', primary: true },
    { label: 'Voir les référentiels', href: '/referentiels', primary: false },
    { label: 'Gérer les utilisateurs', href: '/utilisateurs', primary: false },
];

const DashboardPage = () => {
    const { user } = useAuth();

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
                    <div
                        key={i}
                        className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3"
                        style={stat.accent ? { borderTopWidth: '3px', borderTopColor: 'var(--brand-red)' } : {}}
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
                            <div
                                className="p-1.5 rounded-lg"
                                style={{ backgroundColor: stat.accent ? 'var(--brand-red-light)' : '#F3F4F6', color: stat.accent ? 'var(--brand-red)' : '#6B7280' }}
                            >
                                {stat.icon}
                            </div>
                        </div>
                        <div>
                            <p
                                className="text-2xl font-bold"
                                style={{ color: stat.accent ? 'var(--brand-red)' : '#111827' }}
                            >
                                {stat.value}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{stat.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Accès rapides + Activité récente */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Accès rapides */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Accès rapides</h3>
                    <div className="flex flex-col gap-2">
                        {quickLinks.map((link, i) => (
                            <a
                                key={i}
                                href={link.href}
                                className="flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                                style={
                                    link.primary
                                        ? { backgroundColor: 'var(--brand-red)', color: 'white' }
                                        : { backgroundColor: '#F9FAFB', color: '#374151' }
                                }
                                onMouseEnter={e => {
                                    if (!link.primary) e.currentTarget.style.backgroundColor = '#F3F4F6';
                                }}
                                onMouseLeave={e => {
                                    if (!link.primary) e.currentTarget.style.backgroundColor = '#F9FAFB';
                                }}
                            >
                                <span>{link.label}</span>
                                <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Activité récente */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Activité récente</h3>
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                            style={{ backgroundColor: 'var(--brand-red-light)' }}
                        >
                            <svg className="w-5 h-5" style={{ color: 'var(--brand-red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-500">Aucune activité récente</p>
                        <p className="text-xs text-gray-400 mt-1">Les audits et évaluations apparaîtront ici</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
