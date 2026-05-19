import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ISO_INDICATEURS_DEF } from './auditConstants';
import { TabInfo } from './AuditBadges';

const TabIndicateursISO = ({ referentiel, soaMap, localEvals, indicateurs, setIndicateurs, onSave, saving, readOnly }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newValeur, setNewValeur] = useState('');
    const [newUnite, setNewUnite] = useState('');
    const [contextMenu, setContextMenu] = useState(null); // { id, x, y }
    const [editItem, setEditItem] = useState(null);       // { id, label, valeur, unite }

    const set = (k, v) => setIndicateurs(prev => ({ ...prev, [k]: v }));
    const customList = indicateurs.custom || [];

    const allMesures = referentiel?.domaines?.flatMap(d => d.objectifs?.flatMap(o => o.mesures ?? []) ?? []) ?? [];
    const applicable = allMesures.filter(m => soaMap[m.id]?.applicable === true);
    const ncCount = applicable.filter(m => localEvals[m.id]?.niveau_maturite === 0).length;
    const confCount = applicable.filter(m => localEvals[m.id]?.niveau_maturite === 5).length;
    const implCount = allMesures.filter(m => ['implemente', 'partiel', 'planifie'].includes(soaMap[m.id]?.statut_implementation)).length;

    const getAutoValue = (key) => {
        if (!applicable.length) return '—';
        if (key === 'iso_taux_nc') return `${Math.round(ncCount / applicable.length * 100)}%`;
        if (key === 'iso_taux_conf') return `${Math.round(confCount / applicable.length * 100)}%`;
        if (key === 'iso_taux_impl') return allMesures.length > 0 ? `${Math.round(implCount / allMesures.length * 100)}%` : '—';
        return '—';
    };

    const addCustom = () => {
        if (!newLabel.trim()) return;
        const item = { id: `c_${Date.now()}`, label: newLabel.trim(), valeur: newValeur, unite: newUnite.trim() };
        setIndicateurs(prev => ({ ...prev, custom: [...(prev.custom || []), item] }));
        setNewLabel(''); setNewValeur(''); setNewUnite('');
        setShowAddForm(false);
    };

    const deleteCustom = (id) => {
        setIndicateurs(prev => ({ ...prev, custom: (prev.custom || []).filter(c => c.id !== id) }));
        setContextMenu(null);
    };

    const saveEdit = () => {
        if (!editItem) return;
        setIndicateurs(prev => ({ ...prev, custom: (prev.custom || []).map(c => c.id === editItem.id ? { ...editItem } : c) }));
        setEditItem(null);
    };

    const handleContextMenu = (e, c) => {
        if (readOnly) return;
        e.preventDefault();
        setContextMenu({ id: c.id, x: e.clientX, y: e.clientY });
    };

    useEffect(() => {
        if (!contextMenu) return;
        const close = () => setContextMenu(null);
        window.addEventListener('click', close);
        return () => window.removeEventListener('click', close);
    }, [contextMenu]);

    return (
        <div className="space-y-4">
            <TabInfo text="Indicateurs de performance du Système de Management de la Sécurité de l'Information (SMSI) selon ISO 27001:2022. Les indicateurs marqués « Auto » sont calculés depuis l'évaluation et la SoA." />
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                <div>
                    <h2 className="text-sm font-semibold text-gray-800 mb-1">Indicateurs SMSI</h2>
                    <p className="text-xs text-gray-400">Indicateurs de pilotage de la sécurité de l'information</p>
                </div>

                {/* ── Indicateurs personnalisés ── */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-700">Indicateurs personnalisés</p>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{customList.length}</span>
                        </div>
                        {!readOnly && (
                            <button
                                onClick={() => { setShowAddForm(v => !v); setNewLabel(''); setNewValeur(''); setNewUnite(''); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white transition"
                                style={{ backgroundColor: 'var(--brand-red)' }}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Ajouter
                            </button>
                        )}
                    </div>

                    {/* Formulaire d'ajout */}
                    {showAddForm && !readOnly && (
                        <div className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-gray-300 bg-blue-50/40">
                            <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
                                placeholder="Libellé de l'indicateur" autoFocus
                                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2"
                                style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                                onKeyDown={e => e.key === 'Enter' && addCustom()} />
                            <input type="text" value={newValeur} onChange={e => setNewValeur(e.target.value)}
                                placeholder="Valeur"
                                className="w-24 text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white text-right focus:outline-none focus:ring-2"
                                style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                                onKeyDown={e => e.key === 'Enter' && addCustom()} />
                            <input type="text" value={newUnite} onChange={e => setNewUnite(e.target.value)}
                                placeholder="Unité"
                                className="w-20 text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2"
                                style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                                onKeyDown={e => e.key === 'Enter' && addCustom()} />
                            <button onClick={addCustom} disabled={!newLabel.trim()}
                                className="px-3 py-1.5 rounded-xl text-xs font-medium text-white disabled:opacity-40"
                                style={{ backgroundColor: 'var(--brand-red)' }}>
                                Confirmer
                            </button>
                            <button onClick={() => setShowAddForm(false)}
                                className="px-3 py-1.5 rounded-xl text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200">
                                Annuler
                            </button>
                        </div>
                    )}

                    {/* Liste */}
                    {customList.length > 0 ? (
                        <div className="space-y-0">
                            {!readOnly && <p className="text-[10px] text-gray-400 italic px-1 mb-1">Clic droit sur un indicateur pour le modifier ou supprimer</p>}
                            {customList.map(c => (
                                <div
                                    key={c.id}
                                    onContextMenu={e => handleContextMenu(e, c)}
                                    className={`flex items-center gap-4 py-2.5 border-b border-gray-50 last:border-0 ${!readOnly ? 'cursor-context-menu select-none hover:bg-gray-50/60 rounded-xl px-2 -mx-2' : ''}`}
                                >
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700">{c.label}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {c.valeur ? (
                                            <span className="text-sm font-semibold text-gray-800">{c.valeur}</span>
                                        ) : (
                                            <span className="text-sm text-gray-400">—</span>
                                        )}
                                        {c.unite && <span className="text-xs text-gray-400">{c.unite}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        !showAddForm && <p className="text-xs text-gray-400 italic px-1">Aucun indicateur personnalisé.{!readOnly && ' Cliquez sur « Ajouter » pour en créer.'}</p>
                    )}
                </div>

                {/* ── Indicateurs prédéfinis ── */}
                <div className="space-y-3">
                    {ISO_INDICATEURS_DEF.map(({ key, label, unit, auto }) => {
                        const autoVal = auto ? getAutoValue(key) : null;
                        return (
                            <div key={key} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700">{label}</p>
                                    {auto && <p className="text-xs text-gray-400 mt-0.5">Calculé automatiquement</p>}
                                </div>
                                {auto ? (
                                    <div className="w-40 px-3 py-2 text-sm font-semibold text-center rounded-xl" style={{ backgroundColor: 'var(--brand-red-light)', color: 'var(--brand-red)' }}>
                                        {autoVal}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 w-48">
                                        <input
                                            type="number"
                                            value={indicateurs[key] || ''}
                                            onChange={e => !readOnly && set(key, e.target.value)}
                                            readOnly={readOnly}
                                            placeholder="—"
                                            className={`w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 text-right ${readOnly ? 'bg-gray-50 text-gray-600 cursor-default' : ''}`}
                                            style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                                        />
                                        {unit && <span className="text-xs text-gray-400 flex-shrink-0">{unit}</span>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Bouton sauvegarde */}
                {!readOnly && (
                    <div className="flex justify-end pt-2 border-t border-gray-100">
                        <button onClick={onSave} disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-xl disabled:opacity-60"
                            style={{ backgroundColor: 'var(--brand-red)' }}>
                            {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            Enregistrer les indicateurs
                        </button>
                    </div>
                )}
            </div>

            {/* ── Menu contextuel ── */}
            {contextMenu && createPortal(
                <div
                    style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 9999 }}
                    className="bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[140px]"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={() => { const item = customList.find(c => c.id === contextMenu.id); setEditItem({ ...item }); setContextMenu(null); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                        </svg>
                        Modifier
                    </button>
                    <button
                        onClick={() => deleteCustom(contextMenu.id)}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Supprimer
                    </button>
                </div>,
                document.body
            )}

            {/* ── Modal modification ── */}
            {editItem && createPortal(
                <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/30"
                    onClick={() => setEditItem(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4"
                        onClick={e => e.stopPropagation()}>
                        <h3 className="text-sm font-semibold text-gray-800">Modifier l'indicateur</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Libellé</label>
                                <input type="text" value={editItem.label}
                                    onChange={e => setEditItem(prev => ({ ...prev, label: e.target.value }))}
                                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2"
                                    style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }} autoFocus />
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 mb-1 block">Valeur</label>
                                    <input type="text" value={editItem.valeur}
                                        onChange={e => setEditItem(prev => ({ ...prev, valeur: e.target.value }))}
                                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 text-right"
                                        style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }} />
                                </div>
                                <div className="w-28">
                                    <label className="text-xs text-gray-500 mb-1 block">Unité</label>
                                    <input type="text" value={editItem.unite}
                                        onChange={e => setEditItem(prev => ({ ...prev, unite: e.target.value }))}
                                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2"
                                        style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }} />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setEditItem(null)}
                                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                                Annuler
                            </button>
                            <button onClick={saveEdit} disabled={!editItem.label.trim()}
                                className="px-4 py-2 text-sm font-medium text-white rounded-xl disabled:opacity-40"
                                style={{ backgroundColor: 'var(--brand-red)' }}>
                                Enregistrer
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default TabIndicateursISO;
