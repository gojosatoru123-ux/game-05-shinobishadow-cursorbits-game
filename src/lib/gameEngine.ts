import { Vector } from './vector';
import { Animation, AnimationFrame } from './anim';
import { COLORS, LEVELS } from './constants';
import { draw, SFX } from './utils';
import { 
  BaseBlock, Block, BrokenBlock, SawBlock, FanBlock, PowerBlock, 
  ParticleSystem, SCALE, MASS, MAX_SPEED, MAX_STAMINA, 
  DASH_STAMINA_COST, DASH_SPEED_BOOST, DASH_DURATION, DASH_COOLDOWN,
  OUT_STAMINA_AT_WALL_JUMP, OUT_STAMINA_AT_WALL 
} from './gameLogic';

const CHARACTER_SIZE = { x: 36, y: 59 };

export class CharacterAnimations {
  gMain: AnimationFrame = [[[0,9,36,0,21,26],'','black',1],[[21,27,34,39,34,59],'','black',1],[[21,27,21,45,8,58],'','black',1],[[22,7,29,6,26,11],'','accent',1]];
  gList: Record<string, any> = {
    stay: [this.gMain, [[[1,12,37,3,22,29],[22,29,35,41,34,59],[22,29,21,47,8,58],[23,10,30,9,27,14]]], 400, false],
    walk: [this.gMain, [[[3,8,41,5,21,28],[21,27,24,44,13,60],[22,26,28,44,21,58],[24,9,31,10,27,14]],[[0,9,36,0,21,26],[21,27,17,44,1,55],[22,26,34,40,32,58],[22,7,29,6,26,11]],[[2,8,39,3,21,28],[21,26,30,41,25,60],[21,27,25,45,14,60],[23,8,31,9,26,13]]], 110],
    slowWalk: [this.gMain, [[[3,8,41,5,21,28],[21,27,24,44,13,60],[22,26,28,44,21,58],[24,9,31,10,27,14]],[[0,9,36,0,21,26],[21,27,17,44,1,55],[22,26,34,40,32,58],[22,7,29,6,26,11]],[[2,8,39,3,21,28],[21,26,30,41,25,60],[21,27,25,45,14,60],[23,8,31,9,26,13]]], 320],
    jump: [this.gMain, [[[1,5,36,-7,24,20],[24,20,26,39,17,59],[24,21,20,41,8,58],[24,1,30,-2,28,4]],[[2,4,39,-5,23,21],[23,21,27,36,17,52],[23,21,23,40,11,53],[25,2,32,0,29,6]]], 150, true],
    drop: [this.gMain, [[[1,21,38,22,17,44],[17,43,38,46,26,58],[16,42,22,56,8,58],[21,25,28,26,24,30]],[0,0,0,0]], 120, true],
    sit: [this.gMain, [[[1,21,38,22,17,44],[17,43,38,46,26,58],[16,42,22,56,8,58],[21,25,28,26,24,30]]], 400, true],
    wall: [[[[0,2,34,0,20,21],'','black',1],[[20,20,40,30,34,14],'','black',1],[[19,20,32,33,38,53],'','black',1],[[12,9,7,4,14,4],'','accent',1]], []],
    fall: [[[[3,0,39,10,13,26],'','black',1],[[13,25,26,38,26,57],'','black',1],[[13,25,13,44,0,57],'','black',1],[[23,8,30,10,25,13],'','accent',1]], [[0,[13,25,29,33,28,52],[13,25,8,43,-7,51],0]], 150],
    die: [this.gMain, [[[3,56,27,27,31,58],[66,46,57,60,34,59],[-29,57,-8,49,7,59],[21,40,25,34,26,41]]], 1000, true],
    flying: [[[[38,0,63,28,32,27],'','black',1],[[32,26,21,40,2,42],'','black',1],[[32,26,13,27,0,14],'','black',1],[[51,19,56,24,50,24],'','accent',1]], [[[33,0,62,23,32,27],[32,27,18,37,-2,28],[32,26,14,23,7,9],[48,17,55,19,49,22]]], 500],
    dancing: [this.gMain, [[[20,-2,49,22,18,25],[19,25,35,32,22,43],[19,25,16,44,1,58],[36,15,42,19,36,20]],[[4,10,38,-6,28,23],[27,23,24,40,7,56],[26,23,30,41,24,56],[27,2,33,-1,31,5]],[[17,-4,50,14,21,23],[21,23,21,41,8,56],[21,24,38,31,25,40],[35,9,41,13,35,14]]], 250],
    dash: [this.gMain, [[[10,15,45,15,25,25],[25,25,45,45,40,60],[25,25,15,45,5,55],[28,10,35,10,32,15]]], 150, true]
  };

