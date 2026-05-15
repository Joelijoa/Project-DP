import { useState, useRef } from 'react';
import { PREVIEWABLE, STATUT_BADGE } from './auditConstants';
import { fileIcon, fmtSize } from './auditHelpers';
import DocumentPreviewModal from './DocumentPreviewModal';

const RevueDocuments = ({ documents, isClient, onDownload, onFetchBlob, onUpdateStatut, onReplace }) => {
    const [preview, setPreview] = useState(null);
    const [examined, setExamined] = useState(new Set());
    const [refuseId, setRefuseId] = useState(null);
    const [constatMap, setConstatMap] = useState({});
    const [saving, setSaving] = useState(false);
    const [refOpen, setRefOpen] = useState(false);
    const [docTab, setDocTab] = useState(isClient ? 'auditeur' : 'client');
    const replaceRef = useRef(null);
    const [replacingId, setReplacingId] = useState(null);

    const docsClient = documents.filter(d => d.uploader?.role === 'client');
    const docsAuditeurs = documents.filter(d => d.uploader?.role !== 'client');

    const handleConsulter = (doc) => {
        setExamined(prev => new Set([...prev, doc.id]));
        if (PREVIEWABLE.includes(doc.type_mime)) {
            setPreview({ id: doc.id, nom: doc.nom_original, mime: doc.type_mime, taille: doc.taille });
        } else {
            onDownload(doc.id, doc.nom_original);
        }
    };

    const handleValider = async (doc) => {
        setSaving(true);
        await onUpdateStatut(doc.id, 'valide', null);
        setSaving(false);
    };

    const handleRefuser = async (doc) => {
        const constat = (constatMap[doc.id] || '').trim();
        if (!constat) return;
        setSaving(true);
        await onUpdateStatut(doc.id, 'refuse', constat);
        setRefuseId(null);
        setSaving(false);
    };

    const validatedCount = docsClient.filter(d => d.statut === 'valide').length;
    const total = docsClient.length;
    const pct = total > 0 ? Math.round((validatedCount / total) * 100) : 0;
    const allDone = total > 0 && docsClient.every(d => d.statut !== 'en_attente');

    return (
        <>
            {preview && <DocumentPreviewModal doc={preview} onClose={() => setPreview(null)} onFetchBlob={onFetchBlob} onDownload={onDownload} />}
            {onReplace && (
                <input ref={replaceRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                    className="hidden" onChange={e => { if (replacingId) { const files = Array.from(e.target.files); e.target.value = ''; onReplace(replacingId, files); setReplacingId(null); } else { e.target.value = ''; } }} />
            )}

            {/* ── Onglets navigation ── */}
            <div className="flex border-b border-gray-200">
                {(isClient
                    ? [
                        { id: 'auditeur', label: "Documents auditeur", docs: docsAuditeurs },
                        { id: 'client', label: 'Mes documents', docs: docsClient },
                    ]
                    : [
                        { id: 'client', label: 'Documents client', docs: docsClient },
                        { id: 'auditeur', label: 'Mes dépôts', docs: docsAuditeurs },
                    ]
                ).map(tab => {
                    const refused = tab.docs.filter(d => d.statut === 'refuse').length;
                    const pending = tab.docs.filter(d => d.statut === 'en_attente').length;
                    const active = docTab === tab.id;
                    const badgeCls = refused > 0 ? 'bg-red-100 text-red-600' : pending > 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500';
                    return (
                        <button key={tab.id} onClick={() => setDocTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${active ? 'border-current' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            style={active ? { color: 'var(--brand-red)', borderColor: 'var(--brand-red)' } : {}}>
                            {tab.label}
                            {tab.docs.length > 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeCls}`}>{tab.docs.length}</span>}
                        </button>
                    );
                })}
            </div>

            {/* ── Documents client à valider ─────────────────────────── */}
            {docTab === 'client' && (docsClient.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    </div>
                    <p className="text-sm font-medium text-gray-500">Aucun document transmis par le client</p>
                    <p className="text-xs text-gray-400 mt-1">Les documents apparaîtront ici une fois déposés dans la phase Prérequis</p>
                </div>
            ) : (
                <>
                    {/* ── Header progression ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Validation des documents</p>
                                <p className="text-xs text-gray-400 mt-0.5">{total} document{total > 1 ? 's' : ''} à examiner</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-extrabold tracking-tight" style={{ color: allDone ? '#16a34a' : 'var(--brand-red)' }}>{pct}%</p>
                                <p className="text-xs text-gray-400">{validatedCount}/{total} traité{validatedCount > 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, backgroundColor: allDone ? '#16a34a' : 'var(--brand-red)' }} />
                        </div>
                        {allDone && (
                            <div className="flex items-center gap-1.5 mt-2.5">
                                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p className="text-xs font-semibold text-green-600">Tous les documents ont été examinés</p>
                            </div>
                        )}
                    </div>

                    {/* ── Liste documents ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {docsClient.map((doc, idx) => {
                            const badge = STATUT_BADGE[doc.statut] || STATUT_BADGE.en_attente;
                            const isRefusing = refuseId === doc.id;
                            const examined_ = examined.has(doc.id);
                            const accent = doc.statut === 'valide' ? '#16a34a'
                                : doc.statut === 'refuse' ? '#dc2626'
                                    : doc.is_correction ? '#ea580c'
                                        : '#e5e7eb';
                            return (
                                <div key={doc.id} className={idx > 0 ? 'border-t border-gray-100' : ''}>
                                    {/* Ligne principale */}
                                    <div className="flex items-center gap-3 px-4 py-3" style={{ borderLeft: `3px solid ${accent}` }}>
                                        <span className="text-base flex-shrink-0">{fileIcon(doc.type_mime)}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-semibold text-gray-800 truncate">{doc.nom_original}</p>
                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${badge.cls}`}>{badge.label}</span>
                                                {doc.is_correction && doc.statut === 'en_attente' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 flex-shrink-0">
                                                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                                        Corrigé
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {fmtSize(doc.taille)} · {new Date(doc.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                {examined_ && <span className="ml-1.5 text-gray-300">· Consulté</span>}
                                            </p>
                                        </div>

                                        {/* Actions — une seule rangée */}
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button onClick={() => handleConsulter(doc)} title={examined_ ? 'Revoir' : 'Consulter'}
                                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${examined_ ? 'text-gray-500 hover:bg-gray-50 border border-gray-200' : 'text-white hover:opacity-90'}`}
                                                style={examined_ ? {} : { backgroundColor: 'var(--brand-red)' }}>
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                {examined_ ? 'Revoir' : 'Consulter'}
                                            </button>

                                            {!isClient && (
                                                <>
                                                    <button onClick={() => handleValider(doc)} disabled={saving || doc.statut === 'valide'}
                                                        title="Valider" className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 disabled:opacity-30 transition">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                                    </button>
                                                    <button onClick={() => setRefuseId(isRefusing ? null : doc.id)} disabled={saving || doc.statut === 'refuse'}
                                                        title="Refuser" className={`p-1.5 rounded-lg transition disabled:opacity-30 ${isRefusing ? 'bg-red-50 text-red-600' : 'text-red-400 hover:bg-red-50 hover:text-red-600'}`}>
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </>
                                            )}

                                            {isClient && doc.statut === 'refuse' && onReplace && (
                                                <button onClick={() => { setReplacingId(doc.id); replaceRef.current?.click(); }}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                                    Corriger
                                                </button>
                                            )}

                                            <button onClick={() => onDownload(doc.id, doc.nom_original)} title="Télécharger"
                                                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Constat refus — expansion inline */}
                                    {doc.statut === 'refuse' && doc.constat && (
                                        <div className="px-4 pb-3" style={{ borderLeft: '3px solid #dc2626' }}>
                                            <div className="ml-7 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                                                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Constat · </span>
                                                <span className="text-xs text-red-700">{doc.constat}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Formulaire de refus — expansion inline */}
                                    {isRefusing && !isClient && (
                                        <div className="px-4 pb-3" style={{ borderLeft: '3px solid #dc2626' }}>
                                            <div className="ml-7 space-y-2">
                                                <textarea rows={2}
                                                    value={constatMap[doc.id] || ''}
                                                    onChange={e => setConstatMap(m => ({ ...m, [doc.id]: e.target.value }))}
                                                    placeholder="Décrivez les modifications à apporter…"
                                                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-200"
                                                />
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleRefuser(doc)} disabled={saving || !(constatMap[doc.id] || '').trim()}
                                                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition">
                                                        Confirmer le refus
                                                    </button>
                                                    <button onClick={() => setRefuseId(null)}
                                                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs hover:bg-gray-50 transition">
                                                        Annuler
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            ))}

            {/* ── Onglet : documents auditeurs ─────────────────────────── */}
            {docTab === 'auditeur' && (<>
                {isClient && docsAuditeurs.length === 0 && (
                    <div className="py-10 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                        <p className="text-sm font-medium text-gray-500">Aucun document déposé par l'auditeur</p>
                        <p className="text-xs text-gray-400 mt-1">Les documents apparaîtront ici une fois déposés</p>
                    </div>
                )}
                {isClient && docsAuditeurs.length > 0 && (
                    <>
                        {/* Header progression */}
                        {(() => {
                            const clientTotal = docsAuditeurs.length;
                            const clientValidated = docsAuditeurs.filter(d => d.statut === 'valide').length;
                            const clientPct = Math.round((clientValidated / clientTotal) * 100);
                            const clientAllDone = docsAuditeurs.every(d => d.statut !== 'en_attente');
                            return (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">Documents déposés par l'auditeur</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{clientTotal} document{clientTotal > 1 ? 's' : ''} à valider</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-extrabold tracking-tight" style={{ color: clientAllDone ? '#16a34a' : 'var(--brand-red)' }}>{clientPct}%</p>
                                            <p className="text-xs text-gray-400">{clientValidated}/{clientTotal} traité{clientValidated > 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div className="h-1.5 rounded-full transition-all duration-700"
                                            style={{ width: `${clientPct}%`, backgroundColor: clientAllDone ? '#16a34a' : 'var(--brand-red)' }} />
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Liste docs auditeurs — validation symétrique */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {docsAuditeurs.map((doc, idx) => {
                                const badge = STATUT_BADGE[doc.statut] || STATUT_BADGE.en_attente;
                                const isRefusing = refuseId === doc.id;
                                const examined_ = examined.has(doc.id);
                                const accent = doc.statut === 'valide' ? '#16a34a'
                                    : doc.statut === 'refuse' ? '#dc2626'
                                        : '#e5e7eb';
                                return (
                                    <div key={doc.id} className={idx > 0 ? 'border-t border-gray-100' : ''}>
                                        <div className="flex items-center gap-3 px-4 py-3" style={{ borderLeft: `3px solid ${accent}` }}>
                                            <span className="text-base flex-shrink-0">{fileIcon(doc.type_mime)}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-semibold text-gray-800 truncate">{doc.nom_original}</p>
                                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${badge.cls}`}>{badge.label}</span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {fmtSize(doc.taille)} · {doc.uploader?.prenom} {doc.uploader?.nom}
                                                    {examined_ && <span className="ml-1.5 text-gray-300">· Consulté</span>}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <button onClick={() => handleConsulter(doc)} title={examined_ ? 'Revoir' : 'Consulter'}
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${examined_ ? 'text-gray-500 hover:bg-gray-50 border border-gray-200' : 'text-white hover:opacity-90'}`}
                                                    style={examined_ ? {} : { backgroundColor: 'var(--brand-red)' }}>
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    {examined_ ? 'Revoir' : 'Consulter'}
                                                </button>
                                                <button onClick={() => handleValider(doc)} disabled={saving || doc.statut === 'valide'}
                                                    title="Valider" className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 disabled:opacity-30 transition">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                                </button>
                                                <button onClick={() => setRefuseId(isRefusing ? null : doc.id)} disabled={saving || doc.statut === 'refuse'}
                                                    title="Demander une modification" className={`p-1.5 rounded-lg transition disabled:opacity-30 ${isRefusing ? 'bg-red-50 text-red-600' : 'text-red-400 hover:bg-red-50 hover:text-red-600'}`}>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                                <button onClick={() => onDownload(doc.id, doc.nom_original)} title="Télécharger"
                                                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                        {doc.statut === 'refuse' && doc.constat && (
                                            <div className="px-4 pb-3" style={{ borderLeft: '3px solid #dc2626' }}>
                                                <div className="ml-7 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                                                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Constat · </span>
                                                    <span className="text-xs text-red-700">{doc.constat}</span>
                                                </div>
                                            </div>
                                        )}
                                        {isRefusing && (
                                            <div className="px-4 pb-3" style={{ borderLeft: '3px solid #dc2626' }}>
                                                <div className="ml-7 space-y-2">
                                                    <textarea rows={2}
                                                        value={constatMap[doc.id] || ''}
                                                        onChange={e => setConstatMap(m => ({ ...m, [doc.id]: e.target.value }))}
                                                        placeholder="Précisez les modifications demandées…"
                                                        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-200"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleRefuser(doc)} disabled={saving || !(constatMap[doc.id] || '').trim()}
                                                            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition">
                                                            Confirmer
                                                        </button>
                                                        <button onClick={() => setRefuseId(null)}
                                                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs hover:bg-gray-50 transition">
                                                            Annuler
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* ── Vue AUDITEUR : docs auditeurs en lecture seule + statut client ── */}
                {!isClient && docsAuditeurs.length === 0 && (
                    <div className="py-10 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                        <p className="text-sm font-medium text-gray-500">Aucun document déposé pour le moment</p>
                        <p className="text-xs text-gray-400 mt-1">Vos dépôts apparaîtront ici avec la décision du client</p>
                    </div>
                )}
                {!isClient && docsAuditeurs.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                        {docsAuditeurs.map(doc => {
                            const badge = STATUT_BADGE[doc.statut] || STATUT_BADGE.en_attente;
                            return (
                                <div key={doc.id}>
                                    <div className="flex items-center gap-3 px-5 py-3"
                                        style={{ borderLeft: `3px solid ${doc.statut === 'valide' ? '#16a34a' : doc.statut === 'refuse' ? '#dc2626' : '#e5e7eb'}` }}>
                                        <span className="text-base flex-shrink-0">{fileIcon(doc.type_mime)}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-medium text-gray-800 truncate">{doc.nom_original}</p>
                                                {doc.is_correction && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 flex-shrink-0">
                                                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                                        Corrigé
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-0.5">{fmtSize(doc.taille)} · {doc.uploader?.prenom} {doc.uploader?.nom}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                                            {doc.statut === 'refuse' && onReplace && (
                                                <button onClick={() => { setReplacingId(doc.id); replaceRef.current?.click(); }}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                                    Corriger
                                                </button>
                                            )}
                                            <button onClick={() => handleConsulter(doc)} title="Visualiser"
                                                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            </button>
                                            <button onClick={() => onDownload(doc.id, doc.nom_original)} title="Télécharger"
                                                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                    {doc.statut === 'refuse' && doc.constat && (
                                        <div className="px-5 pb-3" style={{ borderLeft: '3px solid #dc2626' }}>
                                            <div className="ml-7 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                                                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Constat client · </span>
                                                <span className="text-xs text-red-700">{doc.constat}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </>)}
        </>
    );
};

export default RevueDocuments;
