import Field from './Field';
import AppSelect from '../../../components/common/AppSelect';

const ROLES = ['admin', 'auditeur_senior', 'auditeur_junior', 'client'];

const ROLE_CONFIG = {
    admin:           { label: 'Administrateur'  },
    auditeur_senior: { label: 'Auditeur Senior' },
    auditeur_junior: { label: 'Auditeur Junior' },
    client:          { label: 'Client'           },
};

const inputCls = 'w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 transition';

const UserFormModal = ({ form, setF, editingId, submitting, entites, onSubmit, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                    <h2 className="text-base font-semibold text-gray-900">
                        {editingId ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
                    </h2>
                    {!editingId && (
                        <p className="text-xs text-gray-400 mt-0.5">Les identifiants seront envoyés par email automatiquement.</p>
                    )}
                </div>
                <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Prénom" required>
                        <input type="text" required value={form.prenom} onChange={e => setF('prenom', e.target.value)} placeholder="Prénom" className={inputCls} />
                    </Field>
                    <Field label="Nom" required>
                        <input type="text" required value={form.nom} onChange={e => setF('nom', e.target.value)} placeholder="Nom" className={inputCls} />
                    </Field>
                </div>

                {!editingId && (
                    <Field label="Email" required>
                        <input type="email" required value={form.email} onChange={e => setF('email', e.target.value)} placeholder="prenom.nom@organisation.ma" className={inputCls} />
                    </Field>
                )}

                <Field label="Rôle" required>
                    <AppSelect
                        value={form.role}
                        onChange={v => setF('role', v)}
                        options={ROLES.map(r => ({ value: r, label: ROLE_CONFIG[r].label }))}
                    />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                    <Field label="Organisation">
                        <input type="text" value={form.organisation} onChange={e => setF('organisation', e.target.value)} placeholder="Nom de l'organisation" className={inputCls} />
                    </Field>
                    <Field label="Téléphone">
                        <input type="text" value={form.telephone} onChange={e => setF('telephone', e.target.value)} placeholder="+212 6 00 00 00 00" className={inputCls} />
                    </Field>
                </div>

                {form.role === 'client' && (
                    <Field label="Entité auditée" required>
                        <AppSelect
                            value={form.entite_id}
                            onChange={v => setF('entite_id', v)}
                            options={[
                                { value: '', label: '— Sélectionner une entité —' },
                                ...entites.map(e => ({ value: e.id, label: e.nom }))
                            ]}
                        />
                    </Field>
                )}

                {editingId && (
                    <div className="flex items-center gap-3 py-1">
                        <button type="button" onClick={() => setF('actif', !form.actif)}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.actif ? 'bg-green-500' : 'bg-gray-300'}`}>
                            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${form.actif ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                        <span className="text-sm text-gray-700">Compte {form.actif ? 'actif' : 'inactif'}</span>
                    </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button type="submit" disabled={submitting}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-xl disabled:opacity-60 transition hover:opacity-90"
                        style={{ backgroundColor: 'var(--brand-red)' }}>
                        {submitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {editingId ? 'Enregistrer' : 'Créer et envoyer'}
                    </button>
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    </div>
);

export default UserFormModal;