  current: Animation;
  currentName: string = 'stay';
  mirrored: boolean = false;
  nextAnim: string | null = null;
  isBlocked: boolean = false;

  constructor() {
    this.current = new Animation(...(this.gList.stay as [AnimationFrame, any[], number?, boolean?]));
  }

  mirror(value: boolean) {
    this.mirrored = value;
  }

  to(name: string, sfx: SFX, blocked: boolean = false, force: boolean = false) {
    if (name === 'walk') sfx.run();
    else if (name === 'wall') sfx.wall();
    else if (name === 'flying') sfx.flying();
    
    if (this.currentName === name) return;
    
    if (name === 'jump') sfx.jump();
    else if (name === 'drop') sfx.fall();
    else if (name === 'die') sfx.die();
    else if (name === 'dash') sfx.dash();
    
    if (this.isBlocked && !force) {
      this.nextAnim = name;
    } else {
      this.current = new Animation(...(this.gList[name] as [AnimationFrame, any[], number?, boolean?]));
      this.currentName = name;
      this.isBlocked = blocked;
    }
  }

  r(ctx: CanvasRenderingContext2D, position: Vector, scale: number = 1) {
    ctx.save();
    ctx.translate(position.x + (CHARACTER_SIZE.x / 2), position.y + (CHARACTER_SIZE.y / 2));
    ctx.scale(this.mirrored ? -scale : scale, -scale);
    draw(ctx, this.current.next(), [CHARACTER_SIZE.x, CHARACTER_SIZE.y]);
    ctx.restore();
    
    if (this.isBlocked && this.current.getIsFinished()) {
      if (this.nextAnim) {
        this.current = new Animation(...(this.gList[this.nextAnim] as [AnimationFrame, any[], number?, boolean?]));
        this.currentName = this.nextAnim;
        this.nextAnim = null;
        this.isBlocked = false;
      }
    }
  }
}

export class GameEngine {
  res = { x: 1280, y: 720 };
  gravity = new Vector(0, -0.8);
  paused = false;
  splashScreen = true;
  muted = false;
  currentLevel = 0;
  savedLevel = 0;
  backward = false;
  score = 0;
  highScore = 0;
  deaths = 0;
  levelStartTime = Date.now();
  
  levelClear = { active: false, time: 0 };
  gameOver = { active: false, time: 0 };
  
  characterPos = new Vector();
  characterVel = new Vector();
  characterStamina = MAX_STAMINA;
  characterDie = { dying: false, isDead: false };
  characterInAir = false;
  characterJump = { first: true, second: false, done: false };
  characterLevelCompleted = false;
  characterGoingBack = false;
  characterLastMove = Date.now();
  characterIsRelaxing = false;
  
  characterDash = { active: false, startTime: 0, lastTime: 0, direction: 1 };
  
  atFinalPosition = false;
  finalOpacity = 1;
  
  cameraPos = new Vector();
  
  mapData: { map: BaseBlock[], enemy: BaseBlock[], start: Vector, end: Vector } = { map: [], enemy: [], start: new Vector(), end: new Vector() };
  ps = new ParticleSystem();
  sfx = new SFX();
  charAnims = new CharacterAnimations();
  
  // Final scene state
  finalSceneStarted = false;
  finalSceneStartTime = 0;
  finalScenePos = new Vector(1000, 147);
  finalSceneVel = new Vector();
  finalSceneAngle = 0;
  finalSceneScale = 3;
  finalSceneAnim: Animation | null = null;

  constructor() {
    this.highScore = parseInt(localStorage.getItem('shinobi_highscore') || '0');
    this.savedLevel = parseInt(localStorage.getItem('shinobi_lastlevel') || '0');
    this.initLevel();
  }

