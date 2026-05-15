import { useState, useEffect } from 'react';
import { PREVIEWABLE } from './auditConstants';
import { fileIcon, fmtSize } from './auditHelpers';

const DocumentPreviewModal = ({ doc, onClose, onFetchBlob, onDownload }) => {
    const [blobUrl, setBlobUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const canPreview = PREVIEWABLE.includes(doc.mime);
    const isImage = doc.mime?.startsWith('image/');

    useEffect(() => {
        let url = null;
        if (!canPreview) { setLoading(false); return; }
        onFetchBlob(doc.id)
            .then(blob => {
                url = URL.createObjectURL(new Blob([blob], { type: doc.mime }));
                setBlobUrl(url);
            })
            .catch(() => setFetchError(true))
            .finally(() => setLoading(false));
        return () => { if (url) URL.revokeObjectURL(url); };
    }, [doc.id]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden" style={{ height: '85vh' }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl flex-shrink-0">{fileIcon(doc.mime)}</span>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{doc.nom}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{fmtSize(doc.taille)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <button onClick={() => onDownload(doc.id, doc.nom)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                            Télécharger
                        </button>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
                {/* Body */}
                <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-4">
                    {loading && <p className="text-gray-400 text-sm animate-pulse">Chargement…</p>}
                    {!loading && fetchError && (
                        <div className="text-center">
                            <svg className="w-12 h-12 text-red-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                            <p className="text-gray-700 font-medium mb-1">Impossible de charger l'aperçu</p>
                            <p className="text-gray-400 text-sm mb-5">Le fichier est peut-être indisponible sur le serveur.</p>
                            <button onClick={() => onDownload(doc.id, doc.nom)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition hover:opacity-90"
                                style={{ backgroundColor: 'var(--brand-red)' }}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                Télécharger quand même
                            </button>
                        </div>
                    )}
                    {!loading && !fetchError && blobUrl && isImage && (
                        <img src={blobUrl} alt={doc.nom} className="max-w-full max-h-full object-contain rounded shadow" />
                    )}
                    {!loading && !fetchError && blobUrl && !isImage && (
                        <iframe src={blobUrl} title={doc.nom} className="w-full h-full rounded" style={{ border: 'none', minHeight: '400px' }} />
                    )}
                    {!loading && !fetchError && !canPreview && (
                        <div className="text-center">
                            <span className="text-6xl block mb-5">{fileIcon(doc.mime)}</span>
                            <p className="text-gray-700 font-medium mb-2">{doc.nom}</p>
                            <p className="text-gray-400 text-sm mb-6">Aperçu non disponible pour ce format.</p>
                            <button onClick={() => onDownload(doc.id, doc.nom)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition hover:opacity-90"
                                style={{ backgroundColor: 'var(--brand-red)' }}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                Télécharger
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentPreviewModal;
