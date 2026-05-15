const DonutConformite = ({ conforme, partiel, non_conforme, na, isISO = false }) => {
    const total = conforme + partiel + non_conforme + na;
    if (total === 0) return null;

    const segments = [
        { value: conforme,     color: '#16a34a', label: 'Conformes' },
        { value: partiel,      color: '#d97706', label: isISO ? 'NC mineures' : 'Partiels' },
        { value: non_conforme, color: '#CC0000', label: isISO ? 'NC majeures' : 'Non conformes' },
        { value: na,           color: '#d1d5db', label: 'N/A' },
    ];

    const cx = 80, cy = 80, r = 60, sw = 22;
    const circ = 2 * Math.PI * r;

    let offset = 0;
    const arcs = segments.map(s => {
        const dash = (s.value / total) * circ;
        const arc = { ...s, dash, offset };
        offset += dash;
        return arc;
    });

    const tauxConf = total > 0 ? Math.round((conforme / total) * 100) : 0;

    return (
        <div className="flex flex-col items-center">
            <svg width={160} height={160} viewBox="0 0 160 160">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={sw} />
                {arcs.map((arc, i) => arc.value > 0 && (
                    <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                        stroke={arc.color} strokeWidth={sw}
                        strokeDasharray={`${arc.dash} ${circ - arc.dash}`}
                        strokeDashoffset={circ / 4 - arc.offset}
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '80px 80px' }}
                    />
                ))}
                <text x={cx} y={cy - 7} fontSize={18} fontWeight="700" fill="#111827" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">{tauxConf}%</text>
                <text x={cx} y={cy + 9} fontSize={7.5} fill="#6b7280" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">CONFORMITÉ</text>
            </svg>
            <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
                {segments.map(s => s.value > 0 && (
                    <span key={s.label} className="flex items-center gap-1 text-[10px] text-gray-600">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        {s.label} ({s.value})
                    </span>
                ))}
            </div>
        </div>
    );
};

export default DonutConformite;