  initLevel() {
    this.levelStartTime = Date.now();
    this.levelClear.active = false;
    this.mapData = { map: [], enemy: [], start: new Vector(), end: new Vector() };
    const level = LEVELS[this.currentLevel];
    level.forEach((item: any) => {
      const type = item[0];
      const x = item[1] * SCALE;
      const y = item[2] * SCALE;
      const w = item[3] * SCALE;
      const h = item[4] * SCALE;
      const d = (typeof item[5] !== 'undefined' ? new Vector(item[5], item[6]) : new Vector()).mult(SCALE);

      if (type === 4) this.mapData.map.push(new BrokenBlock(type, x, y, w, h, d));
      else if (type === 5) this.mapData.enemy.push(new SawBlock(type, x, y, w, h, d));
      else if (type === 6) this.mapData.start = new Vector(x, y);
      else if (type === 7) this.mapData.end = new Vector(x, y);
      else if (type === 3) this.mapData.enemy.push(new PowerBlock(type, x, y));
      else if (type === 8) this.mapData.enemy.push(new FanBlock(type, x, y));
      else this.mapData.map.push(new Block(type, x, y, w, h, d));
    });
    this.resetCharacter();
  }

  resetCharacter() {
    this.characterVel = new Vector();
    this.characterPos = (this.backward ? this.mapData.end : this.mapData.start).get();
    this.characterStamina = MAX_STAMINA;
    this.charAnims.mirror(this.characterPos.x !== 0);
    this.characterDie = { dying: false, isDead: false };
    this.charAnims.to('stay', this.sfx);
    this.characterInAir = false;
    this.characterLevelCompleted = false;
    this.characterGoingBack = false;
    this.cameraPos = new Vector(this.characterPos.x - this.res.x / 2, this.characterPos.y - this.res.y / 2);
    this.clampCamera();
  }

  clampCamera() {
    if (this.cameraPos.x < 0) this.cameraPos.x = 0;
    if (this.cameraPos.x + this.res.x > this.mapData.end.x + 40) this.cameraPos.x = this.mapData.end.x + 40 - this.res.x;
    if (this.cameraPos.y < 0) this.cameraPos.y = 0;
  }

  update(pressed: [number, number, number, number]) {
    if (this.paused || this.splashScreen) return;

    // Check for level transitions or death reset
    if (this.characterGoingBack) {
      this.paused = true;
      setTimeout(() => {
        this.backward = true;
        this.currentLevel--;
        this.initLevel();
        this.paused = false;
      }, 30);
      return;
    } 
    if (this.characterLevelCompleted) {
      this.paused = true;
      setTimeout(() => {
        this.backward = false;
        this.currentLevel++;
        localStorage.setItem('shinobi_lastlevel', this.currentLevel.toString());
        this.initLevel();
        this.paused = false;
      }, 100);
      return;
    }
    if (this.characterDie.isDead) {
      this.paused = true;
      this.deaths++;
      setTimeout(() => {
        this.resetCharacter();
        this.paused = false;
      }, 30);
      return;
    }

    if (this.isLastLevel()) {
      this.updateFinal(pressed);
    } else {
      this.updateGame(pressed);
    }
    
    this.ps.n(this.gravity);
    this.updateCamera();
  }

