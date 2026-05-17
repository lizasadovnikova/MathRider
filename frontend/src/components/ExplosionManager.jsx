import { useEffect, useState } from 'react';
import '../styles/Explosion.css';

export default function ExplosionManager({ position, onAnimationEnd }) {
  const [sparks, setSparks] = useState([]);
  const [fireballs, setFireballs] = useState([]);

  useEffect(() => {
    const newSparks = Array.from({ length: 24 }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / 24 + (Math.random() * 0.2);
      const distance = 80 + Math.random() * 100;
      return {
        id: i,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance,
        angle: angle * (180 / Math.PI),
        delay: Math.random() * 0.1,
        size: 15 + Math.random() * 20
      };
    });
    setSparks(newSparks);

    const newFireballs = Array.from({ length: 6 }).map((_, i) => {
       const angle = Math.random() * Math.PI * 2;
       const offset = Math.random() * 20;
       return {
         id: i,
         x: Math.cos(angle) * offset,
         y: Math.sin(angle) * offset,
         size: 60 + Math.random() * 40,
         delay: Math.random() * 0.1
       };
    });
    setFireballs(newFireballs);

    const timer = setTimeout(() => {
      onAnimationEnd();
    }, 1200);

    return () => clearTimeout(timer);
  }, [onAnimationEnd]);

  if (!position) return null;

  return (
    <div style={{
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: 0, height: 0,
      pointerEvents: 'none',
      zIndex: 90,
    }}>

      <div className="explosion-flash"></div>

      {fireballs.map(fb => (
         <div key={fb.id} className="explosion-fireball" style={{
           '--fx': `${fb.x}px`,
           '--fy': `${fb.y}px`,
           '--fsize': `${fb.size}px`,
           '--fdelay': `${fb.delay}s`
         }}></div>
      ))}

      {sparks.map(s => (
        <div key={s.id} className="explosion-spark" style={{
          '--tx': `${s.tx}px`,
          '--ty': `${s.ty}px`,
          '--delay': `${s.delay}s`,
          '--size': `${s.size}px`,
          '--rot': `${s.angle}deg`
        }}></div>
      ))}
    </div>
  );
}