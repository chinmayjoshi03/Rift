import React, { useEffect, useRef } from 'react';

export const StarsBackground = ({
  starDensity = 0.0002,
  allStarsTwinkle = true,
  twinkleProbability = 0.8
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = [];
    const numStars = Math.floor(canvas.width * canvas.height * starDensity);

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5,
        opacity: Math.random(),
        twinkleSpeed: 0.001 + Math.random() * 0.003,
        shouldTwinkle: allStarsTwinkle || Math.random() < twinkleProbability
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach(star => {
        if (star.shouldTwinkle) {
          star.opacity += star.twinkleSpeed;
          if (star.opacity >= 1 || star.opacity <= 0) {
            star.twinkleSpeed = -star.twinkleSpeed;
          }
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [starDensity, allStarsTwinkle, twinkleProbability]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};
