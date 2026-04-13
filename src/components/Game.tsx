import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../lib/gameEngine';
import { RotateCcw, ArrowLeft, ArrowRight, ArrowUp, Zap, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';

export const Game: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine>(new GameEngine());
  const [quality, setQuality] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const pressedRef = useRef<[number, number, number, number]>([0, 0, 0, 0]);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('resize', checkDevice);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'KeyA' || event.code === 'ArrowLeft') pressedRef.current[0] = 1;
      if (event.code === 'KeyW' || event.code === 'Space' || event.key === 'ArrowUp') pressedRef.current[1] = 1;
      if (event.code === 'KeyD' || event.code === 'ArrowRight') pressedRef.current[2] = 1;
      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight' || event.code === 'KeyK') pressedRef.current[3] = 1;

      if (event.code === 'Digit1') setQuality(1);
      if (event.code === 'Digit2') setQuality(0.75);
      if (event.code === 'Digit3') setQuality(0.5);
      if (event.code === 'Digit4') setQuality(0.3);
      
      if (event.code === 'KeyP') {
        engineRef.current.paused = !engineRef.current.paused;
        setIsPaused(engineRef.current.paused);
      }
      
      if (event.code === 'KeyM') {
        setMuted(prev => !prev);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'KeyA' || event.code === 'ArrowLeft') pressedRef.current[0] = 0;
      if (event.code === 'KeyW' || event.code === 'Space' || event.code === 'ArrowUp') pressedRef.current[1] = 0;
      if (event.code === 'KeyD' || event.code === 'ArrowRight') pressedRef.current[2] = 0;
      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight' || event.code === 'KeyK') pressedRef.current[3] = 0;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    engineRef.current.sfx.setMuted(muted);
    engineRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      const size = { x: window.innerWidth, y: window.innerHeight };
      const originalRatio = Math.min(size.x / 1280, size.y / 720);
      canvas.style.width = Math.round(1280 * originalRatio) + 'px';
      canvas.style.height = Math.round(720 * originalRatio) + 'px';
      
      const ratio = originalRatio * (window.devicePixelRatio || 1);
      canvas.width = Math.round(1280 * ratio * quality);
      canvas.height = Math.round(720 * ratio * quality);
      
      return { ratio };
    };

    const loop = () => {
      const { ratio } = resize();
      
      engineRef.current.update(pressedRef.current);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      engineRef.current.render(ctx, ratio, quality);
      
      if (engineRef.current.paused) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(1, -1);
        ctx.font = 'bold 60px "Courier New", Courier, monospace';
        ctx.fillStyle = "#f0f0ff";
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', 0, 0);
        ctx.restore();
      }
      
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [quality]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (1280 / rect.width);
    const y = 720 - (e.clientY - rect.top) * (720 / rect.height);

    if (engineRef.current.splashScreen) {
      engineRef.current.handleSplashClick(x, y);
      
      // Auto-fullscreen on game start (must be triggered by user gesture)
      if (!engineRef.current.splashScreen) {
        toggleFullscreen();
      }
      return;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleTouch = (index: number, value: number) => {
    pressedRef.current[index] = value;
  };

  const togglePause = () => {
    engineRef.current.paused = !engineRef.current.paused;
    setIsPaused(engineRef.current.paused);
  };

  const toggleMute = () => {
    setMuted(prev => !prev);
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden flex justify-center items-center bg-black relative"
      style={{ touchAction: 'none' }}
    >
      {isPortrait && isMobile && (
        <div className="absolute inset-0 z-50 bg-[#0a0b1a] flex flex-col items-center justify-center text-white p-6 text-center">
          <RotateCcw className="w-16 h-16 mb-4 animate-spin-slow text-[#a0c0ff]" />
          <h2 className="text-2xl font-bold mb-2 font-mono">LANDSCAPE MODE REQUIRED</h2>
          <p className="text-sm opacity-70 font-mono">Please rotate your device to play SHINOBI: Shadow Path</p>
        </div>
      )}

      <canvas
        id="app"
        ref={canvasRef}
        onClick={handleClick}
        style={{ transform: 'rotateX(180deg)', cursor: 'pointer' }}
      />

      {/* Mobile Controls Overlay */}
      {isMobile && !engineRef.current.splashScreen && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-8">
          {/* Top Utility Buttons */}
          <div className="flex justify-between items-start pointer-events-auto">
            <div className="flex gap-3">
              <button 
                onPointerDown={togglePause}
                className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md active:bg-white/30 transition-all border border-white/20"
              >
                {isPaused ? <Play className="text-white w-6 h-6" /> : <Pause className="text-white w-6 h-6" />}
              </button>
              <button 
                onPointerDown={toggleMute}
                className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md active:bg-white/30 transition-all border border-white/20"
              >
                {muted ? <VolumeX className="text-white w-6 h-6" /> : <Volume2 className="text-white w-6 h-6" />}
              </button>
              <button 
                onPointerDown={toggleFullscreen}
                className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md active:bg-white/30 transition-all border border-white/20"
              >
                {isFullscreen ? <Minimize2 className="text-white w-6 h-6" /> : <Maximize2 className="text-white w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Bottom Game Controls */}
          <div className="flex justify-between items-end">
            {/* Movement (Left Side) */}
            <div className="flex gap-4 pointer-events-auto">
              <button 
                onPointerDown={() => handleTouch(0, 1)}
                onPointerUp={() => handleTouch(0, 0)}
                onPointerLeave={() => handleTouch(0, 0)}
                className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center backdrop-blur-sm active:bg-white/20 transition-all border border-white/10 active:scale-95"
              >
                <ArrowLeft className="text-white w-10 h-10 opacity-70" />
              </button>
              <button 
                onPointerDown={() => handleTouch(2, 1)}
                onPointerUp={() => handleTouch(2, 0)}
                onPointerLeave={() => handleTouch(2, 0)}
                className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center backdrop-blur-sm active:bg-white/20 transition-all border border-white/10 active:scale-95"
              >
                <ArrowRight className="text-white w-10 h-10 opacity-70" />
              </button>
            </div>

            {/* Actions (Right Side) */}
            <div className="flex gap-4 pointer-events-auto items-end">
              <button 
                onPointerDown={() => handleTouch(3, 1)}
                onPointerUp={() => handleTouch(3, 0)}
                onPointerLeave={() => handleTouch(3, 0)}
                className="w-20 h-20 bg-[#8b0000]/30 rounded-full flex items-center justify-center backdrop-blur-md active:bg-[#8b0000]/50 transition-all border-2 border-[#8b0000]/40 active:scale-90 shadow-[0_0_20px_rgba(139,0,0,0.3)]"
              >
                <Zap className="text-white w-10 h-10" />
              </button>
              <button 
                onPointerDown={() => handleTouch(1, 1)}
                onPointerUp={() => handleTouch(1, 0)}
                onPointerLeave={() => handleTouch(1, 0)}
                className="w-24 h-24 bg-[#a0c0ff]/10 rounded-full flex items-center justify-center backdrop-blur-md active:bg-[#a0c0ff]/30 transition-all border-2 border-[#a0c0ff]/20 active:scale-90 shadow-[0_0_25px_rgba(160,192,255,0.2)]"
              >
                <ArrowUp className="text-white w-12 h-12" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Instructions Overlay */}
      {!isMobile && (
        <div className="absolute bottom-4 left-4 text-white/50 text-xs font-mono pointer-events-none flex flex-col gap-1">
          <div>WASD / Arrows to Move • Shift/K to Dash • P to Pause • M to Mute</div>
          <div>1-4 for Quality • Complete all 28 levels to restore honor</div>
        </div>
      )}
    </div>
  );
};
