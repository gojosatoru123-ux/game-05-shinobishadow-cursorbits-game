export class Vector {
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  add(v: Vector): Vector {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  angle(v?: Vector): number {
    return v ? Math.atan2(v.y - this.y, v.x - this.x) : Math.atan2(this.y, this.x);
  }

  apply(v: Vector): Vector {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  distance(v: Vector): number {
    return Math.hypot(this.x - v.x, this.y - v.y);
  }

  div(n: number): Vector {
    this.x /= n;
    this.y /= n;
    return this;
  }

  dot(v: Vector): number {
    return this.mag() * v.mag() * Math.cos(this.angle(v));
  }

  get(): Vector {
    return new Vector(this.x, this.y);
  }

  mag(): number {
    return Math.hypot(this.x, this.y);
  }

  mult(n: number): Vector {
    this.x *= n;
    this.y *= n;
    return this;
  }

  normalize(): Vector {
    const m = this.mag();
    if (m > 0) {
      this.div(m);
    }
    return this;
  }

  perpendicular(): Vector {
    const x = this.x;
    this.x = this.y;
    this.y = -x;
    return this;
  }

  round(): Vector {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    return this;
  }

  sub(v: Vector): Vector {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  normal(v: Vector): Vector {
    return new Vector(this.x - v.x, this.y - v.y).perpendicular().normalize();
  }

  center(v: Vector): Vector {
    return new Vector(this.x + (v.x - this.x) / 2, this.y + (v.y - this.y) / 2);
  }
}
