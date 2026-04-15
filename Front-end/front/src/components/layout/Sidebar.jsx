import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/auth/AuthContext';
import { useState } from 'react';

// Icônes SVG inline pour éviter les emojis
const icons = {
    dashboard: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
    ),
    audit: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
    ),
    referentiel: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
    ),
    actions: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
        </svg>
    ),
    chart: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
    ),
    export: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    ),
    users: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
    ),
    building: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
    ),
    indicator: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
        </svg>
    ),
    settings: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    chevron: (
        <svg className="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
    ),
};

const menuSections = [
    {
        title: null,
        items: [
            { path: '/dashboard', label: 'Tableau de bord', icon: 'dashboard' },
        ],
    },
    {
        title: 'AUDIT & CONFORMITE',
        items: [
            { path: '/audits', label: 'Audits', icon: 'audit', children: [
                { path: '/audits', label: 'Tous les audits' },
                { path: '/audits/nouveau', label: 'Nouvel audit' },
            ]},
            { path: '/referentiels', label: 'Referentiels', icon: 'referentiel' },
            { path: '/entites', label: 'Entites auditees', icon: 'building' },
        ],
    },
    {
        title: 'RESULTATS & SUIVI',
        items: [
            { path: '/resultats', label: 'Graphiques & Rosace', icon: 'chart' },
            { path: '/plans-actions', label: "Plans d'actions", icon: 'actions' },
            { path: '/indicateurs', label: 'Indicateurs SSI', icon: 'indicator' },
            { path: '/rapports', label: 'Rapports & Exports', icon: 'export' },
        ],
    },
    {
        title: 'ADMINISTRATION',
        roles: ['admin'],
        items: [
            { path: '/utilisateurs', label: 'Utilisateurs', icon: 'users' },
            { path: '/parametres', label: 'Parametres', icon: 'settings' },
        ],
    },
];

const Sidebar = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState({});

    const toggleMenu = (path) => {
        setOpenMenus(prev => ({ ...prev, [path]: !prev[path] }));
    };

    const isActive = (path) => {
        if (path === '/audits') return location.pathname.startsWith('/audits');
        return location.pathname === path;
    };

    return (
        <aside className="w-64 text-white flex flex-col flex-shrink-0" style={{ backgroundColor: 'var(--brand-dark)' }}>
            {/* Logo */}
            <div className="p-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--brand-red)' }}>
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-base font-semibold tracking-tight">
                            <span className="text-blue-400">GRC</span> Audit
                        </h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">DNSSI & ISO 27001</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-3 px-3">
                {menuSections.map((section, sIdx) => {
                    // Filtrer par rôle
                    if (section.roles && !section.roles.includes(user?.role)) return null;

                    return (
                        <div key={sIdx} className={section.title ? 'mt-5' : ''}>
                            {section.title && (
                                <p className="px-3 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                    {section.title}
                                </p>
                            )}
                            <div className="space-y-0.5">
                                {section.items.map((item) => {
                                    const hasChildren = item.children && item.children.length > 0;
                                    const isOpen = openMenus[item.path];
                                    const active = isActive(item.path);

                                    if (hasChildren) {
                                        return (
                                            <div key={item.path}>
                                                <button
                                                    onClick={() => toggleMenu(item.path)}
                                                    style={active ? { backgroundColor: 'var(--brand-red-light)', color: 'var(--brand-red)' } : {}}
                                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                                                        active
                                                            ? ''
                                                            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                                    }`}
                                                >
                                                    <span className="flex-shrink-0">{icons[item.icon]}</span>
                                                    <span className="flex-1 text-left">{item.label}</span>
                                                    <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                                                        {icons.chevron}
                                                    </span>
                                                </button>
                                                {isOpen && (
                                                    <div className="ml-8 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                                                        {item.children.map((child) => (
                                                            <NavLink
                                                                key={child.path}
                                                                to={child.path}
                                                                end
                                                                style={({ isActive: ca }) => ca ? { color: 'var(--brand-red)' } : {}}
                                                                className={({ isActive: childActive }) =>
                                                                    `block px-3 py-1.5 rounded text-xs transition-colors ${
                                                                        childActive
                                                                            ? 'font-medium'
                                                                            : 'text-gray-500 hover:text-gray-300'
                                                                    }`
                                                                }
                                                            >
                                                                {child.label}
                                                            </NavLink>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            style={({ isActive: na }) => na ? { backgroundColor: 'var(--brand-red-light)', color: 'var(--brand-red)' } : {}}
                                            className={({ isActive: navActive }) =>
                                                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                                    navActive
                                                        ? 'font-medium'
                                                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                                }`
                                            }
                                        >
                                            <span className="flex-shrink-0">{icons[item.icon]}</span>
                                            <span>{item.label}</span>
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* User info en bas */}
            <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white" style={{ backgroundColor: 'var(--brand-red)' }}>
                        {user?.prenom?.[0]}{user?.nom?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-200 truncate">
                            {user?.prenom} {user?.nom}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">{user?.organisation || user?.email}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