  updateGame(pressed: [number, number, number, number]) {
    if (this.characterDie.dying) {
      this.charAnims.to('die', this.sfx, false, true);
      const acc = this.characterVel.get().normalize().mult(-0.017);
      acc.add(this.gravity.get().mult(MASS / 2));
      this.characterVel.add(acc);
      this.characterPos.add(this.characterVel);
      return;
    }

    const acc = this.characterVel.get().normalize().mult(-0.017);
    acc.add(this.gravity.get().mult(MASS));

    if (pressed[0]) {
      acc.add(new Vector(-1, 0));
      this.charAnims.mirror(true);
      this.characterDash.direction = -1;
    } else if (pressed[2]) {
      acc.add(new Vector(1, 0));
      this.charAnims.mirror(false);
      this.characterDash.direction = 1;
    }

    // Dash Logic
    if (pressed[3] && !this.characterDash.active && Date.now() - this.characterDash.lastTime > DASH_COOLDOWN && this.characterStamina >= DASH_STAMINA_COST) {
      this.characterDash.active = true;
      this.characterDash.startTime = Date.now();
      this.characterDash.lastTime = Date.now();
      this.characterStamina -= DASH_STAMINA_COST;
      this.characterVel.x = this.characterDash.direction * DASH_SPEED_BOOST;
      this.charAnims.to('dash', this.sfx, true, true);
    }

    if (this.characterDash.active) {
      if (Date.now() - this.characterDash.startTime > DASH_DURATION) {
        this.characterDash.active = false;
      } else {
        this.ps.addDash(this.characterPos, this.characterDash.direction);
        // Maintain dash speed during duration
        this.characterVel.x = this.characterDash.direction * DASH_SPEED_BOOST;
        this.characterVel.y = 0; // Dash is horizontal
      }
    }

    this.characterVel.add(acc);
    this.characterVel.x = Math.abs(this.characterVel.x) < MAX_SPEED ? this.characterVel.x : ((Math.abs(this.characterVel.x) / this.characterVel.x) * MAX_SPEED);
    this.characterPos.add(this.characterVel);

    const collisionResult = this.checkCollision();

    collisionResult.touches.forEach((item: any) => {
      if (item.type === 1) {
        if (this.characterVel.y > 0) this.characterVel.y = 0;
        this.toDie();
        return;
      }

      if (item.side === 0 && this.characterVel.y <= 0) {
        this.characterStamina += 0.3;
        if (this.characterStamina > MAX_STAMINA) this.characterStamina = MAX_STAMINA;
        this.characterPos.y = item.intersect;
        this.characterVel.y = 0;
        this.characterPos.add(item.velocity);

        if (!pressed[0] && !pressed[2]) {
          if (item.type === 2) this.characterVel.x /= 1.02;
          else this.characterVel.x /= 2;
        }
        if (Math.abs(this.characterVel.x) > 0.1) {
          this.ps.addRunning(this.characterPos, this.characterVel);
        }
      }

      if (item.side === 1) {
        this.characterPos.x = item.intersect;
        if (pressed[0] && this.characterVel.y < 0 && this.characterStamina > 0 && collisionResult.sides.indexOf(0) === -1) {
          this.characterVel = item.velocity;
          this.charAnims.to('wall', this.sfx);
          this.ps.addWall(this.characterPos, -1);
          this.characterStamina -= OUT_STAMINA_AT_WALL;

          if (pressed[1]) {
            if (this.characterJump.first) {
              this.characterVel.add(new Vector(20, 15));
              this.charAnims.to('jump', this.sfx, false, true);
              this.characterJump.first = false;
              this.characterStamina -= OUT_STAMINA_AT_WALL_JUMP;
            }
          } else {
            this.characterJump.first = true;
          }
        }
      }

      if (item.side === 3) {
        this.characterPos.x = item.intersect;
        if (pressed[2] && this.characterVel.y < 0 && this.characterStamina > 0 && collisionResult.sides.indexOf(0) === -1) {
          this.characterVel = item.velocity;
          this.charAnims.to('wall', this.sfx);
          this.ps.addWall(this.characterPos, 1);
          this.characterStamina -= OUT_STAMINA_AT_WALL;

          if (pressed[1]) {
            if (this.characterJump.first) {
              this.characterVel.add(new Vector(-20, 15));
              this.charAnims.to('jump', this.sfx, false, true);
              this.characterJump.first = false;
              this.characterStamina -= OUT_STAMINA_AT_WALL_JUMP;
            }
          } else {
            this.characterJump.first = true;
          }
        }
      }
      if (item.side === 2) {
        this.characterPos.y = item.intersect;
        this.characterVel.y = this.characterVel.y >= 0 ? 0 : this.characterVel.y;
      }
    });

    if (collisionResult.sides.indexOf(0) !== -1 && this.characterVel.y <= 0) {
      if (pressed[0] || pressed[2]) {
        this.charAnims.to('walk', this.sfx);
      } else if (!this.characterIsRelaxing) {
        this.charAnims.to('stay', this.sfx);
      }

      if (pressed[1]) {
        if (this.characterJump.first) {
          this.characterVel.add(new Vector(0, 15));
          this.charAnims.to('jump', this.sfx, false, true);
          this.characterJump.first = false;
        }
      }

      if (!this.characterJump.first && !pressed[1]) {
        this.characterJump.first = true;
        this.characterJump.second = false;
        this.characterJump.done = false;
      }

      if (this.characterInAir) {
        this.charAnims.to('drop', this.sfx, true);
        this.ps.addJump(this.characterPos, this.characterVel.x);
        this.characterInAir = false;
      }
    } else {
      this.characterInAir = true;
    }

    if ((!collisionResult.sides.length || this.characterStamina < 0) && this.characterVel.y < 0) {
      if (!collisionResult.isOverFan) {
        this.charAnims.to('fall', this.sfx);
      }

      if (pressed[1] && (this.characterJump.second || this.characterJump.first)) {
        this.characterVel.apply(new Vector(0, 15));
        this.charAnims.to('jump', this.sfx, false, true);
        this.characterJump.first = false;
        this.characterJump.second = false;
        this.characterJump.done = true;
      }

      if (!pressed[1] && !this.characterJump.first && !this.characterJump.done) {
        this.characterJump.second = true;
      }
    }

    if (!pressed[1] && this.characterVel.y > 0) {
      this.characterVel.y /= 1.2;
    }

    if (this.characterPos.x < 0 && this.currentLevel === 0) {
      this.characterPos.x = 0;
    } else if (this.characterPos.x + CHARACTER_SIZE.x <= 0) {
      this.characterGoingBack = true;
    }

    if (this.characterPos.y + CHARACTER_SIZE.y < 0) this.toDie(true);

    if (this.characterPos.x >= this.mapData.end.x + 40) {
      if (!this.characterLevelCompleted) {
        this.characterLevelCompleted = true;
        const timeTaken = (Date.now() - this.levelStartTime) / 1000;
        const levelBonus = 500;
        const timeBonus = Math.max(0, Math.floor(1000 - timeTaken * 10));
        this.score += levelBonus + timeBonus;
        if (this.score > this.highScore) {
          this.highScore = this.score;
          localStorage.setItem('shinobi_highscore', this.highScore.toString());
        }
        this.levelClear.active = true;
        this.levelClear.time = Date.now();
      }
    }

    if (pressed[0] || pressed[1] || pressed[2]) {
      this.characterLastMove = Date.now();
    }

    if (Date.now() - this.characterLastMove > 20000) {
      if (!this.characterIsRelaxing) {
        this.characterIsRelaxing = true;
        this.charAnims.to(['dancing', 'sit'][Math.floor(Math.random() * 2)], this.sfx);
      }
    } else {
      this.characterIsRelaxing = false;
    }

    this.mapData.map.forEach(b => b.n(this.ps));
    this.mapData.enemy.forEach(b => b.n(this.ps));
  }

