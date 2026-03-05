import type { CatState } from '../types';

interface Props {
  state: CatState;
  facingLeft?: boolean;
}

// Pixel art cat rendered as SVG rects on a 32×40 grid (displayed at 4× = 128×160px)
// Each element is a <rect> at integer coords, shape-rendering=crispEdges for no antialiasing

const O = '#E07534'; // orange body
const L = '#F4B56A'; // light face / belly
const D = '#C05A1F'; // dark stripe / detail
const B = '#1A1A2E'; // black eyes
const W = '#FFFFFF'; // eye highlight
const P = '#FF9EAE'; // nose / inner ear
const G = '#2A2A4A'; // dark pupil

function Rect({
  x, y, w = 1, h = 1, fill,
}: { x: number; y: number; w?: number; h?: number; fill: string }) {
  return <rect x={x} y={y} width={w} height={h} fill={fill} />;
}

function EarsAndHead() {
  return (
    <>
      {/* Left ear */}
      <Rect x={2} y={0} w={7} h={8} fill={O} />
      <Rect x={3} y={1} w={4} h={6} fill={P} />
      {/* Right ear */}
      <Rect x={23} y={0} w={7} h={8} fill={O} />
      <Rect x={25} y={1} w={4} h={6} fill={P} />
      {/* Head outline */}
      <Rect x={1} y={6} w={30} h={19} fill={O} />
      {/* Face */}
      <Rect x={5} y={8} w={22} h={15} fill={L} />
      {/* Forehead stripes */}
      <Rect x={12} y={8} w={2} h={4} fill={D} />
      <Rect x={18} y={8} w={2} h={4} fill={D} />
    </>
  );
}

function OpenEyes() {
  return (
    <>
      {/* Left eye */}
      <Rect x={7} y={13} w={6} h={6} fill={B} />
      <Rect x={9} y={14} w={2} h={2} fill={W} />
      <Rect x={8} y={15} w={1} h={1} fill={G} />
      {/* Right eye */}
      <Rect x={19} y={13} w={6} h={6} fill={B} />
      <Rect x={21} y={14} w={2} h={2} fill={W} />
      <Rect x={20} y={15} w={1} h={1} fill={G} />
    </>
  );
}

function HalfEyes() {
  // Content / squinting
  return (
    <>
      <Rect x={7} y={15} w={6} h={3} fill={B} />
      <Rect x={19} y={15} w={6} h={3} fill={B} />
    </>
  );
}

function ClosedEyes() {
  return (
    <>
      <Rect x={7} y={16} w={6} h={2} fill={D} />
      <Rect x={19} y={16} w={6} h={2} fill={D} />
    </>
  );
}

function SideEyes() {
  // Hungry — looking toward bowl (right)
  return (
    <>
      <Rect x={9} y={13} w={6} h={6} fill={B} />
      <Rect x={13} y={14} w={2} h={2} fill={W} />
      <Rect x={21} y={13} w={6} h={6} fill={B} />
      <Rect x={25} y={14} w={2} h={2} fill={W} />
    </>
  );
}

function Nose() {
  return (
    <>
      <Rect x={14} y={20} w={4} h={3} fill={P} />
      {/* Whiskers */}
      <Rect x={2} y={21} w={10} h={1} fill={D} />
      <Rect x={20} y={21} w={10} h={1} fill={D} />
      <Rect x={2} y={23} w={10} h={1} fill={D} />
      <Rect x={20} y={23} w={10} h={1} fill={D} />
    </>
  );
}

function SittingBody() {
  return (
    <>
      {/* Neck */}
      <Rect x={10} y={25} w={12} h={3} fill={O} />
      {/* Body */}
      <Rect x={4} y={27} w={24} h={12} fill={O} />
      {/* Belly */}
      <Rect x={8} y={29} w={16} h={8} fill={L} />
      {/* Front paws */}
      <Rect x={4} y={37} w={8} h={5} fill={O} />
      <Rect x={20} y={37} w={8} h={5} fill={O} />
      {/* Paw toes */}
      <Rect x={7} y={41} w={1} h={1} fill={D} />
      <Rect x={9} y={41} w={1} h={1} fill={D} />
      <Rect x={22} y={41} w={1} h={1} fill={D} />
      <Rect x={24} y={41} w={1} h={1} fill={D} />
      {/* Tail */}
      <Rect x={28} y={30} w={4} h={10} fill={O} />
      <Rect x={25} y={38} w={3} h={4} fill={O} />
      <Rect x={28} y={40} w={4} h={2} fill={D} />
    </>
  );
}

