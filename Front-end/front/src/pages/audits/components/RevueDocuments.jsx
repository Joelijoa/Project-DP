import { useState, useRef, useEffect } from 'react';
import { PREVIEWABLE } from './auditConstants';
import { fileIcon, fmtSize } from './auditHelpers';
import DocumentPreviewModal from './DocumentPreviewModal';

const RevueDocuments = ({ documents, isClient, onDownload, onFetchBlob, onSaveCommentaire }) => {
    const [preview, setPreview] = useState(null);
    const [docTab, setDocTab] = useState(isClient ? 'mesdocs' : 'client');
    const [selectedDocId, setSelectedDocId] = useState(null);
    const [commentMap, setCommentMap] = useState({});
    const [savingId, setSavingId] = useState(null);

    const docsClient = documents.filter(d => d.uploader?.role === 'client');
    const docsAuditeurs = documents.filter(d => d.uploader?.role !== 'client');

    // Pre-fill commentMap when documents load
    useEffect(() => {
        const initial = {};
        documents.forEach(d => { if (d.commentaire_entretien) initial[d.id] = d.commentaire_entretien; });
        setCommentMap(prev => ({ ...initial, ...prev }));
    }, [documents]);

    // Auto-select first doc when tab changes
    useEffect(() => {
        const list = docTab === 'client' ? docsClient : docsAuditeurs;
        if (list.length > 0) setSelectedDocId(list[0].id);
        else setSelectedDocId(null);
    }, [docTab, documents]);

    const handleConsulter = (doc) => {
        if (PREVIEWABLE.includes(doc.type_mime)) {
            setPreview({ id: doc.id, nom: doc.nom_original, mime: doc.type_mime, taille: doc.taille });
        } else {
            onDownload(doc.id, doc.nom_original);
        }
    };

    const handleSave = async (docId) => {
        setSavingId(docId);
        try {
            await onSaveCommentaire(docId, commentMap[docId] ?? '');
        } finally {
            setSavingId(null);
        }
    };

    const selectedDoc = documents.find(d => d.id === selectedDocId);
    const currentComment = selectedDocId !== null ? (commentMap[selectedDocId] ?? '') : '';
    const savedComment = selectedDoc?.commentaire_entretien ?? '';
    const isDirty = selectedDoc && currentComment !== savedComment;

    const tabs = isClient
        ? [{ id: 'mesdocs', label: 'Mes documents', docs: docsClient }, { id: 'auditeur', label: 'Documents auditeur', docs: docsAuditeurs }]
        : [{ id: 'client', label: 'Documents client', docs: docsClient }, { id: 'auditeur', label: 'Mes dépôts', docs: docsAuditeurs }];

    const activeList = docTab === 'client' ? docsClient : docTab === 'mesdocs' ? docsClient : docsAuditeurs;

    const isReviewTab = docTab === 'client' || docTab === 'mesdocs';

    return (
        <>
            {preview && <DocumentPreviewModal doc={preview} onClose={() => setPreview(null)} onFetchBlob={onFetchBlob} onDownload={onDownload} />}

            {/* Onglets */}
            <div className="flex border-b border-gray-200 mb-4">
                {tabs.map(tab => {
                    const active = docTab === tab.id;
                    return (
                        <button key={tab.id} onClick={() => setDocTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${active ? 'border-current' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            style={active ? { color: 'var(--brand-red)', borderColor: 'var(--brand-red)' } : {}}>
                            {tab.label}
                            {tab.docs.length > 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                    {tab.docs.length}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Contenu onglet avec layout split */}
            {isReviewTab ? (
                activeList.length === 0 ? (
                    <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-500">Aucun document déposé</p>
                        <p className="text-xs text-gray-400 mt-1">Les documents apparaîtront ici une fois déposés</p>
                    </div>
                ) : (
                    <div className="flex gap-0 rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ minHeight: '460px' }}>

                        {/* ── Colonne gauche : liste des documents ── */}
                        <div className="w-72 flex-shrink-0 border-r border-gray-100 overflow-y-auto bg-white">
                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {activeList.length} document{activeList.length > 1 ? 's' : ''}
                                </p>
                            </div>
                            {activeList.map(doc => {
                                const isSelected = selectedDocId === doc.id;
                                const hasComment = !!(doc.commentaire_entretien);
                                return (
                                    <button
                                        key={doc.id}
                                        onClick={() => {
                                            setSelectedDocId(doc.id);
                                            setCommentMap(m => ({ ...m, [doc.id]: m[doc.id] !== undefined ? m[doc.id] : (doc.commentaire_entretien ?? '') }));
                                        }}
                                        className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-gray-50 transition ${isSelected ? 'bg-red-50/60' : 'hover:bg-gray-50'}`}
                                        style={isSelected ? { borderLeft: '3px solid var(--brand-red)' } : { borderLeft: '3px solid transparent' }}
                                    >
                                        <span className="text-lg flex-shrink-0 mt-0.5">{fileIcon(doc.type_mime)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-semibold truncate ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {doc.nom_original}
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">
                                                {fmtSize(doc.taille)} · {new Date(doc.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                            </p>
                                            {hasComment && (
                                                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                                                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
                                                    Commenté
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* ── Colonne droite : panneau commentaire ── */}
                        <div className="flex-1 bg-white overflow-y-auto">
                            {!selectedDoc ? (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                    Sélectionnez un document
                                </div>
                            ) : (
                                <div className="p-6 space-y-5">
                                    {/* En-tête document */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{fileIcon(selectedDoc.type_mime)}</span>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">{selectedDoc.nom_original}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {fmtSize(selectedDoc.taille)} · Déposé le {new Date(selectedDoc.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    {selectedDoc.uploader && ` par ${selectedDoc.uploader.prenom} ${selectedDoc.uploader.nom}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button onClick={() => handleConsulter(selectedDoc)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white hover:opacity-90 transition"
                                                style={{ backgroundColor: 'var(--brand-red)' }}>
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                Consulter
                                            </button>
                                            <button onClick={() => onDownload(selectedDoc.id, selectedDoc.nom_original)}
                                                className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition" title="Télécharger">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100" />

                                    {/* Zone commentaire */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                                            </svg>
                                            <p className="text-sm font-semibold text-gray-700">Points à évoquer lors des entretiens</p>
                                        </div>
                                        <p className="text-xs text-gray-400 mb-3">
                                            {isClient
                                                ? "Commentaires de l'auditeur sur ce document — ces points seront abordés lors des entretiens planifiés."
                                                : "Notez les points à discuter avec le client lors des entretiens. Ce commentaire sera visible par le client."}
                                        </p>
                                        {isClient ? (
                                            /* Client : lecture seule */
                                            currentComment ? (
                                                <div className="px-4 py-3 rounded-2xl bg-blue-50/60 border border-blue-100 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                    {currentComment}
                                                </div>
                                            ) : (
                                                <div className="px-4 py-4 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-sm text-gray-400 text-center">
                                                    Aucun commentaire pour ce document pour le moment.
                                                </div>
                                            )
                                        ) : (
                                            /* Auditeur : éditable */
                                            <div className="space-y-3">
                                                <textarea
                                                    value={currentComment}
                                                    onChange={e => setCommentMap(m => ({ ...m, [selectedDoc.id]: e.target.value }))}
                                                    rows={7}
                                                    placeholder="Ex : Vérifier la cohérence avec la politique de sécurité, demander la version signée, clarifier le périmètre couvert…"
                                                    className="w-full text-sm border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent resize-y"
                                                    style={{ '--tw-ring-color': 'var(--brand-red)' }}
                                                />
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs text-gray-400">
                                                        {isDirty && <span className="text-orange-500">— modifications non sauvegardées</span>}
                                                    </p>
                                                    <button
                                                        onClick={() => handleSave(selectedDoc.id)}
                                                        disabled={savingId === selectedDoc.id || !isDirty}
                                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50"
                                                        style={{ backgroundColor: 'var(--brand-red)' }}>
                                                        {savingId === selectedDoc.id
                                                            ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                                                        Sauvegarder
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            ) : (
                /* ── Onglet "Mes dépôts" / "Documents auditeur" — liste simple ── */
                docsAuditeurs.length === 0 ? (
                    <div className="py-10 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                        <p className="text-sm font-medium text-gray-500">Aucun document déposé</p>
                        <p className="text-xs text-gray-400 mt-1">Les documents apparaîtront ici une fois déposés</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                        {docsAuditeurs.map(doc => (
                            <div key={doc.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/40 transition">
                                <span className="text-base flex-shrink-0">{fileIcon(doc.type_mime)}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{doc.nom_original}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {fmtSize(doc.taille)} · {doc.uploader?.prenom} {doc.uploader?.nom} · {new Date(doc.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button onClick={() => handleConsulter(doc)}
                                        className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition" title="Consulter">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </button>
                                    <button onClick={() => onDownload(doc.id, doc.nom_original)}
                                        className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition" title="Télécharger">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </>
    );
};

export default RevueDocuments;
