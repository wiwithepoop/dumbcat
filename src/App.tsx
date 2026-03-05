import { useState, useEffect, useRef, useCallback } from 'react';
import * as storage from './storage';
import { getDialogue } from './api';
import type { CatState, CatInstance, Platform, DialogueTrigger } from './types';
import { randomVariant } from './types';
import CatSprite from './components/CatSprite';
import SpeechBubble from './components/SpeechBubble';
import FoodBowl from './components/FoodBowl';
import NameModal from './components/NameModal';
import AdoptModal from './components/AdoptModal';
import SettingsPanel from './components/SettingsPanel';

// Cat dimensions at 2.5× scale: 32×2.5=80, 44×2.5=110
const CAT_W = 80;
const CAT_H = 110;
const MAX_CATS = 8;

function getHungerLevel(lastFedIso: string): number {
  const mins = (Date.now() - new Date(lastFedIso).getTime()) / 60000;
  return Math.max(0, 100 - (mins / 360) * 100);
}

function isSleepTime(): boolean {
  const h = new Date().getHours();
  return h >= 22 || h < 6;
}

function floorY(): number {
  return window.innerHeight * 0.68 - CAT_H / 2;
}

// Build platform list — computed from viewport each time.
// catY = cat CENTER Y when standing on this platform.
// Platform surface Y = catY + CAT_H/2.
// Furniture positions must match exactly what's rendered below.
function getPlatforms(): Platform[] {
  const W = window.innerWidth;
  const H = window.innerHeight;
  // Left shelf: SVG top at H*0.45, shelf board is top of SVG
  const shelfSurface = H * 0.45;
  // Bookshelf: SVG top at H*0.25, SVG viewBox 0 0 90 120 rendered 240px tall (scale=2)
  // Top of case = H*0.25; middle shelf at y=38 in viewBox = 38/120*240=76px below top
  const bsTop = H * 0.25;
  const bsLeft = W - 200; // right:20, width:180 → left = W-200
  const bsRight = W - 20;
  return [
    { id: 'floor',          xLeft: 0,       xRight: W,       catY: floorY() },
    { id: 'shelf-left',     xLeft: 30,      xRight: 230,     catY: shelfSurface - CAT_H / 2 },
    { id: 'bookshelf-top',  xLeft: bsLeft,  xRight: bsRight, catY: bsTop - CAT_H / 2 },
    { id: 'bookshelf-mid',  xLeft: bsLeft,  xRight: bsRight, catY: bsTop + 76 - CAT_H / 2 },
  ];
}

// Drop a cat at (dropX, dropY): find the nearest platform below (or floor).
function findLandingY(dropX: number, dropY: number): number {
  const platforms = getPlatforms();
  // Only consider platforms the cat's X overlaps
  const inRange = platforms.filter(
    (p) => dropX >= p.xLeft + CAT_W / 4 && dropX <= p.xRight - CAT_W / 4,
  );
  if (!inRange.length) return floorY();
  // Platform surface Y = catY + CAT_H/2. Find platforms whose surface is at or below drop point.
  const below = inRange.filter((p) => p.catY + CAT_H / 2 >= dropY);
  if (below.length) {
    // Closest platform below — smallest catY among those below
    return below.reduce((a, b) => (a.catY < b.catY ? a : b)).catY;
  }
  // All platforms above drop — land on floor
  return floorY();
}

function clampX(x: number): number {
  return Math.max(CAT_W / 2 + 10, Math.min(window.innerWidth - CAT_W / 2 - 10, x));
}

interface ChatEntry { catName: string; text: string; ts: number }

