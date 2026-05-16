const ROLE_CONFIG = {
    admin:           { label: 'Administrateur',  badge: 'bg-red-50 text-red-700'          },
    auditeur_senior: { label: 'Auditeur Senior', badge: 'bg-blue-50 text-blue-700'        },
    auditeur_junior: { label: 'Auditeur Junior', badge: 'bg-purple-50 text-purple-700'    },
    client:          { label: 'Client',           badge: 'bg-emerald-50 text-emerald-700' },
};

const getInitials = (prenom = '', nom = '') =>
    ((prenom[0] ?? '') + (nom[0] ?? '')).toUpperCase() || '?';

const InfoRow = ({ icon, label }) => {
    const icons = {
        org: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
        phone: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
        email: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
        entity: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
    };
    return (
        <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icons[icon]} />
                </svg>
            </div>
            <span className="text-xs text-gray-600 truncate">{label}</span>
        </div>
    );
};

const UserDetailPanel = ({ user, onClose, onEdit }) => {
    const rc = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.client;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-4">
            <div className="px-5 pt-5 pb-5">
                {/* Header sobre */}
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold bg-gray-100 text-gray-600 flex-shrink-0">
                        {getInitials(user.prenom, user.nom)}
                    </div>
                    <button onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Nom + bouton modifier */}
                <div className="flex items-start justify-between mb-1">
                    <div className="min-w-0">
                        <h2 className="text-base font-semibold text-gray-900 leading-tight truncate">
                            {user.prenom} {user.nom}
                        </h2>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <button onClick={onEdit}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition flex-shrink-0 ml-2">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                    </button>
                </div>

                {/* Badge rôle */}
                <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-4 ${rc.badge}`}>
                    {rc.label}
                </span>

                {/* Statut */}
                <div className="flex items-center gap-2 mb-4">
                    <span className={`w-1.5 h-1.5 rounded-full ${user.actif ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-xs text-gray-500">{user.actif ? 'Compte actif' : 'Compte inactif'}</span>
                    {user.must_change_password && (
                        <span className="text-[10px] text-gray-400 border border-gray-200 rounded-full px-1.5 py-0.5 ml-1">
                            Att. connexion
                        </span>
                    )}
                </div>

                {/* Infos */}
                <div className="space-y-2.5 pt-4 border-t border-gray-100">
                    {user.organisation && <InfoRow icon="org"    label={user.organisation} />}
                    {user.telephone    && <InfoRow icon="phone"  label={user.telephone} />}
                    {user.email        && <InfoRow icon="email"  label={user.email} />}
                    {user.entite?.nom  && <InfoRow icon="entity" label={user.entite.nom} />}

                    {!user.organisation && !user.telephone && !user.entite?.nom && (
                        <p className="text-xs text-gray-400 italic">Aucune information complémentaire</p>
                    )}
                </div>
            </div>
        </div>
    );
};


export default UserDetailPanel;
