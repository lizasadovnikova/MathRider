import { useEffect } from 'react';

const CanvasRenderer = ({
  canvasRef,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  scale,
  offset,
  level,
  drawnFormulas,
  activeTrackId,
  carPos,
  carAngle,
}) => {
  const ORIGIN_X = CANVAS_WIDTH / 2;
  const ORIGIN_Y = CANVAS_HEIGHT / 2;

  const EFFECTIVE_ORIGIN_X = ORIGIN_X + offset.x;
  const EFFECTIVE_ORIGIN_Y = ORIGIN_Y + offset.y;
  
  const toCanvasX = (mathX) => EFFECTIVE_ORIGIN_X + (mathX * scale);
  const toCanvasY = (mathY) => EFFECTIVE_ORIGIN_Y - (mathY * scale);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const mathMinX = -EFFECTIVE_ORIGIN_X / scale;
    const mathMaxX = (CANVAS_WIDTH - EFFECTIVE_ORIGIN_X) / scale;
    const mathMinY = -(CANVAS_HEIGHT - EFFECTIVE_ORIGIN_Y) / scale;
    const mathMaxY = EFFECTIVE_ORIGIN_Y / scale;

    //сітка
    const drawGrid = () => {
      ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 1; ctx.fillStyle = '#888'; ctx.font = '12px Arial';
      const idealStep = 50 / scale;
      const pow10 = Math.pow(10, Math.floor(Math.log10(idealStep)));
      let mathStep = (idealStep / pow10 <= 1.5 ? 1 : idealStep / pow10 <= 3.5 ? 2 : idealStep / pow10 <= 7.5 ? 5 : 10) * pow10;

      for (let x = Math.floor(mathMinX / mathStep) * mathStep; x <= mathMaxX; x += mathStep) {
        if (Math.abs(x) < 0.0001) continue;
        ctx.beginPath(); ctx.moveTo(toCanvasX(x), 0); ctx.lineTo(toCanvasX(x), CANVAS_HEIGHT); ctx.stroke();
        ctx.fillText(parseFloat(x.toPrecision(4)).toString(), toCanvasX(x) - 12, Math.max(15, Math.min(EFFECTIVE_ORIGIN_Y + 15, CANVAS_HEIGHT - 5)));
      }
      for (let y = Math.floor(mathMinY / mathStep) * mathStep; y <= mathMaxY; y += mathStep) {
        if (Math.abs(y) < 0.0001) continue;
        ctx.beginPath(); ctx.moveTo(0, toCanvasY(y)); ctx.lineTo(CANVAS_WIDTH, toCanvasY(y)); ctx.stroke();
        ctx.fillText(parseFloat(y.toPrecision(4)).toString(), Math.max(5, Math.min(EFFECTIVE_ORIGIN_X + 10, CANVAS_WIDTH - 30)), toCanvasY(y) + 4);
      }
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      if (EFFECTIVE_ORIGIN_Y >= 0 && EFFECTIVE_ORIGIN_Y <= CANVAS_HEIGHT) { ctx.beginPath(); ctx.moveTo(0, EFFECTIVE_ORIGIN_Y); ctx.lineTo(CANVAS_WIDTH, EFFECTIVE_ORIGIN_Y); ctx.stroke(); }
      if (EFFECTIVE_ORIGIN_X >= 0 && EFFECTIVE_ORIGIN_X <= CANVAS_WIDTH) { ctx.beginPath(); ctx.moveTo(EFFECTIVE_ORIGIN_X, 0); ctx.lineTo(EFFECTIVE_ORIGIN_X, CANVAS_HEIGHT); ctx.stroke(); }
    };
    drawGrid();

    if (!level) return;

    // формули
    if (drawnFormulas.length > 0) {
      const colors = ['#9C27B0', '#FF9800', '#E91E63', '#00BCD4', '#4CAF50'];

      drawnFormulas.forEach((fObj, index) => {
        try {
          ctx.beginPath();
          const isActive = fObj.id === activeTrackId;
          ctx.strokeStyle = isActive ? '#2196F3' : colors[index % colors.length];
          ctx.lineWidth = isActive ? 4 : 2;
          ctx.setLineDash(isActive ? [] : [10, 10]);

          if (fObj.type === 'standard') {
            const stepX = 1 / scale;
            for (let x = mathMinX - stepX; x <= mathMaxX + stepX; x += stepX) {
              const y = fObj.compiledY.evaluate({ x: x });
              if (x < mathMinX) ctx.moveTo(toCanvasX(x), toCanvasY(y));
              else ctx.lineTo(toCanvasX(x), toCanvasY(y));
            }
          } else {
            const stepT = 0.05 / scale;
            const startX = fObj.compiledX.evaluate({ t: 0 });
            const startY = fObj.compiledY.evaluate({ t: 0 });

            for (let t = 0; t <= 300; t += stepT) {
              const x = fObj.compiledX.evaluate({ t: t });
              const y = fObj.compiledY.evaluate({ t: t });
              if (t === 0) ctx.moveTo(toCanvasX(x), toCanvasY(y));
              else {
                ctx.lineTo(toCanvasX(x), toCanvasY(y));
                if (t > 3 && Math.hypot(x - startX, y - startY) < 1) break;
              }
            }
          }
          ctx.stroke();
          ctx.setLineDash([]);
        } catch (error) {}
      });
    }

    // старт і фініш
    ctx.fillStyle = '#4CAF50'; ctx.beginPath(); ctx.arc(toCanvasX(level.startPosX), toCanvasY(level.startPosY), 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F44336'; ctx.beginPath(); ctx.arc(toCanvasX(level.finishPosX), toCanvasY(level.finishPosY), 15, 0, Math.PI * 2); ctx.fill();

    // елементи
    if (level.elements && level.elements.length > 0) {
      level.elements.forEach(el => {
        const drawX = toCanvasX(el.posX);
        if (el.type === 'Star') {
          ctx.font = '30px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('⭐', drawX, toCanvasY(el.posY));
        } else if (el.type === 'Obstacle') {
          ctx.fillStyle = '#607D8B';
          ctx.fillRect(drawX, toCanvasY(el.posY) - (el.height * scale), el.width * scale, el.height * scale);
        }
      });
    }

    // машинка
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    
    ctx.textBaseline = 'bottom';
    
    ctx.save();
    
    ctx.translate(toCanvasX(carPos.x !== null ? carPos.x : level.startPosX), toCanvasY(carPos.y !== null ? carPos.y : level.startPosY));
    
    ctx.rotate(carAngle);
    
    ctx.fillText('=>', 0, 0); 
    
    ctx.restore();

  }, [level, drawnFormulas, scale, offset, carPos, activeTrackId, carAngle, CANVAS_WIDTH, CANVAS_HEIGHT]);

  return null;
};

export default CanvasRenderer;