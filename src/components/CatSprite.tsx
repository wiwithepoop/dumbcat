import type { CatState, CatVariant } from '../types';

interface Props {
  state: CatState;
  facingLeft?: boolean;
  variant?: CatVariant;
}

// Pixel art cat rendered as SVG rects on a 32×44 grid (displayed at 2.5× = 80×110px)

interface Pal { O: string; L: string; D: string; P: string }

// Fixed colors (same for all variants)
const B = '#1A1A2E'; // eye black
const W = '#FFFFFF'; // eye highlight
const G = '#2A2A4A'; // pupil

const PALETTES: Record<CatVariant, Pal> = {
  orange:  { O: '#E07534', L: '#F4B56A', D: '#C05A1F', P: '#FF9EAE' },
  gray:    { O: '#8A8A9E', L: '#C8C8D8', D: '#5A5A6E', P: '#FFB8C4' },
  white:   { O: '#D8D8E8', L: '#F4F4FC', D: '#9898B0', P: '#FFB8C4' },
  black:   { O: '#303040', L: '#606070', D: '#202030', P: '#FF9EAE' },
  brown:   { O: '#8B5A2A', L: '#C89050', D: '#6B3A1A', P: '#FFB8C4' },
  calico:  { O: '#E07534', L: '#F0F0F0', D: '#303040', P: '#FFB8C4' },
  tuxedo:  { O: '#303040', L: '#F0F0F0', D: '#202030', P: '#FFB8C4' },
};

function Rect({ x, y, w = 1, h = 1, fill }: { x: number; y: number; w?: number; h?: number; fill: string }) {
  return <rect x={x} y={y} width={w} height={h} fill={fill} />;
}

function EarsAndHead({ p }: { p: Pal }) {
  return (
    <>
      <Rect x={2}  y={0} w={7} h={8} fill={p.O} />
      <Rect x={3}  y={1} w={4} h={6} fill={p.P} />
      <Rect x={23} y={0} w={7} h={8} fill={p.O} />
      <Rect x={25} y={1} w={4} h={6} fill={p.P} />
      <Rect x={1}  y={6} w={30} h={19} fill={p.O} />
      <Rect x={5}  y={8} w={22} h={15} fill={p.L} />
      <Rect x={12} y={8} w={2}  h={4}  fill={p.D} />
      <Rect x={18} y={8} w={2}  h={4}  fill={p.D} />
    </>
  );
}

function OpenEyes() {
  return (
    <>
      <Rect x={7}  y={13} w={6} h={6} fill={B} />
      <Rect x={9}  y={14} w={2} h={2} fill={W} />
      <Rect x={8}  y={15} w={1} h={1} fill={G} />
      <Rect x={19} y={13} w={6} h={6} fill={B} />
      <Rect x={21} y={14} w={2} h={2} fill={W} />
      <Rect x={20} y={15} w={1} h={1} fill={G} />
    </>
  );
}

function HalfEyes() {
  return (
    <>
      <Rect x={7}  y={15} w={6} h={3} fill={B} />
      <Rect x={19} y={15} w={6} h={3} fill={B} />
    </>
  );
}

function ClosedEyes({ p }: { p: Pal }) {
  return (
    <>
      <Rect x={7}  y={16} w={6} h={2} fill={p.D} />
      <Rect x={19} y={16} w={6} h={2} fill={p.D} />
    </>
  );
}

function SideEyes() {
  return (
    <>
      <Rect x={9}  y={13} w={6} h={6} fill={B} />
      <Rect x={13} y={14} w={2} h={2} fill={W} />
      <Rect x={21} y={13} w={6} h={6} fill={B} />
      <Rect x={25} y={14} w={2} h={2} fill={W} />
    </>
  );
}

function Nose({ p }: { p: Pal }) {
  return (
    <>
      <Rect x={14} y={20} w={4} h={3} fill={p.P} />
      <Rect x={2}  y={21} w={10} h={1} fill={p.D} />
      <Rect x={20} y={21} w={10} h={1} fill={p.D} />
      <Rect x={2}  y={23} w={10} h={1} fill={p.D} />
      <Rect x={20} y={23} w={10} h={1} fill={p.D} />
    </>
  );
}

