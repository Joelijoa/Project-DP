import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { INDICATEURS_DEF } from './auditConstants';
import { TabInfo } from './AuditBadges';

const TabIndicateurs = ({ indicateurs, setIndicateurs, synthese, onSave, saving, readOnly }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newValeur, setNewValeur] = useState('');
    const [newUnite, setNewUnite] = useState('');
    // contextMenu: { type: 'predefined'|'custom', key?, id?, x, y }
    const [contextMenu, setContextMenu] = useState(null);
    const [editItem, setEditItem] = useState(null); // { type, id?, key?, label, unite }

    const set = (k, v) => setIndicateurs(prev => ({ ...prev, [k]: v }));
    const customList = indicateurs.custom || [];
    const hiddenKeys = indicateurs.hidden || [];
    const overrides = indicateurs.overrides || {};
    const visibleDef = INDICATEURS_DEF.filter(d => !hiddenKeys.includes(d.key));

    const setCustomField = (id, field, value) =>
        setIndicateurs(prev => ({ ...prev, custom: (prev.custom || []).map(c => c.id === id ? { ...c, [field]: value } : c) }));

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

    const hidePredefined = (key) => {
        setIndicateurs(prev => ({ ...prev, hidden: [...(prev.hidden || []), key] }));
        setContextMenu(null);
    };

    const saveEdit = () => {
        if (!editItem) return;
        if (editItem.type === 'custom') {
            setIndicateurs(prev => ({ ...prev, custom: (prev.custom || []).map(c => c.id === editItem.id ? { ...c, label: editItem.label, unite: editItem.unite } : c) }));
        } else {
            setIndicateurs(prev => ({ ...prev, overrides: { ...(prev.overrides || {}), [editItem.key]: editItem.label } }));
        }
        setEditItem(null);
    };

    const openContextMenu = (e, payload) => {
        if (readOnly) return;
        e.preventDefault();
        e.stopPropagation();
        const x = Math.min(e.clientX, window.innerWidth - 170);
        const y = Math.min(e.clientY, window.innerHeight - 90);
        setContextMenu({ ...payload, x, y });
    };

    useEffect(() => {
        if (!contextMenu) return;
        const close = () => setContextMenu(null);
        const timer = setTimeout(() => window.addEventListener('click', close), 100);
        return () => { clearTimeout(timer); window.removeEventListener('click', close); };
    }, [contextMenu]);

    const getAutoValue = (key) => {
        if (key === 'taux_organisation_ssi') {
            const org = synthese.find(d => d.nom?.toLowerCase().includes('organisation') || d.code?.includes('ORG') || d.code === '2');
            return org ? `${org.tauxConformite}%` : '—';
        }
        if (key === 'taux_actifs_info') {
            const actif = synthese.find(d => d.nom?.toLowerCase().includes('actif') || d.code === '4');
            return actif ? `${actif.tauxConformite}%` : '—';
        }
        return null;
    };

    return (
        <div className="space-y-4">
            <TabInfo text="Les indicateurs de la SSI énumérés dans ce document sont donnés à titre indicatif. Ils peuvent être complétés par l'entité ou l'IIV. Ces indicateurs permettent aux responsables des entités et des IIV de définir les axes de progrès et de s'inscrire dans un processus d'amélioration continue." />
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-800 mb-1">6. Indicateurs de la SSI</h2>
                        <p className="text-xs text-gray-400">Liste non exhaustive d'indicateurs de performance de la sécurité des SI</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        {!readOnly && (
                            <button
                                onClick={() => { setShowAddForm(v => !v); setNewLabel(''); setNewValeur(''); setNewUnite(''); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white transition flex-shrink-0"
                                style={{ backgroundColor: 'var(--brand-red)' }}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Ajouter un indicateur
                            </button>
                        )}
                        {!readOnly && (
                            <span className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
                                </svg>
                                Clic droit sur un indicateur pour modifier ou supprimer
                            </span>
                        )}
                    </div>
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

                {/* Liste complète */}
                <div className="space-y-0">
                    {/* Prédéfinis visibles */}
                    {visibleDef.map(({ key, label, unit, auto }) => {
                        const autoVal = auto ? getAutoValue(key) : null;
                        const displayLabel = overrides[key] || label;
                        return (
                            <div
                                key={key}
                                onContextMenu={!auto ? e => openContextMenu(e, { type: 'predefined', key }) : undefined}
                                className={`flex items-center gap-4 py-2.5 border-b border-gray-50 last:border-0 ${!auto && !readOnly ? 'cursor-context-menu' : ''}`}
                            >
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700 select-none">{displayLabel}</p>
                                    {auto && <p className="text-xs text-gray-400 mt-0.5">Calculé automatiquement depuis la synthèse</p>}
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
                                            onContextMenu={!readOnly ? e => openContextMenu(e, { type: 'predefined', key }) : undefined}
                                            readOnly={readOnly}
                                            placeholder="—"
                                            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 text-right read-only:bg-gray-50 read-only:text-gray-600"
                                            style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                                        />
                                        {unit && <span className="text-xs text-gray-400 flex-shrink-0 select-none">{unit}</span>}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Personnalisés */}
                    {customList.map(c => (
                        <div
                            key={c.id}
                            onContextMenu={e => openContextMenu(e, { type: 'custom', id: c.id })}
                            className={`flex items-center gap-4 py-2.5 border-b border-gray-50 last:border-0 ${!readOnly ? 'cursor-context-menu' : ''}`}
                        >
                            <div className="flex-1">
                                <p className="text-sm text-gray-700 select-none">{c.label}</p>
                            </div>
                            <div className="flex items-center gap-2 w-48">
                                <input
                                    type="text"
                                    value={c.valeur}
                                    onChange={e => !readOnly && setCustomField(c.id, 'valeur', e.target.value)}
                                    onContextMenu={e => openContextMenu(e, { type: 'custom', id: c.id })}
                                    readOnly={readOnly}
                                    placeholder="—"
                                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 text-right read-only:bg-gray-50 read-only:text-gray-600"
                                    style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                                />
                                {c.unite && <span className="text-xs text-gray-400 flex-shrink-0 select-none">{c.unite}</span>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bouton sauvegarde */}
                {!readOnly && (
                    <div className="flex justify-end pt-2 border-t border-gray-100">
                        <button onClick={onSave} disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-xl transition disabled:opacity-60"
                            style={{ backgroundColor: 'var(--brand-red)' }}>
                            {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            Enregistrer les indicateurs
                        </button>
                    </div>
                )}
            </div>

            {/* Menu contextuel */}
            {contextMenu && createPortal(
                <div
                    style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 9999 }}
                    className="bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[150px]"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={() => {
                            if (contextMenu.type === 'custom') {
                                const item = customList.find(c => c.id === contextMenu.id);
                                setEditItem({ type: 'custom', id: item.id, label: item.label, unite: item.unite });
                            } else {
                                const def = INDICATEURS_DEF.find(d => d.key === contextMenu.key);
                                setEditItem({ type: 'predefined', key: contextMenu.key, label: overrides[contextMenu.key] || def?.label || '', unite: '' });
                            }
                            setContextMenu(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                        </svg>
                        Modifier
                    </button>
                    <button
                        onClick={() => contextMenu.type === 'custom' ? deleteCustom(contextMenu.id) : hidePredefined(contextMenu.key)}
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

            {/* Modal modification (custom seulement — nom + unité) */}
            {editItem && createPortal(
                <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/30"
                    onClick={() => setEditItem(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4"
                        onClick={e => e.stopPropagation()}>
                        <h3 className="text-sm font-semibold text-gray-800">Modifier l'indicateur</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Nom de l'indicateur</label>
                                <input type="text" value={editItem.label}
                                    onChange={e => setEditItem(prev => ({ ...prev, label: e.target.value }))}
                                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2"
                                    style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }} autoFocus />
                            </div>
                            {editItem.type === 'custom' && (
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Unité</label>
                                    <input type="text" value={editItem.unite}
                                        onChange={e => setEditItem(prev => ({ ...prev, unite: e.target.value }))}
                                        placeholder="ex : %, /an, ..."
                                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2"
                                        style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }} />
                                </div>
                            )}
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

export default TabIndicateurs;
