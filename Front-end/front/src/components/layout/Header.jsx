import { useAuth } from '../../store/auth/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

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
    '/indicateurs': 'Indicateurs SSI',
    '/rapports': 'Rapports & Exports',
    '/utilisateurs': 'Gestion des utilisateurs',
    '/parametres': 'Parametres',
    '/profil': 'Mon profil',
};

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const currentTitle = pageTitles[location.pathname] || 'Plateforme Audit GRC';

    return (
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
            <h2 className="text-sm font-medium text-gray-800">{currentTitle}</h2>

            <div className="flex items-center gap-3">
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
                    onClick={handleLogout}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                    title="Deconnexion"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                </button>
            </div>
        </header>
    );
};

export default Header;