function SittingBody({ p }: { p: Pal }) {
  return (
    <>
      <Rect x={10} y={25} w={12} h={3}  fill={p.O} />
      <Rect x={4}  y={27} w={24} h={12} fill={p.O} />
      <Rect x={8}  y={29} w={16} h={8}  fill={p.L} />
      <Rect x={4}  y={37} w={8}  h={5}  fill={p.O} />
      <Rect x={20} y={37} w={8}  h={5}  fill={p.O} />
      <Rect x={7}  y={41} w={1}  h={1}  fill={p.D} />
      <Rect x={9}  y={41} w={1}  h={1}  fill={p.D} />
      <Rect x={22} y={41} w={1}  h={1}  fill={p.D} />
      <Rect x={24} y={41} w={1}  h={1}  fill={p.D} />
      <Rect x={28} y={30} w={4}  h={10} fill={p.O} />
      <Rect x={25} y={38} w={3}  h={4}  fill={p.O} />
      <Rect x={28} y={40} w={4}  h={2}  fill={p.D} />
    </>
  );
}

function LyingBody({ p }: { p: Pal }) {
  return (
    <>
      <Rect x={0}  y={27} w={32} h={8} fill={p.O} />
      <Rect x={4}  y={28} w={24} h={6} fill={p.L} />
      <Rect x={0}  y={33} w={10} h={4} fill={p.O} />
      <Rect x={22} y={33} w={10} h={4} fill={p.O} />
      <Rect x={24} y={34} w={8}  h={3} fill={p.O} />
    </>
  );
}

function DanglingBody({ p }: { p: Pal }) {
  return (
    <>
      <Rect x={10} y={25} w={12} h={3}  fill={p.O} />
      <Rect x={6}  y={27} w={20} h={10} fill={p.O} />
      <Rect x={9}  y={29} w={14} h={6}  fill={p.L} />
      <Rect x={6}  y={36} w={5}  h={8}  fill={p.O} />
      <Rect x={21} y={36} w={5}  h={8}  fill={p.O} />
      <Rect x={26} y={24} w={4}  h={10} fill={p.O} />
      <Rect x={22} y={24} w={4}  h={4}  fill={p.O} />
    </>
  );
}

function EatingPose({ p }: { p: Pal }) {
  return (
    <>
      <Rect x={10} y={25} w={12} h={6}  fill={p.O} />
      <Rect x={4}  y={30} w={24} h={10} fill={p.O} />
      <Rect x={8}  y={32} w={16} h={6}  fill={p.L} />
      <Rect x={4}  y={38} w={8}  h={4}  fill={p.O} />
      <Rect x={20} y={38} w={8}  h={4}  fill={p.O} />
      <Rect x={28} y={22} w={4}  h={12} fill={p.O} />
    </>
  );
}

export default function CatSprite({ state, facingLeft = false, variant = 'orange' }: Props) {
  const p = PALETTES[variant];
  const size = 32;
  const viewH = 44;

  const eyes = (() => {
    if (state === 'sleeping') return <ClosedEyes p={p} />;
    if (state === 'happy' || state === 'eating') return <HalfEyes />;
    if (state === 'hungry' || state === 'starving') return <SideEyes />;
    return <OpenEyes />;
  })();

  const body = (() => {
    if (state === 'sleeping') return <LyingBody p={p} />;
    if (state === 'held') return <DanglingBody p={p} />;
    if (state === 'eating') return <EatingPose p={p} />;
    return <SittingBody p={p} />;
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
        width={size * 2.5}
        height={viewH * 2.5}
        style={{ imageRendering: 'pixelated' }}
        shapeRendering="crispEdges"
      >
        <EarsAndHead p={p} />
        {eyes}
        <Nose p={p} />
        {body}
      </svg>
    </div>
  );
}
