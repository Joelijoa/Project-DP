const DonutChart = ({ segments, total }) => {
    const cx = 56, cy = 56, r = 40, sw = 14;
    const circ = 2 * Math.PI * r;
    let cum = 0;
    const computed = segments.map(s => {
        const dash = total > 0 ? (s.value / total) * circ : 0;
        const item = { ...s, dash, offset: -cum };
        cum += dash;
        return item;
    });
    return (
        <svg width="112" height="112" viewBox="0 0 112 112">
            <g transform={`rotate(-90,${cx},${cy})`}>
                {total === 0
                    ? <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={sw} />
                    : computed.filter(s => s.value > 0).map((s, i) => (
                        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                            stroke={s.color} strokeWidth={sw}
                            strokeDasharray={`${s.dash} ${circ - s.dash}`}
                            strokeDashoffset={s.offset}
                        />
                    ))
                }
            </g>
            <text x={cx} y={cy - 6} textAnchor="middle"
                style={{ fontSize: '22px', fontWeight: '800', fill: '#111827', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {total}
            </text>
            <text x={cx} y={cx + 12} textAnchor="middle"
                style={{ fontSize: '8px', fill: '#9ca3af', fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                audits
            </text>
        </svg>
    );
};

export default DonutChart;
