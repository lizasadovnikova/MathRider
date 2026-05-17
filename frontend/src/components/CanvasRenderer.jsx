import { useEffect, useRef, useState } from 'react';

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
  activeStars,
  renderTrigger,
  activeStarsRef
  //speedMultiplier = 1
}) => {
  const ORIGIN_X = CANVAS_WIDTH / 2;
  const ORIGIN_Y = CANVAS_HEIGHT / 2;

  const EFFECTIVE_ORIGIN_X = ORIGIN_X + offset.x;
  const EFFECTIVE_ORIGIN_Y = ORIGIN_Y + offset.y;

  const [assetsLoaded, setAssetsLoaded] = useState(0);
  
  const toCanvasX = (mathX) => EFFECTIVE_ORIGIN_X + (mathX * scale);
  const toCanvasY = (mathY) => EFFECTIVE_ORIGIN_Y - (mathY * scale);
  
  const carImgRef = useRef(new Image());
  const starImgRef = useRef(new Image());
  const finishImgRef = useRef(new Image());
  const startImgRef = useRef(new Image());
  const obstacleImgRef = useRef(new Image());

  useEffect(() => {
    const handleImageLoad = () => {
      setAssetsLoaded(prev => prev + 1); 
    };

    startImgRef.current.onload = handleImageLoad;
    finishImgRef.current.onload = handleImageLoad;
    obstacleImgRef.current.onload = handleImageLoad;
    starImgRef.current.onload = handleImageLoad;
    carImgRef.current.onload = handleImageLoad;

    startImgRef.current.src = '/assets/start.png';
    finishImgRef.current.src = '/assets/finish.png';
    obstacleImgRef.current.src = '/assets/obstacle.png';
    starImgRef.current.src = '/assets/star.png';
    carImgRef.current.src = '/assets/car.png';
  }, []);

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
              
              if (t === 0) {
                ctx.moveTo(toCanvasX(x), toCanvasY(y));
              } else {
                ctx.lineTo(toCanvasX(x), toCanvasY(y));
                
                if (t > 3 && Math.hypot(x - startX, y - startY) < 0.05) {
                  ctx.lineTo(toCanvasX(startX), toCanvasY(startY));
                  break;
                }
              }
            }
          }

          ctx.stroke();
          ctx.setLineDash([]);
        } catch (error) {}
      });
    }

    const startSize = 10 * scale;
    const finishSize = 10 * scale;
    const starSize = 5 * scale;

    // старт
    const startVisualOffsetY = -3 * scale;
    const startScreenY = toCanvasY(level.startPosY) - startVisualOffsetY;

    if (startImgRef.current.complete && startImgRef.current.naturalWidth > 0) {
      ctx.drawImage(
        startImgRef.current, 
        toCanvasX(level.startPosX) - startSize / 2, 
        startScreenY - startSize / 2, 
        startSize, 
        startSize
      );
    } else {
      ctx.fillStyle = '#4CAF50'; 
      ctx.beginPath(); 
      ctx.arc(toCanvasX(level.startPosX), startScreenY, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // фініш
    const finishVisualOffsetY = 4.7 * scale;
    const finishScreenY = toCanvasY(level.finishPosY) - finishVisualOffsetY;

    if (finishImgRef.current.complete && finishImgRef.current.naturalWidth > 0) {
      ctx.drawImage(
        finishImgRef.current, 
        toCanvasX(level.finishPosX) - finishSize / 2, 
        finishScreenY - finishSize / 2, 
        finishSize, 
        finishSize
      );
    } else {
      ctx.fillStyle = '#F44336'; 
      ctx.beginPath(); 
      ctx.arc(toCanvasX(level.finishPosX), finishScreenY, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    const drawRotatedImageRect = (ctx, mathX, mathY, mathW, mathH, angle) => {
      ctx.save();
      const mathCenterX = mathX + mathW / 2;
      const mathCenterY = mathY + mathH / 2; 
      const screenCenterX = toCanvasX(mathCenterX);
      const screenCenterY = toCanvasY(mathCenterY);
      
      const screenW = mathW * scale;
      const screenH = mathH * scale;

      ctx.translate(screenCenterX, screenCenterY);
      ctx.rotate(((angle || 0) * Math.PI) / 180);
      
      if (obstacleImgRef.current.complete && obstacleImgRef.current.naturalWidth > 0) {
        ctx.drawImage(obstacleImgRef.current, -screenW / 2, -screenH / 2, screenW, screenH);
      } else {
        ctx.fillStyle = '#795548';
        ctx.fillRect(-screenW / 2, -screenH / 2, screenW, screenH);
      }
      ctx.restore();
    };

    // перешкода
    if (level.elements) {
        level.elements.forEach(el => {
          if (el.type !== 'Star') {
            drawRotatedImageRect(ctx, el.posX, el.posY, el.width, el.height, el.angle);
          }
        });
    }

    // зірка
    const starsToDraw = activeStarsRef?.current || []; 
    
    if (starsToDraw.length > 0) {
        starsToDraw.forEach(star => {
          const screenX = toCanvasX(star.posX);
          const screenY = toCanvasY(star.posY);
          
          if (starImgRef.current.complete && starImgRef.current.naturalWidth > 0) {
            ctx.drawImage(starImgRef.current, screenX - starSize / 2, screenY - starSize / 2, starSize, starSize);
          } else {
            ctx.font = `${starSize}px Arial`; 
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⭐', screenX, screenY);
          }
        });
    }

    // машинка
   if (carPos.x !== null && carPos.y !== null) {
      ctx.save();
      ctx.translate(toCanvasX(carPos.x), toCanvasY(carPos.y)); 
      ctx.rotate(carAngle);
      
      const carW = 10 * scale; 
      const carH = 10 * scale; 
      const carVisualOffsetY = 1.98 * scale;

      if (carImgRef.current.complete && carImgRef.current.naturalWidth > 0) {
        ctx.drawImage(carImgRef.current, -carW / 2, (-carH / 2) - carVisualOffsetY, carW, carH);
      } else {
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#d7801c';
        ctx.fillText('=>', 0, -carVisualOffsetY); 
      }
      ctx.restore();
    }

  }, [level, drawnFormulas, activeStarsRef, scale, offset, carPos, activeTrackId, carAngle, CANVAS_WIDTH, CANVAS_HEIGHT, assetsLoaded, renderTrigger]);
  return null;
};

export default CanvasRenderer;