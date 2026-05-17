import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import GameBoard from './GameBoard.jsx';
import AlertModal from './AlertModal.jsx';
import '../styles/LevelEditor.css';

export default function LevelEditor({ onExit, onLevelSaved }) {
  const canvasRef = useRef(null);
  
  const CANVAS_WIDTH = 1000; 
  const CANVAS_HEIGHT = 600;

  const [scale, setScale] = useState(7);
  const [offset, setOffset] = useState({ x: 0, y: 0 }); 
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false); 
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const [levelName, setLevelName] = useState('Мій рівень');
  const [elements, setElements] = useState([]);
  const [startPos, setStartPos] = useState({ x: -50, y: 0 }); 
  const [finishPos, setFinishPos] = useState({ x: 50, y: 0 });
  
  const [selectedTool, setSelectedTool] = useState('Star'); 
  const [placementMode, setPlacementMode] = useState('click');
  
  const [inputX, setInputX] = useState(0);
  const [inputY, setInputY] = useState(0);

  const [obsWidth, setObsWidth] = useState(4);
  const [obsHeight, setObsHeight] = useState(4);

  const [previewMathPos, setPreviewMathPos] = useState({ x: 0, y: 0 }); 
  
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [vehicleMass, setVehicleMass] = useState(2); 
  const [enginePower, setEnginePower] = useState(0.25);

  const [isTesting, setIsTesting] = useState(false);
  const [isCleared, setIsCleared] = useState(false);
  const [obsAngle, setObsAngle] = useState(0);
  const [isRotatingObstacle, setIsRotatingObstacle] = useState(false);

  const [autoDifficulty, setAutoDifficulty] = useState(1);
  const [levelCategory, setLevelCategory] = useState('Паркур');

  const [assetsLoaded, setAssetsLoaded] = useState(0); 
  const starImgRef = useRef(new Image());
  const finishImgRef = useRef(new Image());
  const startImgRef = useRef(new Image());
  const obstacleImgRef = useRef(new Image());

  const [modalConfig, setModalConfig] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    type: 'info' 
  });

  const showCustomAlert = (title, message, type = 'info') => {
    setModalConfig({ isOpen: true, title, message, type });
  };

  const closeCustomAlert = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };


  useEffect(() => {
    const handleImageLoad = () => setAssetsLoaded(prev => prev + 1);

    startImgRef.current.onload = handleImageLoad;
    finishImgRef.current.onload = handleImageLoad;
    obstacleImgRef.current.onload = handleImageLoad;
    starImgRef.current.onload = handleImageLoad;

    startImgRef.current.src = '/assets/start.png';
    finishImgRef.current.src = '/assets/finish.png';
    obstacleImgRef.current.src = '/assets/obstacle.png'; 
    starImgRef.current.src = '/assets/star.png';
  }, []);

  useEffect(() => {
    setIsCleared(false); 
    
    const newDiff = calculateDifficulty(elements, startPos, finishPos);
    setAutoDifficulty(newDiff);
    
  }, [elements, startPos, finishPos, vehicleMass, enginePower]);

  const screenToMath = (sx, sy) => ({
    x: (sx - CANVAS_WIDTH / 2 - offset.x) / scale,
    y: -(sy - CANVAS_HEIGHT / 2 - offset.y) / scale
  });

  const mathToScreen = (mx, my) => ({
    x: mx * scale + CANVAS_WIDTH / 2 + offset.x,
    y: -my * scale + CANVAS_HEIGHT / 2 + offset.y
  });

  const getDistance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  const isOverlapping = (rect1, rect2) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  };

  const pointToSegmentDistance = (px, py, x1, y1, x2, y2) => {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return getDistance(px, py, x1, y1);
    
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    
    return getDistance(px, py, projX, projY);
  };

  const calculateDifficulty = (currentElements, start, finish) => {
    let score = 0;
    const straightDist = getDistance(start.x, start.y, finish.x, finish.y);
    score += straightDist / 600;

    const stars = currentElements.filter(el => el.type === 'Star');
    const obstacles = currentElements.filter(el => el.type === 'obstacle');

    const pathPoints = [start];
    
    if (stars.length > 0) {
      const sortedStars = [...stars].sort((a, b) => a.posX - b.posX);
      let idealPathDist = 0;
      
      sortedStars.forEach(s => {
        const lastPoint = pathPoints[pathPoints.length - 1];
        idealPathDist += getDistance(lastPoint.x, lastPoint.y, s.posX, s.posY);
        pathPoints.push({ x: s.posX, y: s.posY });
      });
      
      const lastStar = pathPoints[pathPoints.length - 1];
      idealPathDist += getDistance(lastStar.x, lastStar.y, finish.x, finish.y);
      pathPoints.push(finish);

      const pathRatio = idealPathDist / (straightDist || 1); 
      score += (pathRatio - 1) * 8; 
      score += Math.min(stars.length * 0.1, 1.5); 
    } else {
      pathPoints.push(finish);
    }

    let chokePoints = 0;
    const activeObstacles = [];

    const minX = Math.min(start.x, finish.x) - 200;
    const maxX = Math.max(start.x, finish.x) + 200;
    const minY = Math.min(start.y, finish.y) - 600; 
    const maxY = Math.max(start.y, finish.y) + 600;

    obstacles.forEach(obs => {
      if (obs.posX > minX && obs.posX < maxX && obs.posY > minY && obs.posY < maxY) {
        let threatLevel = 0.4;
        if (obs.angle && obs.angle % 90 !== 0) threatLevel += 0.6;

        const obsCenterX = obs.posX + obs.width / 2;
        const obsCenterY = obs.posY + obs.height / 2;

        let minDistToPath = Infinity;
        for (let i = 0; i < pathPoints.length - 1; i++) {
          const p1 = pathPoints[i];
          const p2 = pathPoints[i+1];
          const dist = pointToSegmentDistance(obsCenterX, obsCenterY, p1.x, p1.y, p2.x, p2.y);
          minDistToPath = Math.min(minDistToPath, dist);
        }

        if (minDistToPath < 150) threatLevel += 0.5;
        if (minDistToPath < 70) threatLevel += 1.0;

        score += threatLevel;
        activeObstacles.push(obs);
      }
    });

    for (let i = 0; i < activeObstacles.length; i++) {
      for (let j = i + 1; j < activeObstacles.length; j++) {
        const o1 = activeObstacles[i];
        const o2 = activeObstacles[j];
        
        const centerDist = getDistance(
          o1.posX + o1.width/2, o1.posY + o1.height/2, 
          o2.posX + o2.width/2, o2.posY + o2.height/2
        );
        
        const approxRadius1 = Math.max(o1.width, o1.height) / 2;
        const approxRadius2 = Math.max(o2.width, o2.height) / 2;
        const edgeDist = centerDist - approxRadius1 - approxRadius2;
        
        if (edgeDist > 20 && edgeDist < 100) {
          chokePoints++;
        }
      }
    }

    score += chokePoints * 1.5; 

    if (score < 4) return 1;       
    if (score < 8.5) return 2;     
    if (score < 15) return 3;      
    if (score < 25) return 4;      
    return 5;                      
  };

  //const getPointRect = (pos) => ({ x: pos.x - 15, y: pos.y - 15, width: 30, height: 30 });
  //const SAFE_RADIUS = 35;

  const placeObject = (mathX, mathY) => {
    setErrorMessage('');

    const MIN_GATES_DIST = 40;
    const MIN_STAR_DIST = 10;
    const SAFE_STAR_RADIUS = 15;
    const GATE_HITBOX_SIZE = 20;
    const OBS_SAFE_MARGIN = 20;

    const getGateRect = (pos, margin = 0) => ({
      x: pos.x - (GATE_HITBOX_SIZE / 2) - margin,
      y: pos.y - (GATE_HITBOX_SIZE / 2) - margin,
      width: GATE_HITBOX_SIZE + (margin * 2),
      height: GATE_HITBOX_SIZE + (margin * 2)
    });

    // старт
    if (selectedTool === 'Start') {
      if (getDistance(mathX, mathY, finishPos.x, finishPos.y) < MIN_GATES_DIST) {
        return setErrorMessage(`Старт надто близько до Фінішу! (Мінімум ${MIN_GATES_DIST} од.)`);
      }
      
      const stars = elements.filter(el => el.type === 'Star');
      if (stars.length > 0) {
        const newMinX = Math.min(mathX, finishPos.x);
        const newMaxX = Math.max(mathX, finishPos.x);
        if (stars.some(s => s.posX <= newMinX || s.posX >= newMaxX)) {
          return setErrorMessage('Старт не можна ставити так, щоб існуючі зірки опинилися позаду нього!');
        }
        if (stars.some(s => getDistance(mathX, mathY, s.posX, s.posY) < SAFE_STAR_RADIUS)) {
          return setErrorMessage('Старт надто близько до існуючої зірки!');
        }
      }
      
      const startRect = getGateRect({ x: mathX, y: mathY });
      if (elements.some(el => el.type === 'obstacle' && isOverlapping(startRect, { x: el.posX, y: el.posY, width: el.width, height: el.height }))) {
        return setErrorMessage('Старт перекриває існуючу перешкоду!');
      }
      
      setStartPos({ x: mathX, y: mathY });
    } 
    
    // фініш
    else if (selectedTool === 'Finish') {
      if (getDistance(startPos.x, startPos.y, mathX, mathY) < MIN_GATES_DIST) {
        return setErrorMessage(`Фініш надто близько до Старту! (Мінімум ${MIN_GATES_DIST} од.)`);
      }
      
      const stars = elements.filter(el => el.type === 'Star');
      if (stars.length > 0) {
        const newMinX = Math.min(startPos.x, mathX);
        const newMaxX = Math.max(startPos.x, mathX);
        if (stars.some(s => s.posX <= newMinX || s.posX >= newMaxX)) {
          return setErrorMessage('Фініш не можна ставити перед існуючими зірками! Вони мають залишатися на трасі.');
        }
        if (stars.some(s => getDistance(mathX, mathY, s.posX, s.posY) < SAFE_STAR_RADIUS)) {
          return setErrorMessage('Фініш надто близько до існуючої зірки!');
        }
      }

      const finishRect = getGateRect({ x: mathX, y: mathY });
      if (elements.some(el => el.type === 'obstacle' && isOverlapping(finishRect, { x: el.posX, y: el.posY, width: el.width, height: el.height }))) {
        return setErrorMessage('Фініш перекриває існуючу перешкоду!');
      }

      setFinishPos({ x: mathX, y: mathY });
    } 
    
    // зірка
    else if (selectedTool === 'Star') {
      if (elements.some(el => el.type === 'Star' && getDistance(mathX, mathY, el.posX, el.posY) < MIN_STAR_DIST)) {
        return setErrorMessage(`Зірки надто близько одна до одної! (Мінімум ${MIN_STAR_DIST} од.)`);
      }

      if (getDistance(mathX, mathY, startPos.x, startPos.y) < SAFE_STAR_RADIUS) return setErrorMessage('Зірка надто близько до Старту!');
      if (getDistance(mathX, mathY, finishPos.x, finishPos.y) < SAFE_STAR_RADIUS) return setErrorMessage('Зірка надто близько до Фінішу!');

      const minX = Math.min(startPos.x, finishPos.x);
      const maxX = Math.max(startPos.x, finishPos.x);
      if (mathX <= minX || mathX >= maxX) {
        return setErrorMessage('Зірки можна ставити лише на шляху між Стартом і Фінішем!');
      }

      setElements(prev => [...prev, { type: 'Star', posX: mathX, posY: mathY, width: 20, height: 20 }]);
    } 
    
    // перешкода
    else if (selectedTool === 'obstacle') {
      const newObs = { x: mathX, y: mathY, width: obsWidth, height: obsHeight };

      const expandedStartRect = getGateRect(startPos, OBS_SAFE_MARGIN);
      const expandedFinishRect = getGateRect(finishPos, OBS_SAFE_MARGIN);

      if (isOverlapping(newObs, expandedStartRect)) return setErrorMessage('Перешкода надто близько до Старту!');
      if (isOverlapping(newObs, expandedFinishRect)) return setErrorMessage('Перешкода надто близько до Фінішу!');

      setElements(prev => [...prev, { type: 'obstacle', posX: mathX, posY: mathY, width: obsWidth, height: obsHeight, angle: obsAngle }]);
    }
  };

  const handlePlaceByCoords = () => {
    placeObject(Number(inputX), Number(inputY));
  };

  useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
    const handleWheel = (e) => { 
      e.preventDefault(); 
      setScale(prev => Math.min(Math.max(prev - (e.deltaY * 0.02), 0.05), 50));
    };
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [isTesting]);

  const getCanvasMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e) => { 
    const { x: currentX, y: currentY } = getCanvasMousePos(e);

    if (selectedTool === 'obstacle' && placementMode === 'click') {
      setIsRotatingObstacle(true);
    } else {
      setIsDragging(true); 
      setHasDragged(false); 
    }
    setLastMousePos({ x: currentX, y: currentY }); 
  };

  const handleMouseMove = (e) => {
    const { x: currentX, y: currentY } = getCanvasMousePos(e);

    if (isRotatingObstacle) {
      const mathCenterX = previewMathPos.x + obsWidth / 2;
      const mathCenterY = previewMathPos.y + obsHeight / 2;
      const screenCenter = mathToScreen(mathCenterX, mathCenterY);
      const dx = currentX - screenCenter.x;
      const dy = currentY - screenCenter.y;
      let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angleDeg < 0) angleDeg += 360;
      if (e.shiftKey) { angleDeg = Math.round(angleDeg / 15) * 15; } 
      else { angleDeg = Math.round(angleDeg); }
      setObsAngle(angleDeg);

    } else if (isDragging) {
      if (Math.hypot(currentX - lastMousePos.x, currentY - lastMousePos.y) > 10) {
        setHasDragged(true); 
      }
      setOffset(prev => ({ 
        x: prev.x + (currentX - lastMousePos.x), 
        y: prev.y + (currentY - lastMousePos.y) 
      }));
    } else {
      if (placementMode === 'click') {
        const rawMath = screenToMath(currentX, currentY);
        setPreviewMathPos({ x: rawMath.x, y: rawMath.y });
      }
    }
    setLastMousePos({ x: currentX, y: currentY });
  };

  const handleMouseUp = (e) => {
    if (isRotatingObstacle) {
      setIsRotatingObstacle(false);
      placeObject(previewMathPos.x, previewMathPos.y); 
      return; 
    }

    setIsDragging(false);
    
    if (hasDragged || placementMode !== 'click') return;

    const { x, y } = getCanvasMousePos(e); 
    const rawMath = screenToMath(x, y);

    placeObject(rawMath.x, rawMath.y);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setIsRotatingObstacle(false);
  };

  /*const handleMouseUp = (e) => {
    if (isRotatingObstacle) {
      setIsRotatingObstacle(false);
      placeObject(previewMathPos.x, previewMathPos.y); 
      return; 
    }

    setIsDragging(false);
    if (hasDragged || placementMode !== 'click') return;

    const { x, y } = getCanvasMousePos(e); 
    const rawMath = screenToMath(x, y);
    
    const mathX = rawMath.x; 
    const mathY = rawMath.y;

    placeObject(mathX, mathY);
  };

  /*useEffect(() => {
    if (selectedTool !== 'obstacle') {
      setPreviewMathPos({ x: 0, y: 0 });
    }
  }, [selectedTool]);*/

  useEffect(() => {
   const canvas = canvasRef.current;
    if (!canvas) return; 

    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const EFFECTIVE_ORIGIN_X = CANVAS_WIDTH / 2 + offset.x;
    const EFFECTIVE_ORIGIN_Y = CANVAS_HEIGHT / 2 + offset.y;

    const toCanvasX = (mathX) => EFFECTIVE_ORIGIN_X + (mathX * scale);
    const toCanvasY = (mathY) => EFFECTIVE_ORIGIN_Y - (mathY * scale);

    const mathMinX = -EFFECTIVE_ORIGIN_X / scale;
    const mathMaxX = (CANVAS_WIDTH - EFFECTIVE_ORIGIN_X) / scale;
    const mathMinY = -(CANVAS_HEIGHT - EFFECTIVE_ORIGIN_Y) / scale;
    const mathMaxY = EFFECTIVE_ORIGIN_Y / scale;

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

    const drawRotatedRect = (ctx, mathX, mathY, mathW, mathH, angle, color, isPreview = false) => {
      ctx.save();
      if (isPreview) ctx.globalAlpha = 0.5;

      const mathCenterX = mathX + mathW / 2;
      const mathCenterY = mathY + mathH / 2; 

      const screenCenter = mathToScreen(mathCenterX, mathCenterY);
      const screenW = mathW * scale;
      const screenH = mathH * scale;

      ctx.translate(screenCenter.x, screenCenter.y);
      ctx.rotate(((angle || 0) * Math.PI) / 180);
      
      if (obstacleImgRef.current.complete && obstacleImgRef.current.naturalWidth > 0) {
        ctx.drawImage(obstacleImgRef.current, -screenW / 2, -screenH / 2, screenW, screenH);
      } else {
        ctx.fillStyle = color;
        ctx.fillRect(-screenW / 2, -screenH / 2, screenW, screenH);
      }
      
      if (isPreview) {
        ctx.strokeStyle = 'rgba(139, 0, 0, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-screenW / 2, -screenH / 2, screenW, screenH);
      }
      ctx.restore();
    };

    const startSize = 10 * scale;
    const finishSize = 10 * scale;
    const starSize = 5 * scale;

    // старт
    const drawStart = mathToScreen(startPos.x, startPos.y);
    const startVisualOffsetY = -3 * scale;
    const startScreenY = drawStart.y - startVisualOffsetY;

    if (startImgRef.current.complete && startImgRef.current.naturalWidth > 0) {
      ctx.drawImage(
        startImgRef.current, 
        drawStart.x - startSize / 2, 
        startScreenY - startSize / 2, 
        startSize, 
        startSize
      );
    } else {
      ctx.fillStyle = 'rgba(0, 0, 255, 0.8)';
      ctx.beginPath(); ctx.arc(drawStart.x, startScreenY, 15 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'blue'; ctx.font = 'bold 12px Arial'; ctx.fillText("СТАРТ", drawStart.x - 20, startScreenY + 25);
    }

    // фініш
    const drawFinish = mathToScreen(finishPos.x, finishPos.y);
    const finishVisualOffsetY = 4.7 * scale;
    const finishScreenY = drawFinish.y - finishVisualOffsetY;

    if (finishImgRef.current.complete && finishImgRef.current.naturalWidth > 0) {
      ctx.drawImage(
        finishImgRef.current, 
        drawFinish.x - finishSize / 2, 
        finishScreenY - finishSize / 2, 
        finishSize, 
        finishSize
      );
    } else {
      ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.beginPath(); ctx.arc(drawFinish.x, finishScreenY, 15 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'darkgreen'; ctx.fillText("ФІНІШ", drawFinish.x - 20, finishScreenY + 25);
    }

    // елементи
    elements.forEach(el => {
      if (el.type === 'obstacle') {
        drawRotatedRect(ctx, el.posX, el.posY, el.width, el.height, el.angle, '#795548');
      }
      else if (el.type === 'Star') {
        const screenPos = mathToScreen(el.posX, el.posY);
        if (starImgRef.current.complete && starImgRef.current.naturalWidth > 0) {
          ctx.drawImage(starImgRef.current, screenPos.x - starSize / 2, screenPos.y - starSize / 2, starSize, starSize);
        } else {
          ctx.fillStyle = 'gold'; ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(screenPos.x, screenPos.y, 10 * scale, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
      }
    });

    /*if (selectedTool === 'obstacle' && placementMode === 'click' && !isDragging) {
      drawRotatedRect(ctx, previewMathPos.x, previewMathPos.y, obsWidth, obsHeight, obsAngle, 'rgba(244, 67, 54, 0.4)', true);
      
      const screenTL = mathToScreen(previewMathPos.x, previewMathPos.y + obsHeight);
      ctx.fillStyle = 'black';
      ctx.font = '10px Arial';
      ctx.fillText(`Прев'ю: ${obsWidth}x${obsHeight} ∠${obsAngle}°`, screenTL.x + 5, screenTL.y - 5);
    }*/

    // малювання прев'ю
    if (placementMode === 'click' && !isDragging && previewMathPos) {
      ctx.save();
      ctx.globalAlpha = 0.5;

      const screenPos = mathToScreen(previewMathPos.x, previewMathPos.y);

      // старт
      if (selectedTool === 'Start') {
        const previewStartScreenY = screenPos.y - startVisualOffsetY; 
        
        if (startImgRef.current.complete && startImgRef.current.naturalWidth > 0) {
          ctx.drawImage(startImgRef.current, screenPos.x - startSize / 2, previewStartScreenY - startSize / 2, startSize, startSize);
        } else {
          ctx.fillStyle = 'blue'; ctx.beginPath(); ctx.arc(screenPos.x, previewStartScreenY, 2 * scale, 0, Math.PI * 2); ctx.fill();
        }
      } 
      // фініш
      else if (selectedTool === 'Finish') {
        const previewFinishScreenY = screenPos.y - finishVisualOffsetY; 
        
        if (finishImgRef.current.complete && finishImgRef.current.naturalWidth > 0) {
          ctx.drawImage(finishImgRef.current, screenPos.x - finishSize / 2, previewFinishScreenY - finishSize / 2, finishSize, finishSize);
        } else {
          ctx.fillStyle = 'green'; ctx.beginPath(); ctx.arc(screenPos.x, previewFinishScreenY, 2 * scale, 0, Math.PI * 2); ctx.fill();
        }
      }
      // зірка
      else if (selectedTool === 'Star') {
        if (starImgRef.current.complete && starImgRef.current.naturalWidth > 0) {
          ctx.drawImage(starImgRef.current, screenPos.x - starSize / 2, screenPos.y - starSize / 2, starSize, starSize);
        } else {
          ctx.fillStyle = 'gold'; ctx.beginPath(); ctx.arc(screenPos.x, screenPos.y, 1 * scale, 0, Math.PI * 2); ctx.fill();
        }
      } 
      // перешкода
      else if (selectedTool === 'obstacle') {
        ctx.restore();
        drawRotatedRect(ctx, previewMathPos.x, previewMathPos.y, obsWidth, obsHeight, obsAngle, 'rgba(244, 67, 54, 0.4)', true);
        
        ctx.save();
        
        const screenTL = mathToScreen(previewMathPos.x, previewMathPos.y + obsHeight);
        ctx.fillStyle = 'black';
        ctx.globalAlpha = 1.0;
        ctx.font = '12px Arial';
        ctx.fillText(`Прев'ю: ${obsWidth}x${obsHeight} ∠${obsAngle}°`, screenTL.x + 5, screenTL.y - 10); 
      }

      ctx.restore();
    }

  }, [elements, startPos, finishPos, scale, offset, previewMathPos, selectedTool, placementMode, isDragging, obsWidth, obsHeight, obsAngle, isTesting, assetsLoaded]);

  const handleSaveLevel = () => {
    setIsSaving(true);
    const token = localStorage.getItem('mathRider_token');
    const userId = localStorage.getItem('mathRider_userId');

    const newLevelData = {
      name: levelName,
      difficulty: autoDifficulty,
      category: levelCategory,
      startPosX: startPos.x,
      startPosY: startPos.y,
      finishPosX: finishPos.x,
      finishPosY: finishPos.y,
      vehicleMass: vehicleMass,
      enginePower: enginePower,
      userId: parseInt(userId),
      elements: elements
    };

    axios.post('https://localhost:7281/api/Levels', newLevelData, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(() => { 
      showCustomAlert('Супер!', 'Рівень успішно збережено!', 'success');
      
      if (onLevelSaved) {
        onLevelSaved();
      } else {
        onExit(); 
      }
    })
    .catch(error => { console.error(error); showCustomAlert('Помилка', 'Не вдалося зберегти рівень. Спробуй ще раз.', 'error'); setIsSaving(false); });
  };

  const getDifficultyClass = (diff) => {
    if (diff <= 2) return 'diff-low';
    if (diff === 3) return 'diff-med';
    return 'diff-high';
  };

  const canvasCursor = placementMode === 'click' && !isDragging ? 'crosshair' : (isDragging ? 'grabbing' : 'default');

  if (isTesting) {
    const testLevel = {
      name: levelName,
      startPosX: startPos.x, startPosY: startPos.y,
      finishPosX: finishPos.x, finishPosY: finishPos.y,
      vehicleMass: vehicleMass || 10,
      enginePower: enginePower || 15,
      elements: elements
    };

    return (
      <div className="editor-container">
        <div className="header-panel">
          <button className="btn-stop-test" onClick={() => setIsTesting(false)}>
            Зупинити тест (повернутися в редактор)
          </button>
          <h2>Тест-драйв: {levelName}</h2>
          <div className="header-spacer"></div>
        </div>
        
        <GameBoard 
          level={testLevel}
          onLevelComplete={(finalTime, collectedStarsCount) => {
            const totalStars = testLevel.elements.filter(el => el.type === 'Star').length;

            if (collectedStarsCount === totalStars) {
              showCustomAlert(
                'Тест-драйв пройдено!', 
                `Ви зібрали всі ${totalStars} зірок.\nТепер рівень можна зберегти.`, 
                'success'
              );
              setIsCleared(true);
            } else {
              showCustomAlert('Тест-драйв не зараховано!',`Ви зібрали ${collectedStarsCount} з ${totalStars} зірок.\nЩоб опублікувати рівень, автор має довести, що його можна пройти на 100%!`,'error');
              setIsCleared(false);
            }
            setIsTesting(false);
          }} 
        />
      </div>
    );
  } 

  return (
    <div className="editor-container">
      
      <div className="header-panel">
        <button onClick={onExit} className="btn-back">⬅ Назад</button>
        <div className="title-container">
          <input 
            type="text" 
            value={levelName} 
            onChange={(e) => setLevelName(e.target.value)} 
            className="level-name-input" 
          />
          <select 
            value={levelCategory} 
            onChange={e => setLevelCategory(e.target.value)} 
            className="category-select"
          >
            <option value="Головоломка">Головоломка</option>
            <option value="Паркур">Паркур</option>
            <option value="Лабіринт">Лабіринт</option>
            <option value="Спідран">Спідран</option>
          </select>
        </div>
        <div className="difficulty-container">
          
          <div className="difficulty-badge">
            Складність (Auto): 
            <b className={`difficulty-value ${getDifficultyClass(autoDifficulty)}`}>
              {autoDifficulty === 1 && '🟢 1'}
              {autoDifficulty === 2 && '🟡 2'}
              {autoDifficulty === 3 && '🟠 3'}
              {autoDifficulty === 4 && '🔴 4'}
              {autoDifficulty === 5 && '💀 5'}
            </b>
          </div>
        </div>
        
        <div className="action-buttons">
          <button onClick={() => setIsTesting(true)} className="btn-test">
            Тест-драйв
          </button>

          <button 
            onClick={handleSaveLevel} 
            disabled={!isCleared || isSaving} 
            title={!isCleared ? "Спочатку пройдіть рівень у Тест-драйві!" : "Зберегти рівень"}
            className={`btn-save ${isCleared ? 'cleared' : 'locked'}`}
          >
            {isSaving ? 'Збереження...' : (isCleared ? '💾 Зберегти' : '🔒 Спочатку пройдіть')}
          </button>
        </div>
      </div>

      <div className="toolbar">
        
        <div className="toolbar-group">
          <div className="toolbar-label">Інструмент:</div>
          <button onClick={() => setSelectedTool('Start')} className={`btn-tool ${selectedTool === 'Start' ? 'start-active' : ''}`}>Старт</button>
          <button onClick={() => setSelectedTool('Finish')} className={`btn-tool ${selectedTool === 'Finish' ? 'finish-active' : ''}`}>Фініш</button>
          <button onClick={() => setSelectedTool('Star')} className={`btn-tool ${selectedTool === 'Star' ? 'star-active' : ''}`}>Зірка</button>
          
          <div className="toolbar-subgroup">
            <button onClick={() => setSelectedTool('obstacle')} className={`btn-tool ${selectedTool === 'obstacle' ? 'obstacle-active' : ''}`}>Перешкода</button>
            {selectedTool === 'obstacle' && (
              <span className="obstacle-inputs">
                <input type="number" placeholder="Ш" title="Ширина" value={obsWidth} onChange={e => setObsWidth(Number(e.target.value))} className="input-small" />
                <input type="number" placeholder="В" title="Висота" value={obsHeight} onChange={e => setObsHeight(Number(e.target.value))} className="input-small" />
                <span style={{ marginLeft: '5px' }}>∠</span>
                <input type="number" placeholder="Кут" title="Кут (в градусах)" value={obsAngle} onChange={e => setObsAngle(Number(e.target.value))} className="input-medium" />
              </span>
            )}
          </div>
        </div>

        <div className="toolbar-subgroup-modes">
          <div className="toolbar-label">Режим:</div>
          <select 
            value={placementMode} 
            onChange={(e) => setPlacementMode(e.target.value)}
            className="mode-select"
          >
            <option value="click">Тикати на сітці</option>
            <option value="coords">Ввести координати</option>
          </select>

          {placementMode === 'coords' && (
            <div className="coords-inputs">
              X: <input type="number" value={inputX} onChange={e => setInputX(e.target.value)} className="input-coord" />
              Y: <input type="number" value={inputY} onChange={e => setInputY(e.target.value)} className="input-coord" />
              <button onClick={handlePlaceByCoords} className="btn-place">
                Поставити
              </button>
            </div>
          )}
        </div>

        <button onClick={() => setElements([])} className="btn-clear">🗑️ Очистити</button>
      </div>

      <div className="error-message">
        {errorMessage}
      </div>

      

      <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT} 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="editor-canvas"
        style={{ cursor: canvasCursor }}
      />

      <AlertModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={closeCustomAlert}
      />
    </div>
  );
}