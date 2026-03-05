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

function getHungerLevel(lastFedIso: string): number {
  const mins = (Date.now() - new Date(lastFedIso).getTime()) / 60000;
  return Math.max(0, 100 - (mins / 360) * 100);
}

function isSleepTime(): boolean {
  const h = new Date().getHours();
  return h >= 22 || h < 6;
}

// Floor Y: where the cat's center sits when standing on the floor line (68% viewport)
function floorY(): number {
  return window.innerHeight * 0.68 - CAT_H / 2;
}

function clampPos(x: number, y: number): Position {
  const margin = 20;
  return {
    x: Math.max(margin + CAT_W / 2, Math.min(window.innerWidth - margin - CAT_W / 2, x)),
    y: Math.max(margin + CAT_H / 2, Math.min(window.innerHeight - margin - CAT_H / 2, y)),
  };
}

interface ChatEntry { text: string; ts: number }

export default function App() {
  const [catName, setCatName] = useState<string | null>(() => storage.getCatName());
  const [catPos, setCatPos] = useState<Position>(() => ({
    x: window.innerWidth / 2,
    y: floorY(),
  }));
  const [catState, setCatState] = useState<CatState>('idle');
  const [facingLeft, setFacingLeft] = useState(false);
  const [isDragging, setIsDragging] = useState(false); // only for CSS transition toggle
  const [foodInBowl, setFoodInBowl] = useState(() => storage.getFoodInBowl());
  const [lastFed, setLastFed] = useState(() => storage.getLastFed());
  const [hungerLevel, setHungerLevel] = useState(() => getHungerLevel(storage.getLastFed()));
  const [dialogue, setDialogue] = useState<string | null>(null);
  const [dialogueKey, setDialogueKey] = useState(0);
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKeyState] = useState(() => storage.getApiKey());
  const [apiToast, setApiToast] = useState<string | null>(null);
  const [isSleeping, setIsSleeping] = useState(false);

  // Refs for drag — set up once, no stale closures
  const isDraggingRef = useRef(false);
  const wasDraggedRef = useRef(false);
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 });
  const foodInBowlRef = useRef(foodInBowl);
  const catNameRef = useRef(catName);
  const apiKeyRef = useRef(apiKey);
  const isSleepingRef = useRef(isSleeping);
  const catStateRef = useRef(catState);
  const stateOverrideRef = useRef<CatState | null>(null);
  const lastInteractionRef = useRef(Date.now());
  const dialogueActiveRef = useRef(false);
  const lastDialogueTimeRef = useRef(0);

  useEffect(() => { foodInBowlRef.current = foodInBowl; }, [foodInBowl]);
  useEffect(() => { catNameRef.current = catName; }, [catName]);
  useEffect(() => { apiKeyRef.current = apiKey; }, [apiKey]);
  useEffect(() => { isSleepingRef.current = isSleeping; }, [isSleeping]);
  useEffect(() => { catStateRef.current = catState; }, [catState]);

  const getBowlCenter = useCallback((): Position => ({
    x: window.innerWidth / 2,
    y: window.innerHeight * 0.68 - 42, // center of bowl SVG (84px tall) sitting on floor
  }), []);

  const getBedCenter = useCallback((): Position => ({
    x: 90,
    y: floorY(),
  }), []);

  // ── Dialogue ──────────────────────────────────────────────────────────────
  const showDialogue = useCallback(async (trigger: DialogueTrigger) => {
    const now = Date.now();
    if (now - lastDialogueTimeRef.current < 5000) return;
    lastDialogueTimeRef.current = now;
    dialogueActiveRef.current = true;
    const name = catNameRef.current ?? 'Neko';
    const key = apiKeyRef.current;
    const text = await getDialogue(trigger, name, key);
    setDialogue(text);
    setDialogueKey((k) => k + 1);
    setTimeout(() => { dialogueActiveRef.current = false; }, 5000);
    setChatHistory((prev) => [{ text, ts: now }, ...prev].slice(0, 12));
  }, []);

  // ── State helpers ─────────────────────────────────────────────────────────
  function setTransientState(state: CatState, ms: number, then: CatState = 'idle') {
    stateOverrideRef.current = state;
    setCatState(state);
    setTimeout(() => {
      stateOverrideRef.current = null;
      setCatState(then);
    }, ms);
  }

  // ── Feed interaction (called from window onUp) ────────────────────────────
  function doFeedInteraction() {
    const food = foodInBowlRef.current;
    if (food > 0) {
      const newFood = food - 1;
      const nowIso = new Date().toISOString();
      foodInBowlRef.current = newFood;
      setFoodInBowl(newFood);
      storage.setFoodInBowl(newFood);
      setLastFed(nowIso);
      storage.setLastFed(nowIso);
      storage.incrementFeeds();
      setHungerLevel(100);
      // Eating → happy → idle chain
      stateOverrideRef.current = 'eating';
      setCatState('eating');
      setTimeout(() => {
        stateOverrideRef.current = 'happy';
        setCatState('happy');
        setTimeout(() => {
          stateOverrideRef.current = null;
          setCatState('idle');
        }, 1500);
      }, 2000);
      showDialogue('eaten');
    } else {
      stateOverrideRef.current = null;
      setCatState('hungry');
      setTimeout(() => {
        if (!stateOverrideRef.current) setCatState('idle');
      }, 1500);
      showDialogue('bowl_empty');
    }
  }

  // ── Global mouse handlers (set up once) ───────────────────────────────────
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!isDraggingRef.current) return;
      wasDraggedRef.current = true;
      const newPos = clampPos(
        e.clientX - dragOffsetRef.current.x,
        e.clientY - dragOffsetRef.current.y,
      );
      setCatPos(newPos);
    }

    function onUp(e: MouseEvent) {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);
      lastInteractionRef.current = Date.now();

      if (!wasDraggedRef.current) {
        // Pure click — pet the cat
        if (!isSleepingRef.current && !stateOverrideRef.current) {
          storage.incrementPets();
          stateOverrideRef.current = 'happy';
          setCatState('happy');
          setTimeout(() => {
            stateOverrideRef.current = null;
            setCatState('idle');
          }, 2000);
          showDialogue('petted');
        }
        return;
      }

      // Was a drag — check bowl overlap
      const dropX = e.clientX - dragOffsetRef.current.x;
      const dropY = e.clientY - dragOffsetRef.current.y;
      const bowl = { x: window.innerWidth / 2, y: window.innerHeight - 100 };
      const dist = Math.hypot(dropX - bowl.x, dropY - bowl.y);

      if (dist < 90) {
        setCatPos(clampPos(bowl.x, bowl.y - 110));
        doFeedInteraction();
      } else {
        // Always land on the floor
        setCatPos(clampPos(dropX, floorY()));
        if (!stateOverrideRef.current) {
          setCatState('idle');
          showDialogue('put_down');
        }
      }
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []); // ← empty deps: set up once, refs handle mutable values

  // ── Mouse down on cat ────────────────────────────────────────────────────
  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    lastInteractionRef.current = Date.now();

    if (isSleepingRef.current) {
      setIsSleeping(false);
      setCatState('idle');
      showDialogue('waking_up');
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left - CAT_W / 2,
      y: e.clientY - rect.top - CAT_H / 2,
    };
    wasDraggedRef.current = false;
    isDraggingRef.current = true;
    setIsDragging(true);
    stateOverrideRef.current = null; // clear any previous override
    setCatState('held');
    showDialogue('picked_up');
  }

  // ── Hunger tick ──────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const level = getHungerLevel(lastFed);
      setHungerLevel(level);
      if (!isDraggingRef.current && !isSleepingRef.current && !stateOverrideRef.current) {
        if (level <= 0) {
          setCatState('starving');
          if (!dialogueActiveRef.current) showDialogue('very_hungry');
        } else if (level <= 33) {
          setCatState('hungry');
        } else {
          setCatState('idle');
        }
      }
    }, 10000);
    return () => clearInterval(id);
  }, [lastFed, showDialogue]);

  // ── Sleep check ───────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (isDraggingRef.current || stateOverrideRef.current) return;
      const inactiveTooLong = Date.now() - lastInteractionRef.current > 5 * 60 * 1000;
      const shouldSleep = isSleepTime() || inactiveTooLong;

      if (shouldSleep && !isSleepingRef.current) {
        const bed = getBedCenter();
        setFacingLeft(false);
        setCatPos(bed);
        setIsSleeping(true);
        setCatState('sleeping');
      } else if (!shouldSleep && isSleepingRef.current) {
        setIsSleeping(false);
        setCatState('idle');
        showDialogue('waking_up');
      }
    }, 20000);
    return () => clearInterval(id);
  }, [getBedCenter, showDialogue]);

  // ── Random idle behavior ─────────────────────────────────────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function schedule() {
      const delay = 9000 + Math.random() * 7000;
      timer = setTimeout(() => {
        if (!isDraggingRef.current && !isSleepingRef.current && !stateOverrideRef.current) {
          if (Math.random() < 0.6) {
            const margin = 120;
            const tx = margin + Math.random() * (window.innerWidth - margin * 2);
            const newPos = clampPos(tx, floorY());
            setCatPos((cur) => {
              setFacingLeft(newPos.x < cur.x);
              return cur;
            });
            setCatPos(newPos);
            setCatState('walk');
            setTimeout(() => {
              if (!stateOverrideRef.current) setCatState('idle');
            }, 2200);
          }
        }
        schedule();
      }, delay);
    }
    schedule();
    return () => clearTimeout(timer);
  }, []);

  // ── Add food ─────────────────────────────────────────────────────────────
  function handleAddFood() {
    if (foodInBowlRef.current >= 5) return;
    const next = foodInBowlRef.current + 1;
    foodInBowlRef.current = next;
    setFoodInBowl(next);
    storage.setFoodInBowl(next);
  }

  function handleNameSubmit(name: string) {
    storage.setCatName(name);
    setCatName(name);
    storage.setLastFed(new Date().toISOString());
    setHungerLevel(100);
  }

  function handleApiSave(key: string) {
    setApiKeyState(key);
    setApiToast(null);
  }

  const displayState: CatState = isSleeping ? 'sleeping' : catState;

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

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

      {/* HUD */}
      <div style={{ position: 'fixed', top: 12, left: 12, zIndex: 100 }}>
        <HungerBar level={hungerLevel} catName={catName ?? 'Neko'} />
      </div>

      {/* Settings */}
      <button
        onClick={() => setShowSettings(true)}
        className="settings-btn"
        aria-label="Settings"
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
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: 50,
          transition: isDragging ? 'none' : 'left 2s cubic-bezier(0.25,0.1,0.25,1), top 2s cubic-bezier(0.25,0.1,0.25,1)',
          filter: 'drop-shadow(3px 6px 0 rgba(0,0,0,0.35))',
        }}
        onMouseDown={handleMouseDown}
      >
        <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', width: 230, pointerEvents: 'none' }}>
          <SpeechBubble key={dialogueKey} text={dialogue} />
        </div>
        <CatSprite state={displayState} facingLeft={facingLeft} />
      </div>

      {/* Bed — bottom of SVG (72px tall) sits on floor line at 68vh */}
      <div style={{ position: 'fixed', top: 'calc(68vh - 72px)', left: 20, zIndex: 10, lineHeight: 0 }}>
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

      {/* Bowl — bottom of SVG (84px) sits on floor line at 68vh */}
      <div style={{ position: 'fixed', top: 'calc(68vh - 84px)', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
        <FoodBowl foodCount={foodInBowl} onAddFood={handleAddFood} />
      </div>

      {/* Chat history */}
      {chatHistory.length > 0 && (
        <div className="chat-history">
          <div className="pixel-text" style={{ fontSize: 6, color: '#F4B56A', marginBottom: 6, borderBottom: '1px solid #3d2b1c', paddingBottom: 4 }}>
            {catName ?? 'Neko'}'s diary
          </div>
          {chatHistory.map((entry) => (
            <div key={entry.ts} className="chat-entry">
              <span className="chat-time">{formatTime(entry.ts)}</span>
              <span className="chat-text">{entry.text}</span>
            </div>
          ))}
        </div>
      )}

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
