import { Vector } from './vector';
import { Animation } from './anim';
import { COLORS, LEVELS } from './constants';
import { draw, SFX } from './utils';

export const SCALE = 40;
export const MASS = 0.9;
export const MAX_SPEED = 6;
export const MAX_STAMINA = 20;
export const DASH_STAMINA_COST = 5;
export const DASH_SPEED_BOOST = 25;
export const DASH_DURATION = 200;
export const DASH_COOLDOWN = 600;
export const OUT_STAMINA_AT_WALL_JUMP = 2.5;
export const OUT_STAMINA_AT_WALL = 0.07;

export class Particle {
  isActive: boolean = true;
  position: Vector;
  velocity: Vector;
  acceleration: Vector = new Vector();
  startTime: number = Date.now();
  lifeTime: number;
  color: string;
  mass: number;
  radius: number;

  constructor(mass: number, radius: number, p: Vector, v: Vector, lifeTime: number, cc: string) {
    this.mass = mass;
    this.radius = radius;
    this.position = p.get();
    this.velocity = v.get();
    this.lifeTime = lifeTime;
    this.color = cc;
  }

  n(gravity: Vector) {
    this.acceleration.add(this.velocity.get().normalize().mult(0.001));
    this.acceleration.add(gravity.get().mult(this.mass));

    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.mult(0);

    if (Date.now() - this.startTime >= this.lifeTime) {
      this.isActive = false;
    }
  }

