import { useState, useEffect } from 'react';
import { getAllAudits, getAuditById, getEvaluations } from '../../services/endpoints/auditService';
import { getReferentielById } from '../../services/endpoints/referentielService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sortRef = (ref) => {
    if (!ref) return ref;
    return {
        ...ref,
        domaines: [...(ref.domaines || [])].sort((a, b) => a.id - b.id).map(d => ({
            ...d,
            objectifs: [...(d.objectifs || [])].sort((a, b) => a.id - b.id).map(o => ({
                ...o,
                mesures: [...(o.mesures || [])].sort((a, b) => a.id - b.id),
            })),
        })),
    };
};

const calcConformite = (n) => {
    if (n === null || n === undefined) return 'na';
    if (n >= 3) return 'conforme';
    if (n >= 1) return 'partiel';
    return 'non_conforme';
};

const buildSynthese = (referentiel, evMap) => {
    if (!referentiel) return [];
    return referentiel.domaines.map(domaine => {
        const mesures = domaine.objectifs.flatMap(o => o.mesures);
        const evaluated = mesures.filter(m => evMap[m.id]?.niveau_maturite !== null && evMap[m.id]?.niveau_maturite !== undefined);
        const scores = evaluated.map(m => evMap[m.id].niveau_maturite);
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        let conforme = 0, partiel = 0, non_conforme = 0, na = 0;
        mesures.forEach(m => {
            const c = calcConformite(evMap[m.id]?.niveau_maturite ?? null);
            if (c === 'conforme') conforme++;
            else if (c === 'partiel') partiel++;
            else if (c === 'non_conforme') non_conforme++;
            else na++;
        });
        const applicables = conforme + partiel + non_conforme;
        const tauxConformite = applicables > 0 ? Math.round(((conforme + partiel * 0.5) / applicables) * 100) : 0;

        return {
            ...domaine,
            total: mesures.length,
            evaluatedCount: evaluated.length,
            avgScore: Math.round(avgScore * 10) / 10,
            conforme, partiel, non_conforme, na, tauxConformite,
        };
    });
};

const scoreColor = (s) => {
    if (s >= 4) return '#16a34a';
    if (s >= 3) return '#2563eb';
    if (s >= 2) return '#d97706';
    if (s >= 1) return '#ea580c';
    return '#CC0000';
};

const scoreLabel = (s) => {
    if (s >= 4) return 'Optimisé';
    if (s >= 3) return 'Défini';
    if (s >= 2) return 'Reproductible';
    if (s >= 1) return 'Initial';
    return 'Inexistant';
};

const stripPrefix = (str) => (str || '').replace(/^\d+[\.\-\s]+/, '');

// ─── Graphique : Rosace (Radar SVG) ──────────────────────────────────────────

const RadarChart = ({ synthese }) => {
    const cx = 210, cy = 210, maxR = 140, n = synthese.length;
    if (n < 3) return null;

    const angle = (i) => (2 * Math.PI * i / n) - Math.PI / 2;
    const pt = (i, val, max = 5) => {
        const r = (val / max) * maxR;
        return { x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) };
    };
    const poly = (vals) =>
        vals.map((v, i) => pt(i, v)).map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z';

    const gridPoly = (lvl) => poly(synthese.map(() => lvl));
    const scorePoly = poly(synthese.map(d => d.avgScore));
    const targetPoly = poly(synthese.map(() => 3));
    const globalScore = synthese.reduce((s, d) => s + d.avgScore, 0) / n;

    return (
        <svg viewBox="0 0 420 420" width="100%" style={{ maxWidth: 420 }}>
            {[1, 2, 3, 4, 5].map(lvl => (
                <path key={lvl} d={gridPoly(lvl)} fill="none"
                    stroke={lvl === 3 ? '#94a3b8' : '#e2e8f0'}
                    strokeWidth={lvl === 3 ? 1.5 : 1}
                    strokeDasharray={lvl === 3 ? '5 3' : undefined} />
            ))}
            {synthese.map((_, i) => {
                const tip = pt(i, 5);
                return <line key={i} x1={cx} y1={cy} x2={tip.x.toFixed(1)} y2={tip.y.toFixed(1)} stroke="#e2e8f0" strokeWidth={1} />;
            })}
            <path d={targetPoly} fill="rgba(59,130,246,0.06)" stroke="#93c5fd" strokeWidth={1.5} strokeDasharray="5 3" />
            <path d={scorePoly} fill="rgba(204,0,0,0.14)" stroke="var(--brand-red)" strokeWidth={2} />
            {synthese.map((d, i) => {
                const p = pt(i, d.avgScore);
                return <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={4.5} fill="var(--brand-red)" stroke="white" strokeWidth={1.5} />;
            })}
            {[1, 2, 3, 4, 5].map(lvl => {
                const p = pt(0, lvl);
                return <text key={lvl} x={(p.x - 10).toFixed(1)} y={(p.y + 4).toFixed(1)} fontSize={8} fill="#9ca3af" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">{lvl}</text>;
            })}
            {synthese.map((d, i) => {
                const r = maxR + 28;
                const a = angle(i);
                const lx = cx + r * Math.cos(a);
                const ly = cy + r * Math.sin(a);
                return (
                    <g key={i}>
                        <text x={lx.toFixed(1)} y={(ly - 3).toFixed(1)} fontSize={9} fontWeight="700" fill="#CC0000" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">{d.code}</text>
                        <text x={lx.toFixed(1)} y={(ly + 10).toFixed(1)} fontSize={8} fill="#374151" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">{d.avgScore.toFixed(1)}</text>
                    </g>
                );
            })}
            <text x={cx} y={cy - 9} fontSize={24} fontWeight="700" fill="#111827" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">{globalScore.toFixed(1)}</text>
            <text x={cx} y={cy + 9} fontSize={8} fill="#6b7280" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">SCORE GLOBAL</text>
        </svg>
    );
};