  updateFinal(pressed: [number, number, number, number]) {
    const maxSpeed = 1;
    if (!this.atFinalPosition) {
      this.charAnims.to('slowWalk', this.sfx);
      const acc = this.characterVel.get().normalize().mult(-0.017);
      acc.add(new Vector(0.1, 0));
      this.characterVel.add(acc);
      this.characterVel.x = Math.abs(this.characterVel.x) < maxSpeed ? this.characterVel.x : ((Math.abs(this.characterVel.x) / this.characterVel.x) * maxSpeed);
      this.characterPos.add(this.characterVel);

      if (this.characterPos.x >= 1000 - (CHARACTER_SIZE.x / 2)) {
        this.characterPos.x = 1000 - (CHARACTER_SIZE.x / 2);
        this.atFinalPosition = true;
        this.charAnims.to('dancing', this.sfx);
        setTimeout(() => {
          this.initFinalScene();
        }, 5000);
      }
    } else {
      this.finalOpacity -= 0.004;
      if (this.finalOpacity < 0) this.finalOpacity = 0;
    }

    if (this.finalSceneStarted) {
      if (Date.now() - this.finalSceneStartTime > 2500) {
        this.finalSceneAngle += 0.01;
        if (this.finalSceneAngle > Math.PI / 4) this.finalSceneAngle = Math.PI / 4;
        this.finalSceneScale -= 0.01;
        const acc = this.finalSceneVel.get().normalize().mult(-0.017);
        acc.add(new Vector(-0.2, 0.1));
        this.finalSceneVel.add(acc);
        this.finalScenePos.add(this.finalSceneVel);
      }
    }
  }

  initFinalScene() {
    const g = [[[8,52,11,72,16,36],"","black",1],[[75,36,86,53,80,72],"","black",1],[[39,35,56,35,67,72,26,72],"","rgba(255, 255, 255, .1)",1],[[51,0,0,36,97,37],"","black",1],[[36,17,15,30,33,29],"","red",1],[[65,17,82,31,67,29],"","red",1]];
    this.finalSceneStarted = true;
    this.finalSceneStartTime = Date.now();
    this.finalSceneAnim = new Animation(g as any, [[0,0,[39,35,56,35,56,35,38,35],0,0,0],[[33,32,47,16,16,35],[76,36,56,34,46,16],[39,35,56,35,57,35,38,35],0,0,0]], 2000, true);
  }

