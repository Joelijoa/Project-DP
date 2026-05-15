const EvolutionChart = ({ points }) => {
    const W = 600, H = 130;
    const PAD = { top: 12, right: 16, bottom: 28, left: 36 };
    const iW = W - PAD.left - PAD.right;
    const iH = H - PAD.top  - PAD.bottom;
    const n  = points.length;
    if (n === 0) return null;

    const xOf = (i) => PAD.left + (n > 1 ? (i / (n - 1)) * iW : iW / 2);
    const yOf = (v) => PAD.top  + iH - (v / 100) * iH;

    const pts  = points.map((p, i) => ({ ...p, cx: xOf(i), cy: yOf(p.score) }));
    const line = pts.map(p => `${p.cx},${p.cy}`).join(' ');
    const area = `${pts[0].cx},${PAD.top + iH} ${line} ${pts[n - 1].cx},${PAD.top + iH}`;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
            {[0, 25, 50, 75, 100].map(v => {
                const y = yOf(v);
                return (
                    <g key={v}>
                        <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                            stroke="#F3F4F6" strokeWidth={1} />
                        <text x={PAD.left - 6} y={y + 3.5} textAnchor="end"
                            style={{ fontSize: 8, fill: '#9CA3AF' }}>{v}%</text>
                    </g>
                );
            })}
            <polygon points={area} fill="rgba(204,0,0,0.07)" />
            <polyline points={line} fill="none" stroke="#CC0000" strokeWidth={2}
                strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((p, i) => (
                <g key={i}>
                    <circle cx={p.cx} cy={p.cy} r={4} fill="white"
                        stroke="#CC0000" strokeWidth={2} />
                    <text x={p.cx} y={H - 4} textAnchor="middle"
                        style={{ fontSize: 7, fill: '#9CA3AF' }}>
                        {p.label.length > 12 ? p.label.slice(0, 11) + '…' : p.label}
                    </text>
                    <text x={p.cx} y={p.cy - 8} textAnchor="middle"
                        style={{ fontSize: 8, fontWeight: 700, fill: '#CC0000' }}>
                        {p.score}%
                    </text>
                </g>
            ))}
        </svg>
    );
};

export default EvolutionChart;
