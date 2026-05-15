const STATUT_AUDIT = {
    brouillon: { label: 'Brouillon', cls: 'bg-gray-100 text-gray-600' },
    en_cours:  { label: 'En cours',  cls: 'bg-blue-100 text-blue-700' },
    termine:   { label: 'Terminé',   cls: 'bg-green-100 text-green-700' },
};

const AuditCard = ({ audit, onNavigate, onValider, onRejeter, saving }) => {
    const cfg = STATUT_AUDIT[audit.statut] || { label: audit.statut, cls: 'bg-gray-100 text-gray-500' };
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-gray-300 transition-all duration-200">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-50 border border-gray-100">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={onNavigate}>
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${cfg.cls}`}>
                                {cfg.label}
                            </span>
                            {audit.referentiel && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-violet-50 text-violet-600">
                                    {audit.referentiel.nom}
                                </span>
                            )}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-red-700 truncate">{audit.nom}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {audit.client && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                                    </svg>
                                    {audit.client}
                                </span>
                            )}
                            {audit.auditeurs?.length > 0 && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                    {audit.auditeurs.map(a => `${a.prenom} ${a.nom}`).join(', ')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={onRejeter} disabled={saving}
                        className="px-3.5 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition disabled:opacity-50">
                        Rejeter
                    </button>
                    <button onClick={onValider} disabled={saving}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white rounded-xl transition hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: 'var(--brand-red)' }}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Valider
                    </button>
                </div>
            </div>
            <div className="flex items-center mt-4 pt-3 border-t border-gray-100">
                <span className="text-[11px] text-gray-400">Soumis pour validation</span>
                <button onClick={onNavigate} className="ml-auto flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition">
                    Voir l'audit
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default AuditCard;
