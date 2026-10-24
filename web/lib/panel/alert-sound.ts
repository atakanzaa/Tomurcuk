// Panelde yeni sipariş sesi. Ses dosyası yok; Web Audio ile kısa, iki notalı yumuşak bir zil.
// Tarayıcılar sesi ancak kullanıcı sayfaya dokunduktan sonra çalar; bu yüzden tercih
// tarayıcıda saklanır, ses bağlamı ilk dokunuşta açılır.

const PREF_KEY = "tomurcuk.sesli-uyari";

/** Tercih değişince panelin her yerine haber verir. */
export const SOUND_EVENT = "tomurcuk:sesli-uyari";

export function soundEnabled(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) === "acik";
  } catch {
    return false;
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    if (on) localStorage.setItem(PREF_KEY, "acik");
    else localStorage.removeItem(PREF_KEY);
  } catch {
    // Gizli pencere gibi depolamanın kapalı olduğu durumda tercih yalnızca bu sayfada kalır.
  }
  window.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: on }));
}

let context: AudioContext | null = null;

/** Kullanıcı dokunuşunun içinde çağrılmalı; sonraki çalmalar dokunuş beklemez. */
export function unlockSound() {
  if (typeof AudioContext === "undefined") return;
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
}

export function playChime() {
  if (!context || context.state !== "running") return;
  const start = context.currentTime;
  [659.25, 880].forEach((frequency, i) => {
    const at = start + i * 0.18;
    const oscillator = context!.createOscillator();
    const gain = context!.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.25, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.6);
    oscillator.connect(gain).connect(context!.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.62);
  });
}
