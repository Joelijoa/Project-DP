import { Link } from 'react-router-dom';
import { SECTEUR_COLORS, STATUT_CONFIG, getInitials, getAvatarColor, isIncomplete } from './entiteConfig';
import InfoRow from './InfoRow';

const EntiteDetailPanel = ({ entite, onClose, onEdit }) => {
    const color      = getAvatarColor(entite.secteur);
    const badge      = SECTEUR_COLORS[entite.secteur]?.badge ?? 'bg-gray-100 text-gray-600';
    const incomplete = isIncomplete(entite);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-4">
            <div className="h-16 relative" style={{ backgroundColor: color + '22' }}>
                <button onClick={onClose}
                    className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 bg-white/70 hover:bg-white rounded-lg transition">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="px-5 pb-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold -mt-7 mb-3 shadow-md"
                    style={{ backgroundColor: color }}>
                    {getInitials(entite.nom)}
                </div>

                {incomplete && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 mb-4">
                        <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-amber-800 mb-0.5">Informations incomplètes</p>
                            <p className="text-xs text-amber-700 leading-relaxed">
                                Cette entité a été créée automatiquement depuis un audit. Veuillez compléter ses informations (secteur, contact, adresse…).
                            </p>
                            <button onClick={onEdit}
                                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-900 underline underline-offset-2">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                </svg>
                                Compléter maintenant
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex items-start justify-between mb-1">
                    <h2 className="text-base font-semibold text-gray-900 leading-tight">{entite.nom}</h2>
                    <button onClick={onEdit}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition flex-shrink-0 ml-2">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                    </button>
                </div>

                {entite.secteur && (
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-4 ${badge}`}>
                        {entite.secteur}
                    </span>
                )}

                <div className="space-y-2 mb-5">
                    {(entite.adresse || entite.ville) && (
                        <InfoRow icon="location" label={[entite.adresse, entite.ville, entite.pays].filter(Boolean).join(', ')} />
                    )}
                    {entite.telephone && <InfoRow icon="phone" label={entite.telephone} />}
                    {entite.email     && <InfoRow icon="email" label={entite.email} />}
                    {entite.site_web  && <InfoRow icon="web"   label={entite.site_web} />}
                    {entite.description && (
                        <p className="text-xs text-gray-500 pt-2 mt-2 border-t border-gray-100 leading-relaxed">
                            {entite.description}
                        </p>
                    )}
                </div>

                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Audits associés ({entite.audits?.length ?? 0})
                    </p>
                    {!entite.audits?.length ? (
                        <p className="text-xs text-gray-400 italic">Aucun audit lié à cette entité</p>
                    ) : (
                        <div className="space-y-1.5">
                            {entite.audits.map(audit => {
                                const st = STATUT_CONFIG[audit.statut] ?? STATUT_CONFIG.brouillon;
                                return (
                                    <Link key={audit.id} to={`/audits/${audit.id}`}
                                        className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition group">
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-gray-800 truncate group-hover:text-gray-900">{audit.nom}</p>
                                            {audit.referentiel && (
                                                <p className="text-xs text-gray-400">{audit.referentiel.nom}</p>
                                            )}
                                        </div>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${st.bg} ${st.text}`}>
                                            {st.label}
                                        </span>
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

export default EntiteDetailPanel;
