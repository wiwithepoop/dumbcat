import { useState } from 'react';
import { setApiKey } from '../storage';

interface Props {
  currentKey: string;
  onClose: () => void;
  onSave: (key: string) => void;
  toast: string | null;
}

export default function SettingsPanel({ currentKey, onClose, onSave, toast }: Props) {
  const [draft, setDraft] = useState(currentKey);

  function handleSave() {
    setApiKey(draft);
    onSave(draft);
    onClose();
  }

  function handleClear() {
    setDraft('');
    setApiKey('');
    onSave('');
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
        padding: 16,
        zIndex: 900,
      }}
      onClick={onClose}
    >
      <div
        className="pixel-panel"
        style={{ width: 300, padding: 20, marginTop: 48 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pixel-text" style={{ fontSize: 8, color: '#F4B56A', marginBottom: 16 }}>
          Settings
        </div>

        <div className="pixel-text" style={{ fontSize: 6, color: '#aaa', marginBottom: 8 }}>
          Anthropic API Key
        </div>
        <div className="pixel-text" style={{ fontSize: 5, color: '#666', marginBottom: 8 }}>
          Optional. Enables AI dialogue.
          Without it, fallback lines are used.
        </div>

        <input
          type="password"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="sk-ant-..."
          className="pixel-input"
          style={{ width: '100%', marginBottom: 12 }}
        />

        {toast && (
          <div className="pixel-text" style={{ fontSize: 6, color: '#ef4444', marginBottom: 8 }}>
            {toast}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSave} className="pixel-btn pixel-btn-primary" style={{ flex: 1 }}>
            Save
          </button>
          <button onClick={handleClear} className="pixel-btn" style={{ flex: 1 }}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
