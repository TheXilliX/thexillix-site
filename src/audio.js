class SoundEngine {
  constructor() {
    this.context = null;
    this.master = null;
    this.enabled = localStorage.getItem('thexillix-sound') !== 'off';
  }

  unlock() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.16;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') this.context.resume();
  }

  setEnabled(value) {
    this.enabled = value;
    localStorage.setItem('thexillix-sound', value ? 'on' : 'off');
    if (value) this.unlock();
  }

  noise(duration = 0.28, cutoff = 1100, volume = 0.08) {
    if (!this.enabled) return;
    this.unlock();
    if (!this.context) return;
    const length = Math.floor(this.context.sampleRate * duration);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      const fade = 1 - i / length;
      data[i] = (Math.random() * 2 - 1) * fade * fade;
    }
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    filter.type = 'bandpass';
    filter.frequency.value = cutoff;
    filter.Q.value = 0.55;
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(this.master);
    source.start();
  }

  tick(frequency = 520, duration = 0.08, volume = 0.08) {
    if (!this.enabled) return;
    this.unlock();
    if (!this.context) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.72, this.context.currentTime + duration);
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
    oscillator.connect(gain).connect(this.master);
    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);
  }

  paper() {
    this.noise(0.42, 720, 0.11);
    window.setTimeout(() => this.tick(260, 0.07, 0.05), 120);
  }

  transition(kind) {
    const settings = {
      about: [860, 0.38],
      now: [420, 0.34],
      inspiration: [1280, 0.44],
      projects: [620, 0.36],
      contacts: [980, 0.3]
    };
    const [cutoff, duration] = settings[kind] || [800, 0.32];
    this.noise(duration, cutoff, 0.075);
    window.setTimeout(() => this.tick(kind === 'inspiration' ? 780 : 440, 0.12, 0.05), 130);
  }
}

export const sound = new SoundEngine();
