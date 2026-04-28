import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../store/auth/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import ConfirmModal from '../common/ConfirmModal';
import { getNotifications, markAsRead, markAllAsRead } from '../../services/endpoints/notificationService';

const roleLabels = {
    admin: 'Administrateur',
    auditeur_senior: 'Auditeur Senior',
    auditeur_junior: 'Auditeur Junior',
    client: 'Client',
};

const pageTitles = {
    '/dashboard': 'Tableau de bord',
    '/audits': 'Audits',
    '/audits/nouveau': 'Nouvel audit',
    '/referentiels': 'Referentiels',
    '/entites': 'Entites auditees',
    '/resultats': 'Graphiques & Rosace',
    '/plans-actions': "Plans d'actions",
    '/validation': 'En attente de validation',
    '/indicateurs': 'Indicateurs SSI',
    '/rapports': 'Rapports & Exports',
    '/utilisateurs': 'Gestion des utilisateurs',
    '/parametres': 'Parametres',
    '/profil': 'Mon profil',
};

const TYPE_ICONS = {
    AUDIT_ASSIGNE:   { color: 'text-blue-600',   bg: 'bg-blue-50'   },
    AUDIT_EN_ATTENTE:{ color: 'text-amber-600',  bg: 'bg-amber-50'  },
    AUDIT_VALIDE:    { color: 'text-green-600',  bg: 'bg-green-50'  },
    AUDIT_REJETE:    { color: 'text-red-600',    bg: 'bg-red-50'    },
    PLAN_EN_ATTENTE: { color: 'text-amber-600',  bg: 'bg-amber-50'  },
    PLAN_VALIDE:     { color: 'text-green-600',  bg: 'bg-green-50'  },
    PLAN_REJETE:     { color: 'text-red-600',    bg: 'bg-red-50'    },
};

// ── Notification Bell ─────────────────────────────────────────────────────────

const NotificationBell = () => {
    const [notifs, setNotifs]     = useState([]);
    const [nonLues, setNonLues]   = useState(0);
    const [open, setOpen]         = useState(false);
    const ref                     = useRef(null);
    const navigate                = useNavigate();

    const load = async () => {
        try {
            const res = await getNotifications();
            setNotifs(res.data.notifications || []);
            setNonLues(res.data.non_lues || 0);
        } catch { /* silencieux */ }
    };

    useEffect(() => {
        load();
        const timer = setInterval(load, 30000);
        return () => clearInterval(timer);
    }, []);

    // Fermer si clic en dehors
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleOpen = () => setOpen(o => !o);

    const getTarget = (n) => {
        if (n.type === 'AUDIT_EN_ATTENTE' || n.type === 'PLAN_EN_ATTENTE') return '/validation';
        if (n.audit_id) return `/audits/${n.audit_id}`;
        return null;
    };

    const handleMarkOne = async (n) => {
        if (!n.lu) {
            await markAsRead(n.id).catch(() => {});
            setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, lu: true } : x));
            setNonLues(c => Math.max(0, c - 1));
        }
        const target = getTarget(n);
        if (target) {
            setOpen(false);
            navigate(target);
        }
    };

    const handleMarkAll = async () => {
        await markAllAsRead().catch(() => {});
        setNotifs(prev => prev.map(x => ({ ...x, lu: true })));
        setNonLues(0);
    };

    const cfg = (type) => TYPE_ICONS[type] || { color: 'text-gray-500', bg: 'bg-gray-100' };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={handleOpen}
                className="relative p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition"
                title="Notifications"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {nonLues > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                        style={{ backgroundColor: 'var(--brand-red)' }}>
                        {nonLues > 9 ? '9+' : nonLues}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                    {/* Header dropdown */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <span className="text-sm font-semibold text-gray-800">Notifications</span>
                        {nonLues > 0 && (
                            <button onClick={handleMarkAll}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                Tout marquer lu
                            </button>
                        )}
                    </div>

                    {/* Liste */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {notifs.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-8">Aucune notification</p>
                        ) : (
                            notifs.map(n => {
                                const c = cfg(n.type);
                                const hasLink = !!getTarget(n);
                                return (
                                    <button key={n.id} onClick={() => handleMarkOne(n)}
                                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-start gap-3 ${!n.lu ? 'bg-blue-50/30' : ''} ${hasLink ? 'cursor-pointer' : 'cursor-default'}`}>
                                        <div className={`mt-0.5 w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${c.bg}`}>
                                            <div className={`w-2 h-2 rounded-full ${c.color.replace('text-', 'bg-')}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-semibold ${n.lu ? 'text-gray-600' : 'text-gray-900'}`}>{n.titre}</p>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {new Date(n.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                            {!n.lu && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--brand-red)' }} />}
                                            {hasLink && (
                                                <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Header ────────────────────────────────────────────────────────────────────

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogoutConfirmed = () => {
        logout();
        navigate('/login');
    };

    const currentTitle = pageTitles[location.pathname] || 'Plateforme Audit GRC';

    return (
        <>
            <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
                <h2 className="text-sm font-medium text-gray-800">{currentTitle}</h2>

                <div className="flex items-center gap-3">
                    {/* Cloche */}
                    <NotificationBell />

                    {/* Separator */}
                    <div className="w-px h-6 bg-gray-200" />

                    {/* Profil */}
                    <button
                        onClick={() => navigate('/profil')}
                        className="flex items-center gap-2.5 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition cursor-pointer"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-medium text-gray-700">
                                {user?.prenom} {user?.nom}
                            </p>
                            <p className="text-[10px] text-gray-400">
                                {roleLabels[user?.role]}
                            </p>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ backgroundColor: 'var(--brand-red)' }}>
                            {user?.prenom?.[0]}{user?.nom?.[0]}
                        </div>
                    </button>

                    {/* Separator */}
                    <div className="w-px h-6 bg-gray-200" />

                    {/* Logout */}
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                        title="Deconnexion"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                    </button>
                </div>
            </header>

            <ConfirmModal
                isOpen={showLogoutConfirm}
                title="Se déconnecter ?"
                message="Vous serez redirigé vers la page de connexion. Toute session non sauvegardée sera perdue."
                confirmLabel="Se déconnecter"
                cancelLabel="Annuler"
                danger
                onConfirm={handleLogoutConfirmed}
                onCancel={() => setShowLogoutConfirm(false)}
            />
        </>
    );
};

export default Header;
