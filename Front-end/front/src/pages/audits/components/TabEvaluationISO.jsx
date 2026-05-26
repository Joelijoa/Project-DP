import { useRef } from 'react';
import { ISO_NIVEAUX } from './auditConstants';
import { TabInfo } from './AuditBadges';
import AppSelect from '../../../components/common/AppSelect';

const naturalSort = (a, b) =>
    (a.code ?? '').localeCompare(b.code ?? '', undefined, { numeric: true, sensitivity: 'base' });

// Extrait le titre avant le " — " dans la description
const extractTitle = (desc = '') => {
    const idx = desc.indexOf(' — ');
    return idx !== -1 ? desc.slice(0, idx) : desc;
};

const TabEvaluationISO = ({ referentiel, localEvals, setEval, openDomaines, setOpenDomaines, isDirty, saving, onSave, readOnly }) => {
    const themeRefs = useRef({});

    const toggleTheme = (id) => {
        setOpenDomaines(prev => {
            const isNowOpen = !prev[id];
            if (isNowOpen) setTimeout(() => {
                const el = themeRefs.current[id];
                if (el) el.style.scrollMarginTop = '120px';
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
            return { [id]: isNowOpen };
        });
    };

    const annexeDomaines = (referentiel?.domaines ?? []).filter(d => d.code.startsWith('A.'));

    if (annexeDomaines.length === 0)
        return <div className="text-gray-400 text-sm">Chargement du référentiel...</div>;

    return (
        <div className="space-y-3">
            <TabInfo text="Évaluez le niveau de maturité de chaque contrôle de l'Annexe A ISO 27001:2022. Utilisez 'N/A' pour les contrôles non applicables à l'organisation et justifiez le cas échéant." />


            {/* Légende */}
            <div className="flex flex-wrap gap-3 px-1">
                {ISO_NIVEAUX.map(n => (
                    <span key={n.value} className={`text-xs font-medium ${n.color}`}>
                        {n.value} = {n.label}
                    </span>
                ))}
                <span className="text-xs font-medium text-gray-400">N/A = Non applicable</span>
            </div>

            {/* Accordion par chapitre (5 / 6 / 7 / 8) */}
            {annexeDomaines.map(theme => {
                const shortCode = theme.code.replace(/^A\./, '');
                const allMesures = (theme.objectifs ?? [])
                    .flatMap(o => o.mesures ?? [])
                    .sort(naturalSort);

                if (allMesures.length === 0) return null;

                const evCount = allMesures.filter(m => {
                    const n = localEvals[m.id]?.niveau_maturite;
                    return n !== null && n !== undefined;
                }).length;
                const isOpen = !!openDomaines[theme.id];

                return (
                    <div key={theme.id} ref={el => themeRefs.current[theme.id] = el}
                        className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">

                        <div onClick={() => toggleTheme(theme.id)}
                            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/60 transition cursor-pointer">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>
                                    {shortCode}
                                </span>
                                <span className="text-sm font-semibold text-gray-800">{theme.nom}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">{evCount}/{allMesures.length} évalués</span>
                                <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${allMesures.length > 0 ? (evCount / allMesures.length) * 100 : 0}%`, backgroundColor: 'var(--brand-red)' }} />
                                </div>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </div>

                        {isOpen && (
                            <div className="border-t border-gray-100">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/60">
                                            <th className="text-left px-5 py-2.5 font-semibold text-gray-400 uppercase tracking-wider w-56">Contrôle</th>
                                            <th className="text-left px-3 py-2.5 font-semibold text-gray-400 uppercase tracking-wider w-44">Niveau maturité</th>
                                            <th className="text-left px-3 py-2.5 font-semibold text-gray-400 uppercase tracking-wider w-36">Preuves / Références</th>
                                            <th className="text-left px-3 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Constat</th>
                                            <th className="text-left px-3 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Recommandation</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allMesures.map(mesure => {
                                            const ev = localEvals[mesure.id] || {};
                                            const niveau = ev.niveau_maturite ?? null;
                                            const isNA = niveau === -2;
                                            const shortMesureCode = mesure.code?.trim().replace(/^A\./, '');
                                            const title = extractTitle(mesure.description || '');

                                            return (
                                                <tr key={mesure.id} className={`border-b border-gray-50 transition-colors align-top ${isNA ? 'bg-gray-50/60 opacity-70' : 'hover:bg-gray-50/40'}`}>
                                                    {/* Code + titre */}
                                                    <td className="px-5 py-3">
                                                        <span className="font-mono text-[11px] font-semibold text-gray-500 mr-1.5">{shortMesureCode}</span>
                                                        <span className={`text-xs ${isNA ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{title}</span>
                                                    </td>
                                                    {/* Niveau maturité + N/A */}
                                                    <td className="px-3 py-3">
                                                        <AppSelect
                                                            value={niveau === null || niveau === undefined ? '' : niveau === -2 ? 'na' : String(niveau)}
                                                            onChange={v => {
                                                                if (readOnly) return;
                                                                setEval(mesure.id, 'niveau_maturite', v === '' ? null : v === 'na' ? -2 : parseInt(v));
                                                            }}
                                                            locked={readOnly}
                                                            size="sm"
                                                            options={[
                                                                { value: '',   label: '— Sélectionner —' },
                                                                { value: 'na', label: 'N/A — Non applicable' },
                                                                { value: '0',  label: '0 — Inexistant' },
                                                                { value: '1',  label: '1 — Initié' },
                                                                { value: '2',  label: '2 — Reproductible' },
                                                                { value: '3',  label: '3 — Défini' },
                                                                { value: '4',  label: '4 — Géré' },
                                                                { value: '5',  label: '5 — Optimisé' },
                                                            ]}
                                                        />
                                                        {/* Raison N/A */}
                                                        {isNA && (
                                                            <textarea
                                                                value={ev.preuve || ''}
                                                                onChange={e => !readOnly && setEval(mesure.id, 'preuve', e.target.value)}
                                                                readOnly={readOnly}
                                                                rows={2}
                                                                placeholder={readOnly ? '—' : 'Justifier la non-applicabilité...'}
                                                                className="mt-1.5 w-full text-xs border border-orange-200 bg-orange-50/60 rounded-xl px-2 py-1.5 focus:outline-none read-only:bg-white read-only:text-gray-700 read-only:cursor-not-allowed resize-y"
                                                            />
                                                        )}
                                                    </td>
                                                    {/* Preuves */}
                                                    <td className="px-3 py-3">
                                                        {!isNA && (
                                                            <input type="text" value={ev.preuve || ''}
                                                                onChange={e => !readOnly && setEval(mesure.id, 'preuve', e.target.value)}
                                                                readOnly={readOnly}
                                                                placeholder={readOnly ? '—' : 'Références...'}
                                                                className="w-full text-xs border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none read-only:bg-white read-only:text-gray-700 read-only:cursor-not-allowed" />
                                                        )}
                                                    </td>
                                                    {/* Constat */}
                                                    <td className="px-3 py-3">
                                                        {!isNA && (
                                                            <textarea value={ev.commentaire || ''}
                                                                onChange={e => !readOnly && setEval(mesure.id, 'commentaire', e.target.value)}
                                                                readOnly={readOnly}
                                                                rows={5}
                                                                placeholder={readOnly ? '—' : 'Constat...'}
                                                                className="w-full text-xs border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none read-only:bg-white read-only:text-gray-700 read-only:cursor-not-allowed resize-y" />
                                                        )}
                                                    </td>
                                                    {/* Recommandation */}
                                                    <td className="px-3 py-3">
                                                        {!isNA && (
                                                            <textarea value={ev.recommandation || ''}
                                                                onChange={e => !readOnly && setEval(mesure.id, 'recommandation', e.target.value)}
                                                                readOnly={readOnly}
                                                                rows={5}
                                                                placeholder={readOnly ? '—' : 'Recommandation...'}
                                                                className="w-full text-xs border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none read-only:bg-white read-only:text-gray-700 read-only:cursor-not-allowed resize-y" />
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })}
            {isDirty && !readOnly && (
                <div className="sticky bottom-4 flex justify-end">
                    <button onClick={onSave} disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-xl shadow-lg transition disabled:opacity-60"
                        style={{ backgroundColor: 'var(--brand-red)' }}>
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                        Sauvegarder les modifications
                    </button>
                </div>
            )}
        </div>
    );
};

export default TabEvaluationISO;
