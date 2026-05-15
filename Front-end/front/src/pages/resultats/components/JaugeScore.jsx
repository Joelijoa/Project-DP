import { scoreColor, scoreLabel } from './resultatsHelpers';

const JaugeScore = ({ score, max = 5 }) => {
    const pct = Math.min(score / max, 1);
    const color = scoreColor(score);
    const cx = 100, cy = 90, r = 70;
    const valueAngle = Math.PI + pct * Math.PI;

    const polar = (angle) => ({
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
    });

    const arcPath = (a1, a2, col) => {
        const steps = 60;
        const pts = Array.from({ length: steps + 1 }, (_, i) => {
            const a = a1 + (a2 - a1) * (i / steps);
            return polar(a);
        });
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
        return <path d={d} fill="none" stroke={col} strokeWidth={14} strokeLinecap="round" />;
    };

    const needle = polar(valueAngle);

    const ticks = [0, 1, 2, 3, 4, 5].map(v => {
        const a = Math.PI + (v / 5) * Math.PI;
        const inner = { x: cx + (r - 16) * Math.cos(a), y: cy + (r - 16) * Math.sin(a) };
        const outer = { x: cx + (r + 4)  * Math.cos(a), y: cy + (r + 4)  * Math.sin(a) };
        const label = { x: cx + (r + 16) * Math.cos(a), y: cy + (r + 16) * Math.sin(a) };
        return { v, inner, outer, label };
    });

    return (
        <div className="flex flex-col items-center">
            <svg width={200} height={110} viewBox="0 0 200 110">
                {arcPath(Math.PI, 0, '#e5e7eb')}
                {arcPath(Math.PI, valueAngle, color)}
                {ticks.map(t => (
                    <g key={t.v}>
                        <line x1={t.inner.x.toFixed(2)} y1={t.inner.y.toFixed(2)}
                              x2={t.outer.x.toFixed(2)} y2={t.outer.y.toFixed(2)}
                              stroke="#d1d5db" strokeWidth={1.5} />
                        <text x={t.label.x.toFixed(2)} y={(t.label.y + 3).toFixed(2)}
                            fontSize={7.5} fill="#9ca3af" textAnchor="middle"
                            fontFamily="Plus Jakarta Sans, sans-serif">{t.v}</text>
                    </g>
                ))}
                <line
                    x1={cx} y1={cy}
                    x2={needle.x.toFixed(2)} y2={needle.y.toFixed(2)}
                    stroke="#111827" strokeWidth={2} strokeLinecap="round"
                />
                <circle cx={cx} cy={cy} r={5} fill="#111827" />
                <text x={cx} y={cy + 22} fontSize={20} fontWeight="700" fill={color} textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">{score.toFixed(1)}</text>
                <text x={cx} y={cy + 34} fontSize={7} fill="#6b7280" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">/ {max} — {scoreLabel(score)}</text>
            </svg>
        </div>
    );
};

export default JaugeScore;
