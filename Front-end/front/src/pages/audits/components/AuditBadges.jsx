import { CONFORMITE_CONFIG, STATUT_CONFIG } from './auditConstants';

export const ConformiteBadge = ({ conformite }) => {
    const cfg = CONFORMITE_CONFIG[conformite] ?? CONFORMITE_CONFIG.na;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
        </span>
    );
};

export const StatutBadge = ({ statut }) => {
    const cfg = STATUT_CONFIG[statut] ?? STATUT_CONFIG.brouillon;
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
        </span>
    );
};

export const TabInfo = ({ text }) => (
    <div className="flex items-start gap-3 rounded-2xl px-4 py-3 mb-5 text-sm text-gray-600 border border-blue-100 bg-blue-50/40 shadow-sm">
        <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <p className="leading-relaxed">{text}</p>
    </div>
);

export const TabPlaceholder = ({ titre, texte }) => (
    <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">{titre}</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">{texte}</p>
        </div>
    </div>
);
