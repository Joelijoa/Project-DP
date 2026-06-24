import { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logoDataprotect from '../../../assets/images/logoDataprotect.png';
import { ETAPES_DEF } from './auditConstants';

const migrateEtapesLocal = (etapes) =>
    (etapes || []).map(e =>
        typeof e === 'string'
            ? { nom: e, activites: '', date_debut: '', date_fin: '', duree: '', livrables: '' }
            : { activites: '', date_debut: '', date_fin: '', duree: '', livrables: '', ...e }
    );

const PlanningAuditCard = ({ audit, identification, setIdentification, onSave, saving, readOnly }) => {
    const planning = identification.planning || {};
    const rawEtapes = planning.etapes;
    const sessions = planning.sessions || [];
    const hasData = !!(planning.objectifs || planning.methodes || planning.documents_attendus
        || (rawEtapes || []).some(e => e.activites || e.duree || e.date_debut)
        || sessions.length > 0);

    const [editing, setEditing] = useState(!readOnly && !hasData);
    const [expandedRow, setExpandedRow] = useState(null);
    const [exporting, setExporting] = useState(false);
    const exportRef = useRef(null);
    const section3Ref = useRef(null);

    const setP = (key, val) => setIdentification(prev => ({
        ...prev,
        planning: { ...(prev.planning || {}), [key]: val },
    }));

    const etapes = rawEtapes ? migrateEtapesLocal(rawEtapes) : ETAPES_DEF.map(e => ({ ...e }));

    const setEtape = (idx, field, val) => {
        const next = [...etapes];
        next[idx] = { ...next[idx], [field]: val };
        setP('etapes', next);
    };

    const addEtape = () => {
        const next = [...etapes, { nom: '', activites: '', date_debut: '', date_fin: '', duree: '', livrables: '' }];
        setP('etapes', next);
        setExpandedRow(next.length - 1);
    };

    const removeEtape = (idx) => {
        setP('etapes', etapes.filter((_, i) => i !== idx));
        setExpandedRow(null);
    };

    const setSession = (si, field, val) => {
        const next = sessions.map((s, i) => i === si ? { ...s, [field]: val } : s);
        setP('sessions', next);
    };
    const addSession = () => setP('sessions', [...sessions, { date: '', entretiens: [{ interlocuteurs: [''], plage_debut: '', plage_fin: '', exigences: '' }] }]);
    const removeSession = (si) => setP('sessions', sessions.filter((_, i) => i !== si));
    const setEntretien = (si, ei, field, val) => {
        const next = sessions.map((s, i) => {
            if (i !== si) return s;
            return { ...s, entretiens: s.entretiens.map((e, j) => j === ei ? { ...e, [field]: val } : e) };
        });
        setP('sessions', next);
    };
    const addEntretien = (si) => {
        const next = sessions.map((s, i) => i === si ? { ...s, entretiens: [...s.entretiens, { interlocuteurs: [''], plage_debut: '', plage_fin: '', exigences: '' }] } : s);
        setP('sessions', next);
    };
    const removeEntretien = (si, ei) => {
        const next = sessions.map((s, i) => i === si ? { ...s, entretiens: s.entretiens.filter((_, j) => j !== ei) } : s);
        setP('sessions', next);
    };
    const getInterlocuteurs = (e) => e.interlocuteurs?.length ? e.interlocuteurs : (e.interlocuteur ? [e.interlocuteur] : ['']);
    const setInterlocuteur = (si, ei, ii, val) => {
        const next = sessions.map((s, i) => {
            if (i !== si) return s;
            return {
                ...s, entretiens: s.entretiens.map((e, j) => {
                    if (j !== ei) return e;
                    const ints = [...getInterlocuteurs(e)];
                    ints[ii] = val;
                    return { ...e, interlocuteurs: ints, interlocuteur: undefined };
                })
            };
        });
        setP('sessions', next);
    };
    const addInterlocuteur = (si, ei) => {
        const next = sessions.map((s, i) => {
            if (i !== si) return s;
            return {
                ...s, entretiens: s.entretiens.map((e, j) => {
                    if (j !== ei) return e;
                    return { ...e, interlocuteurs: [...getInterlocuteurs(e), ''], interlocuteur: undefined };
                })
            };
        });
        setP('sessions', next);
    };
    const removeInterlocuteur = (si, ei, ii) => {
        const next = sessions.map((s, i) => {
            if (i !== si) return s;
            return {
                ...s, entretiens: s.entretiens.map((e, j) => {
                    if (j !== ei) return e;
                    return { ...e, interlocuteurs: getInterlocuteurs(e).filter((_, k) => k !== ii), interlocuteur: undefined };
                })
            };
        });
        setP('sessions', next);
    };

    const fmtDateSession = (d) => {
        if (!d) return { jour: '', date: '' };
        const date = new Date(d + 'T00:00:00');
        const jour = date.toLocaleDateString('fr-FR', { weekday: 'long' }).replace(/^\w/, c => c.toUpperCase());
        const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return { jour, date: dateStr };
    };

    const handleSave = () => { onSave(); setEditing(false); setExpandedRow(null); };

    const fmt = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('fr-FR') : null;

    const dureeCalc = (debut, fin) => {
        if (!debut || !fin) return null;
        const d = Math.round((new Date(fin) - new Date(debut)) / 86400000);
        return d > 0 ? `${d}j` : null;
    };

    const inputCls = "w-full px-2 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-400 bg-white";
    const inputStyle = { color: '#111827' };

    const SH = ({ children }) => (
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">{children}</h3>
    );
    const InfoBlock = ({ label, value }) => !value ? null : (
        <div>
            <dt className="text-xs font-medium text-gray-500 mb-0.5">{label}</dt>
            <dd className="text-sm text-gray-800 whitespace-pre-wrap">{value}</dd>
        </div>
    );

    const handleExport = async () => {
        setExporting(true);
        await new Promise(r => setTimeout(r, 250));
        try {
            const el = exportRef.current;
            const canvas = await html2canvas(el, {
                scale: 2, useCORS: true, allowTaint: true,
                backgroundColor: '#ffffff', logging: false,
            });

            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pw = pdf.internal.pageSize.getWidth();
            const ph = pdf.internal.pageSize.getHeight();
            const scale = canvas.width / pw;
            const pageHeightPx = Math.floor(ph * scale);
            const topMarginMm = 8;
            const topMarginPx = Math.floor(topMarginMm * scale);
            const ctx = canvas.getContext('2d');

            // Position de la section 3 dans le canvas (saut de page forcé)
            let forceBreakAt = null;
            if (section3Ref.current && exportRef.current) {
                const elRect = exportRef.current.getBoundingClientRect();
                const s3Rect = section3Ref.current.getBoundingClientRect();
                forceBreakAt = Math.floor((s3Rect.top - elRect.top) * (canvas.width / elRect.width));
            }

            const isLightRow = (y) => {
                const row = ctx.getImageData(0, Math.floor(y), canvas.width, 1).data;
                for (let i = 0; i < row.length; i += 4) {
                    if ((row[i] + row[i + 1] + row[i + 2]) / 3 < 200) return false;
                }
                return true;
            };

            // Cherche d'abord en arrière (fin de ligne précédente), puis en avant (début de ligne suivante)
            const findSafeCut = (idealY) => {
                const searchPx = 120 * scale;
                const back = Math.max(0, idealY - searchPx);
                for (let y = Math.floor(idealY); y > back; y--) {
                    if (isLightRow(y)) return y;
                }
                const fwd = Math.min(canvas.height, idealY + searchPx);
                for (let y = Math.ceil(idealY); y < fwd; y++) {
                    if (isLightRow(y)) return y;
                }
                return Math.floor(idealY);
            };

            let srcY = 0;
            let pageNum = 0;
            while (srcY < canvas.height) {
                if (pageNum > 0) pdf.addPage();
                // Pages de continuation : réserver la marge en haut
                const topPad = pageNum > 0 ? topMarginPx : 0;
                const availH = pageHeightPx - topPad;
                const idealEnd = srcY + availH;

                // Saut forcé avant la section 3
                let cutY;
                if (forceBreakAt !== null && forceBreakAt > srcY && forceBreakAt < idealEnd) {
                    cutY = forceBreakAt;
                    forceBreakAt = null;
                } else {
                    cutY = idealEnd >= canvas.height ? canvas.height : findSafeCut(idealEnd);
                }
                const sliceH = cutY - srcY;

                const slice = document.createElement('canvas');
                slice.width = canvas.width;
                slice.height = sliceH + topPad;
                const sCtx = slice.getContext('2d');
                if (topPad > 0) {
                    sCtx.fillStyle = '#ffffff';
                    sCtx.fillRect(0, 0, canvas.width, topPad);
                }
                sCtx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, topPad, canvas.width, sliceH);
                pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pw, (sliceH + topPad) / scale);

                srcY = cutY;
                pageNum++;
            }

            const safeName = (audit.nom || 'audit').replace(/[^a-zA-Z0-9_-]/g, '_');
            pdf.save(`Plan_Audit_${safeName}.pdf`);
        } catch {
            toast.error('Erreur lors de la génération du PDF.');
        } finally {
            setExporting(false);
        }
    };

    /* ── Données pour le rendu export ── */
    const exportRows = rawEtapes ? migrateEtapesLocal(rawEtapes) : ETAPES_DEF.map(e => ({ ...e }));
    const fmtEx = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('fr-FR') : '-';
    const auditeurs = (audit.auditeurs || []).map(a => `${a.prenom} ${a.nom}`).join(', ') || '-';
    const dateAudit = [audit.date_debut, audit.date_fin].filter(Boolean).map(d => fmtEx(d.split('T')[0])).join(' / ') || '-';
    const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const year = new Date().getFullYear();

    /* ── Mode lecture ── */
    if (!editing) {
        return (
            <>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-800">Planning de l'audit</h2>
                        <div className="flex items-center gap-2">
                            {hasData && (
                                <button onClick={handleExport} disabled={exporting}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed">
                                    {exporting
                                        ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                                        : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                    }
                                    {exporting ? 'Génération…' : 'Exporter PDF'}
                                </button>
                            )}
                            {!readOnly && (
                                <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-xl transition">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                                    Modifier
                                </button>
                            )}
                        </div>
                    </div>

                    {!hasData ? (
                        <p className="text-xs text-gray-400 italic">Planning non encore défini.</p>
                    ) : (
                        <>
                            <dl className="space-y-3">
                                <InfoBlock label="Objectifs de l'audit" value={planning.objectifs} />
                                <InfoBlock label="Méthodes d'audit" value={planning.methodes} />
                                <InfoBlock label="Documents attendus du client" value={planning.documents_attendus} />
                            </dl>

                            {audit.auditeurs?.length > 0 && (
                                <div>
                                    <SH>Équipe d'audit</SH>
                                    <div className="flex flex-wrap gap-2">
                                        {audit.auditeurs.map(a => (
                                            <span key={a.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                                                <span className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-[10px] font-bold">{(a.prenom?.[0] || '?').toUpperCase()}</span>
                                                {a.prenom} {a.nom}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <SH>Calendrier prévisionnel</SH>
                                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                                    <table className="w-full text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="text-center font-semibold text-gray-400 px-3 py-2.5 w-8">N°</th>
                                                <th className="text-left font-semibold text-gray-600 px-3 py-2.5 w-[160px]">Phase</th>
                                                <th className="text-left font-semibold text-gray-600 px-3 py-2.5">Activités</th>
                                                <th className="text-left font-semibold text-gray-600 px-3 py-2.5 w-[140px]">Période</th>
                                                <th className="text-left font-semibold text-gray-600 px-3 py-2.5 w-[70px]">Durée</th>
                                                <th className="text-left font-semibold text-gray-600 px-3 py-2.5">Livrables</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {etapes.map((e, i) => {
                                                const dc = dureeCalc(e.date_debut, e.date_fin);
                                                const dureeAff = dc || e.duree || '—';
                                                const debut = fmt(e.date_debut);
                                                const fin = fmt(e.date_fin);
                                                return (
                                                    <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition">
                                                        <td className="px-3 py-2.5 text-center text-gray-400 font-medium">{i + 1}</td>
                                                        <td className="px-3 py-2.5 font-semibold text-gray-800">{e.nom || '—'}</td>
                                                        <td className="px-3 py-2.5 text-gray-600 leading-relaxed">{e.activites || '—'}</td>
                                                        <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                                                            {debut && fin ? `${debut} → ${fin}` : debut || fin || '—'}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-gray-600 font-medium">{dureeAff}</td>
                                                        <td className="px-3 py-2.5 text-gray-600 leading-relaxed">{e.livrables || '—'}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {sessions.length > 0 && (
                                <div>
                                    <SH>Programme des entretiens</SH>
                                    <div className="space-y-4">
                                        {sessions.map((s, si) => {
                                            const { jour, date: dateStr } = fmtDateSession(s.date);
                                            const nb = (s.entretiens || []).length;
                                            return (
                                                <div key={si} className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                                    {/* En-tête journée */}
                                                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                                                        <div className="w-0.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--brand-red)' }} />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-gray-800">{jour || '—'}</p>
                                                            {dateStr && <p className="text-xs text-gray-500 mt-0.5">{dateStr}</p>}
                                                        </div>
                                                        <span className="flex-shrink-0 text-xs font-medium bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full">
                                                            {nb} entretien{nb > 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                    {/* Colonnes */}
                                                    <div className="grid bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={{ gridTemplateColumns: '1fr 200px 2fr' }}>
                                                        <span className="px-4 py-2">Interlocuteur</span>
                                                        <span className="px-4 py-2">Plage d'horaire</span>
                                                        <span className="px-4 py-2">Exigences ISO 27001:2022</span>
                                                    </div>
                                                    {/* Lignes */}
                                                    {(s.entretiens || []).map((e, ei) => {
                                                        const plageAff = e.plage_debut && e.plage_fin
                                                            ? `${e.plage_debut} → ${e.plage_fin}`
                                                            : e.plage || '—';
                                                        const lignes = (e.exigences || '').split('\n').filter(l => l.trim());
                                                        return (
                                                            <div key={ei} className="grid border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors" style={{ gridTemplateColumns: '1fr 200px 2fr' }}>
                                                                <div className="px-4 py-3 align-top">
                                                                    {getInterlocuteurs(e).filter(Boolean).length > 0
                                                                        ? <ul className="space-y-1">{getInterlocuteurs(e).filter(Boolean).map((name, ni) => <li key={ni} className="text-sm font-medium text-gray-800">{name}</li>)}</ul>
                                                                        : <span className="text-sm text-gray-400 italic">—</span>}
                                                                </div>
                                                                <div className="px-4 py-3 align-top">
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gray-100 text-xs font-medium text-gray-700 whitespace-nowrap">
                                                                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                        {plageAff}
                                                                    </span>
                                                                </div>
                                                                <div className="px-4 py-3 align-top">
                                                                    {lignes.length > 0 ? (
                                                                        <ul className="space-y-1">
                                                                            {lignes.map((l, li) => (
                                                                                <li key={li} className="flex items-start gap-2 text-xs text-gray-600">
                                                                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                                                                                    {l}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    ) : <span className="text-xs text-gray-400 italic">—</span>}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ── Document export (off-screen, html2canvas target) ── */}
                {exporting && (
                    <div ref={exportRef} style={{
                        position: 'fixed', left: '-9999px', top: 0,
                        width: '794px', backgroundColor: '#ffffff',
                        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                        color: '#111827', fontSize: '10px', lineHeight: '1.5',
                    }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', padding: '24px 32px 18px', borderBottom: '3px solid #CC0000' }}>
                            <img src={logoDataprotect} alt="DataProtect" style={{ height: '38px', objectFit: 'contain' }} crossOrigin="anonymous" />
                        </div>

                        {/* Meta strip */}
                        <div style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: '10px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', alignItems: 'center' }}>
                            {[
                                { label: 'Référence', value: `REF-PA-${year}-001` },
                                { label: 'Version', value: 'V1.0' },
                            ].map(({ label, value }, i) => (
                                <div key={i}>
                                    <p style={{ margin: 0, fontSize: '8px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af' }}>{label}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '10px', fontWeight: 700, color: '#111827' }}>{value}</p>
                                </div>
                            ))}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'inherit' }}>
                                <div style={{ backgroundColor: '#111827', borderRadius: '3px', padding: '0 10px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#ffffff', lineHeight: 1, marginTop: '-2px' }}>
                                        CONFIDENTIEL
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '8px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af' }}>Date d'émission</p>
                                <p style={{ margin: '2px 0 0', fontSize: '10px', fontWeight: 700, color: '#111827' }}>{today}</p>
                            </div>
                        </div>

                        {/* Title block */}
                        <div style={{ padding: '26px 32px 18px' }}>
                            <p style={{ margin: 0, fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#CC0000' }}>DataProtect - Plan d'audit</p>
                            <h1 style={{ margin: '6px 0 5px', fontSize: '21px', fontWeight: 700, color: '#111111', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{audit.nom || 'Audit ISO 27001'}</h1>
                            <p style={{ margin: 0, fontSize: '12px', color: '#4b5563', fontWeight: 400 }}>
                                {audit.client || ''}{audit.referentiel?.nom ? ` · ${audit.referentiel.nom}` : ''}
                            </p>
                        </div>

                        {/* Identification box */}
                        <div style={{ margin: '0 32px 22px', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                            <div style={{ backgroundColor: '#f3f4f6', padding: '7px 14px', borderBottom: '1px solid #e5e7eb' }}>
                                <p style={{ margin: 0, fontSize: '8px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#374151' }}>Identification de la mission</p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                {[
                                    { label: 'Organisation auditée', value: audit.client || '-' },
                                    { label: 'Référentiel', value: audit.referentiel?.nom || '-' },
                                    { label: "Période d'audit", value: dateAudit },
                                    { label: "Équipe d'audit", value: auditeurs },
                                ].map(({ label, value }, idx) => (
                                    <div key={idx} style={{
                                        padding: '10px 14px',
                                        borderBottom: idx < 2 ? '1px solid #f3f4f6' : 'none',
                                        borderRight: idx % 2 === 0 ? '1px solid #f3f4f6' : 'none',
                                    }}>
                                        <p style={{ margin: '0 0 2px', fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af' }}>{label}</p>
                                        <p style={{ margin: 0, fontSize: '10px', fontWeight: 500, color: '#111827' }}>{value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section 1 — Contexte */}
                        {(planning.objectifs || planning.methodes || planning.documents_attendus) && (
                            <div style={{ padding: '0 32px 20px' }}>
                                <h2 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 700, color: '#111111', letterSpacing: '-0.005em' }}>1. Contexte et périmètre</h2>
                                {[
                                    { label: 'Objectifs', value: planning.objectifs },
                                    { label: "Méthodes d'audit", value: planning.methodes },
                                    { label: 'Documents attendus', value: planning.documents_attendus },
                                ].filter(r => r.value).map(({ label, value }, i) => (
                                    <div key={i} style={{ marginBottom: '10px' }}>
                                        <p style={{ margin: '0 0 2px', fontSize: '9px', fontWeight: 700, color: '#374151' }}>{label}</p>
                                        <p style={{ margin: 0, fontSize: '10px', color: '#374151', lineHeight: '1.6' }}>{value}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Section 2 — Calendrier */}
                        {exportRows.length > 0 && (
                            <div style={{ padding: '0 32px 22px' }}>
                                <h2 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 700, color: '#111111', letterSpacing: '-0.005em' }}>2. Calendrier prévisionnel</h2>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#111111', color: '#ffffff' }}>
                                            {['N°', 'Phase', 'Activités principales', 'Période', 'Durée', 'Livrables'].map((h, i) => (
                                                <th key={i} style={{ padding: '7px 9px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 600, fontSize: '8px', letterSpacing: '0.05em', textTransform: 'uppercase', borderRight: i < 5 ? '1px solid #374151' : 'none' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {exportRows.map((e, i) => {
                                            const dc = dureeCalc(e.date_debut, e.date_fin);
                                            const dureeAff = dc || e.duree || '-';
                                            const debut = fmtEx(e.date_debut);
                                            const fin = fmtEx(e.date_fin);
                                            const periode = debut !== '-' && fin !== '-' ? `${debut} au ${fin}` : debut !== '-' ? debut : fin !== '-' ? fin : '-';
                                            return (
                                                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                                    <td style={{ padding: '7px 9px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 700, color: '#374151', borderRight: '1px solid #e5e7eb', width: '22px' }}>{i + 1}</td>
                                                    <td style={{ padding: '7px 9px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 600, color: '#111111', borderRight: '1px solid #e5e7eb', width: '110px' }}>{e.nom || '-'}</td>
                                                    <td style={{ padding: '7px 9px', textAlign: 'center', verticalAlign: 'middle', color: '#374151', borderRight: '1px solid #e5e7eb', lineHeight: '1.5' }}>{e.activites || '-'}</td>
                                                    <td style={{ padding: '7px 9px', textAlign: 'center', verticalAlign: 'middle', color: '#374151', borderRight: '1px solid #e5e7eb', width: '115px' }}>{periode}</td>
                                                    <td style={{ padding: '7px 9px', textAlign: 'center', verticalAlign: 'middle', color: '#374151', borderRight: '1px solid #e5e7eb', width: '55px', fontWeight: 500 }}>{dureeAff}</td>
                                                    <td style={{ padding: '7px 9px', textAlign: 'center', verticalAlign: 'middle', color: '#374151', lineHeight: '1.5' }}>{e.livrables || '-'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Section 3 — Programme des entretiens */}
                        {sessions.length > 0 && (
                            <div ref={section3Ref} style={{ padding: '0 32px 22px' }}>
                                <h2 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 700, color: '#111111', letterSpacing: '-0.005em' }}>3. Programme des entretiens</h2>
                                {sessions.map((s, si) => {
                                    const { jour, date: dateStr } = fmtDateSession(s.date);
                                    return (
                                        <div key={si} style={{ marginBottom: '14px' }}>
                                            <div style={{ backgroundColor: '#111111', color: '#ffffff', padding: '7px 12px', borderRadius: '4px 4px 0 0', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '10px', fontWeight: 700 }}>{jour || '-'}</span>
                                                    {dateStr && <span style={{ fontSize: '9px', color: '#9ca3af' }}>{dateStr}</span>}
                                                </div>
                                                <div style={{ fontSize: '8px', backgroundColor: 'rgba(255,255,255,0.12)', padding: '3px 8px', borderRadius: '10px', color: '#d1d5db' }}>
                                                    {(s.entretiens || []).length} entretien{(s.entretiens || []).length > 1 ? 's' : ''}
                                                </div>
                                            </div>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', border: '1px solid #e5e7eb', borderTop: 'none' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                                                        {['Interlocuteur', 'Plage horaire', 'Exigences ISO 27001:2022'].map((h, hi) => (
                                                            <th key={hi} style={{ padding: '6px 10px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 600, fontSize: '8px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb', borderRight: hi < 2 ? '1px solid #e5e7eb' : 'none' }}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(s.entretiens || []).map((e, ei) => {
                                                        const plageAff = e.plage_debut && e.plage_fin ? `${e.plage_debut} - ${e.plage_fin}` : e.plage || '-';
                                                        const ints = getInterlocuteurs(e).filter(Boolean);
                                                        return (
                                                            <tr key={ei} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: ei % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                                                                <td style={{ padding: '7px 10px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 600, color: '#111111', borderRight: '1px solid #e5e7eb', width: '150px' }}>
                                                                    {ints.length > 0
                                                                        ? ints.map((name, ni) => <div key={ni} style={{ marginBottom: ni < ints.length - 1 ? '3px' : 0 }}>{name}</div>)
                                                                        : '-'}
                                                                </td>
                                                                <td style={{ padding: '7px 10px', textAlign: 'center', verticalAlign: 'middle', color: '#374151', fontWeight: 500, borderRight: '1px solid #e5e7eb', width: '95px' }}>{plageAff}</td>
                                                                <td style={{ padding: '7px 10px', textAlign: 'center', verticalAlign: 'middle', color: '#374151', lineHeight: '1.6' }}>{e.exigences || '-'}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Footer */}
                        <div style={{ margin: '8px 32px 0', borderTop: '1px solid #e5e7eb', padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '8px', color: '#9ca3af' }}>© {year} DataProtect · Tous droits réservés</span>
                            <span style={{ fontSize: '8px', color: '#9ca3af', fontWeight: 500 }}>Document confidentiel - Usage restreint aux parties concernées</span>
                            <span style={{ fontSize: '8px', color: '#9ca3af' }}>REF-PA-{year}-001 / V1.0</span>
                        </div>
                    </div>
                )}
            </>
        );
    }

    /* ── Mode édition ── */
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">Planning de l'audit</h2>
                {hasData && <button onClick={() => { setEditing(false); setExpandedRow(null); }} className="text-xs text-gray-500 hover:text-gray-700 underline">Annuler</button>}
            </div>

            <div>
                <SH>Objectifs de l'audit</SH>
                <textarea rows={3} value={planning.objectifs || ''} onChange={e => setP('objectifs', e.target.value)}
                    placeholder="Décrire les objectifs de l'audit…"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-400 resize-none"
                    style={{ color: '#111827' }} />
            </div>

            <div>
                <SH>Méthodes d'audit</SH>
                <textarea rows={2} value={planning.methodes || ''} onChange={e => setP('methodes', e.target.value)}
                    placeholder="Entretiens, revue documentaire, tests techniques, observations terrain…"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-400 resize-none"
                    style={{ color: '#111827' }} />
            </div>

            <div>
                <SH>Documents attendus du client</SH>
                <textarea rows={2} value={planning.documents_attendus || ''} onChange={e => setP('documents_attendus', e.target.value)}
                    placeholder="Politique de sécurité, procédures internes, schémas réseau…"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-400 resize-none"
                    style={{ color: '#111827' }} />
            </div>

            <div>
                <SH>Calendrier prévisionnel</SH>
                <div className="rounded-2xl border border-gray-100 overflow-hidden">
                    {/* En-tête tableau */}
                    <div className="grid bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 px-3 py-2" style={{ gridTemplateColumns: '28px 1fr 32px' }}>
                        <span className="text-center">N°</span>
                        <span>Phase</span>
                        <span></span>
                    </div>

                    {/* Lignes */}
                    {etapes.map((e, i) => (
                        <div key={i} className="border-b border-gray-100 last:border-0">
                            {/* Ligne résumé — clic pour développer */}
                            <div
                                className="grid items-center px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition"
                                style={{ gridTemplateColumns: '28px 1fr auto 32px' }}
                                onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                            >
                                <span className="text-xs text-gray-400 font-medium text-center">{i + 1}</span>
                                <span className="text-sm font-medium text-gray-800 truncate pr-2">{e.nom || <span className="text-gray-400 italic">Nouvelle étape</span>}</span>
                                <span className="text-xs text-gray-400 mr-2">
                                    {e.duree || dureeCalc(e.date_debut, e.date_fin) || ''}
                                </span>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedRow === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>

                            {/* Panneau édition déplié */}
                            {expandedRow === i && (
                                <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Intitulé de la phase</label>
                                            <input value={e.nom} onChange={ev => setEtape(i, 'nom', ev.target.value)}
                                                placeholder="Ex : Cadrage" className={inputCls} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Durée</label>
                                            <input value={e.duree} onChange={ev => setEtape(i, 'duree', ev.target.value)}
                                                placeholder="Ex : 1 semaine" className={inputCls} style={inputStyle} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Activités</label>
                                        <textarea rows={2} value={e.activites} onChange={ev => setEtape(i, 'activites', ev.target.value)}
                                            placeholder="Décrire les activités de cette phase…"
                                            className={`${inputCls} resize-none`} style={inputStyle} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Date début <span className="text-gray-300">(optionnel)</span></label>
                                            <input type="date" value={e.date_debut} onChange={ev => setEtape(i, 'date_debut', ev.target.value)}
                                                className={inputCls} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Date fin <span className="text-gray-300">(optionnel)</span></label>
                                            <input type="date" value={e.date_fin}
                                                min={e.date_debut || undefined}
                                                onChange={ev => setEtape(i, 'date_fin', ev.target.value)}
                                                className={`w-full px-2 py-1.5 text-xs border rounded-xl focus:outline-none focus:ring-1 focus:ring-red-400 bg-white ${
                                                    e.date_fin && e.date_debut && e.date_fin < e.date_debut ? 'border-red-300' : 'border-gray-200'
                                                }`}
                                                style={inputStyle} />
                                            {e.date_fin && e.date_debut && e.date_fin < e.date_debut && (
                                                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                                    </svg>
                                                    Date de fin antérieure au début
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Livrables</label>
                                        <textarea rows={2} value={e.livrables} onChange={ev => setEtape(i, 'livrables', ev.target.value)}
                                            placeholder="Livrables attendus à la fin de cette phase…"
                                            className={`${inputCls} resize-none`} style={inputStyle} />
                                    </div>
                                    {etapes.length > 1 && (
                                        <div className="flex justify-end">
                                            <button onClick={() => removeEtape(i)}
                                                className="text-xs text-red-500 hover:text-red-700 transition">
                                                Supprimer cette étape
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Ajouter une étape */}
                    <button onClick={addEtape}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition border-t border-gray-100">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        Ajouter une étape
                    </button>
                </div>
            </div>

            {/* Programme des entretiens */}
            <div>
                <SH>Programme des entretiens</SH>

                {sessions.length === 0 ? (
                    <button onClick={addSession}
                        className="w-full flex flex-col items-center gap-2 py-8 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500 hover:bg-gray-50 transition group">
                        <svg className="w-8 h-8 text-gray-300 group-hover:text-gray-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                        </svg>
                        <div className="text-center">
                            <p className="text-sm font-medium">Aucune journée planifiée</p>
                            <p className="text-xs mt-0.5">Cliquez pour ajouter la première journée d'entretiens</p>
                        </div>
                    </button>
                ) : (
                    <div className="space-y-4">
                        {sessions.map((s, si) => {
                            const { jour, date: dateStr } = fmtDateSession(s.date);
                            return (
                                <div key={si} className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    {/* En-tête journée */}
                                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                                        <div className="w-0.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--brand-red)' }} />
                                        <div className="flex-1 min-w-0">
                                            {jour
                                                ? <p className="text-sm font-bold text-gray-800">{jour} <span className="font-normal text-gray-500 ml-1">{dateStr}</span></p>
                                                : <p className="text-sm text-gray-400 italic">Date non définie</p>
                                            }
                                        </div>
                                        <input
                                            type="date"
                                            value={s.date}
                                            onChange={ev => setSession(si, 'date', ev.target.value)}
                                            className="px-2 py-1 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-400"
                                            style={{ color: '#111827' }}
                                        />
                                        <button onClick={() => removeSession(si)}
                                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition px-2 py-1 rounded-xl hover:bg-red-50">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                            Supprimer
                                        </button>
                                    </div>

                                    {/* En-têtes colonnes */}
                                    <div className="grid bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={{ gridTemplateColumns: '1fr 230px 2fr 32px' }}>
                                        <span className="px-4 py-2">Interlocuteur</span>
                                        <span className="px-4 py-2">Plage d'horaire</span>
                                        <span className="px-4 py-2">Exigences ISO 27001:2022</span>
                                        <span />
                                    </div>

                                    {/* Lignes entretiens */}
                                    {(s.entretiens || []).map((e, ei) => (
                                        <div key={ei} className="grid items-start border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors group/row" style={{ gridTemplateColumns: '1fr 230px 2fr 32px' }}>
                                            <div className="px-3 py-2.5 space-y-1">
                                                {getInterlocuteurs(e).map((name, ii) => (
                                                    <div key={ii} className="flex items-center gap-1">
                                                        <input
                                                            value={name}
                                                            onChange={ev => setInterlocuteur(si, ei, ii, ev.target.value)}
                                                            placeholder="Ex : RSSI, DSI, DRH…"
                                                            className="flex-1 min-w-0 px-2.5 py-1.5 text-sm border border-transparent rounded-xl hover:border-gray-200 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-red-400 bg-transparent focus:bg-white transition"
                                                            style={{ color: '#111827' }}
                                                        />
                                                        {getInterlocuteurs(e).length > 1 && (
                                                            <button onClick={() => removeInterlocuteur(si, ei, ii)}
                                                                className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-red-400 hover:bg-red-50 transition"
                                                                title="Retirer cet interlocuteur">
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button onClick={() => addInterlocuteur(si, ei)}
                                                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition pt-0.5">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                                    Ajouter
                                                </button>
                                            </div>
                                            <div className="px-3 py-2.5">
                                                <div className="flex items-center gap-1.5">
                                                    <input
                                                        type="time"
                                                        value={e.plage_debut || ''}
                                                        onChange={ev => setEntretien(si, ei, 'plage_debut', ev.target.value)}
                                                        className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-transparent rounded-xl hover:border-gray-200 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-red-400 bg-transparent focus:bg-white transition"
                                                        style={{ color: '#111827' }}
                                                    />
                                                    <span className="text-gray-300 text-xs">—</span>
                                                    <input
                                                        type="time"
                                                        value={e.plage_fin || ''}
                                                        onChange={ev => setEntretien(si, ei, 'plage_fin', ev.target.value)}
                                                        className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-transparent rounded-xl hover:border-gray-200 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-red-400 bg-transparent focus:bg-white transition"
                                                        style={{ color: '#111827' }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="px-3 py-2.5">
                                                <textarea
                                                    rows={3}
                                                    value={e.exigences || ''}
                                                    onChange={ev => setEntretien(si, ei, 'exigences', ev.target.value)}
                                                    placeholder={'Une exigence par ligne :\nA.5.1 — Politiques de sécurité\nA.6.1 — Organisation interne'}
                                                    className="w-full px-2.5 py-1.5 text-xs border border-transparent rounded-xl hover:border-gray-200 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-red-400 bg-transparent focus:bg-white resize-none transition"
                                                    style={{ color: '#111827' }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-center pt-3">
                                                {s.entretiens.length > 1 && (
                                                    <button
                                                        onClick={() => removeEntretien(si, ei)}
                                                        className="opacity-0 group-hover/row:opacity-100 w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                                                        title="Supprimer cette ligne">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Ajouter un interlocuteur */}
                                    <button
                                        onClick={() => addEntretien(si)}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition border-t border-dashed border-gray-200">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                        Ajouter un interlocuteur
                                    </button>
                                </div>
                            );
                        })}

                        <button onClick={addSession}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            Ajouter une journée
                        </button>
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-1">
                <button onClick={handleSave} disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition hover:opacity-90"
                    style={{ backgroundColor: 'var(--brand-red)' }}>
                    {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {saving ? 'Enregistrement…' : 'Enregistrer le planning'}
                </button>
            </div>
        </div>
    );
};

export default PlanningAuditCard;
