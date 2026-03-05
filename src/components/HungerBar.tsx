interface Props {
  level: number; // 0–100
  catName: string;
}

export default function HungerBar({ level, catName }: Props) {
  const pct = Math.max(0, Math.min(100, level));
  const color =
    pct > 60 ? '#4ade80' :
    pct > 30 ? '#facc15' :
    '#ef4444';

  return (
    <div className="hud-box" style={{ minWidth: 160 }}>
      <div className="pixel-text" style={{ fontSize: 8, color: '#F4B56A', marginBottom: 4 }}>
        {catName}
      </div>
      <div className="pixel-text" style={{ fontSize: 6, color: '#aaa', marginBottom: 3 }}>
        HUNGER
      </div>
      <div
        style={{
          width: 120,
          height: 10,
          background: '#2a2a2a',
          border: '2px solid #555',
          imageRendering: 'pixelated',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${pct}%`,
            background: color,
            transition: 'width 1s linear, background 0.5s',
            animation: pct < 20 ? 'hunger-pulse 0.8s ease-in-out infinite' : undefined,
          }}
        />
      </div>
      <div className="pixel-text" style={{ fontSize: 6, color: '#aaa', marginTop: 2 }}>
        {Math.round(pct)}%
      </div>
    </div>
  );
}
