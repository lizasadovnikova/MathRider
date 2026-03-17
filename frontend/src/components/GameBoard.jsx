import { useRef, useEffect, useState } from 'react';
import * as math from 'mathjs';
import ControlPanel from './ControlPanel';

const GameBoard = ({ level }) => {
  const canvasRef = useRef(null);
  
  const CANVAS_WIDTH = 1000; 
  const CANVAS_HEIGHT = 600; 
  
  const ORIGIN_X = CANVAS_WIDTH / 2; 
  const ORIGIN_Y = CANVAS_HEIGHT / 2; 

  const [formula, setFormula] = useState('x^2 / 50'); 
  const [drawnFormula, setDrawnFormula] = useState('');
  const [scale, setScale] = useState(1);
  
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const EFFECTIVE_ORIGIN_X = ORIGIN_X + offset.x;
  const EFFECTIVE_ORIGIN_Y = ORIGIN_Y + offset.y;

  const toCanvasX = (mathX) => EFFECTIVE_ORIGIN_X + (mathX * scale);
  const toCanvasY = (mathY) => EFFECTIVE_ORIGIN_Y - (mathY * scale);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e) => {
      e.preventDefault(); 
      setScale(prevScale => {
        const zoomSensitivity = 0.001;
        const newScale = prevScale - (e.deltaY * zoomSensitivity);
        return Math.min(Math.max(newScale, 0.05), 10); 
      });
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const mathMinX = -EFFECTIVE_ORIGIN_X / scale;
    const mathMaxX = (CANVAS_WIDTH - EFFECTIVE_ORIGIN_X) / scale;
    const mathMinY = -(CANVAS_HEIGHT - EFFECTIVE_ORIGIN_Y) / scale;
    const mathMaxY = EFFECTIVE_ORIGIN_Y / scale;

    const drawGrid = () => {
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#888';
      ctx.font = '12px Arial';

      const idealStep = 50 / scale;
      const pow10 = Math.pow(10, Math.floor(Math.log10(idealStep)));
      const fraction = idealStep / pow10;
      let niceFraction = fraction <= 1.5 ? 1 : fraction <= 3.5 ? 2 : fraction <= 7.5 ? 5 : 10;
      const mathStep = niceFraction * pow10;

      const startX = Math.floor(mathMinX / mathStep) * mathStep;
      for (let x = startX; x <= mathMaxX; x += mathStep) {
        if (Math.abs(x) < 0.0001) continue;
        let cx = toCanvasX(x);
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, CANVAS_HEIGHT); ctx.stroke();
        ctx.fillText(parseFloat(x.toPrecision(4)).toString(), cx - 12, Math.max(15, Math.min(EFFECTIVE_ORIGIN_Y + 15, CANVAS_HEIGHT - 5)));
      }

      const startY = Math.floor(mathMinY / mathStep) * mathStep;
      for (let y = startY; y <= mathMaxY; y += mathStep) {
        if (Math.abs(y) < 0.0001) continue;
        let cy = toCanvasY(y);
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(CANVAS_WIDTH, cy); ctx.stroke();
        ctx.fillText(parseFloat(y.toPrecision(4)).toString(), Math.max(5, Math.min(EFFECTIVE_ORIGIN_X + 10, CANVAS_WIDTH - 30)), cy + 4);
      }


      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      
      if (EFFECTIVE_ORIGIN_Y >= 0 && EFFECTIVE_ORIGIN_Y <= CANVAS_HEIGHT) {
        ctx.beginPath(); ctx.moveTo(0, EFFECTIVE_ORIGIN_Y); ctx.lineTo(CANVAS_WIDTH, EFFECTIVE_ORIGIN_Y); ctx.stroke(); 
      }
      
      if (EFFECTIVE_ORIGIN_X >= 0 && EFFECTIVE_ORIGIN_X <= CANVAS_WIDTH) {
        ctx.beginPath(); ctx.moveTo(EFFECTIVE_ORIGIN_X, 0); ctx.lineTo(EFFECTIVE_ORIGIN_X, CANVAS_HEIGHT); ctx.stroke(); 
      }
      
      const zeroX = Math.max(5, Math.min(EFFECTIVE_ORIGIN_X + 5, CANVAS_WIDTH - 15));
      const zeroY = Math.max(15, Math.min(EFFECTIVE_ORIGIN_Y + 15, CANVAS_HEIGHT - 5));
      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('0', zeroX, zeroY);
    };

    drawGrid(); 

    if (!level) return;

    if (drawnFormula) {
      try {
        const compiledFormula = math.compile(drawnFormula);
        
        ctx.beginPath();
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 4;

        const stepX = 1 / scale; 

        for (let x = mathMinX - stepX; x <= mathMaxX + stepX; x += stepX) {
          const y = compiledFormula.evaluate({ x: x });
          const canvasX = toCanvasX(x);
          const canvasY = toCanvasY(y);

          if (x < mathMinX) {
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
    ctx.arc(toCanvasX(level.startPosX), toCanvasY(level.startPosY), 15 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F44336';
    ctx.beginPath();
    ctx.arc(toCanvasX(level.finishPosX), toCanvasY(level.finishPosY), 15 * scale, 0, Math.PI * 2);
    ctx.fill();

    if (level.elements && level.elements.length > 0) {
      level.elements.forEach(el => {
        const drawX = toCanvasX(el.posX);
        const drawY = toCanvasY(el.posY) - (el.height * scale); 

        if (el.type === 'Star') {
          ctx.fillStyle = '#FFD700';
          ctx.fillRect(drawX, drawY, el.width * scale, el.height * scale);
        } else if (el.type === 'Obstacle') {
          ctx.fillStyle = '#607D8B';
          ctx.fillRect(drawX, drawY, el.width * scale, el.height * scale);
        }
      });
    }
  }, [level, drawnFormula, scale, offset]);

  return (
    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <ControlPanel 
        formula={formula} 
        onFormulaChange={setFormula} 
        onDrawClick={() => setDrawnFormula(formula)} 
      />

      <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT} 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ 
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          cursor: isDragging ? 'grabbing' : 'grab'
        }} 
      />
      <p style={{ color: '#888', fontSize: '14px', marginTop: '10px' }}>
        * Крутіть коліщатко для масштабу. Затисніть ліву кнопку миші, щоб рухати дошку.
      </p>
    </div>
  );
};

export default GameBoard;
