import { stripPrefix } from './resultatsHelpers';

const BarresEmpilees = ({ synthese, isISO = false }) => {
    const maxTotal = Math.max(...synthese.map(d => d.total), 1);

    return (
        <div className="space-y-2.5">
            {synthese.map(d => {
                const conf  = d.total > 0 ? (d.conforme     / d.total) * 100 : 0;
                const part  = d.total > 0 ? (d.partiel      / d.total) * 100 : 0;
                const nc    = d.total > 0 ? (d.non_conforme / d.total) * 100 : 0;
                const naP   = d.total > 0 ? (d.na           / d.total) * 100 : 0;
                return (
                    <div key={d.id}>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className="shrink-0 text-[10px] font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>{d.code}</span>
                                <span className="text-xs text-gray-600 truncate max-w-[160px]">{stripPrefix(d.nom)}</span>
                            </div>
                            <span className="text-xs font-semibold text-gray-500 ml-2">{d.total}</span>
                        </div>
                        <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
                            {conf > 0  && <div style={{ width: `${conf}%`,  backgroundColor: '#16a34a' }} title={`Conformes: ${d.conforme}`} />}
                            {part > 0  && <div style={{ width: `${part}%`,  backgroundColor: '#d97706' }} title={`${isISO ? 'NC mineures' : 'Partiels'}: ${d.partiel}`} />}
                            {nc > 0    && <div style={{ width: `${nc}%`,    backgroundColor: '#CC0000' }} title={`${isISO ? 'NC majeures' : 'NC'}: ${d.non_conforme}`} />}
                            {naP > 0   && <div style={{ width: `${naP}%`,   backgroundColor: '#e5e7eb' }} title={`N/A: ${d.na}`} />}
                        </div>
                    </div>
                );
            })}
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2">
                {[
                    { color: '#16a34a', label: 'Conformes' },
                    { color: '#d97706', label: isISO ? 'NC mineures' : 'Partiels' },
                    { color: '#CC0000', label: isISO ? 'NC majeures' : 'Non conformes' },
                    { color: '#e5e7eb', label: 'N/A', border: true },
                ].map(l => (
                    <span key={l.label} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color, border: l.border ? '1px solid #d1d5db' : 'none' }} />
                        {l.label}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default BarresEmpilees;
