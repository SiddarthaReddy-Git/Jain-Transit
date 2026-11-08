/**
 * Web Audio API synthesizer for realistic transit station chimes (Ding-Dong / Airport Chime)
 */
export function playTransitChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Tone 1: High crisp chime (F5 - ~698Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(698.46, now);

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.25, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.75);

    // Tone 2: Warm lower resolve chime (C5 - ~523Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(523.25, now + 0.35);

    gain2.gain.setValueAtTime(0.001, now + 0.35);
    gain2.gain.exponentialRampToValueAtTime(0.28, now + 0.39);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.35);
    osc2.stop(now + 1.3);
  } catch (err) {
    console.debug('Audio chime unable to play:', err);
  }
}
