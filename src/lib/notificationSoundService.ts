/**
 * Notification Sound Service
 * Web Audio API ile melodili bildirim sesleri uretir.
 * 5 ses grubu: positive, info, reminder, warning, urgent
 * Harici ses dosyasi gerektirmez (uygulama icindeyken).
 */

export type SoundGroup = 'positive' | 'info' | 'reminder' | 'warning' | 'urgent';

interface NoteConfig {
  freq: number;
  duration: number;
  waveType: OscillatorType;
  gain: number;
  attack: number;
  decay: number;
  sustainLevel: number;
  release: number;
}

interface SoundGroupConfig {
  notes: (NoteConfig | { rest: number })[];
}

const SOUND_GROUPS: Record<SoundGroup, SoundGroupConfig> = {
  // Pozitif — Yukselen C major arpej (C5 E5 G5), triangle, parlak
  positive: {
    notes: [
      { freq: 523, duration: 0.15, waveType: 'triangle', gain: 0.12, attack: 0.008, decay: 0.02, sustainLevel: 0.9, release: 0.04 },
      { freq: 659, duration: 0.15, waveType: 'triangle', gain: 0.14, attack: 0.008, decay: 0.02, sustainLevel: 0.9, release: 0.04 },
      { freq: 784, duration: 0.30, waveType: 'triangle', gain: 0.10, attack: 0.008, decay: 0.03, sustainLevel: 0.7, release: 0.15 },
    ],
  },
  // Bilgilendirme — Yumusak ikili can (G4 C5), sine, reverb hissi
  info: {
    notes: [
      { freq: 392, duration: 0.15, waveType: 'sine', gain: 0.08, attack: 0.005, decay: 0.02, sustainLevel: 0.85, release: 0.06 },
      { freq: 523, duration: 0.25, waveType: 'sine', gain: 0.06, attack: 0.005, decay: 0.03, sustainLevel: 0.7, release: 0.12 },
    ],
  },
  // Hatirlatma — Uclu dikkat cani (E5 G5 E5), sine+triangle mix
  reminder: {
    notes: [
      { freq: 659, duration: 0.15, waveType: 'sine', gain: 0.10, attack: 0.008, decay: 0.02, sustainLevel: 0.85, release: 0.04 },
      { freq: 784, duration: 0.20, waveType: 'sine', gain: 0.12, attack: 0.008, decay: 0.02, sustainLevel: 0.85, release: 0.06 },
      { freq: 659, duration: 0.25, waveType: 'triangle', gain: 0.08, attack: 0.008, decay: 0.03, sustainLevel: 0.7, release: 0.12 },
    ],
  },
  // Uyari — Inen minor (A5 F5 D5), son nota square dusuk gain
  warning: {
    notes: [
      { freq: 880, duration: 0.20, waveType: 'sine', gain: 0.10, attack: 0.01, decay: 0.03, sustainLevel: 0.85, release: 0.05 },
      { freq: 698, duration: 0.20, waveType: 'sine', gain: 0.10, attack: 0.01, decay: 0.03, sustainLevel: 0.85, release: 0.05 },
      { freq: 587, duration: 0.40, waveType: 'square', gain: 0.06, attack: 0.01, decay: 0.05, sustainLevel: 0.6, release: 0.20 },
    ],
  },
  // Acil — Cift vurus + cozum (G5, rest, G5, C6)
  urgent: {
    notes: [
      { freq: 784, duration: 0.15, waveType: 'square', gain: 0.12, attack: 0.005, decay: 0.02, sustainLevel: 0.8, release: 0.04 },
      { rest: 0.10 },
      { freq: 784, duration: 0.15, waveType: 'square', gain: 0.14, attack: 0.005, decay: 0.02, sustainLevel: 0.85, release: 0.04 },
      { freq: 1047, duration: 0.40, waveType: 'triangle', gain: 0.10, attack: 0.008, decay: 0.05, sustainLevel: 0.6, release: 0.22 },
    ],
  },
};

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (audioCtx) return audioCtx;
  try {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioCtx;
  } catch {
    return null;
  }
}

function isNote(item: NoteConfig | { rest: number }): item is NoteConfig {
  return 'freq' in item;
}

export async function playNotificationSound(group: SoundGroup = 'info'): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;

  // iOS WKWebView icin gerekli
  if (ctx.state === 'suspended') {
    try { await ctx.resume(); } catch { return; }
  }

  const config = SOUND_GROUPS[group];
  let currentTime = ctx.currentTime;

  for (const item of config.notes) {
    if (!isNote(item)) {
      // Rest (silence)
      currentTime += item.rest;
      continue;
    }

    const { freq, duration, waveType, gain, attack, decay, sustainLevel, release } = item;
    const sustainDur = Math.max(0, duration - attack - decay - release);

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = waveType;
    osc.frequency.value = freq;

    // ADSR envelope
    const t0 = currentTime;
    gainNode.gain.setValueAtTime(0, t0);
    gainNode.gain.linearRampToValueAtTime(gain, t0 + attack);
    gainNode.gain.linearRampToValueAtTime(gain * sustainLevel, t0 + attack + decay);
    gainNode.gain.setValueAtTime(gain * sustainLevel, t0 + attack + decay + sustainDur);
    gainNode.gain.linearRampToValueAtTime(0, t0 + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(t0);
    osc.stop(t0 + duration);

    currentTime += duration;
  }
}

/** Backward-compatible alias — eski SoundProfile parametresi de calisir */
export function playNotificationSoundLegacy(profile: 'gentle' | 'alert' | 'urgent'): Promise<void> {
  const mapping: Record<string, SoundGroup> = {
    gentle: 'info',
    alert: 'reminder',
    urgent: 'urgent',
  };
  return playNotificationSound(mapping[profile] || 'info');
}
