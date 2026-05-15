const RadarChart = ({ synthese }) => {
    const cx = 210, cy = 210, maxR = 140, n = synthese.length;
    if (n < 3) return null;

    const angle = (i) => (2 * Math.PI * i / n) - Math.PI / 2;
    const pt = (i, val, max = 5) => {
        const r = (val / max) * maxR;
        return { x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) };
    };
    const poly = (vals) =>
        vals.map((v, i) => pt(i, v)).map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z';

    const gridPoly = (lvl) => poly(synthese.map(() => lvl));
    const scorePoly = poly(synthese.map(d => d.avgScore));
    const targetPoly = poly(synthese.map(() => 3));
    const globalScore = synthese.reduce((s, d) => s + d.avgScore, 0) / n;

    return (
        <svg viewBox="0 0 420 420" width="100%" style={{ maxWidth: 420 }}>
            {[1, 2, 3, 4, 5].map(lvl => (
                <path key={lvl} d={gridPoly(lvl)} fill="none"
                    stroke={lvl === 3 ? '#94a3b8' : '#e2e8f0'}
                    strokeWidth={lvl === 3 ? 1.5 : 1}
                    strokeDasharray={lvl === 3 ? '5 3' : undefined} />
            ))}
            {synthese.map((_, i) => {
                const tip = pt(i, 5);
                return <line key={i} x1={cx} y1={cy} x2={tip.x.toFixed(1)} y2={tip.y.toFixed(1)} stroke="#e2e8f0" strokeWidth={1} />;
            })}
            <path d={targetPoly} fill="rgba(59,130,246,0.06)" stroke="#93c5fd" strokeWidth={1.5} strokeDasharray="5 3" />
            <path d={scorePoly} fill="rgba(204,0,0,0.14)" stroke="var(--brand-red)" strokeWidth={2} />
            {synthese.map((d, i) => {
                const p = pt(i, d.avgScore);
                return <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={4.5} fill="var(--brand-red)" stroke="white" strokeWidth={1.5} />;
            })}
            {[1, 2, 3, 4, 5].map(lvl => {
                const p = pt(0, lvl);
                return <text key={lvl} x={(p.x - 10).toFixed(1)} y={(p.y + 4).toFixed(1)} fontSize={8} fill="#9ca3af" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">{lvl}</text>;
            })}
            {synthese.map((d, i) => {
                const r = maxR + 28;
                const a = angle(i);
                const lx = cx + r * Math.cos(a);
                const ly = cy + r * Math.sin(a);
                return (
                    <g key={i}>
                        <text x={lx.toFixed(1)} y={(ly - 3).toFixed(1)} fontSize={9} fontWeight="700" fill="#CC0000" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">{d.code}</text>
                        <text x={lx.toFixed(1)} y={(ly + 10).toFixed(1)} fontSize={8} fill="#374151" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">{d.avgScore.toFixed(1)}</text>
                    </g>
                );
            })}
            <text x={cx} y={cy - 9} fontSize={24} fontWeight="700" fill="#111827" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">{globalScore.toFixed(1)}</text>
            <text x={cx} y={cy + 9} fontSize={8} fill="#6b7280" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">SCORE GLOBAL</text>
        </svg>
    );
};

export default RadarChart;