function LyingBody() {
  return (
    <>
      {/* Flat body */}
      <Rect x={0} y={27} w={32} h={8} fill={O} />
      {/* Belly patch */}
      <Rect x={4} y={28} w={24} h={6} fill={L} />
      {/* Paws extended */}
      <Rect x={0} y={33} w={10} h={4} fill={O} />
      <Rect x={22} y={33} w={10} h={4} fill={O} />
      {/* Tail curled */}
      <Rect x={24} y={34} w={8} h={3} fill={O} />
    </>
  );
}

function DanglingBody() {
  return (
    <>
      {/* Neck */}
      <Rect x={10} y={25} w={12} h={3} fill={O} />
      {/* Body */}
      <Rect x={6} y={27} w={20} h={10} fill={O} />
      {/* Belly */}
      <Rect x={9} y={29} w={14} h={6} fill={L} />
      {/* Dangling legs */}
      <Rect x={6} y={36} w={5} h={8} fill={O} />
      <Rect x={21} y={36} w={5} h={8} fill={O} />
      {/* Tail up */}
      <Rect x={26} y={24} w={4} h={10} fill={O} />
      <Rect x={22} y={24} w={4} h={4} fill={O} />
    </>
  );
}

function EatingPose() {
  return (
    <>
      {/* Neck stretched down */}
      <Rect x={10} y={25} w={12} h={6} fill={O} />
      {/* Body */}
      <Rect x={4} y={30} w={24} h={10} fill={O} />
      {/* Belly */}
      <Rect x={8} y={32} w={16} h={6} fill={L} />
      {/* Front paws */}
      <Rect x={4} y={38} w={8} h={4} fill={O} />
      <Rect x={20} y={38} w={8} h={4} fill={O} />
      {/* Tail up excited */}
      <Rect x={28} y={22} w={4} h={12} fill={O} />
    </>
  );
}

export default function CatSprite({ state, facingLeft = false }: Props) {
  const size = 32;
  const viewH = 44;

  const eyes = (() => {
    if (state === 'sleeping') return <ClosedEyes />;
    if (state === 'happy' || state === 'eating') return <HalfEyes />;
    if (state === 'hungry' || state === 'starving') return <SideEyes />;
    return <OpenEyes />;
  })();

  const body = (() => {
    if (state === 'sleeping') return <LyingBody />;
    if (state === 'held') return <DanglingBody />;
    if (state === 'eating') return <EatingPose />;
    return <SittingBody />;
  })();

  const cssClass = (() => {
    switch (state) {
      case 'idle':     return 'cat-idle';
      case 'happy':    return 'cat-happy';
      case 'walk':     return 'cat-walk';
      case 'eating':   return 'cat-eating';
      case 'sleeping': return 'cat-sleeping';
      case 'held':     return 'cat-held';
      case 'hungry':   return 'cat-hungry';
      case 'starving': return 'cat-starving';
      default:         return 'cat-idle';
    }
  })();

  return (
    <div
      className={cssClass}
      style={{
        transform: facingLeft ? 'scaleX(-1)' : undefined,
        imageRendering: 'pixelated',
        lineHeight: 0,
        userSelect: 'none',
      }}
    >
      <svg
        viewBox={`0 0 ${size} ${viewH}`}
        width={size * 4}
        height={viewH * 4}
        style={{ imageRendering: 'pixelated' }}
        shapeRendering="crispEdges"
      >
        <EarsAndHead />
        {eyes}
        <Nose />
        {body}
      </svg>
    </div>
  );
}
