import { useState, useEffect, useRef, useCallback } from 'react';
import * as storage from './storage';
import { getDialogue } from './api';
import type { CatState, Position, DialogueTrigger } from './types';
import CatSprite from './components/CatSprite';
import SpeechBubble from './components/SpeechBubble';
import HungerBar from './components/HungerBar';
import FoodBowl from './components/FoodBowl';
import NameModal from './components/NameModal';
import SettingsPanel from './components/SettingsPanel';

const CAT_W = 128;
const CAT_H = 176;
const BOWL_OFFSET = { x: 0, y: -40 }; // bowl center relative to viewport center-bottom

function getHungerLevel(lastFedIso: string): number {
  const mins = (Date.now() - new Date(lastFedIso).getTime()) / 60000;
  return Math.max(0, 100 - (mins / 360) * 100);
}

function getCatStateFromHunger(hunger: number): CatState {
  if (hunger > 67) return 'idle';
  if (hunger > 33) return 'idle';
  if (hunger > 0)  return 'hungry';
  return 'starving';
}

function isSleepTime(): boolean {
  const h = new Date().getHours();
  return h >= 22 || h < 6;
}

export default function App() {
  const [catName, setCatName] = useState<string | null>(() => storage.getCatName());
  const [catPos, setCatPos] = useState<Position>({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [catState, setCatState] = useState<CatState>('idle');
  const [facingLeft, setFacingLeft] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [foodInBowl, setFoodInBowl] = useState(() => storage.getFoodInBowl());
  const [lastFed, setLastFed] = useState(() => storage.getLastFed());
  const [hungerLevel, setHungerLevel] = useState(() => getHungerLevel(storage.getLastFed()));
  const [dialogue, setDialogue] = useState<string | null>(null);
  const [dialogueKey, setDialogueKey] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKeyState] = useState(() => storage.getApiKey());
  const [apiToast, setApiToast] = useState<string | null>(null);
  const [isSleeping, setIsSleeping] = useState(false);
  const [sleepBubble, setSleepBubble] = useState(false);

  const lastInteractionRef = useRef(Date.now());
  const behaviorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateOverrideRef = useRef<CatState | null>(null); // for transient states (eating, happy)

  const catNameRef = useRef(catName);
  const apiKeyRef = useRef(apiKey);
  const catPosRef = useRef(catPos);
  useEffect(() => { catNameRef.current = catName; }, [catName]);
  useEffect(() => { apiKeyRef.current = apiKey; }, [apiKey]);
  useEffect(() => { catPosRef.current = catPos; }, [catPos]);

  // Bowl position (derived from viewport)
  const getBowlCenter = useCallback((): Position => ({
    x: window.innerWidth / 2 + BOWL_OFFSET.x,
    y: window.innerHeight - 100,
  }), []);

  const getBedCenter = useCallback((): Position => ({
    x: 80,
    y: window.innerHeight - 80,
  }), []);

  // Clamp cat position inside viewport
  function clampPos(x: number, y: number): Position {
    const margin = 20;
    return {
      x: Math.max(margin + CAT_W / 2, Math.min(window.innerWidth - margin - CAT_W / 2, x)),
      y: Math.max(margin + CAT_H / 2, Math.min(window.innerHeight - margin - CAT_H / 2, y)),
    };
  }

  // Show dialogue
  async function showDialogue(trigger: DialogueTrigger) {
    const name = catNameRef.current ?? 'Neko';
    const key = apiKeyRef.current;
    const text = await getDialogue(trigger, name, key);
    setDialogue(text);
    setDialogueKey((k) => k + 1);
  }

  // Transient state helper — set state for N ms then revert
  function transientState(state: CatState, ms: number, then: CatState = 'idle') {
    stateOverrideRef.current = state;
    setCatState(state);
    setTimeout(() => {
      stateOverrideRef.current = null;
      setCatState(then);
    }, ms);
  }

  // Feed cat when dragged onto bowl
  function handleFeedInteraction() {
    if (stateOverrideRef.current) return;
    if (foodInBowl > 0) {
      const newFood = foodInBowl - 1;
      const nowIso = new Date().toISOString();
      setFoodInBowl(newFood);
      storage.setFoodInBowl(newFood);
      setLastFed(nowIso);
      storage.setLastFed(nowIso);
      storage.incrementFeeds();
      setHungerLevel(100);
      transientState('eating', 2000, 'happy');
      setTimeout(() => transientState('happy', 1500, 'idle'), 2000);
      showDialogue('eaten');
    } else {
      transientState('hungry', 1500, 'idle');
      showDialogue('bowl_empty');
    }
  }

  // Hunger tick
  useEffect(() => {
    const id = setInterval(() => {
      const level = getHungerLevel(lastFed);
      setHungerLevel(level);

      if (!isDragging && !isSleeping && stateOverrideRef.current === null) {
        const base = getCatStateFromHunger(level);
        setCatState(base);

        if (level === 0) {
          showDialogue('very_hungry');
        }
      }
    }, 30000); // every 30s update hunger display
    return () => clearInterval(id);
  }, [lastFed, isDragging, isSleeping]);

  // Sleep check
  useEffect(() => {
    const id = setInterval(() => {
      if (isDragging || stateOverrideRef.current !== null) return;
      const shouldSleep = isSleepTime() ||
        (Date.now() - lastInteractionRef.current > 5 * 60 * 1000);

      if (shouldSleep && !isSleeping) {
        const bed = getBedCenter();
        setCatPos(bed);
        setIsSleeping(true);
        setCatState('sleeping');
        setSleepBubble(true);
        setTimeout(() => setSleepBubble(false), 4000);
        showDialogue('waking_up'); // actually shows on wake, but we trigger on sleep
      } else if (!shouldSleep && isSleeping) {
        setIsSleeping(false);
        setCatState('idle');
        showDialogue('waking_up');
      }
    }, 15000);
    return () => clearInterval(id);
  }, [isDragging, isSleeping, getBedCenter]);

  // Random idle behavior
  const scheduleBehavior = useCallback(() => {
    const delay = 8000 + Math.random() * 7000;
    behaviorTimerRef.current = setTimeout(() => {
      if (!isDragging && !isSleeping && stateOverrideRef.current === null) {
        const behaviors = ['walk', 'yawn', 'stretch'] as const;
        const pick = behaviors[Math.floor(Math.random() * behaviors.length)];

        if (pick === 'walk') {
          const margin = 100;
          const tx = margin + Math.random() * (window.innerWidth - margin * 2);
          const ty = window.innerHeight * 0.3 + Math.random() * (window.innerHeight * 0.5);
          const newPos = clampPos(tx, ty);
          setFacingLeft(newPos.x < catPosRef.current.x);
          setCatPos(newPos);
          setCatState('walk');
          setTimeout(() => {
            if (stateOverrideRef.current === null) setCatState('idle');
          }, 2000);
        } else {
          // yawn / stretch — stay in idle visually, just show dialogue later
          setCatState('idle');
        }
      }
      scheduleBehavior();
    }, delay);
  }, [isDragging, isSleeping]);

  useEffect(() => {
    scheduleBehavior();
    return () => {
      if (behaviorTimerRef.current) clearTimeout(behaviorTimerRef.current);
    };
  }, [scheduleBehavior]);

  // Mouse drag handlers
  function handleMouseDown(e: React.MouseEvent) {
    if (isSleeping) {
      setIsSleeping(false);
      setCatState('idle');
      showDialogue('waking_up');
      return;
    }
    lastInteractionRef.current = Date.now();
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left - CAT_W / 2,
      y: e.clientY - rect.top - CAT_H / 2,
    });
    setIsDragging(true);
    setCatState('held');
    showDialogue('picked_up');
  }

  useEffect(() => {
    if (!isDragging) return;

    function onMove(e: MouseEvent) {
      const newPos = clampPos(
        e.clientX - dragOffset.x,
        e.clientY - dragOffset.y,
      );
      setCatPos(newPos);
    }

    function onUp(e: MouseEvent) {
      setIsDragging(false);
      lastInteractionRef.current = Date.now();

      const dropX = e.clientX - dragOffset.x;
      const dropY = e.clientY - dragOffset.y;
      const bowl = getBowlCenter();
      const dist = Math.hypot(dropX - bowl.x, dropY - bowl.y);

      if (dist < 80) {
        // Snap to bowl area
        setCatPos(clampPos(bowl.x, bowl.y - 80));
        handleFeedInteraction();
      } else {
        setCatPos(clampPos(dropX, dropY));
        setCatState('idle');
        showDialogue('put_down');
      }
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, dragOffset, getBowlCenter, foodInBowl]);

  // Click (pet) — fires when drag distance was small
  function handleClick(e: React.MouseEvent) {
    if (isDragging) return;
    lastInteractionRef.current = Date.now();
    e.stopPropagation();
    if (isSleeping) return;
    transientState('happy', 2000, 'idle');
    storage.incrementPets();
    showDialogue('petted');
  }

  function handleAddFood() {
    if (foodInBowl >= 5) return;
    const next = foodInBowl + 1;
    setFoodInBowl(next);
    storage.setFoodInBowl(next);
  }

  function handleNameSubmit(name: string) {
    storage.setCatName(name);
    setCatName(name);
    storage.setLastFed(new Date().toISOString());
    showDialogue('waking_up');
  }

  function handleApiSave(key: string) {
    setApiKeyState(key);
    setApiToast(null);
  }

  const displayState = isSleeping ? 'sleeping' : catState;

  return (
    <div
      className="game-world"
      style={{ userSelect: 'none' }}
    >
      {/* Decorative room */}
      <div className="room-wall" />
      <div className="room-floor" />

      {/* Window decoration */}
      <div className="window-decoration">
        <div className="window-pane" />
        <div className="window-cross-h" />
        <div className="window-cross-v" />
      </div>

      {/* HUD top-left */}
      <div style={{ position: 'fixed', top: 12, left: 12, zIndex: 100 }}>
        <HungerBar level={hungerLevel} catName={catName ?? 'Neko'} />
      </div>

      {/* Settings gear */}
      <button
        onClick={() => setShowSettings(true)}
        style={{
          position: 'fixed', top: 12, right: 12,
          background: 'rgba(0,0,0,0.5)',
          border: '2px solid #555',
          color: '#aaa',
          fontSize: 20,
          width: 40, height: 40,
          cursor: 'pointer',
          zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        ⚙️
      </button>

      {/* Cat */}
      <div
        style={{
          position: 'fixed',
          left: catPos.x - CAT_W / 2,
          top: catPos.y - CAT_H / 2,
          width: CAT_W,
          height: CAT_H,
          cursor: isSleeping ? 'pointer' : isDragging ? 'grabbing' : 'grab',
          zIndex: 50,
          transition: isDragging ? undefined : 'left 2s ease, top 2s ease',
          filter: 'drop-shadow(4px 4px 0 rgba(0,0,0,0.25))',
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      >
        {/* Speech bubble above cat */}
        <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', width: 220 }}>
          <SpeechBubble key={dialogueKey} text={dialogue} />
        </div>

        {/* Sleep bubble */}
        {sleepBubble && (
          <div
            className="pixel-text sleep-bubble"
            style={{ position: 'absolute', top: -32, right: -10, fontSize: 14, color: '#adf' }}
          >
            💤
          </div>
        )}

        <CatSprite state={displayState} facingLeft={facingLeft} />
      </div>

      {/* Cat bed — bottom left */}
      <div
        className="cat-bed"
        style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          zIndex: 10,
        }}
      >
        <div style={{ fontSize: 10, textAlign: 'center', fontFamily: "'Press Start 2P', monospace", color: '#888' }}>
          🛏️
        </div>
        <svg viewBox="0 0 80 32" width={160} height={64} shapeRendering="crispEdges" style={{ imageRendering: 'pixelated', display: 'block' }}>
          {/* Bed base */}
          <rect x={0} y={18} width={80} height={14} fill="#8B5E3C" />
          {/* Mattress */}
          <rect x={2} y={8} width={76} height={14} fill="#D4856A" />
          {/* Pillow */}
          <rect x={4} y={10} width={20} height={10} fill="#F4E0C8" />
          {/* Blanket */}
          <rect x={26} y={10} width={50} height={10} fill="#E07534" />
          <rect x={28} y={12} width={46} height={6} fill="#C05A1F" />
        </svg>
      </div>

      {/* Food bowl — bottom center */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <FoodBowl foodCount={foodInBowl} onAddFood={handleAddFood} />
      </div>

      {/* Modals */}
      {!catName && <NameModal onSubmit={handleNameSubmit} />}
      {showSettings && (
        <SettingsPanel
          currentKey={apiKey}
          onClose={() => setShowSettings(false)}
          onSave={handleApiSave}
          toast={apiToast}
        />
      )}
    </div>
  );
}
