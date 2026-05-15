import { useState } from 'react';
import DocumentPreviewModal from './DocumentPreviewModal';
import DocSubList from './DocSubList';

const DepotDocuments = ({ documents, auditeursIds = [], uploading, currentUserId, isSeniorOrAdmin, isClient, onUpload, onDelete, onDownload, onFetchBlob, onReplace }) => {
    const [preview, setPreview] = useState(null);

    const docsClient = documents.filter(d => d.uploader?.role === 'client');
    const docsAuditeurs = documents.filter(d => d.uploader?.role !== 'client');

    return (
        <>
            {preview && <DocumentPreviewModal doc={preview} onClose={() => setPreview(null)} onFetchBlob={onFetchBlob} onDownload={onDownload} />}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Section client */}
                <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border-b border-orange-100">
                        <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                        <span className="text-sm font-semibold text-orange-800">Documents du client</span>
                        {docsClient.length > 0 && <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-orange-200 text-orange-700">{docsClient.length}</span>}
                    </div>
                    <div className="p-4">
                        <DocSubList
                            docs={docsClient}
                            canUpload={isClient}
                            uploading={uploading}
                            currentUserId={currentUserId}
                            isSeniorOrAdmin={isSeniorOrAdmin}
                            onUpload={onUpload}
                            onDelete={onDelete}
                            onDownload={onDownload}
                            onReplace={isClient ? onReplace : null}
                            setPreview={setPreview}
                            accentColor="orange"
                        />
                    </div>
                </div>

                {/* Section auditeurs */}
                <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border-b border-blue-100">
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                        <span className="text-sm font-semibold text-blue-800">Documents des auditeurs</span>
                        {docsAuditeurs.length > 0 && <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-blue-200 text-blue-700">{docsAuditeurs.length}</span>}
                    </div>
                    <div className="p-4">
                        <DocSubList
                            docs={docsAuditeurs}
                            canUpload={!isClient}
                            uploading={uploading}
                            currentUserId={currentUserId}
                            isSeniorOrAdmin={isSeniorOrAdmin}
                            onUpload={onUpload}
                            onDelete={onDelete}
                            onDownload={onDownload}
                            setPreview={setPreview}
                            accentColor="blue"
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default DepotDocuments;
