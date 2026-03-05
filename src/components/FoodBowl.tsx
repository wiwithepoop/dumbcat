interface Props {
  foodCount: number;
  onAddFood: () => void;
}

export default function FoodBowl({ foodCount, onAddFood }: Props) {
  const filled = foodCount > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {/* Bowl SVG */}
      <div style={{ imageRendering: 'pixelated', lineHeight: 0 }}>
        <svg
          viewBox="0 0 40 28"
          width={120}
          height={84}
          shapeRendering="crispEdges"
          style={{ imageRendering: 'pixelated' }}
        >
          {/* Bowl rim */}
          <rect x={0} y={8} width={40} height={4} fill="#8B6914" />
          {/* Bowl body */}
          <rect x={2} y={12} width={36} height={12} fill="#A07820" />
          <rect x={4} y={14} width={32} height={8} fill="#C49A28" />
          {/* Bowl base */}
          <rect x={8} y={24} width={24} height={4} fill="#8B6914" />

          {/* Food (kibble dots) when filled */}
          {filled && (
            <>
              <rect x={8} y={10} width={4} height={4} fill="#E07534" />
              <rect x={14} y={9} width={4} height={4} fill="#C05A1F" />
              <rect x={20} y={10} width={4} height={4} fill="#E07534" />
              <rect x={26} y={9} width={4} height={4} fill="#F4B56A" />
              <rect x={11} y={13} width={3} height={3} fill="#C05A1F" />
              <rect x={17} y={12} width={3} height={3} fill="#E07534" />
              <rect x={23} y={13} width={3} height={3} fill="#F4B56A" />
            </>
          )}

          {/* Food count indicator */}
          {foodCount > 1 &&
            Array.from({ length: Math.min(foodCount - 1, 4) }).map((_, i) => (
              <rect
                key={i}
                x={4 + i * 8}
                y={6}
                width={4}
                height={4}
                fill="#E07534"
                opacity={0.6}
              />
            ))}

          {/* Empty indicator */}
          {!filled && (
            <rect x={16} y={16} width={8} height={2} fill="#8B6914" />
          )}
        </svg>
      </div>

      <button
        onClick={onAddFood}
        disabled={foodCount >= 5}
        className="pixel-btn"
        style={{
          opacity: foodCount >= 5 ? 0.5 : 1,
          cursor: foodCount >= 5 ? 'not-allowed' : 'pointer',
        }}
      >
        + Add Food
      </button>

      {foodCount >= 5 && (
        <div className="pixel-text" style={{ fontSize: 6, color: '#facc15' }}>
          BOWL FULL!
        </div>
      )}
    </div>
  );
}