// ─── Graphique : Donut conformité ─────────────────────────────────────────────

const DonutConformite = ({ conforme, partiel, non_conforme, na }) => {
    const total = conforme + partiel + non_conforme + na;
    if (total === 0) return null;

    const segments = [
        { value: conforme,     color: '#16a34a', label: 'Conformes' },
        { value: partiel,      color: '#d97706', label: 'Partiels' },
        { value: non_conforme, color: '#CC0000', label: 'Non conformes' },
        { value: na,           color: '#d1d5db', label: 'N/A' },
    ];

    const cx = 80, cy = 80, r = 60, sw = 22;
    const circ = 2 * Math.PI * r;

    let offset = 0;
    const arcs = segments.map(s => {
        const dash = (s.value / total) * circ;
        const arc = { ...s, dash, offset };
        offset += dash;
        return arc;
    });

    const tauxConf = total > 0 ? Math.round((conforme / total) * 100) : 0;

    return (
        <div className="flex flex-col items-center">
            <svg width={160} height={160} viewBox="0 0 160 160">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={sw} />
                {arcs.map((arc, i) => arc.value > 0 && (
                    <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                        stroke={arc.color} strokeWidth={sw}
                        strokeDasharray={`${arc.dash} ${circ - arc.dash}`}
                        strokeDashoffset={circ / 4 - arc.offset}
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '80px 80px' }}
                    />
                ))}
                <text x={cx} y={cy - 7} fontSize={18} fontWeight="700" fill="#111827" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">{tauxConf}%</text>
                <text x={cx} y={cy + 9} fontSize={7.5} fill="#6b7280" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">CONFORMITÉ</text>
            </svg>
            <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
                {segments.map(s => s.value > 0 && (
                    <span key={s.label} className="flex items-center gap-1 text-[10px] text-gray-600">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        {s.label} ({s.value})
                    </span>
                ))}
            </div>
        </div>
    );
};

// ─── Graphique : Barres empilées par domaine ──────────────────────────────────

