import { COLORS } from './constants';

export const draw = (ctx: CanvasRenderingContext2D, g: any[], size?: [number, number], width?: number) => {
  ctx.save();
  if (size) {
    ctx.translate(-size[0] / 2, -size[1] / 2);
  }
  g.forEach((p) => {
    ctx.beginPath();
    const fillColor = (COLORS as any)[p[2]] || p[2] || 'transparent';
    const strokeColor = (COLORS as any)[p[1]] || p[1] || 'transparent';
    
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = !p[3] ? (width || 1) : 0.001;
    ctx.lineJoin = 'round';
    
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 2; i < p[0].length; i += 2) {
      ctx.lineTo(p[0][i], p[0][i + 1]);
    }
    
    if (p[3]) ctx.closePath();
    if (p[1]) ctx.stroke();
    if (p[3]) ctx.fill();
  });
  ctx.restore();
};

export class SFX {
  private ac: AudioContext | null = null;
  private lastFX: number = Date.now();
  private muted: boolean = false;

  init() {
    if (!this.ac) {
      this.ac = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  private playShort(frequency: number, time: number = 0.5, volume: number = 1) {
    if (this.muted || !this.ac) return;
    
    const o = this.ac.createOscillator();
    const g = this.ac.createGain();
    o.type = 'triangle';
    o.connect(g);
    g.connect(this.ac.destination);
    o.frequency.value = frequency;
    o.start(0);
    g.gain.value = volume;
    g.gain.exponentialRampToValueAtTime(0.00001, this.ac.currentTime + time);
  }

  fall() {
    this.playShort(43.65);
  }

  jump() {
    this.playShort(82.41, 0.2);
  }

  run() {
    if (Date.now() - this.lastFX < 200) return;
    this.playShort(146.83, 0.05, 0.4);
    this.lastFX = Date.now();
  }

  wall() {
    if (Date.now() - this.lastFX < 100) return;
    this.playShort(41.20, 0.2);
    this.lastFX = Date.now();
  }

  die() {
    this.playShort(61.74, 3);
  }

  fallingBlock() {
    this.playShort(51.91, 5);
  }

  takePower() {
    this.playShort(220.00, 0.5);
  }

  flying() {
    if (Date.now() - this.lastFX < 30) return;
    this.playShort(27.50, 0.5);
    this.lastFX = Date.now();
  }

  dash() {
    this.playShort(174.61, 0.3, 0.8);
  }
}
