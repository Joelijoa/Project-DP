import { useEffect, useState } from 'react';
import { getAllReferentiels, getReferentielById, getReferentielStats } from '../../services/endpoints/referentielService';

const TYPE_CONFIG = {
    ISO27001: { label: 'ISO 27001:2022', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
    DNSSI:    { label: 'DNSSI',          color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
};

// Icônes chevron
const ChevronRight = () => (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
);
const ChevronDown = () => (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

// Supprime le préfixe numérique d'un libellé  ex: "1. POLITIQUE..." → "POLITIQUE..."
const stripNumericPrefix = (str = '') =>
    str.replace(/^\d+[\.\s\t]+/, '').trim();

// Supprime "Objectif N : " ou "Objectif N: " en début de chaîne
const stripObjectifPrefix = (str = '') =>
    str.replace(/^Objectif\s+\d+\s*:\s*/i, '').trim();

// Ligne mesure avec tooltip sur l'objectif parent
const MesureRow = ({ mesure, objectifDesc }) => (
    <div className="relative group flex items-start gap-2 py-1.5 px-3 rounded hover:bg-gray-50 ml-1">
        <span className="font-mono text-xs font-semibold text-gray-500 mt-0.5 w-24 shrink-0">{mesure.code?.trim()}</span>
        <span className="text-xs text-gray-700 line-clamp-2 flex-1">
            {mesure.description || objectifDesc || '—'}
        </span>
        {(mesure.description || objectifDesc) && (
            <div className="absolute left-0 bottom-full mb-2 z-50 hidden group-hover:block w-96 bg-gray-900 text-white text-xs rounded-lg px-3 py-2.5 shadow-xl pointer-events-none">
                <p className="font-semibold mb-1 text-gray-200">{mesure.code?.trim()}</p>
                <p className="text-gray-300 leading-relaxed">{mesure.description || objectifDesc}</p>
                <div className="absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
            </div>
        )}
    </div>
);

// Objectif accordéon
const ObjectifRow = ({ objectif }) => {
    const [open, setOpen] = useState(false);
    const desc = stripObjectifPrefix(objectif.description || '');
    return (
        <div className="ml-4">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 text-left"
            >
                <span className="text-gray-400">{open ? <ChevronDown /> : <ChevronRight />}</span>
                <span className="font-mono text-xs font-medium text-gray-500 w-8 shrink-0">{objectif.code}</span>
                <span className="text-xs text-gray-700 flex-1 line-clamp-1">{desc}</span>
                <span className="text-xs text-gray-400 shrink-0">{objectif.mesures?.length || 0} mesure(s)</span>
            </button>
            {open && objectif.mesures?.length > 0 && (
                <div className="ml-6 mt-1 mb-1 border-l-2 border-gray-100 pl-2">
                    {objectif.mesures.map(m => <MesureRow key={m.id} mesure={m} objectifDesc={desc} />)}
                </div>
            )}
        </div>
    );
};

// Domaine accordéon
const DomaineRow = ({ domaine }) => {
    const [open, setOpen] = useState(false);
    const totalMesures = domaine.objectifs?.reduce((acc, o) => acc + (o.mesures?.length || 0), 0) || 0;
    const nomPropre = stripNumericPrefix(domaine.nom || '');
    return (
        <div className="border border-gray-100 rounded-lg mb-2">
            <button
                onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left ${open ? 'rounded-t-lg' : 'rounded-lg'}`}
            >
                <span className="text-gray-500">{open ? <ChevronDown /> : <ChevronRight />}</span>
                <span className="font-mono text-xs font-bold text-gray-600 w-8 shrink-0">{domaine.code}</span>
                <span className="text-sm font-medium text-gray-800 flex-1">{nomPropre}</span>
                <span className="text-xs text-gray-400 shrink-0">
                    {domaine.objectifs?.length || 0} obj. · {totalMesures} mesures
                </span>
            </button>
            {open && (
                <div className="px-2 py-2">
                    {domaine.objectifs?.map(o => <ObjectifRow key={o.id} objectif={o} />)}
                </div>
            )}
        </div>
    );
};

const ReferentielsPage = () => {
    const [referentiels, setReferentiels] = useState([]);
    const [stats, setStats] = useState({});
    const [selected, setSelected] = useState(null);
    const [tree, setTree] = useState(null);
    const [loadingTree, setLoadingTree] = useState(false);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await getAllReferentiels();
                const list = res.data.referentiels || [];
                setReferentiels(list);
                // Charger les stats pour chaque référentiel
                const statsMap = {};
                await Promise.all(list.map(async (r) => {
                    try {
                        const s = await getReferentielStats(r.id);
                        statsMap[r.id] = s.data.stats;
                    } catch {}
                }));
                setStats(statsMap);
            } catch {}
            finally { setLoadingList(false); }
        };
        load();
    }, []);

    const selectReferentiel = async (ref) => {
        if (selected?.id === ref.id) { setSelected(null); setTree(null); return; }
        setSelected(ref);
        setTree(null);
        setLoadingTree(true);
        try {
            const res = await getReferentielById(ref.id);
            setTree(res.data.referentiel);
        } catch {}
        finally { setLoadingTree(false); }
    };

    // Tri naturel : "1","2","10","11" au lieu de "1","10","11","2"
    const naturalSort = (a, b) =>
        a.code?.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' }) ?? 0;

    const sortedDomaines = tree?.domaines
        ?.map(d => ({
            ...d,
            objectifs: d.objectifs
                ?.map(o => ({ ...o, mesures: [...(o.mesures || [])].sort(naturalSort) }))
                .sort(naturalSort),
        }))
        .sort(naturalSort) || [];

    // Filtrer les domaines selon la recherche
    const filteredDomaines = sortedDomaines.filter(d => {
        if (!search) return true;
        const q = search.toLowerCase();
        if (d.code?.toLowerCase().includes(q) || d.nom?.toLowerCase().includes(q)) return true;
        return d.objectifs?.some(o =>
            o.code?.toLowerCase().includes(q) ||
            o.nom?.toLowerCase().includes(q) ||
            o.mesures?.some(m => m.code?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q))
        );
    }) || [];

    return (
        <div>
            {/* En-tête */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">Référentiels</h1>
                <p className="text-sm text-gray-500 mt-0.5">Vue arborescente des référentiels de contrôle</p>
            </div>

            {/* Cartes de sélection */}
            {loadingList ? (
                <div className="flex justify-center py-12">
                    <div className="w-5 h-5 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {referentiels.map(ref => {
                        const cfg = TYPE_CONFIG[ref.type] || TYPE_CONFIG.DNSSI;
                        const s = stats[ref.id];
                        const isActive = selected?.id === ref.id;
                        return (
                            <button
                                key={ref.id}
                                onClick={() => selectReferentiel(ref)}
                                className="text-left rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-lg"
                                style={{
                                    borderColor: isActive ? cfg.color : '#E5E7EB',
                                    boxShadow: isActive ? `0 0 0 3px ${cfg.bg}, 0 0 0 4px ${cfg.border}` : undefined,
                                }}
                            >
                                <div className="p-5" style={{ backgroundColor: isActive ? cfg.bg : '#fff' }}>
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                        <div className="flex-1 min-w-0">
                                            <span
                                                className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-md mb-2 tracking-wide uppercase"
                                                style={{ backgroundColor: cfg.bg, color: cfg.color }}
                                            >
                                                {cfg.label}
                                            </span>
                                            <h3 className="text-sm font-semibold text-gray-900 leading-snug">{ref.nom}</h3>
                                            {ref.version && (
                                                <p className="text-xs text-gray-400 mt-0.5">Version {ref.version}</p>
                                            )}
                                            {ref.description && (
                                                <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{ref.description}</p>
                                            )}
                                        </div>
                                        {/* Icône cadenas/shield */}
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: cfg.bg }}>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ color: cfg.color }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-2 mb-4">
                                        {s ? (
                                            <>
                                                {[
                                                    { val: s.domaines,  lbl: 'domaines'  },
                                                    { val: s.objectifs, lbl: 'objectifs' },
                                                    { val: s.mesures,   lbl: 'mesures'   },
                                                ].map(({ val, lbl }) => (
                                                    <div key={lbl} className="flex-1 text-center py-2 rounded-xl" style={{ backgroundColor: isActive ? '#fff' : cfg.bg }}>
                                                        <p className="text-base font-bold leading-none" style={{ color: cfg.color }}>{val}</p>
                                                        <p className="text-[10px] text-gray-500 mt-0.5">{lbl}</p>
                                                    </div>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <div className="w-3.5 h-3.5 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: cfg.color }} />
                                                Chargement des stats...
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer toggle */}
                                    <div className="flex items-center gap-1.5 text-xs font-semibold pt-3 border-t" style={{ color: cfg.color, borderColor: isActive ? cfg.border : '#F3F4F6' }}>
                                        {isActive ? <ChevronDown /> : <ChevronRight />}
                                        <span>{isActive ? "Masquer l'arborescence" : "Voir l'arborescence"}</span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Vue arborescente */}
            {selected && (
                <div className="bg-white rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">{selected.nom}</h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {TYPE_CONFIG[selected.type]?.label} · {tree?.domaines?.length || '—'} domaines
                            </p>
                        </div>
                        <input
                            type="text"
                            placeholder="Rechercher un code ou mot-clé..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-64 focus:outline-none focus:ring-1"
                        />
                    </div>

                    <div className="p-4">
                        {loadingTree ? (
                            <div className="flex justify-center py-12">
                                <div className="w-5 h-5 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
                            </div>
                        ) : filteredDomaines.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">
                                {search ? 'Aucun résultat pour cette recherche' : 'Aucun domaine trouvé'}
                            </p>
                        ) : (
                            filteredDomaines.map(d => <DomaineRow key={d.id} domaine={d} />)
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReferentielsPage;
