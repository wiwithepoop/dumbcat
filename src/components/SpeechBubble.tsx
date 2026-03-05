import { useEffect, useState } from 'react';

interface Props {
  text: string | null;
}

export default function SpeechBubble({ text }: Props) {
  const [visible, setVisible] = useState(false);
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    if (!text) {
      setVisible(false);
      return;
    }
    setDisplayed(text);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, [text]);

  if (!displayed) return null;

  return (
    <div
      className="speech-bubble"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
        pointerEvents: 'none',
      }}
    >
      {displayed}
      <div className="speech-bubble-tail" />
    </div>
  );
}