  updateCamera() {
    const to = new Vector(this.characterPos.x - this.res.x / 2, this.characterPos.y - this.res.y / 2);
    if (to.x < 0) to.x = 0;
    if (to.x + this.res.x > this.mapData.end.x + 40) to.x = this.mapData.end.x + 40 - this.res.x;
    if (to.y < 0) to.y = 0;
    this.cameraPos.add(to.get().sub(this.cameraPos).mult(0.05));
  }

  checkCollision() {
    const collisionInfo: any = { touches: [], sides: [], isOverFan: false };

    this.mapData.enemy.forEach((block) => {
      if (block instanceof FanBlock) {
        if (this.characterPos.x + (CHARACTER_SIZE.x / 2) > block.x && this.characterPos.x + (CHARACTER_SIZE.x / 2) < block.x + 120 && this.characterPos.y >= block.y - 10) {
          const distance = this.characterPos.y - block.y;
          if (distance < 400) {
            this.characterVel.add(new Vector(0, 3 * (1 - distance / 400)));
            this.charAnims.to('flying', this.sfx);
          }
          collisionInfo.isOverFan = true;
        }
      } else if (block instanceof PowerBlock) {
        if (block.active && block.center().distance(this.characterPos.get().add(new Vector(CHARACTER_SIZE.x / 2, CHARACTER_SIZE.y / 2))) < block.collisionRadius + 20) {
          this.characterJump.done = false;
          this.characterStamina = MAX_STAMINA;
          block.destroy(this.ps, this.sfx);
          this.score += 50;
        }
      } else {
        if (block.center().distance(this.characterPos.get().add(new Vector(CHARACTER_SIZE.x / 2, CHARACTER_SIZE.y / 2))) < block.collisionRadius + 20) {
          this.toDie();
        }
      }
    });

    this.mapData.map.forEach((block) => {
      if (block.active && this.characterPos.x + CHARACTER_SIZE.x > block.x && this.characterPos.x < block.x + block.w && this.characterPos.y < block.y + block.h && this.characterPos.y + CHARACTER_SIZE.y > block.y) {
        const coords = [block.y + block.h, block.x + block.w, block.y - CHARACTER_SIZE.y, block.x - CHARACTER_SIZE.x];
        const distances = [(block.y + block.h) - this.characterPos.y, (block.x + block.w) - this.characterPos.x, (this.characterPos.y + CHARACTER_SIZE.y) - block.y, (this.characterPos.x + CHARACTER_SIZE.x) - block.x];
        const side = distances.indexOf(Math.min(...distances));
        collisionInfo.sides.push(side);
        collisionInfo.touches.push({ side, type: block.type, intersect: coords[side], velocity: block.getVelocity() });
        if (block instanceof BrokenBlock) block.startFalling(this.sfx);
      }
    });

    return collisionInfo;
  }

  toDie(falling: boolean = false) {
    if (this.characterDie.dying) return;
    if (falling) this.ps.dying(this.characterPos.get().add(new Vector(0, CHARACTER_SIZE.y)), [COLORS.dying1, COLORS.dying2, COLORS.dying3, COLORS.dying4]);
    else this.ps.dying(this.characterPos, [COLORS.dying1, COLORS.dying2, COLORS.dying3, COLORS.dying4]);
    this.characterVel = new Vector();
    this.characterDie.dying = true;
    setTimeout(() => { 
      if (this.characterDie.dying) {
        this.characterDie.isDead = true; 
      }
    }, 1000);
  }

  isLastLevel() {
    return this.currentLevel === LEVELS.length - 1;
  }

  render(ctx: CanvasRenderingContext2D, ratio: number, quality: number) {
    ctx.save();
    ctx.scale(ratio * quality, ratio * quality);
    
    // Background
    if (this.splashScreen) {
      this.renderSplashScreen(ctx);
    } else {
      if (this.isLastLevel()) {
        this.renderFinalBackground(ctx);
      } else {
        this.renderGameBackground(ctx);
      }
      
      ctx.save();
      ctx.translate(-this.cameraPos.x, -this.cameraPos.y);
      this.mapData.map.forEach(b => b.r(ctx));
      this.mapData.enemy.forEach(b => b.r(ctx));
      
      if (this.isLastLevel()) {
        this.renderFinalCharacter(ctx);
        this.renderFinalScene(ctx);
      } else {
        this.renderCharacter(ctx);
      }
      
      this.ps.r(ctx);
      ctx.restore();
    }
    
    // UI
    this.renderUI(ctx);
    
    ctx.restore();
  }