const BarresEmpilees = ({ synthese }) => {
    const maxTotal = Math.max(...synthese.map(d => d.total), 1);

    return (
        <div className="space-y-2.5">
            {synthese.map(d => {
                const conf  = d.total > 0 ? (d.conforme     / d.total) * 100 : 0;
                const part  = d.total > 0 ? (d.partiel      / d.total) * 100 : 0;
                const nc    = d.total > 0 ? (d.non_conforme / d.total) * 100 : 0;
                const naP   = d.total > 0 ? (d.na           / d.total) * 100 : 0;
                return (
                    <div key={d.id}>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className="shrink-0 text-[10px] font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>{d.code}</span>
                                <span className="text-xs text-gray-600 truncate max-w-[160px]">{stripPrefix(d.nom)}</span>
                            </div>
                            <span className="text-xs font-semibold text-gray-500 ml-2">{d.total}</span>
                        </div>
                        <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
                            {conf > 0  && <div style={{ width: `${conf}%`,  backgroundColor: '#16a34a' }} title={`Conformes: ${d.conforme}`} />}
                            {part > 0  && <div style={{ width: `${part}%`,  backgroundColor: '#d97706' }} title={`Partiels: ${d.partiel}`} />}
                            {nc > 0    && <div style={{ width: `${nc}%`,    backgroundColor: '#CC0000' }} title={`NC: ${d.non_conforme}`} />}
                            {naP > 0   && <div style={{ width: `${naP}%`,   backgroundColor: '#e5e7eb' }} title={`N/A: ${d.na}`} />}
                        </div>
                    </div>
                );
            })}
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2">
                {[
                    { color: '#16a34a', label: 'Conformes' },
                    { color: '#d97706', label: 'Partiels' },
                    { color: '#CC0000', label: 'Non conformes' },
                    { color: '#e5e7eb', label: 'N/A', border: true },
                ].map(l => (
                    <span key={l.label} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color, border: l.border ? '1px solid #d1d5db' : 'none' }} />
                        {l.label}
                    </span>
                ))}
            </div>
        </div>
    );
};

// ─── Graphique : Jauge score global ──────────────────────────────────────────

const JaugeScore = ({ score, max = 5 }) => {
    const pct = Math.min(score / max, 1);
    const color = scoreColor(score);
    // Arc SVG : demi-cercle de -180° à 0°
    const cx = 100, cy = 90, r = 70;
    const startAngle = Math.PI;
    const endAngle = 0;
    const valueAngle = Math.PI + pct * Math.PI;

    const polar = (angle) => ({
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
    });

    const arcPath = (a1, a2, col) => {
        const steps = 60;
        const pts = Array.from({ length: steps + 1 }, (_, i) => {
            const a = a1 + (a2 - a1) * (i / steps);
            return polar(a);
        });
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
        return <path d={d} fill="none" stroke={col} strokeWidth={14} strokeLinecap="round" />;
    };

    const needle = polar(valueAngle);

    // Repères niveaux
    const ticks = [0, 1, 2, 3, 4, 5].map(v => {
        const a = Math.PI + (v / 5) * Math.PI;
        const inner = { x: cx + (r - 16) * Math.cos(a), y: cy + (r - 16) * Math.sin(a) };
        const outer = { x: cx + (r + 4)  * Math.cos(a), y: cy + (r + 4)  * Math.sin(a) };
        const label = { x: cx + (r + 16) * Math.cos(a), y: cy + (r + 16) * Math.sin(a) };
        return { v, inner, outer, label };
    });

    return (
        <div className="flex flex-col items-center">
            <svg width={200} height={110} viewBox="0 0 200 110">
                {/* Fond gris */}
                {arcPath(Math.PI, 0, '#e5e7eb')}
                {/* Arc coloré jusqu'au score */}
                {arcPath(Math.PI, valueAngle, color)}
                {/* Repères */}
                {ticks.map(t => (
                    <g key={t.v}>
                        <line x1={t.inner.x.toFixed(2)} y1={t.inner.y.toFixed(2)}
                              x2={t.outer.x.toFixed(2)} y2={t.outer.y.toFixed(2)}
                              stroke="#d1d5db" strokeWidth={1.5} />
                        <text x={t.label.x.toFixed(2)} y={(t.label.y + 3).toFixed(2)}
                            fontSize={7.5} fill="#9ca3af" textAnchor="middle"
                            fontFamily="Plus Jakarta Sans, sans-serif">{t.v}</text>
                    </g>
                ))}
                {/* Aiguille */}
                <line
                    x1={cx} y1={cy}
                    x2={needle.x.toFixed(2)} y2={needle.y.toFixed(2)}
                    stroke="#111827" strokeWidth={2} strokeLinecap="round"
                />
                <circle cx={cx} cy={cy} r={5} fill="#111827" />
                {/* Score centré */}
                <text x={cx} y={cy + 22} fontSize={20} fontWeight="700" fill={color} textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">{score.toFixed(1)}</text>
                <text x={cx} y={cy + 34} fontSize={7} fill="#6b7280" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">/ {max} — {scoreLabel(score)}</text>
            </svg>
        </div>
    );
};

// ─── État vide (avant sélection) ─────────────────────────────────────────────

