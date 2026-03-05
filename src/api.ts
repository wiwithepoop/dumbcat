import Anthropic from '@anthropic-ai/sdk';
import type { DialogueTrigger } from './types';

const FALLBACKS: Record<DialogueTrigger, string[]> = {
  eaten:       ["Finally!! I was WASTING AWAY.", "Nom nom nom!", "More. Give more."],
  bowl_empty:  ["Bowl. Empty. Unacceptable.", "...you forgot. Again.", "I stare into the void of this bowl."],
  petted:      ["...fine. Just this once.", "Purrr", "I tolerate this."],
  picked_up:   ["PUT ME DOWN.", "Oh no.", "I did not consent to this."],
  put_down:    ["I was NOT done being upset.", "Finally. Dignity restored.", "Hmph."],
  very_hungry: ["Hello?? HELLO???", "I am FADING AWAY.", "Feed me or I haunt you."],
  waking_up:   ["Five more minutes.", "...where am I.", "I demand breakfast. Now."],
};

const PROMPTS: Record<DialogueTrigger, string> = {
  eaten:       "You just ate food from your bowl. React with delight.",
  bowl_empty:  "You tried to eat but the bowl was empty. React with betrayal.",
  petted:      "Your human is petting you. React.",
  picked_up:   "Your human just picked you up unexpectedly. React.",
  put_down:    "Your human just dropped you. React.",
  very_hungry: "You are starving and your bowl is empty. Demand food dramatically.",
  waking_up:   "You just woke up from a nap. React groggily.",
};

function hungerDescription(lastFedIso: string): string {
  const mins = (Date.now() - new Date(lastFedIso).getTime()) / 60000;
  if (mins < 60) return "full and content";
  if (mins < 180) return "a bit peckish";
  if (mins < 300) return "quite hungry";
  return "absolutely starving";
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function getDialogue(
  trigger: DialogueTrigger,
  catName: string,
  apiKey: string,
  lastFedIso?: string,
): Promise<string> {
  if (!apiKey) return randomFrom(FALLBACKS[trigger]);

  const hunger = lastFedIso ? hungerDescription(lastFedIso) : 'a bit peckish';

  try {
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 60,
      system: `You are a pixel art cat named ${catName}. Right now you are ${hunger}. You speak in short, expressive cat reactions — 1-2 sentences max. You're dramatic, cute, and a little chaotic. Never break character. Never say you're an AI.`,
      messages: [{ role: 'user', content: PROMPTS[trigger] }],
    });
    const block = msg.content[0];
    if (block.type === 'text') return block.text;
    return randomFrom(FALLBACKS[trigger]);
  } catch {
    return randomFrom(FALLBACKS[trigger]);
  }
}
