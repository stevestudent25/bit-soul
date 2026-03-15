import { useEffect, useRef } from "react";

interface SoulProps {
  color: string;
  secondaryColor: string;
  size?: number;
  label?: string;
  className?: string;
  pulseColor?: string;
  trail?: boolean;
  animated?: boolean;
  floatDelay?: number;
}

const AnimatedSoul = ({
  color,
  secondaryColor,
  size = 64,
  label,
  className = "",
  pulseColor,
  trail = true,
  animated = true,
  floatDelay = 0,
}: SoulProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = size * 2;
    canvas.height = size * 2;

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = size * 0.7;

      // Trail rings
      if (trail) {
        for (let i = 3; i >= 1; i--) {
          ctx.beginPath();
          ctx.arc(cx, cy, r + i * 8 + Math.sin(t * 0.003 + i) * 3, 0, Math.PI * 2);
          ctx.strokeStyle = `${pulseColor || color}${Math.floor(20 - i * 5).toString(16).padStart(2, "0")}`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Outer glow
      const glowGrad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.6);
      glowGrad.addColorStop(0, `${color}44`);
      glowGrad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.6, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // Main soul body
      const bodyGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
      bodyGrad.addColorStop(0, "#ffffff88");
      bodyGrad.addColorStop(0.3, color);
      bodyGrad.addColorStop(1, secondaryColor);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // Shine
      const shineGrad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, 0, cx - r * 0.35, cy - r * 0.35, r * 0.5);
      shineGrad.addColorStop(0, "rgba(255,255,255,0.7)");
      shineGrad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = shineGrad;
      ctx.fill();

      // Eye
      const eyeX = cx + Math.cos(t * 0.001) * r * 0.2;
      const eyeY = cy + Math.sin(t * 0.0015) * r * 0.2;
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, r * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = "#000000cc";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(eyeX - r * 0.04, eyeY - r * 0.05, r * 0.06, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
    };

    const loop = (t: number) => {
      timeRef.current = t;
      if (animated) draw(t + floatDelay * 500);
      else draw(1000);
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [color, secondaryColor, size, trail, pulseColor, animated, floatDelay]);

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <div
        className={animated ? "soul-float" : ""}
        style={{ animationDelay: `${floatDelay}s` }}
      >
        <canvas ref={canvasRef} style={{ width: size, height: size }} />
      </div>
      {label && (
        <span className="mt-1 text-xs font-bold text-white/70 tracking-wider uppercase">
          {label}
        </span>
      )}
    </div>
  );
};

export default AnimatedSoul;