  r(ctx: CanvasRenderingContext2D) {
    const opacity = 1 - (Date.now() - this.startTime) / this.lifeTime;
    ctx.save();
    ctx.translate(this.position.x + 20, this.position.y);
    ctx.globalAlpha = opacity >= 0 ? opacity : 0;
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.rect(-(this.radius / 2), -(this.radius / 2), this.radius * 2, this.radius * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class ParticleSystem {
  list: Particle[] = [];
  runningLast: number = Date.now();
  wallLast: number = Date.now();

  reset() {
    this.list = [];
  }

  addRunning(position: Vector, velocity: Vector) {
    if (Date.now() - this.runningLast < 200) return;
    for (let i = 0; i < 5; i++) {
      this.list.push(new Particle(
        Math.random() * 0.05 + 0.1,
        1,
        position.get(),
        new Vector(Math.random() * 2 - 1, Math.random() * 0.5 + 0.5 + (velocity.x / 5)),
        500,
        COLORS.walking
      ));
    }
    this.runningLast = Date.now();
  }

  addWall(position: Vector, sideDirection: number) {
    if (Date.now() - this.wallLast < 200) return;
    for (let i = 0; i < 5; i++) {
      this.list.push(new Particle(
        Math.random() * 0.05 + 0.1,
        1,
        position.get().add(new Vector(sideDirection * 20, 0)),
        new Vector(Math.random() - 0.5, Math.random() * 0.4 + 0.1),
        500,
        COLORS.walking
      ));
    }
    this.wallLast = Date.now();
  }

  addJump(position: Vector, velocityX: number) {
    for (let i = 0; i < 50; i++) {
      this.list.push(new Particle(
        Math.random() * 0.05 + 0.1,
        1,
        position.get(),
        new Vector(Math.random() * 4 + velocityX - 2, Math.random() * 0.5 + 0.5),
        500,
        COLORS.walking
      ));
    }
  }

  addFan(position: Vector) {
    this.list.push(new Particle(
      Math.random() * 0.00005 + 0.0001,
      2,
      position.get().add(new Vector(Math.floor(Math.random() * 100), Math.floor(Math.random() * 20))),
      new Vector(0, Math.random() * 2 + 1),
      2000,
      COLORS.walking
    ));
  }

  addDash(position: Vector, direction: number) {
    for (let i = 0; i < 12; i++) {
      this.list.push(new Particle(
        Math.random() * 0.1 + 0.1,
        Math.floor(Math.random() * 4 + 2),
        position.get().add(new Vector(Math.random() * 20 - 10, Math.random() * 40)),
        new Vector(-direction * (Math.random() * 12 + 6), Math.random() * 4 - 2),
        400,
        'rgba(160, 192, 255, 0.6)'
      ));
    }
  }

  dying(position: Vector, colors: string[]) {
    for (let i = 0; i < 30; i++) {
      this.list.push(new Particle(
        Math.random() * 0.2 + 0.1,
        Math.floor(Math.random() * 7 + 3),
        position.get(),
        new Vector(
          (Math.random() * 1.5 + 0.5) * Math.sin(Math.random() * Math.PI * 2),
          (Math.random() * 1 + 3) * Math.cos(Math.random() * Math.PI * 2)
        ),
        500,
        colors[Math.floor(Math.random() * colors.length)]
      ));
    }
  }

  takePower(position: Vector) {
    for (let i = 0; i < 30; i++) {
      this.list.push(new Particle(
        Math.random() * 0.2 + 0.1,
        Math.floor(Math.random() * 3 + 1),
        position.get(),
        new Vector(
          (Math.random() * 1.5 + 0.5) * Math.sin(Math.random() * Math.PI * 2),
          (Math.random() * 1 + 3) * Math.cos(Math.random() * Math.PI * 2)
        ),
        500,
        COLORS.power
      ));
    }
  }

  n(gravity: Vector) {
    this.list = this.list.filter(p => {
      p.n(gravity);
      return p.isActive;
    });
  }

  r(ctx: CanvasRenderingContext2D) {
    this.list.forEach(p => p.r(ctx));
  }
}

export abstract class BaseBlock {
  type: number;
  x: number;
  y: number;
  w: number;
  h: number;
  active: boolean = true;
  collisionRadius: number = 0;

  constructor(type: number, x: number, y: number, w: number, h: number) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  abstract n(ps?: ParticleSystem): void;
  abstract r(ctx: CanvasRenderingContext2D): void;
  
  center(): Vector {
    return new Vector(this.x + this.w / 2, this.y + this.h / 2);
  }

  getVelocity(): Vector {
    return new Vector(0, 0);
  }
}

export class Block extends BaseBlock {
  d: Vector;
  isMovable: boolean;
  original: Vector;
  shift: number = 0;
  step: number;
  direction: number = 1;
  speed: number = 2;

  constructor(type: number, x: number, y: number, w: number, h: number, d: Vector) {
    super(type, x, y, w, h);
    this.d = d;
    this.isMovable = d.mag() > 0;
    this.original = new Vector(x, y);
    this.step = this.isMovable ? 1 / Math.floor(d.mag() / this.speed) : 0;
  }

  n() {
    if (this.isMovable) {
      const current = this.original.get().add(this.d.get().mult(this.shift));
      this.x = current.x;
      this.y = current.y;
      if (this.shift > 1 || this.shift < 0) {
        this.direction *= -1;
      }
      this.shift += this.step * this.direction;
    }
  }

  getVelocity(): Vector {
    return this.d.get().normalize().mult(this.speed * this.direction);
  }

  r(ctx: CanvasRenderingContext2D) {
    if (this.isMovable) {
      const gHolder = [[[12,0,0,22,11,40,40,36,40,4],'','black',1],[[19,16,16,20,19,24,24,23,26,17],'','mechanics',1]];
      ctx.save();
      ctx.translate(this.original.x + this.w / 2, this.original.y + this.h / 2);
      draw(ctx, gHolder, [40, 40]);
      ctx.restore();

      ctx.save();
      ctx.translate(this.original.x + this.d.x + this.w / 2, this.original.y + this.d.y + this.h / 2);
      draw(ctx, gHolder, [40, 40]);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = COLORS.mechanics;
      ctx.beginPath();
      ctx.moveTo(this.original.x + this.w / 2, this.original.y + this.h / 2);
      ctx.lineTo(this.original.x + this.d.x + this.w / 2, this.original.y + this.d.y + this.h / 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.type === 1) {
      const nails = [[[0,8,40,8,35,0,34,6,23,1,21,5,15,7,11,1,8,6,3,1],'danger','danger',1]];
      // TOP
      ctx.save();
      ctx.scale(1, -1);
      ctx.translate(-20, -this.h - 4);
      for (let i = 0; i < Math.floor(this.w / 40); i++) {
        ctx.translate(40, 0);
        draw(ctx, nails, [40, 8]);
      }
      ctx.restore();
      // BOTTOM
      ctx.save();
      ctx.translate(-20, -4);
      for (let i = 0; i < Math.floor(this.w / 40); i++) {
        ctx.translate(40, 0);
        draw(ctx, nails, [40, 8]);
      }
      ctx.restore();
      // RIGHT
      ctx.save();
      ctx.rotate(Math.PI / 2);
      ctx.translate(-20, -this.w - 4);
      for (let i = 0; i < Math.floor(this.h / 40); i++) {
        ctx.translate(40, 0);
        draw(ctx, nails, [40, 8]);
      }
      ctx.restore();
      // LEFT
      ctx.save();
      ctx.rotate(-Math.PI / 2);
      ctx.translate(-this.h - 20, -4);
      for (let i = 0; i < Math.floor(this.h / 40); i++) {
        ctx.translate(40, 0);
        draw(ctx, nails, [40, 8]);
      }
      ctx.restore();
      ctx.fillStyle = COLORS.black;
      ctx.fillRect(0, 0, this.w, this.h);
    } else {
      const colors = [COLORS.black, COLORS.black, COLORS.ice, COLORS.black];
      ctx.fillStyle = colors[this.type] || COLORS.black;
      ctx.fillRect(0, 0, this.w, this.h);
    }
    ctx.restore();
  }
}

export class BrokenBlock extends BaseBlock {
  d: Vector;
  isMovable: boolean;
  original: Vector;
  shift: number = 0;
  step: number;
  direction: number = 1;
  speed: number = 2;
  falling = {
    active: false,
    falling: false,
    dead: false,
    position: new Vector(),
    velocity: new Vector(),
    opacity: 1,
    start: 0
  };

  constructor(type: number, x: number, y: number, w: number, h: number, d: Vector) {
    super(type, x, y, w, h);
    this.d = d;
    this.isMovable = d.mag() > 0;
    this.original = new Vector(x, y);
    this.step = this.isMovable ? 1 / Math.floor(d.mag() / this.speed) : 0;
  }

  startFalling(sfx: SFX) {
    if (this.falling.active) return;
    sfx.fallingBlock();
    this.falling.active = true;
    this.falling.start = Date.now();
  }

  n(ps?: ParticleSystem) {
    if (this.isMovable && !this.falling.falling) {
      const current = this.original.get().add(this.d.get().mult(this.shift));
      this.x = current.x;
      this.y = current.y;
      if (this.shift > 1 || this.shift < 0) {
        this.direction *= -1;
      }
      this.shift += this.step * this.direction;
    }

    if (this.falling.active && !this.falling.falling) {
      if (Date.now() - this.falling.start < 1000) return;
      this.falling.falling = true;
      this.active = false;
      this.falling.position = new Vector(this.x, this.y);
    } else if (this.falling.falling && !this.falling.dead) {
      const acc = this.falling.velocity.get().normalize().mult(-0.017);
      acc.add(new Vector(0, -0.8).mult(0.3)); // Gravity
      this.falling.velocity.add(acc);
      this.falling.position.add(this.falling.velocity);
      this.x = this.falling.position.x;
      this.y = this.falling.position.y;
      this.falling.opacity -= 0.04;
      if (this.falling.opacity < 0) {
        this.falling.dead = true;
        this.falling.opacity = 0;
        setTimeout(() => {
          this.falling.active = false;
          this.falling.falling = false;
          this.falling.velocity = new Vector();
          this.falling.dead = false;
          this.active = true;
          this.x = this.original.x;
          this.y = this.original.y;
        }, 2000);
      }
    }

    if (!this.falling.active) {
      this.falling.opacity += 0.05;
      if (this.falling.opacity > 1) this.falling.opacity = 1;
    }
  }

  r(ctx: CanvasRenderingContext2D) {
    const g = [[[0,0,40,0,39,33,33,29,26,37,16,31,9,29,7,38,0,34],'','black',1]];
    const gHolder = [[[12,0,0,22,11,40,40,36,40,4],'','black',1],[[19,16,16,20,19,24,24,23,26,17],"",'mechanics',1]];

    if (this.isMovable) {
      ctx.save();
      ctx.translate(this.original.x + this.w / 2, this.original.y + this.h / 2);
      draw(ctx, gHolder, [40, 40]);
      ctx.restore();

      ctx.save();
      ctx.translate(this.original.x + this.d.x + this.w / 2, this.original.y + this.d.y + this.h / 2);
      draw(ctx, gHolder, [40, 40]);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = COLORS.mechanics;
      ctx.beginPath();
      ctx.moveTo(this.original.x + this.w / 2, this.original.y + this.h / 2);
      ctx.lineTo(this.original.x + this.d.x + this.w / 2, this.original.y + this.d.y + this.h / 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x + 20, this.y + 20);
    ctx.globalAlpha = this.falling.opacity;
    ctx.scale(1, -1);
    for (let i = 0; i < Math.floor(this.w / 40); i++) {
      ctx.save();
      if (this.falling.active) {
        ctx.translate(Math.floor(Math.random() * 3 - 1), Math.floor(Math.random() * 3 - 1));
      } else {
        ctx.translate(i * 40, 0);
      }
      draw(ctx, g, [40, 38]);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

export class SawBlock extends BaseBlock {
  d: Vector;
  original: Vector;
  shift: number = 0;
  step: number;
  direction: number = 1;
  speed: number = 6;
  angle: number = 0;
  acc: number = -0.015;
  velocity: number = 0;
  currentFunc: number = 0;

  constructor(type: number, x: number, y: number, w: number, h: number, d: Vector) {
    super(type, x, y, w, h);
    this.d = d;
    this.original = new Vector(x, y);
    this.step = 1 / Math.floor(d.mag() / this.speed);
    this.collisionRadius = 35;
  }

  n(ps?: ParticleSystem) {
    if (this.currentFunc === 0) {
      this.velocity += this.acc;
      this.angle += this.velocity;
      if (this.velocity <= -0.5) this.currentFunc = 1;
    } else {
      this.velocity *= 0.97;
      this.angle += this.velocity;
      const current = this.original.get().add(this.d.get().mult(this.shift));
      this.x = current.x;
      this.y = current.y;
      if (this.shift > 1 || this.shift < 0) {
        this.direction *= -1;
        this.currentFunc = 0;
      }
      this.shift += this.step * this.direction;
    }
  }

  r(ctx: CanvasRenderingContext2D) {
    const g = [[[19,0,28,11,27,21,13,17,0,28,12,26,20,34,10,39,7,56,16,45,24,46,22,56,36,68,32,56,39,48,48,58,65,56,53,50,49,40,63,43,76,30,62,33,52,27,64,16,54,0,54,12,41,19,33,4],'danger','danger',1]];
    const gHolder = [[[6,6,0,22,7,37,23,41,36,35,40,22,36,7,21,0],'','black',1],[[20,17,17,21,20,24,24,23,26,18],'','mechanics',1]];

    ctx.save();
    ctx.translate(this.x + 18, this.y + 18);
    ctx.scale(1, -1);
    ctx.rotate(this.angle);
    draw(ctx, g, [76, 68]);
    ctx.restore();

    ctx.save();
    ctx.translate(this.original.x + 18, this.original.y + 18);
    draw(ctx, gHolder, [40, 40]);
    ctx.restore();

    ctx.save();
    ctx.translate(this.original.x + this.d.x + 18, this.original.y + this.d.y + 18);
    draw(ctx, gHolder, [40, 40]);
    ctx.restore();
  }
}

export class FanBlock extends BaseBlock {
  fanLast: number = Date.now();
  anim: Animation;

  constructor(type: number, x: number, y: number) {
    super(type, x, y, 120, 81);
    this.anim = new Animation(
      [[[1,56,118,55,109,44,9,45],'black','black',1],[[0,50,0,81,120,81,120,50],'black','black',1],[[8,60,7,66,11,69,15,68,15,62],'','mechanics',1],[[103,59,108,62,107,68,100,69,99,62],'','mechanics',1],[[18,45,14,34,14,27,12,18,15,11,18,1,19,1,17,11,14,17,17,26,18,34,20,44],'black','black',1],[[30,46,27,37,29,30,25,15,29,6,29,0,32,0,31,6,27,15,31,29,30,37,33,45],'black','black',1],[[62,45,64,44,63,30,61,21,64,12,65,1,62,1,60,11,58,21,61,30],'black','black',1],[[90,45,92,45,91,37,92,26,95,17,94,8,94,2,91,2,92,9,92,16,88,25,88,37],'black','black',1]],
      [[0,0,0,0,[18,45,23,34,24,26,23,20,13,19,10,13,13,8,16,16,26,17,27,26,25,35,20,44],[30,46,37,37,39,30,41,16,44,9,36,1,41,1,47,8,44,17,42,29,41,37,33,45],[62,45,64,44,58,30,67,26,73,21,63,10,62,17,69,20,64,24,56,31],[90,45,92,45,95,37,101,24,99,16,92,10,85,5,82,6,88,13,96,17,99,25,92,37]],[0,0,0,0,[17,45,9,35,4,29,2,19,3,12,18,13,19,16,7,14,6,20,9,28,14,35,19,44],[30,46,24,38,21,31,12,20,7,14,1,10,4,8,12,14,17,20,25,30,27,38,33,45],[62,45,64,44,70,31,65,18,56,13,44,10,42,13,52,15,62,20,67,32],[90,45,92,45,88,36,83,28,83,21,86,13,94,14,93,9,84,12,79,20,79,28,84,36]]],
      Math.floor(Math.random() * 100 + 100)
    );
  }

  n(ps: ParticleSystem) {
    if (Date.now() - this.fanLast < 100) return;
    ps.addFan(new Vector(this.x, this.y));
    this.fanLast = Date.now();
  }

  r(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x + 60, this.y + 41);
    ctx.scale(1, -1);
    draw(ctx, this.anim.next(), [120, 81]);
    ctx.restore();
  }
}

export class PowerBlock extends BaseBlock {
  anim: Animation;
  startBeingInactive: number = 0;
  opacity: number = 1;

  constructor(type: number, x: number, y: number) {
    super(type, x, y, 36, 37);
    this.collisionRadius = 35;
    this.anim = new Animation([[[18,0,18,37,0,17],'','power',1]], [[[18,4,18,42,36,21]]], 500);
  }

  destroy(ps: ParticleSystem, sfx: SFX) {
    this.active = false;
    this.opacity = 0;
    this.startBeingInactive = Date.now();
    ps.takePower(new Vector(this.x, this.y));
    sfx.takePower();
  }

  n(ps?: ParticleSystem) {
    if (!this.active && Date.now() - this.startBeingInactive >= 4000) {
      this.active = true;
    }
    if (this.active) {
      this.opacity += 0.03;
      if (this.opacity > 1) this.opacity = 1;
    }
  }

  r(ctx: CanvasRenderingContext2D) {
    if (this.active) {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.translate(this.x, this.y);
      ctx.scale(1, -1);
      draw(ctx, this.anim.next(), [36, 37]);
      ctx.restore();
    }
  }
}
