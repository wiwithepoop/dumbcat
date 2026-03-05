import { useState } from 'react';
import type { CatVariant } from '../types';
import { CAT_VARIANTS } from '../types';
import CatSprite from './CatSprite';

interface Props {
  onAdopt: (name: string, variant: CatVariant) => void;
  onClose: () => void;
}

const VARIANT_LABELS: Record<CatVariant, string> = {
  orange:  'orange',
  gray:    'gray',
  white:   'white',
  black:   'black',
  brown:   'brown',
  calico:  'calico',
  tuxedo:  'tuxedo',
};

export default function AdoptModal({ onAdopt, onClose }: Props) {
  const [name, setName] = useState('');
  const [variant, setVariant] = useState<CatVariant>('orange');

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdopt(trimmed, variant);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200,
    }}>
      <div className="pixel-panel" style={{ padding: '24px 28px', minWidth: 300 }}>
        <div className="pixel-text" style={{ fontSize: 9, color: '#F4B56A', marginBottom: 16, textAlign: 'center' }}>
          adopt a cat!
        </div>

        {/* Variant picker */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
          {CAT_VARIANTS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVariant(v)}
              style={{
                background: 'none',
                border: variant === v ? '2px solid #F4B56A' : '2px solid #3d2b1c',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {/* Mini cat preview at 1× scale */}
              <div style={{ transform: 'scale(0.5)', transformOrigin: 'top center', height: 55, width: 40, overflow: 'hidden' }}>
                <CatSprite state="idle" variant={v} />
              </div>
              <span className="pixel-text" style={{ fontSize: 5, color: variant === v ? '#F4B56A' : '#888' }}>
                {VARIANT_LABELS[v]}
              </span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            className="pixel-input"
            autoFocus
            placeholder="cat name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="pixel-btn" style={{ flex: 1 }} onClick={onClose}>
              cancel
            </button>
            <button type="submit" className="pixel-btn pixel-btn-primary" style={{ flex: 1 }}>
              adopt!
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