export default function App() {
  const [cats, setCats] = useState<CatInstance[]>(() => storage.getCats());
  const [catStates, setCatStates] = useState<Record<string, CatState>>({});
  const [facingLeft, setFacingLeft] = useState<Record<string, boolean>>({});
  const [dialogues, setDialogues] = useState<Record<string, { text: string; key: number }>>({});
  const [foodInBowl, setFoodInBowl] = useState(() => storage.getFoodInBowl());
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdopt, setShowAdopt] = useState(false);
  const [releaseId, setReleaseId] = useState<string | null>(null);
  const [nearBin, setNearBin] = useState(false);
  const [apiKey, setApiKeyState] = useState(() => storage.getApiKey());

  // Refs for drag system (set up once)
  const draggingCatIdRef = useRef<string | null>(null);
  const wasDraggedRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const catsRef = useRef(cats);
  const foodInBowlRef = useRef(foodInBowl);
  const apiKeyRef = useRef(apiKey);
  const stateOverrideRef = useRef<Record<string, CatState | null>>({});
  const lastInteractionRef = useRef(Date.now());
  const lastDialogueTimeRef = useRef<Record<string, number>>({});
  const isSleepingRef = useRef<Record<string, boolean>>({});

  useEffect(() => { catsRef.current = cats; }, [cats]);
  useEffect(() => { foodInBowlRef.current = foodInBowl; }, [foodInBowl]);
  useEffect(() => { apiKeyRef.current = apiKey; }, [apiKey]);

  // Init positions to floor if y=0
  useEffect(() => {
    if (cats.length === 0) return;
    let changed = false;
    const updated = cats.map((c) => {
      if (c.y === 0) { changed = true; return { ...c, y: floorY() }; }
      return c;
    });
    if (changed) {
      setCats(updated);
      storage.saveCats(updated);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function getCatState(id: string): CatState {
    return catStates[id] ?? 'idle';
  }

  function setCatState(id: string, state: CatState) {
    setCatStates((prev) => ({ ...prev, [id]: state }));
  }

  function setTransientState(id: string, state: CatState, ms: number, then: CatState = 'idle') {
    stateOverrideRef.current[id] = state;
    setCatState(id, state);
    setTimeout(() => {
      stateOverrideRef.current[id] = null;
      setCatState(id, then);
    }, ms);
  }

  function moveCat(id: string, x: number, y: number) {
    setCats((prev) => {
      const updated = prev.map((c) => c.id === id ? { ...c, x, y } : c);
      storage.saveCats(updated);
      return updated;
    });
  }

  // ── Dialogue ──────────────────────────────────────────────────────────────
  const showDialogue = useCallback(async (catId: string, trigger: DialogueTrigger) => {
    const now = Date.now();
    const last = lastDialogueTimeRef.current[catId] ?? 0;
    if (now - last < 5000) return;
    lastDialogueTimeRef.current[catId] = now;

    const cat = catsRef.current.find((c) => c.id === catId);
    if (!cat) return;

    const text = await getDialogue(trigger, cat.name, apiKeyRef.current, cat.lastFed);
    setDialogues((prev) => ({ ...prev, [catId]: { text, key: (prev[catId]?.key ?? 0) + 1 } }));
    setChatHistory((prev) => [{ catName: cat.name, text, ts: now }, ...prev].slice(0, 16));
  }, []);

  // ── Feed interaction ──────────────────────────────────────────────────────
  function doFeedInteraction(catId: string) {
    const food = foodInBowlRef.current;
    if (food > 0) {
      const newFood = food - 1;
      const nowIso = new Date().toISOString();
      foodInBowlRef.current = newFood;
      setFoodInBowl(newFood);
      storage.setFoodInBowl(newFood);
      storage.incrementFeeds();
      setCats((prev) => {
        const updated = prev.map((c) => c.id === catId ? { ...c, lastFed: nowIso } : c);
        storage.saveCats(updated);
        return updated;
      });
      stateOverrideRef.current[catId] = 'eating';
      setCatState(catId, 'eating');
      setTimeout(() => {
        stateOverrideRef.current[catId] = 'happy';
        setCatState(catId, 'happy');
        setTimeout(() => {
          stateOverrideRef.current[catId] = null;
          setCatState(catId, 'idle');
        }, 1500);
      }, 2000);
      showDialogue(catId, 'eaten');
    } else {
      setTransientState(catId, 'hungry', 1500);
      showDialogue(catId, 'bowl_empty');
    }
  }

  // ── Global mouse handlers (set up once) ───────────────────────────────────
  useEffect(() => {
    function onMove(e: MouseEvent) {
      const id = draggingCatIdRef.current;
      if (!id) return;
      wasDraggedRef.current = true;
      const x = clampX(e.clientX - dragOffsetRef.current.x);
      const y = Math.max(CAT_H / 2 + 10, Math.min(window.innerHeight - CAT_H / 2 - 10, e.clientY - dragOffsetRef.current.y));
      setCats((prev) => prev.map((c) => c.id === id ? { ...c, x, y } : c));
      // Highlight bin when cat is dragged near it
      const binX = window.innerWidth - 320;
      const binY = window.innerHeight * 0.68 - 30;
      setNearBin(Math.hypot(x - binX, y - binY) < 70);
    }

    function onUp(e: MouseEvent) {
      const id = draggingCatIdRef.current;
      if (!id) return;
      draggingCatIdRef.current = null;
      lastInteractionRef.current = Date.now();

      if (!wasDraggedRef.current) {
        setNearBin(false);
        // Pure click — pet
        if (!isSleepingRef.current[id] && !stateOverrideRef.current[id]) {
          storage.incrementPets();
          setTransientState(id, 'happy', 2000);
          showDialogue(id, 'petted');
        }
        return;
      }

      const dropX = clampX(e.clientX - dragOffsetRef.current.x);
      const dropY = e.clientY - dragOffsetRef.current.y;

      // Bin proximity check — bin center at right:320px on floor
      const binX = window.innerWidth - 320;
      const binY = window.innerHeight * 0.68 - 30;
      const binDist = Math.hypot(dropX - binX, dropY - binY);

      setNearBin(false);

      if (binDist < 70) {
        // Snap to bin then show confirm
        moveCat(id, binX, floorY());
        setCatState(id, 'idle');
        setReleaseId(id);
        stateOverrideRef.current[id] = null;
        return;
      }

      // Bowl proximity check
      const bowlX = window.innerWidth / 2;
      const bowlY = window.innerHeight * 0.68 - 42;
      const bowlDist = Math.hypot(dropX - bowlX, dropY - bowlY);

      if (bowlDist < 90) {
        moveCat(id, bowlX, bowlY - CAT_H * 0.6);
        doFeedInteraction(id);
      } else {
        const landY = findLandingY(dropX, dropY);
        moveCat(id, dropX, landY);
        if (!stateOverrideRef.current[id]) {
          setCatState(id, 'idle');
          showDialogue(id, 'put_down');
        }
      }

      stateOverrideRef.current[id] = null;
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mouse down on a cat ───────────────────────────────────────────────────
  function handleMouseDown(e: React.MouseEvent, catId: string) {
    e.preventDefault();
    e.stopPropagation();
    lastInteractionRef.current = Date.now();

    if (isSleepingRef.current[catId]) {
      isSleepingRef.current[catId] = false;
      setCatState(catId, 'idle');
      showDialogue(catId, 'waking_up');
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left - CAT_W / 2,
      y: e.clientY - rect.top - CAT_H / 2,
    };
    wasDraggedRef.current = false;
    draggingCatIdRef.current = catId;
    stateOverrideRef.current[catId] = null;
    setCatState(catId, 'held');
    showDialogue(catId, 'picked_up');
  }

  // ── Hunger tick ───────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const current = catsRef.current;
      current.forEach((cat) => {
        if (draggingCatIdRef.current === cat.id) return;
        if (isSleepingRef.current[cat.id]) return;
        if (stateOverrideRef.current[cat.id]) return;
        const level = getHungerLevel(cat.lastFed);
        if (level <= 0) {
          setCatState(cat.id, 'starving');
          showDialogue(cat.id, 'very_hungry');
        } else if (level <= 33) {
          setCatState(cat.id, 'hungry');
        } else {
          setCatState(cat.id, 'idle');
        }
      });
    }, 10000);
    return () => clearInterval(id);
  }, [showDialogue]);

  // ── Sleep check ───────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (draggingCatIdRef.current) return;
      const shouldSleep = isSleepTime() || Date.now() - lastInteractionRef.current > 5 * 60 * 1000;
      catsRef.current.forEach((cat) => {
        const sleeping = isSleepingRef.current[cat.id] ?? false;
        if (shouldSleep && !sleeping && !stateOverrideRef.current[cat.id]) {
          isSleepingRef.current[cat.id] = true;
          setCatState(cat.id, 'sleeping');
          // Cat sleeps in place — no forced move
        } else if (!shouldSleep && sleeping) {
          isSleepingRef.current[cat.id] = false;
          setCatState(cat.id, 'idle');
          showDialogue(cat.id, 'waking_up');
        }
      });
    }, 20000);
    return () => clearInterval(id);
  }, [showDialogue]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Random idle walk ──────────────────────────────────────────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function schedule() {
      const delay = 8000 + Math.random() * 6000;
      timer = setTimeout(() => {
        const current = catsRef.current;
        if (current.length > 0 && !draggingCatIdRef.current) {
          // Pick a random cat to walk
          const cat = current[Math.floor(Math.random() * current.length)];
          if (!isSleepingRef.current[cat.id] && !stateOverrideRef.current[cat.id]) {
            const margin = 100;
            const tx = clampX(margin + Math.random() * (window.innerWidth - margin * 2));
            setFacingLeft((prev) => ({ ...prev, [cat.id]: tx < cat.x }));
            moveCat(cat.id, tx, findLandingY(tx, cat.y));
            setCatState(cat.id, 'walk');
            setTimeout(() => {
              if (!stateOverrideRef.current[cat.id]) setCatState(cat.id, 'idle');
            }, 2200);
          }
        }
        schedule();
      }, delay);
    }
    schedule();
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Adopt ─────────────────────────────────────────────────────────────────
  function handleAdopt(name: string, variant: CatInstance['variant']) {
    if (cats.length >= MAX_CATS) return;
    const newCat: CatInstance = {
      id: crypto.randomUUID(),
      name,
      lastFed: new Date().toISOString(),
      x: window.innerWidth / 2 + (Math.random() * 200 - 100),
      y: floorY(),
      variant,
    };
    const updated = [...cats, newCat];
    setCats(updated);
    storage.saveCats(updated);
    setShowAdopt(false);
  }

  function releaseCat(id: string) {
    const updated = cats.filter((c) => c.id !== id);
    setCats(updated);
    storage.saveCats(updated);
    // Clean up all per-cat state
    setCatStates((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setFacingLeft((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setDialogues((prev) => { const n = { ...prev }; delete n[id]; return n; });
    delete isSleepingRef.current[id];
    delete stateOverrideRef.current[id];
    delete lastDialogueTimeRef.current[id];
    setReleaseId(null);
  }

  function handleAddFood() {
    if (foodInBowlRef.current >= 5) return;
    const next = foodInBowlRef.current + 1;
    foodInBowlRef.current = next;
    setFoodInBowl(next);
    storage.setFoodInBowl(next);
  }

  function handleNameSubmit(name: string) {
    const cat: CatInstance = {
      id: crypto.randomUUID(),
      name,
      lastFed: new Date().toISOString(),
      x: window.innerWidth / 2,
      y: floorY(),
      variant: randomVariant(),
    };
    const updated = [cat];
    setCats(updated);
    storage.saveCats(updated);
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  const H = window.innerHeight;

  return (
    <div className="game-world">
      {/* Room */}
      <div className="room-wall" />
      <div className="room-floor" />
      <div className="floor-line" />

      {/* Window */}
      <div className="window-decoration">
        <div className="window-cross-h" />
        <div className="window-cross-v" />
        <div className="window-glow" />
      </div>

      {/* ── Furniture ── */}

      {/* Left wall shelf */}
      <div style={{ position: 'fixed', left: 30, top: H * 0.45, zIndex: 10 }}>
        <svg viewBox="0 0 100 18" width={200} height={36} shapeRendering="crispEdges" style={{ imageRendering: 'pixelated', display: 'block' }}>
          {/* Shelf board */}
          <rect x={0} y={0} width={100} height={8} fill="#8B5A2B" />
          <rect x={0} y={0} width={100} height={2} fill="#C89060" />
          <rect x={0} y={8} width={100} height={2} fill="#5A3820" />
          {/* Brackets */}
          <rect x={8} y={8} width={4} height={10} fill="#6B4423" />
          <rect x={88} y={8} width={4} height={10} fill="#6B4423" />
        </svg>
      </div>

      {/* Right bookshelf */}
      <div style={{ position: 'fixed', right: 20, top: H * 0.25, zIndex: 10 }}>
        <svg viewBox="0 0 90 120" width={180} height={240} shapeRendering="crispEdges" style={{ imageRendering: 'pixelated', display: 'block' }}>
          {/* Back panel */}
          <rect x={0} y={0} width={90} height={120} fill="#5A3820" />
          {/* Shelves */}
          <rect x={2} y={38} width={86} height={5} fill="#8B5A2B" />
          <rect x={2} y={38} width={86} height={2} fill="#C89060" />
          <rect x={2} y={76} width={86} height={5} fill="#8B5A2B" />
          <rect x={2} y={76} width={86} height={2} fill="#C89060" />
          <rect x={2} y={115} width={86} height={5} fill="#8B5A2B" />
          {/* Books on bottom shelf */}
          <rect x={5}  y={82} width={10} height={28} fill="#E07534" />
          <rect x={16} y={86} width={8}  height={24} fill="#4a90d9" />
          <rect x={25} y={84} width={12} height={26} fill="#7dc462" />
          <rect x={38} y={88} width={9}  height={22} fill="#c462a0" />
          <rect x={48} y={85} width={11} height={25} fill="#F4B56A" />
          <rect x={60} y={83} width={8}  height={27} fill="#e05050" />
          {/* Books on mid shelf */}
          <rect x={5}  y={44} width={14} height={27} fill="#7dc462" />
          <rect x={20} y={47} width={10} height={24} fill="#E07534" />
          <rect x={31} y={45} width={8}  height={26} fill="#c462a0" />
          <rect x={50} y={44} width={12} height={27} fill="#4a90d9" />
          {/* Side panels */}
          <rect x={0} y={0} width={3} height={120} fill="#6B4423" />
          <rect x={87} y={0} width={3} height={120} fill="#6B4423" />
        </svg>
      </div>

      {/* Trash bin — right side floor, drag cat here to release */}
      <div style={{
        position: 'fixed', right: 300, top: 'calc(68vh - 64px)', zIndex: 10, lineHeight: 0,
        filter: nearBin ? 'drop-shadow(0 0 8px #e05050) drop-shadow(0 0 4px #ff4444)' : undefined,
        transition: 'filter 0.15s ease',
      }}>
        <svg viewBox="0 0 28 32" width={56} height={64} shapeRendering="crispEdges" style={{ imageRendering: 'pixelated', display: 'block' }}>
          {/* Lid */}
          <rect x={2}  y={0}  width={24} height={3}  fill="#8B5A2B" />
          <rect x={2}  y={0}  width={24} height={1}  fill="#C89060" />
          <rect x={10} y={0}  width={8}  height={2}  fill="#6B4423" />
          {/* Body */}
          <rect x={3}  y={4}  width={22} height={26} fill="#6B4423" />
          <rect x={3}  y={4}  width={22} height={2}  fill="#8B5A2B" />
          <rect x={3}  y={28} width={22} height={2}  fill="#5A3820" />
          {/* Stripes */}
          <rect x={8}  y={6}  width={2}  height={22} fill="#5A3820" />
          <rect x={14} y={6}  width={2}  height={22} fill="#5A3820" />
          <rect x={20} y={6}  width={2}  height={22} fill="#5A3820" />
        </svg>
        <div className="pixel-text" style={{ fontSize: 5, color: '#6B4423', textAlign: 'center', marginTop: 2 }}>release</div>
      </div>

      {/* Bed — left side floor */}
      <div style={{ position: 'fixed', top: `calc(68vh - 72px)`, left: 20, zIndex: 10, lineHeight: 0 }}>
        <svg viewBox="0 0 90 36" width={180} height={72} shapeRendering="crispEdges" style={{ imageRendering: 'pixelated', display: 'block' }}>
          <rect x={0} y={20} width={90} height={16} fill="#6B4423" />
          <rect x={2} y={8}  width={86} height={14} fill="#B07040" />
          <rect x={4} y={10} width={82} height={10} fill="#C88050" />
          <rect x={4} y={10} width={22} height={9}  fill="#F4E0C8" />
          <rect x={28} y={10} width={58} height={9} fill="#C05A1F" />
          <rect x={30} y={12} width={54} height={5} fill="#E07534" />
          <rect x={10} y={0} width={6}  height={10} fill="#6B4423" />
          <rect x={74} y={0} width={6}  height={10} fill="#6B4423" />
        </svg>
        <div className="pixel-text" style={{ fontSize: 6, color: '#6B4423', textAlign: 'center', marginTop: 2 }}>bed</div>
      </div>

      {/* Bowl — center floor */}
      <div style={{ position: 'fixed', top: 'calc(68vh - 84px)', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
        <FoodBowl foodCount={foodInBowl} onAddFood={handleAddFood} />
      </div>

      {/* ── Cats ── */}
      {cats.map((cat) => {
        const sleeping = isSleepingRef.current[cat.id] ?? false;
        const displayState: CatState = sleeping ? 'sleeping' : (getCatState(cat.id));
        const dragging = draggingCatIdRef.current === cat.id;
        const dial = dialogues[cat.id];

        return (
          <div
            key={cat.id}
            style={{
              position: 'fixed',
              left: cat.x - CAT_W / 2,
              top: cat.y - CAT_H / 2,
              width: CAT_W,
              height: CAT_H,
              cursor: dragging ? 'grabbing' : 'grab',
              zIndex: 50,
              transition: dragging ? 'none' : 'left 2s cubic-bezier(0.25,0.1,0.25,1), top 2s cubic-bezier(0.25,0.1,0.25,1)',
              filter: 'drop-shadow(2px 4px 0 rgba(0,0,0,0.35))',
            }}
            onMouseDown={(e) => handleMouseDown(e, cat.id)}
          >
            {/* Name + speech bubble above cat */}
            <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', width: 200, pointerEvents: 'none', textAlign: 'center' }}>
              {dial && <SpeechBubble key={dial.key} text={dial.text} />}
              <div className="pixel-text" style={{ fontSize: 5, color: '#c8a87a', marginTop: 2 }}>{cat.name}</div>
            </div>
            <CatSprite state={displayState} facingLeft={facingLeft[cat.id] ?? false} variant={cat.variant} />
          </div>
        );
      })}

      {/* ── HUD ── */}
      <div style={{ position: 'fixed', top: 12, left: 12, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {cats.map((cat) => {
          const level = getHungerLevel(cat.lastFed);
          const color = level > 60 ? '#7dc462' : level > 30 ? '#F4B56A' : '#e05050';
          return (
            <div key={cat.id} className="hud-box" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px' }}>
              <span className="pixel-text" style={{ fontSize: 6, color: '#c8a87a', minWidth: 60 }}>{cat.name}</span>
              <div style={{ width: 60, height: 6, background: '#2a1a10', border: '1px solid #5a3f2a' }}>
                <div style={{ width: `${level}%`, height: '100%', background: color, transition: 'width 1s' }} />
              </div>
              <button
                onClick={() => setReleaseId(cat.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a3f2a', fontSize: 10, lineHeight: 1, padding: 0 }}
                title="release cat"
              >🗑</button>
            </div>
          );
        })}

        {/* Adopt button */}
        {cats.length < MAX_CATS && (
          <button
            className="pixel-btn"
            style={{ marginTop: 4, fontSize: 6 }}
            onClick={() => setShowAdopt(true)}
          >
            + adopt cat
          </button>
        )}
      </div>

      {/* Settings */}
      <button onClick={() => setShowSettings(true)} className="settings-btn" aria-label="Settings">
        ⚙️
      </button>

      {/* Chat history */}
      {chatHistory.length > 0 && (
        <div className="chat-history">
          <div className="pixel-text" style={{ fontSize: 6, color: '#F4B56A', marginBottom: 6, borderBottom: '1px solid #3d2b1c', paddingBottom: 4 }}>
            diary
          </div>
          {chatHistory.map((entry) => (
            <div key={entry.ts} className="chat-entry">
              <span className="chat-time">{formatTime(entry.ts)} — {entry.catName}</span>
              <span className="chat-text">{entry.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Release confirm modal */}
      {releaseId && (() => {
        const cat = cats.find((c) => c.id === releaseId);
        return cat ? (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
            <div className="pixel-panel" style={{ padding: '24px 28px', textAlign: 'center' }}>
              <div className="pixel-text" style={{ fontSize: 8, color: '#F4B56A', marginBottom: 8 }}>release {cat.name}?</div>
              <div className="pixel-text" style={{ fontSize: 6, color: '#888', marginBottom: 20 }}>this cannot be undone.</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="pixel-btn" onClick={() => setReleaseId(null)}>keep</button>
                <button className="pixel-btn pixel-btn-primary" onClick={() => releaseCat(releaseId)}>release</button>
              </div>
            </div>
          </div>
        ) : null;
      })()}

      {/* Modals */}
      {cats.length === 0 && <NameModal onSubmit={handleNameSubmit} />}
      {showAdopt && <AdoptModal onAdopt={handleAdopt} onClose={() => setShowAdopt(false)} />}
      {showSettings && (
        <SettingsPanel
          currentKey={apiKey}
          onClose={() => setShowSettings(false)}
          onSave={(key) => { setApiKeyState(key); storage.setApiKey(key); }}
          toast={null}
        />
      )}
    </div>
  );
}
