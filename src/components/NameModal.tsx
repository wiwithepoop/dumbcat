import { useState } from 'react';

interface Props {
  onSubmit: (name: string) => void;
}

export default function NameModal({ onSubmit }: Props) {
  const [name, setName] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(name.trim() || 'Neko');
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div className="pixel-panel" style={{ width: 320, padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 16 }}>😺</div>
        <div className="pixel-text" style={{ fontSize: 10, color: '#F4B56A', marginBottom: 8 }}>
          MyCat
        </div>
        <div className="pixel-text" style={{ fontSize: 7, color: '#aaa', marginBottom: 24 }}>
          Name your new cat!
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Neko"
            maxLength={16}
            className="pixel-input"
            autoFocus
          />
          <button type="submit" className="pixel-btn pixel-btn-primary">
            Start 🐾
          </button>
        </form>
      </div>
    </div>
  );
}
