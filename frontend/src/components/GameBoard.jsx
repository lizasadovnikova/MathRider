import { useRef, useEffect, useState } from 'react';
import * as math from 'mathjs';

const GameBoard = ({ level }) => {
  const canvasRef = useRef(null);
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 400;
  
  const ORIGIN_X = CANVAS_WIDTH / 2; 
  const ORIGIN_Y = CANVAS_HEIGHT / 2; 

  const toCanvasX = (mathX) => ORIGIN_X + mathX;
  const toCanvasY = (mathY) => ORIGIN_Y - mathY;

  const [formula, setFormula] = useState('x^2 / 50'); 
  const [drawnFormula, setDrawnFormula] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const drawGrid = () => {
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;

      for (let x = 0; x <= CANVAS_WIDTH; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
      }
      for (let y = 0; y <= CANVAS_HEIGHT; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
      }

      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ORIGIN_X, 0); ctx.lineTo(ORIGIN_X, CANVAS_HEIGHT); ctx.stroke(); 
      ctx.beginPath(); ctx.moveTo(0, ORIGIN_Y); ctx.lineTo(CANVAS_WIDTH, ORIGIN_Y); ctx.stroke(); 
      
      ctx.fillStyle = '#333';
      ctx.font = '14px Arial';
      ctx.fillText('0', ORIGIN_X + 5, ORIGIN_Y + 15);
    };

    drawGrid(); 

    if (!level) return;

    if (drawnFormula) {
      try {
        const compiledFormula = math.compile(drawnFormula);
        
        ctx.beginPath();
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 4;

        for (let x = -ORIGIN_X; x <= ORIGIN_X; x++) {
          const y = compiledFormula.evaluate({ x: x });

          const canvasX = toCanvasX(x);
          const canvasY = toCanvasY(y);

          if (x === -ORIGIN_X) {
            ctx.moveTo(canvasX, canvasY);
          } else {
            ctx.lineTo(canvasX, canvasY);
          }
        }
        ctx.stroke();
      } catch (error) {
        console.error("Помилка у формулі:", error);
      }
    }

    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(toCanvasX(level.startPosX), toCanvasY(level.startPosY), 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F44336';
    ctx.beginPath();
    ctx.arc(toCanvasX(level.finishPosX), toCanvasY(level.finishPosY), 15, 0, Math.PI * 2);
    ctx.fill();

    if (level.elements && level.elements.length > 0) {
      level.elements.forEach(el => {
        const drawX = toCanvasX(el.posX);
        const drawY = toCanvasY(el.posY) - el.height; 

        if (el.type === 'Star') {
          ctx.fillStyle = '#FFD700';
          ctx.fillRect(drawX, drawY, el.width, el.height);
        } else if (el.type === 'Obstacle') {
          ctx.fillStyle = '#607D8B';
          ctx.fillRect(drawX, drawY, el.width, el.height);
        }
      });
    }
  }, [level, drawnFormula]);

  return (
    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span style={{ fontSize: '20px', fontWeight: 'bold' }}>y = </span>
        <input 
          type="text" 
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder="Наприклад: x^2 / 10"
          style={{ padding: '8px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button 
          onClick={() => setDrawnFormula(formula)}
          style={{ padding: '8px 15px', fontSize: '16px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Побудувати трасу
        </button>
      </div>

      <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT} 
        style={{ 
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }} 
      />
    </div>
  );
};

export default GameBoard;