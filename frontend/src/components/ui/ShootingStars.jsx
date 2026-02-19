import React, { useEffect, useRef } from 'react';

export const ShootingStars = ({
  starColor = '#1A73E8',
  trailColor = '#2BC48A',
  minDelay = 1000,
  maxDelay = 3000,
  minSpeed = 15,
  maxSpeed = 35
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const shootingStars = [];

    const createShootingStar = () => {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height / 2;
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.5;

      shootingStars.push({ x, y, speed, angle, life: 1 });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      shootingStars.forEach((star, index) => {
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        star.life -= 0.01;

        if (star.life <= 0) {
          shootingStars.splice(index, 1);
          return;
        }

        const gradient = ctx.createLinearGradient(
          star.x,
          star.y,
          star.x - Math.cos(star.angle) * 50,
          star.y - Math.sin(star.angle) * 50
        );
        gradient.addColorStop(0, starColor);
        gradient.addColorStop(1, 'transparent');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.globalAlpha = star.life;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(
          star.x - Math.cos(star.angle) * 50,
          star.y - Math.sin(star.angle) * 50
        );
        ctx.stroke();
      });

      requestAnimationFrame(animate);
    };

    const interval = setInterval(() => {
      createShootingStar();
    }, minDelay + Math.random() * (maxDelay - minDelay));

    animate();

    return () => {
      clearInterval(interval);
    };
  }, [starColor, trailColor, minDelay, maxDelay, minSpeed, maxSpeed]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
};
