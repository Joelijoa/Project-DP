const ResultatsEmptyState = ({ audits, loadingList }) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex flex-col items-center pt-10 pb-6 px-8 border-b border-gray-100">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="mb-4">
                <circle cx="36" cy="36" r="34" fill="#fef2f2" stroke="#fecaca" strokeWidth="1.5" />
                {[8, 16, 24].map(r => (
                    <circle key={r} cx="36" cy="36" r={r} fill="none" stroke="#fecaca" strokeWidth="1" strokeDasharray="3 2" />
                ))}
                {[0,1,2,3,4,5].map(i => {
                    const a = (2 * Math.PI * i / 6) - Math.PI / 2;
                    return <line key={i} x1={36} y1={36} x2={(36 + 28 * Math.cos(a)).toFixed(1)} y2={(36 + 28 * Math.sin(a)).toFixed(1)} stroke="#fca5a5" strokeWidth="1" />;
                })}
                <polygon
                    points={[0,1,2,3,4,5].map(i => {
                        const a = (2 * Math.PI * i / 6) - Math.PI / 2;
                        const r = [18, 12, 20, 15, 22, 10][i];
                        return `${(36 + r * Math.cos(a)).toFixed(1)},${(36 + r * Math.sin(a)).toFixed(1)}`;
                    }).join(' ')}
                    fill="rgba(204,0,0,0.12)" stroke="#CC0000" strokeWidth="1.5"
                />
                <circle cx="36" cy="36" r="3" fill="#CC0000" />
            </svg>
            <h2 className="text-base font-semibold text-gray-800 mb-1">Sélectionnez un audit à analyser</h2>
            <p className="text-sm text-gray-500 text-center max-w-md">
                Choisissez un audit dans la liste ci-dessus pour afficher ses graphiques de résultats : rosace de maturité, répartition de conformité, scores par domaine et analyse détaillée.
            </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
            {[
                {
                    icon: (
                        <svg width="36" height="36" viewBox="0 0 36 36">
                            <polygon points={[0,1,2,3,4].map(i => { const a=(2*Math.PI*i/5)-Math.PI/2; const r=[14,9,13,8,12][i]; return `${(18+r*Math.cos(a)).toFixed(1)},${(18+r*Math.sin(a)).toFixed(1)}`; }).join(' ')} fill="rgba(204,0,0,0.15)" stroke="#CC0000" strokeWidth="1.5" />
                            {[0,1,2,3,4].map(i => { const a=(2*Math.PI*i/5)-Math.PI/2; return <line key={i} x1={18} y1={18} x2={(18+16*Math.cos(a)).toFixed(1)} y2={(18+16*Math.sin(a)).toFixed(1)} stroke="#e5e7eb" strokeWidth="1" />; })}
                        </svg>
                    ),
                    title: 'Rosace de maturité',
                    desc: 'Vue radar DNSSI — scores par domaine avec cible niveau 3 (non applicable ISO 27001)',
                },
                {
                    icon: (
                        <svg width="36" height="36" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="13" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                            <circle cx="18" cy="18" r="13" fill="none" stroke="#16a34a" strokeWidth="6" strokeDasharray="25 57" strokeDashoffset="20.4" />
                            <circle cx="18" cy="18" r="13" fill="none" stroke="#d97706" strokeWidth="6" strokeDasharray="15 57" strokeDashoffset="-4.6" />
                            <circle cx="18" cy="18" r="13" fill="none" stroke="#CC0000" strokeWidth="6" strokeDasharray="17 57" strokeDashoffset="-19.6" />
                        </svg>
                    ),
                    title: 'Répartition conformité',
                    desc: 'Donut : Conformes / Partiels / Non conformes / N/A',
                },
                {
                    icon: (
                        <svg width="36" height="36" viewBox="0 0 36 36">
                            {[0,1,2,3].map((i) => (
                                <g key={i}>
                                    <rect x={4} y={6+i*7} width={28} height={5} rx={2} fill="#f3f4f6" />
                                    <rect x={4} y={6+i*7} width={[18,12,22,8][i]} height={5} rx={2} fill={['#16a34a','#d97706','#CC0000','#16a34a'][i]} />
                                </g>
                            ))}
                        </svg>
                    ),
                    title: 'Barres par domaine',
                    desc: 'Répartition empilée Conformes / Partiels / NC par domaine',
                },
                {
                    icon: (
                        <svg width="36" height="36" viewBox="0 0 36 36">
                            <path d="M4,28 A14,14 0 0,1 32,28" fill="none" stroke="#e5e7eb" strokeWidth="5" strokeLinecap="round" />
                            <path d="M4,28 A14,14 0 0,1 24,10" fill="none" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" />
                            <line x1="18" y1="28" x2="26" y2="13" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="18" cy="28" r="3" fill="#111827" />
                        </svg>
                    ),
                    title: 'Jauge score global',
                    desc: 'Score moyen de maturité sur une jauge 0-5',
                },
            ].map((g, i) => (
                <div key={i} className="flex flex-col items-center gap-2 px-4 py-5 text-center">
                    <div className="w-10 h-10 flex items-center justify-center">{g.icon}</div>
                    <p className="text-xs font-semibold text-gray-700">{g.title}</p>
                    <p className="text-[10px] text-gray-400 leading-relaxed">{g.desc}</p>
                </div>
            ))}
        </div>

        {!loadingList && audits.length === 0 && (
            <div className="px-6 py-4 bg-yellow-50 border-t border-yellow-100">
                <p className="text-xs text-yellow-700 text-center">
                    Aucun audit trouvé. Créez d'abord un audit et complétez son évaluation.
                </p>
            </div>
        )}
    </div>
);

export default ResultatsEmptyState;