  renderSplashScreen(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const bg = ctx.createLinearGradient(0, 0, 0, this.res.y);
    bg.addColorStop(0, '#0a0b1a');
    bg.addColorStop(1, '#1a1c3a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.res.x, this.res.y);
    
    // Moon in splash
    ctx.save();
    ctx.translate(1000, 150);
    ctx.beginPath();
    ctx.arc(0, 0, 80, 0, Math.PI * 2);
    ctx.fillStyle = '#f0f0ff';
    ctx.shadowBlur = 40;
    ctx.shadowColor = '#a0c0ff';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(500, 340);
    ctx.scale(1, -1);
    ctx.font = 'bold 120px "Courier New", Courier, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = "#f0f0ff";
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#a0c0ff';
    ctx.fillText('SHINOBI:', 0, 0);
    ctx.translate(0, 100);
    ctx.font = 'bold 60px "Courier New", Courier, monospace';
    ctx.fillStyle = "#a0c0ff";
    ctx.fillText('Shadow Path', 30, 0);
    ctx.restore();
    
    this.charAnims.r(ctx, new Vector(320, 350), 6);

    if (this.savedLevel > 0 && this.savedLevel < LEVELS.length - 1) {
      // Continue Button
      this.drawSplashButton(ctx, 850, 300, `CONTINUE (Level ${this.savedLevel + 1})`, '#d4af37');
      // New Game Button
      this.drawSplashButton(ctx, 850, 200, 'NEW GAME', '#f0f0ff');
    } else {
      ctx.save();
      ctx.translate(850, 250);
      ctx.scale(1, -1);
      ctx.font = 'bold 30px "Courier New", Courier, monospace';
      ctx.fillStyle = "#f0f0ff";
      ctx.textAlign = 'center';
      ctx.fillText('DRAW YOUR BLADE', 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }

  drawSplashButton(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    const w = 400;
    const h = 60;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    
    ctx.scale(1, -1);
    ctx.font = 'bold 24px "Courier New", Courier, monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  handleSplashClick(x: number, y: number) {
    if (this.savedLevel > 0 && this.savedLevel < LEVELS.length - 1) {
      // Buttons are centered at x=850, width=400
      if (x > 850 - 200 && x < 850 + 200) {
        // Continue Button (y=300)
        if (y > 300 - 30 && y < 300 + 30) {
          this.currentLevel = this.savedLevel;
          this.initLevel();
          this.splashScreen = false;
          this.sfx.init();
          return;
        }
        // New Game Button (y=200)
        if (y > 200 - 30 && y < 200 + 30) {
          this.currentLevel = 0;
          this.initLevel();
          this.splashScreen = false;
          this.sfx.init();
          return;
        }
      }
    } else {
      this.splashScreen = false;
      this.sfx.init();
    }
  }

  renderGameBackground(ctx: CanvasRenderingContext2D) {
    const bg = ctx.createLinearGradient(0, 0, 0, this.res.y);
    bg.addColorStop(0, '#0a0b1a');
    bg.addColorStop(0.6, '#1a1c3a');
    bg.addColorStop(1, '#2a2c4a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.res.x, this.res.y);
    
    // Moon
    ctx.save();
    ctx.translate(1100 - (this.cameraPos.x / 10), 150 - (this.cameraPos.y / 10));
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.fillStyle = '#f0f0ff';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#a0c0ff';
    ctx.fill();
    ctx.restore();

    // Mountains background
    const g1 = [[[0,2,494,0,497,163,469,51,471,144,451,96,447,162,423,65,425,139,385,52,373,146,352,157,350,37,330,130,310,159,290,151,281,38,273,163,262,88,255,141,232,39,215,141,203,162,180,94,174,163,152,157,143,89,117,124,113,172,77,149,74,85,57,164,54,82,32,173,19,60,2,160],'','black',1],[[138,107,124,167,156,194],'','black',1],[[183,116,189,156,182,195,179,154],'','black',1],[[233,63,214,158,232,159],'','black',1],[[236,75,251,151,237,195],'','black',1],[[281,94,279,158,288,162],'','black',1],[[346,76,347,149,353,182,321,199,322,167],'','black',1],[[387,75,374,149,386,149,401,181,401,147,426,150,393,106],'','black',1],[[455,117,455,154,475,158],'','black',1],[[18,88,2,204,23,162],'','black',1],[[50,115,41,163,55,193],'','black',1]];
    ctx.save();
    ctx.translate(2400 - (this.cameraPos.x / 2), 1000 - (this.cameraPos.y / 2));
    ctx.globalAlpha = 0.15;
    ctx.scale(10, -10);
    draw(ctx, g1, [497, 204]);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  renderFinalBackground(ctx: CanvasRenderingContext2D) {
    const bg = ctx.createLinearGradient(0, 0, 0, this.res.y);
    bg.addColorStop(0, '#0a0b1a');
    bg.addColorStop(1, '#1a1c3a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.res.x, this.res.y);
  }

  renderCharacter(ctx: CanvasRenderingContext2D) {
    this.charAnims.r(ctx, this.characterPos);
    if (this.characterStamina < MAX_STAMINA) {
      ctx.save();
      ctx.fillStyle = COLORS.stamina;
      ctx.fillRect(this.characterPos.x - 10, this.characterPos.y + CHARACTER_SIZE.y + 10, Math.max(0, this.characterStamina * 6), 8);
      ctx.restore();
    }
  }

  renderFinalCharacter(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = this.finalOpacity;
    ctx.scale(1, 1 + (1 - this.finalOpacity));
    this.charAnims.r(ctx, this.characterPos);
    ctx.restore();
  }

  renderFinalScene(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(100, 550);
    ctx.scale(1, -1);
    ctx.font = '120px "Courier New", Courier, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = "#8b0000";
    ctx.fillText('HONOR RESTORED', 0, 0);
    ctx.translate(0, 100);
    ctx.font = '60px "Courier New", Courier, monospace';
    ctx.fillStyle = "#e0e0e0";
    ctx.fillText('The path of the shadow is complete.', 10, 0);
    ctx.restore();

    if (this.finalSceneAnim) {
      ctx.save();
      ctx.translate(this.finalScenePos.x, this.finalScenePos.y);
      ctx.scale(this.finalSceneScale, -this.finalSceneScale);
      ctx.rotate(this.finalSceneAngle);
      draw(ctx, this.finalSceneAnim.next(), [97, 72]);
      ctx.restore();
    }
  }

  renderUI(ctx: CanvasRenderingContext2D) {
    // Top Left: Score and Level
    ctx.save();
    ctx.translate(30, 680);
    ctx.scale(1, -1);
    ctx.font = 'bold 24px "Courier New", Courier, monospace';
    ctx.fillStyle = "#f0f0ff";
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${this.score.toString().padStart(6, '0')}`, 0, 0);
    ctx.translate(0, 30);
    ctx.font = 'bold 18px "Courier New", Courier, monospace';
    ctx.fillStyle = "#a0c0ff";
    const displayLevel = Math.min(this.currentLevel + 1, 28);
    ctx.fillText(`LEVEL: ${displayLevel} / 28`, 0, 0);
    ctx.translate(0, 25);
    ctx.fillStyle = "#8b0000";
    ctx.fillText(`DEATHS: ${this.deaths}`, 0, 0);
    ctx.restore();

    // Top Right: High Score
    ctx.save();
    ctx.translate(1250, 680);
    ctx.scale(1, -1);
    ctx.font = 'bold 18px "Courier New", Courier, monospace';
    ctx.fillStyle = "#d4af37";
    ctx.textAlign = 'right';
    ctx.fillText(`HI-SCORE: ${this.highScore.toString().padStart(6, '0')}`, 0, 0);
    ctx.restore();

    // Mute Icon
    ctx.save();
    ctx.translate(1250, 50);
    ctx.scale(0.3, 0.3);
    if (this.muted) {
      draw(ctx, [[[0,23,0,59,30,59,55,75,55,0,30,24],'','white',1]], [55, 75]);
    } else {
      draw(ctx, [[[0,27,0,64,30,63,55,80,55,4,30,28],'','white',1],[[59,28,60,57,65,57,64,28],'','white',1],[[66,18,67,64,71,64,71,19],'','white',1],[[73,8,75,72,80,72,80,8],'','white',1],[[83,0,84,81,89,81,87,0],'','white',1]], [89, 81]);
    }
    ctx.restore();
  }
}
