const EntiteEmptyState = ({ hasFilter, onClear }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
        </div>
        <p className="text-sm font-medium text-gray-700">
            {hasFilter ? 'Aucun résultat' : 'Aucune entité'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
            {hasFilter ? 'Essayez de modifier vos filtres.' : 'Créez votre première entité auditée.'}
        </p>
        {hasFilter && (
            <button onClick={onClear} className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                Réinitialiser les filtres
            </button>
        )}
    </div>
);

export default EntiteEmptyState;
