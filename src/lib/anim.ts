export type AnimationPath = [number[], string, string, number];
export type AnimationFrame = AnimationPath[];

export class Animation {
  speed: number;
  total: number;
  slides: AnimationFrame[];
  index: number = 0;
  t: number = 0;
  tt: number = 0;
  last: number = Date.now();
  isFinished: boolean = false;
  loop: boolean;

  constructor(...args: [AnimationFrame, any[], number?, boolean?]) {
    const [g, a, s = 200, f = false] = args;
    this.speed = s;
    this.total = a.length + 1;
    this.slides = [];
    this.loop = !f;

    this.slides.push(g);

    a.forEach((aa) => {
      this.slides.push(
        g.map((item, i) => {
          let value = item;
          if (aa[i]) {
            // If aa[i] is an array, it's the new path coordinates
            if (Array.isArray(aa[i])) {
              value = [aa[i], item[1], item[2], item[3]];
            } else {
              // If it's 0 or something else, keep original
              value = item;
            }
          }
          return value;
        })
      );
    });
  }

  next(): AnimationFrame {
    const now = Date.now();
    const diff = now - this.last;
    this.t += diff;
    this.index = Math.floor((this.t % (this.total * this.speed)) / this.speed);
    
    if (this.index + 1 === this.total) {
      this.isFinished = true;
    }
    
    const nextIndex = this.index + 1 === this.total ? (this.loop ? 0 : this.index) : this.index + 1;
    this.tt = (this.t % (this.total * this.speed)) % this.speed;

    this.last = now;

    if (!this.loop && this.isFinished) {
      return this.slides[this.total - 1];
    }

    return this.slides[this.index].map((slide, i) => {
      return [
        slide[0].map((coord, iii) => {
          const nextCoord = this.slides[nextIndex][i][0][iii];
          return coord + ((nextCoord - coord) * this.tt) / this.speed;
        }),
        slide[1],
        slide[2],
        slide[3],
      ] as AnimationPath;
    });
  }

  getIsFinished(): boolean {
    return this.isFinished;
  }
}
