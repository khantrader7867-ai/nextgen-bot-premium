import React, { useEffect, useRef } from 'react';

export const BackgroundEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Golden & white cyberpunk particles
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      pulseSpeed: number;
    }

    const particles: Particle[] = [];
    const particleCount = 55;
    const colors = [
      '#f59e0b', // Amber Gold
      '#fbbf24', // Warm Gold
      '#ffffff', // Crisp White
      '#fef08a', // Champagne Light
      '#10b981', // Emerald Accents
    ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: Math.random() * 2.2 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.45 + 0.15,
        pulseSpeed: Math.random() * 0.02 + 0.008,
      });
    }

    let t = 0;

    const render = () => {
      t += 0.012;
      ctx.clearRect(0, 0, width, height);

      // 1. Moving Cyberpunk Perspective Grid (Floor section)
      const gridYStart = height * 0.45;
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.09)'; // Subtle golden grid

      const gridSize = 56;
      const xOffset = (t * 8) % gridSize;

      // Vertical perspective lines converging to horizon
      const horizonY = height * 0.4;
      const horizonX = width * 0.5;
      const fovLines = 24;

      for (let i = -fovLines; i <= fovLines; i++) {
        const spreadX = horizonX + i * 90;
        ctx.beginPath();
        ctx.moveTo(horizonX + (i * 12), horizonY);
        ctx.lineTo(spreadX, height);
        ctx.stroke();
      }

      // Horizontal depth lines
      for (let y = gridYStart; y < height; y += gridSize * 0.65) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Flowing Golden AI Neural Algorithmic Waves
      ctx.beginPath();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)'; // Radiant Gold
      for (let x = 0; x <= width; x += 10) {
        const y = height * 0.48 + Math.sin(x * 0.004 + t) * 45 + Math.cos(x * 0.01 + t * 0.7) * 20;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.lineWidth = 1.0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)'; // Luminous White
      for (let x = 0; x <= width; x += 12) {
        const y = height * 0.52 + Math.cos(x * 0.005 - t * 0.8) * 35 + Math.sin(x * 0.009 + t * 1.1) * 18;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 3. Particles and Connecting Golden Filaments
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const currentAlpha = p.alpha + Math.sin(t * 2 + i) * 0.12;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0.05, Math.min(0.85, currentAlpha));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby nodes with subtle golden filaments
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 90) {
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / 90) * 0.11;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      {/* High-definition Cyberpunk Gold Grid Photographic Backdrop */}
      <img
        src="/src/assets/images/cyber_gold_grid_backdrop_1792593083899.jpg"
        alt="Cyberpunk Trading Grid"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-30 filter blur-[0.5px] scale-105"
      />

      {/* Atmospheric Vignette and Deep Dark Obsidian Scrim */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#05070e]/92 via-[#070b16]/88 to-[#04060c]/96" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_50%_-10%,rgba(245,158,11,0.14),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_90%,rgba(16,185,129,0.06),transparent_50%)]" />

      {/* Dynamic Golden Canvas Grid & Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
