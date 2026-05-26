import { TabInfo } from './AuditBadges';

const TabNC = ({ referentiel, soaMap, localEvals }) => {
    if (!referentiel) return <div className="text-gray-400 text-sm">Chargement...</div>;

    const ncList = referentiel.domaines.flatMap(theme =>
        theme.objectifs.flatMap(obj =>
            (obj.mesures || [])
                .filter(m => {
                    const n = localEvals[m.id]?.niveau_maturite;
                    const isNC = n === 0 || n === 2;
                    if (!isNC) return false;
                    // §4-10 : toujours applicables ; Annexe A : filtrée par SoA
                    return theme.code.startsWith('A.') ? !!soaMap[m.id]?.applicable : true;
                })
                .map(m => ({ ...m, theme, obj, ncType: localEvals[m.id]?.niveau_maturite === 0 ? 'majeure' : 'mineure' }))
        )
    );

    if (ncList.length === 0) {
        return (
            <div className="space-y-4">
                <TabInfo text="Ce registre liste tous les contrôles ISO 27001 applicables évalués comme NC mineure ou NC majeure. Il sert de base pour définir les actions correctives dans le Plan d'actions." />
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">Aucune non-conformité enregistrée</p>
                    <p className="text-xs text-gray-400 mt-1">Tous les contrôles applicables évalués sont conformes.</p>
                </div>
            </div>
        );
    }

    // Grouper par thème
    const byTheme = {};
    ncList.forEach(m => {
        const key = m.theme.id;
        if (!byTheme[key]) byTheme[key] = { theme: m.theme, items: [] };
        byTheme[key].items.push(m);
    });

    return (
        <div className="space-y-4">
            <TabInfo text="Ce registre liste tous les contrôles ISO 27001 applicables évalués comme NC mineure ou NC majeure. Utilisez le Plan d'actions pour définir les actions correctives associées." />

            {/* Compteur */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                        <span className="text-lg font-bold text-red-600">{ncList.length}</span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800">Non-conformité(s) identifiée(s)</p>
                        <p className="text-xs text-gray-500">NC mineures + NC majeures</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 font-medium">
                        {ncList.filter(m => m.ncType === 'mineure').length} NC mineures
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-medium">
                        {ncList.filter(m => m.ncType === 'majeure').length} NC majeures
                    </span>
                </div>
            </div>

            {/* Liste par thème */}
            {Object.values(byTheme).map(({ theme, items }) => (
                <div key={theme.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
                        <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>{theme.code}</span>
                        <span className="text-sm font-semibold text-gray-700">{theme.nom}</span>
                        <span className="ml-auto text-xs text-red-600 font-medium">{items.length} NC</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {items.map(m => {
                            const ev = localEvals[m.id] || {};
                            return (
                                <div key={m.id} className="px-5 py-3 flex items-start gap-4">
                                    <span className="font-mono text-xs text-gray-600 flex-shrink-0 w-24 pt-0.5">{m.code?.trim()}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-700 leading-relaxed">{m.description || m.obj?.description || ''}</p>
                                        {ev.commentaire && <p className="text-xs text-gray-400 mt-1 italic">"{ev.commentaire}"</p>}
                                        {ev.recommandation && <p className="text-xs text-blue-500 mt-1">↳ {ev.recommandation}</p>}
                                    </div>
                                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded font-medium ${m.ncType === 'majeure' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                                        {m.ncType === 'majeure' ? 'NC majeure' : 'NC mineure'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TabNC;
