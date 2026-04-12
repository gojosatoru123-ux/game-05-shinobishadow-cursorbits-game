import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../lib/gameEngine';
import { RotateCcw } from 'lucide-react';

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
    const y = (e.clientY - rect.top) * (720 / rect.height);

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
      
      {/* Instructions Overlay */}
      <div className="absolute bottom-4 left-4 text-white/50 text-xs font-mono pointer-events-none flex flex-col gap-1">
        <div>WASD / Arrows to Move • Shift/K to Dash • P to Pause • M to Mute</div>
        <div>1-4 for Quality • Complete all 28 levels to restore honor</div>
      </div>

      {/* Mobile Start Overlay */}
      {isMobile && engineRef.current.splashScreen && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none">
          <div className="bg-white/10 backdrop-blur-md px-8 py-4 rounded-full border border-white/20 animate-pulse text-white font-mono text-lg pointer-events-auto" onClick={(e) => handleClick(e as any)}>
            TAP TO START
          </div>
        </div>
      )}
    </div>
  );
};