const EmptyState = ({ audits, loadingList }) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Illustration */}
        <div className="flex flex-col items-center pt-10 pb-6 px-8 border-b border-gray-100">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="mb-4">
                <circle cx="36" cy="36" r="34" fill="#fef2f2" stroke="#fecaca" strokeWidth="1.5" />
                {/* Grille radar décorative */}
                {[8, 16, 24].map(r => (
                    <circle key={r} cx="36" cy="36" r={r} fill="none" stroke="#fecaca" strokeWidth="1" strokeDasharray="3 2" />
                ))}
                {[0,1,2,3,4,5].map(i => {
                    const a = (2 * Math.PI * i / 6) - Math.PI / 2;
                    return <line key={i} x1={36} y1={36} x2={(36 + 28 * Math.cos(a)).toFixed(1)} y2={(36 + 28 * Math.sin(a)).toFixed(1)} stroke="#fca5a5" strokeWidth="1" />;
                })}
                {/* Polygone exemple */}
                <polygon
                    points={[0,1,2,3,4,5].map(i => {
                        const a = (2 * Math.PI * i / 6) - Math.PI / 2;
                        const r = [18, 12, 20, 15, 22, 10][i];
                        return `${(36 + r * Math.cos(a)).toFixed(1)},${(36 + r * Math.sin(a)).toFixed(1)}`;
                    }).join(' ')}
                    fill="rgba(204,0,0,0.12)" stroke="#CC0000" strokeWidth="1.5"
                />
                {/* Point central */}
                <circle cx="36" cy="36" r="3" fill="#CC0000" />
            </svg>
            <h2 className="text-base font-semibold text-gray-800 mb-1">Sélectionnez un audit à analyser</h2>
            <p className="text-sm text-gray-500 text-center max-w-md">
                Choisissez un audit dans la liste ci-dessus pour afficher ses graphiques de résultats : rosace de maturité, répartition de conformité, scores par domaine et analyse détaillée.
            </p>
        </div>

        {/* Aperçu des graphiques disponibles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
            {[
                {
                    icon: (
                        <svg width="36" height="36" viewBox="0 0 36 36">
                            {[0,1,2,3,4].map(i => {
                                const a = (2*Math.PI*i/5) - Math.PI/2;
                                const r = [14,9,13,8,12][i];
                                return null;
                            })}
                            <polygon points={[0,1,2,3,4].map(i => { const a=(2*Math.PI*i/5)-Math.PI/2; const r=[14,9,13,8,12][i]; return `${(18+r*Math.cos(a)).toFixed(1)},${(18+r*Math.sin(a)).toFixed(1)}`; }).join(' ')} fill="rgba(204,0,0,0.15)" stroke="#CC0000" strokeWidth="1.5" />
                            {[0,1,2,3,4].map(i => { const a=(2*Math.PI*i/5)-Math.PI/2; return <line key={i} x1={18} y1={18} x2={(18+16*Math.cos(a)).toFixed(1)} y2={(18+16*Math.sin(a)).toFixed(1)} stroke="#e5e7eb" strokeWidth="1" />; })}
                        </svg>
                    ),
                    title: 'Rosace de maturité',
                    desc: 'Vue radar DNSSI — scores par domaine avec cible niveau 3 (non applicable ISO 27001)',
                },
                {
                    icon: (
                        <svg width="36" height="36" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="13" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                            <circle cx="18" cy="18" r="13" fill="none" stroke="#16a34a" strokeWidth="6" strokeDasharray="25 57" strokeDashoffset="20.4" />
                            <circle cx="18" cy="18" r="13" fill="none" stroke="#d97706" strokeWidth="6" strokeDasharray="15 57" strokeDashoffset="-4.6" />
                            <circle cx="18" cy="18" r="13" fill="none" stroke="#CC0000" strokeWidth="6" strokeDasharray="17 57" strokeDashoffset="-19.6" />
                        </svg>
                    ),
                    title: 'Répartition conformité',
                    desc: 'Donut : Conformes / Partiels / Non conformes / N/A',
                },
                {
                    icon: (
                        <svg width="36" height="36" viewBox="0 0 36 36">
                            {[0,1,2,3].map((i,_) => (
                                <g key={i}>
                                    <rect x={4} y={6+i*7} width={28} height={5} rx={2} fill="#f3f4f6" />
                                    <rect x={4} y={6+i*7} width={[18,12,22,8][i]} height={5} rx={2} fill={['#16a34a','#d97706','#CC0000','#16a34a'][i]} />
                                </g>
                            ))}
                        </svg>
                    ),
                    title: 'Barres par domaine',
                    desc: 'Répartition empilée Conformes / Partiels / NC par domaine',
                },
                {
                    icon: (
                        <svg width="36" height="36" viewBox="0 0 36 36">
                            <path d="M4,28 A14,14 0 0,1 32,28" fill="none" stroke="#e5e7eb" strokeWidth="5" strokeLinecap="round" />
                            <path d="M4,28 A14,14 0 0,1 24,10" fill="none" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" />
                            <line x1="18" y1="28" x2="26" y2="13" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="18" cy="28" r="3" fill="#111827" />
                        </svg>
                    ),
                    title: 'Jauge score global',
                    desc: 'Score moyen de maturité sur une jauge 0-5',
                },
            ].map((g, i) => (
                <div key={i} className="flex flex-col items-center gap-2 px-4 py-5 text-center">
                    <div className="w-10 h-10 flex items-center justify-center">{g.icon}</div>
                    <p className="text-xs font-semibold text-gray-700">{g.title}</p>
                    <p className="text-[10px] text-gray-400 leading-relaxed">{g.desc}</p>
                </div>
            ))}
        </div>

        {/* Hint si aucun audit */}
        {!loadingList && audits.length === 0 && (
            <div className="px-6 py-4 bg-yellow-50 border-t border-yellow-100">
                <p className="text-xs text-yellow-700 text-center">
                    Aucun audit trouvé. Créez d'abord un audit et complétez son évaluation.
                </p>
            </div>
        )}
    </div>
);

