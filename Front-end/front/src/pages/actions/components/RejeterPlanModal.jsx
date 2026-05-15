import { useState } from 'react';

const RejeterPlanModal = ({ onConfirm, onCancel }) => {
    const [commentaire, setCommentaire] = useState('');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Rejeter le plan d'action</h3>
                <p className="text-sm text-gray-500 mb-4">Ce commentaire sera visible par les auditeurs concernés.</p>
                <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)}
                    rows={4} placeholder="Motif du rejet..."
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1"
                    autoFocus />
                <div className="flex gap-2 mt-4">
                    <button onClick={() => commentaire.trim() && onConfirm(commentaire.trim())}
                        disabled={!commentaire.trim()}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
                        style={{ backgroundColor: '#cc0000' }}>
                        Confirmer le rejet
                    </button>
                    <button onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RejeterPlanModal;
