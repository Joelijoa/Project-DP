import { useState, useRef } from 'react';
import { PREVIEWABLE } from './auditConstants';
import { fileIcon, fmtSize } from './auditHelpers';

const DocSubList = ({ docs, canUpload, uploading, currentUserId, isSeniorOrAdmin, onUpload, onDelete, onDownload, onReplace, setPreview, accentColor }) => {
    const inputRef = useRef(null);
    const replaceRef = useRef(null);
    const [replacingId, setReplacingId] = useState(null);
    const [dragging, setDragging] = useState(false);
    const colors = {
        orange: { border: 'border-orange-300', bg: 'bg-orange-50', hover: 'hover:border-orange-300 hover:bg-orange-50/40', text: 'text-orange-500', pulse: 'text-orange-600' },
        blue: { border: 'border-blue-300', bg: 'bg-blue-50', hover: 'hover:border-blue-300 hover:bg-blue-50/40', text: 'text-blue-500', pulse: 'text-blue-600' },
    };
    const c = colors[accentColor] || colors.blue;
    return (
        <div className="space-y-2">
            {canUpload && (
                <>
                    <div
                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={e => { e.preventDefault(); setDragging(false); onUpload(e.dataTransfer.files); }}
                        onClick={() => !uploading && inputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging ? `${c.border} ${c.bg}` : `border-gray-200 ${c.hover}`}`}
                    >
                        {uploading ? <p className={`text-sm font-medium animate-pulse ${c.pulse}`}>Dépôt en cours…</p> : (
                            <>
                                <svg className={`w-8 h-8 mx-auto mb-2 ${c.text} opacity-60`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                                <p className="text-sm font-semibold text-gray-700">Glissez vos fichiers ici</p>
                                <p className={`text-xs mt-1 ${c.text} font-medium`}>ou cliquez pour sélectionner</p>
                                <p className="text-xs text-gray-300 mt-2">PDF · Word · Excel · Image — 10 Mo max</p>
                            </>
                        )}
                    </div>
                    <input ref={inputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                        className="hidden" onChange={e => { onUpload(e.target.files); e.target.value = ''; }} />
                </>
            )}
            {docs.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Aucun document déposé.</p>
            ) : (
                <>
                    <input ref={replaceRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                        className="hidden" onChange={e => { if (replacingId) { onReplace(replacingId, e.target.files); setReplacingId(null); } e.target.value = ''; }} />
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
                        {docs.map(doc => {
                            const canDelete = isSeniorOrAdmin || doc.uploaded_by === currentUserId;
                            const isRefused = doc.statut === 'refuse';
                            return (
                                <div key={doc.id} className={`px-4 py-3 ${isRefused ? 'bg-red-50/40' : ''}`}>
                                    {/* Constat refus visible pour le client */}
                                    {isRefused && doc.constat && (
                                        <div className="flex items-start gap-1.5 mb-2 p-2 rounded-xl bg-red-50 border border-red-100">
                                            <svg className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                                            <div>
                                                <p className="text-xs font-semibold text-red-700">Document refusé</p>
                                                <p className="text-xs text-red-600 mt-0.5">{doc.constat}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg flex-shrink-0">{fileIcon(doc.type_mime)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{doc.nom_original}</p>
                                            <p className="text-xs text-gray-400">{fmtSize(doc.taille)} · {new Date(doc.createdAt).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            {isRefused && onReplace && (
                                                <button
                                                    onClick={() => { setReplacingId(doc.id); replaceRef.current?.click(); }}
                                                    disabled={uploading}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition"
                                                    title="Déposer une correction"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                                    Corriger
                                                </button>
                                            )}
                                            <button onClick={() => PREVIEWABLE.includes(doc.type_mime) ? setPreview({ id: doc.id, nom: doc.nom_original, mime: doc.type_mime, taille: doc.taille }) : onDownload(doc.id, doc.nom_original)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition" title={PREVIEWABLE.includes(doc.type_mime) ? 'Visualiser' : 'Télécharger'}>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            </button>
                                            <button onClick={() => onDownload(doc.id, doc.nom_original)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition" title="Télécharger">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                            </button>
                                            {canDelete && onDelete && !isRefused && (
                                                <button onClick={() => onDelete(doc.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition" title="Supprimer">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default DocSubList;