// ─── Page principale ──────────────────────────────────────────────────────────

const ResultatsPage = () => {
    const [audits, setAudits]           = useState([]);
    const [selectedId, setSelectedId]   = useState('');
    const [audit, setAudit]             = useState(null);
    const [referentiel, setReferentiel] = useState(null);
    const [synthese, setSynthese]       = useState([]);
    const [loading, setLoading]         = useState(false);
    const [loadingList, setLoadingList] = useState(true);

    useEffect(() => {
        getAllAudits()
            .then(res => {
                const data = res.data;
                setAudits(Array.isArray(data) ? data : (data.audits || []));
            })
            .catch(() => {})
            .finally(() => setLoadingList(false));
    }, []);

    useEffect(() => {
        if (!selectedId) { setAudit(null); setReferentiel(null); setSynthese([]); return; }
        setLoading(true);
        (async () => {
            try {
                const [auditRes, evalsRes] = await Promise.all([
                    getAuditById(selectedId),
                    getEvaluations(selectedId),
                ]);
                const auditData = auditRes.data.audit || auditRes.data;
                const evalsArr  = evalsRes.data.evaluations || evalsRes.data || [];
                const refRes    = await getReferentielById(auditData.referentiel_id);
                const ref       = sortRef(refRes.data.referentiel || refRes.data);
                const evMap     = {};
                evalsArr.forEach(e => { evMap[e.mesure_id] = e; });
                setAudit(auditData);
                setReferentiel(ref);
                setSynthese(buildSynthese(ref, evMap));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [selectedId]);

    const globalScore    = synthese.length > 0 ? synthese.reduce((s, d) => s + d.avgScore, 0) / synthese.length : 0;
    const totalMesures   = synthese.reduce((s, d) => s + d.total, 0);
    const totalEvaluated = synthese.reduce((s, d) => s + d.evaluatedCount, 0);
    const totalConforme  = synthese.reduce((s, d) => s + d.conforme, 0);
    const totalPartiel   = synthese.reduce((s, d) => s + d.partiel, 0);
    const totalNC        = synthese.reduce((s, d) => s + d.non_conforme, 0);
    const totalNA        = synthese.reduce((s, d) => s + d.na, 0);
    const tauxGlobal     = synthese.length > 0
        ? Math.round(synthese.reduce((s, d) => s + d.tauxConformite, 0) / synthese.length)
        : 0;
    const isISO = audit?.referentiel?.type === 'ISO27001' || referentiel?.type === 'ISO27001';

    return (
        <div className="space-y-5">

            {/* ── Header ── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Graphiques & Rosace</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Visualisation des résultats d'audit par domaine</p>
                </div>
                <div className="flex items-center gap-3">
                    {audit && (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isISO ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                            {isISO ? 'ISO 27001' : 'DNSSI'}
                        </span>
                    )}
                    <select
                        value={selectedId}
                        onChange={e => setSelectedId(e.target.value)}
                        disabled={loadingList}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': 'var(--brand-red)', color: '#111827', minWidth: 240 }}
                    >
                        <option value="">— Sélectionner un audit —</option>
                        {audits.map(a => (
                            <option key={a.id} value={a.id}>{a.nom}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ── État vide ── */}
            {!selectedId && !loadingList && (
                <EmptyState audits={audits} loadingList={loadingList} />
            )}

            {/* ── Loading ── */}
            {loading && (
                <div className="bg-white rounded-xl border border-gray-200 p-16 flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">Chargement des résultats…</span>
                </div>
            )}

            {/* ── Aucune évaluation ── */}
            {!loading && selectedId && synthese.length > 0 && synthese.every(d => d.evaluatedCount === 0) && (
                <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center gap-2">
                    <p className="text-sm font-medium text-gray-600">Aucune évaluation enregistrée pour cet audit</p>
                    <p className="text-xs text-gray-400">Complétez l'onglet Évaluation dans le détail de l'audit.</p>
                </div>
            )}

            {/* ── Contenu principal ── */}
            {!loading && synthese.length > 0 && synthese.some(d => d.evaluatedCount > 0) && (
                <>
                    {/* KPI cards */}
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { label: 'Score global',        value: globalScore.toFixed(1), sub: `/ 5 — ${scoreLabel(globalScore)}`, color: scoreColor(globalScore) },
                            { label: 'Taux de conformité',  value: `${tauxGlobal}%`,        sub: 'Moyenne des domaines',            color: '#2563eb' },
                            { label: 'Mesures évaluées',    value: totalEvaluated,           sub: `sur ${totalMesures} mesures`,     color: '#d97706' },
                            { label: 'Conformes (≥ niv. 3)',value: totalConforme,            sub: `sur ${totalMesures} mesures`,     color: '#16a34a' },
                        ].map((k, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                                <p className="text-xs text-gray-500 mb-1">{k.label}</p>
                                <p className="text-2xl font-bold leading-none" style={{ color: k.color }}>{k.value}</p>
                                <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── Ligne 2 : Rosace (DNSSI) ou Donut+Jauge côte à côte (ISO) ── */}
                    {!isISO ? (
                        <div className="grid grid-cols-5 gap-5">
                            {/* Rosace DNSSI */}
                            <div className="col-span-3 bg-white rounded-xl border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                    <h2 className="text-sm font-semibold text-gray-800">Rosace de maturité par domaine</h2>
                                    <div className="flex items-center gap-5 text-xs text-gray-500">
                                        <span className="flex items-center gap-1.5">
                                            <span className="inline-block w-7 border-t-2 border-dashed border-blue-300" />
                                            Cible (niv. 3)
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(204,0,0,0.2)', border: '1.5px solid #CC0000' }} />
                                            Score actuel
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-center">
                                    <RadarChart synthese={synthese} />
                                </div>
                            </div>
                            {/* Donut + Jauge empilés */}
                            <div className="col-span-2 flex flex-col gap-5">
                                <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col items-center">
                                    <h2 className="text-sm font-semibold text-gray-800 mb-3 self-start">Répartition de conformité</h2>
                                    <DonutConformite conforme={totalConforme} partiel={totalPartiel} non_conforme={totalNC} na={totalNA} />
                                </div>
                                <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col items-center">
                                    <h2 className="text-sm font-semibold text-gray-800 mb-1 self-start">Score global de maturité</h2>
                                    <p className="text-[10px] text-gray-400 self-start mb-2">Moyenne sur l'ensemble des domaines</p>
                                    <JaugeScore score={globalScore} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ISO 27001 : pas de rosace — donut + jauge côte à côte */
                        <div className="grid grid-cols-2 gap-5">
                            <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center">
                                <h2 className="text-sm font-semibold text-gray-800 mb-3 self-start">Répartition de conformité (Annexe A)</h2>
                                <p className="text-[10px] text-gray-400 self-start mb-4">Contrôles applicables évalués — Conformes / Partiels / Non conformes / N/A</p>
                                <DonutConformite conforme={totalConforme} partiel={totalPartiel} non_conforme={totalNC} na={totalNA} />
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center">
                                <h2 className="text-sm font-semibold text-gray-800 mb-1 self-start">Taux de conformité global</h2>
                                <p className="text-[10px] text-gray-400 self-start mb-2">Score moyen pondéré sur les contrôles applicables</p>
                                <JaugeScore score={globalScore} />
                                <p className="text-[10px] text-gray-400 mt-3 text-center max-w-xs">
                                    Pour ISO 27001, la rosace de maturité n'est pas applicable — l'évaluation utilise uniquement Conforme / Partiel / Non conforme.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Ligne 3 : Barres empilées + Scores par domaine ── */}
                    <div className="grid grid-cols-5 gap-5">
                        {/* Barres empilées */}
                        <div className="col-span-3 bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-sm font-semibold text-gray-800 mb-4">Répartition conformité par domaine</h2>
                            <BarresEmpilees synthese={synthese} />
                        </div>

                        {/* Score bars */}
                        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-sm font-semibold text-gray-800 mb-4">Score de maturité par domaine</h2>
                            <div className="space-y-4">
                                {synthese.map(d => (
                                    <div key={d.id}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="shrink-0 text-[10px] font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>{d.code}</span>
                                                <span className="text-xs text-gray-600 truncate">{stripPrefix(d.nom)}</span>
                                            </div>
                                            <span className="shrink-0 text-xs font-bold ml-2" style={{ color: scoreColor(d.avgScore) }}>
                                                {d.avgScore.toFixed(1)}/5
                                            </span>
                                        </div>
                                        <div className="relative h-2 bg-gray-100 rounded-full overflow-visible">
                                            <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${(d.avgScore / 5) * 100}%`, backgroundColor: scoreColor(d.avgScore) }} />
                                            <div className="absolute top-[-3px] bottom-[-3px] w-px bg-blue-400 opacity-60" style={{ left: '60%' }} />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                                            <span>{d.evaluatedCount}/{d.total} évaluées</span>
                                            <span>{d.tauxConformite}% conformité</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-100">
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        { label: '0 Inexistant',    color: '#CC0000' },
                                        { label: '1-2 Initial',     color: '#ea580c' },
                                        { label: '2-3 Reproductible', color: '#d97706' },
                                        { label: '3-4 Défini',      color: '#2563eb' },
                                        { label: '4-5 Optimisé',    color: '#16a34a' },
                                    ].map((l, i) => (
                                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: l.color + '18', color: l.color }}>
                                            {l.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Tableau détail ── */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-sm font-semibold text-gray-800 mb-4">Tableau de synthèse détaillé</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        {['Domaine', 'Score moy.', 'Niveau', 'Conformes', 'Partiels', 'Non-conformes', 'N/A', 'Taux conformité'].map((h, i) => (
                                            <th key={i} className={`text-xs font-semibold text-gray-500 pb-2.5 ${i === 0 ? 'text-left pr-4' : 'text-center px-3'}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {synthese.map((d, i) => (
                                        <tr key={d.id} className={`border-b border-gray-50 ${i % 2 !== 0 ? 'bg-gray-50/40' : ''}`}>
                                            <td className="py-3 pr-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>{d.code}</span>
                                                    <span className="text-xs text-gray-700">{stripPrefix(d.nom)}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                <span className="text-sm font-bold" style={{ color: scoreColor(d.avgScore) }}>{d.avgScore.toFixed(1)}</span>
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: scoreColor(d.avgScore), backgroundColor: scoreColor(d.avgScore) + '1a' }}>{scoreLabel(d.avgScore)}</span>
                                            </td>
                                            <td className="py-3 px-3 text-center text-xs font-semibold text-green-600">{d.conforme}</td>
                                            <td className="py-3 px-3 text-center text-xs font-semibold text-yellow-600">{d.partiel}</td>
                                            <td className="py-3 px-3 text-center text-xs font-semibold text-red-600">{d.non_conforme}</td>
                                            <td className="py-3 px-3 text-center text-xs text-gray-400">{d.na}</td>
                                            <td className="py-3 px-3">
                                                <div className="flex items-center gap-2 justify-center">
                                                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full" style={{ width: `${d.tauxConformite}%`, backgroundColor: '#2563eb' }} />
                                                    </div>
                                                    <span className="text-xs font-medium text-blue-600">{d.tauxConformite}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ResultatsPage;
