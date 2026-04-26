import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

import GameBoard from './GameBoard.jsx';

export default function LevelEditor({ onExit, onLevelSaved }) {
  const canvasRef = useRef(null);
  
  const CANVAS_WIDTH = 1000; 
  const CANVAS_HEIGHT = 600;

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 }); 
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false); 
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const [levelName, setLevelName] = useState('Мій рівень');
  const [elements, setElements] = useState([]);
  const [startPos, setStartPos] = useState({ x: -300, y: 0 });
  const [finishPos, setFinishPos] = useState({ x: 300, y: 0 });
  
  const [selectedTool, setSelectedTool] = useState('Star'); 
  const [placementMode, setPlacementMode] = useState('click');
  
  const [inputX, setInputX] = useState(0);
  const [inputY, setInputY] = useState(0);

  const [obsWidth, setObsWidth] = useState(40);
  const [obsHeight, setObsHeight] = useState(40);

  const [previewMathPos, setPreviewMathPos] = useState({ x: 0, y: 0 }); 
  
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [vehicleMass, setVehicleMass] = useState(2); 
  const [enginePower, setEnginePower] = useState(0.25);

  const [isTesting, setIsTesting] = useState(false);
  const [isCleared, setIsCleared] = useState(false);
  const [obsAngle, setObsAngle] = useState(0);
  const [isRotatingObstacle, setIsRotatingObstacle] = useState(false);

  useEffect(() => {
    setIsCleared(false);
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

  
  const getPointRect = (pos) => ({ x: pos.x - 15, y: pos.y - 15, width: 30, height: 30 });
  const SAFE_RADIUS = 35;

  const placeObject = (mathX, mathY) => {
    setErrorMessage('');

    if (selectedTool === 'Start') {
      if (getDistance(mathX, mathY, finishPos.x, finishPos.y) < 200) return setErrorMessage('Старт надто близько до Фінішу!');
      
      const startRect = getPointRect({ x: mathX, y: mathY });
      if (elements.some(el => el.type === 'obstacle' && isOverlapping(startRect, { x: el.posX, y: el.posY, width: el.width, height: el.height }))) {
        return setErrorMessage('Старт не можна ставити на перешкоду!');
      }
      
      setStartPos({ x: mathX, y: mathY });
    } 
    else if (selectedTool === 'Finish') {
      if (getDistance(startPos.x, startPos.y, mathX, mathY) < 200) return setErrorMessage('Фініш надто близько до Старту!');
      
      const finishRect = getPointRect({ x: mathX, y: mathY });
      if (elements.some(el => el.type === 'obstacle' && isOverlapping(finishRect, { x: el.posX, y: el.posY, width: el.width, height: el.height }))) {
        return setErrorMessage('Фініш не можна ставити на перешкоду!');
      }

      setFinishPos({ x: mathX, y: mathY });
    } 
    else if (selectedTool === 'Star') {
      if (elements.some(el => el.type === 'Star' && getDistance(mathX, mathY, el.posX, el.posY) < 40)) {
        return setErrorMessage('Зірки надто близько одна до одної!');
      }

      if (getDistance(mathX, mathY, startPos.x, startPos.y) < SAFE_RADIUS) return setErrorMessage('Зірка лежить прямо на Старті!');
      if (getDistance(mathX, mathY, finishPos.x, finishPos.y) < SAFE_RADIUS) return setErrorMessage('Зірка лежить прямо на Фініші!');

      const minX = Math.min(startPos.x, finishPos.x);
      const maxX = Math.max(startPos.x, finishPos.x);
      if (mathX <= minX || mathX >= maxX) {
        return setErrorMessage('Зірки можна ставити лише на шляху між Стартом і Фінішем!');
      }

      setElements(prev => [...prev, { type: 'Star', posX: mathX, posY: mathY, width: 20, height: 20 }]);
    } 
    else if (selectedTool === 'obstacle') {
      const newObs = { x: mathX, y: mathY, width: obsWidth, height: obsHeight };
      
      /*if (elements.some(el => el.type === 'obstacle' && isOverlapping(newObs, { x: el.posX, y: el.posY, width: el.width, height: el.height }))) {
        return setErrorMessage('Перешкоди не можуть накладатися!');
      }*/

      const startRect = getPointRect(startPos);
      const finishRect = getPointRect(finishPos);

      if (isOverlapping(newObs, startRect)) return setErrorMessage('Перешкода перекриває зону Старту!');
      if (isOverlapping(newObs, finishRect)) return setErrorMessage('Перешкода перекриває зону Фінішу!');

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
      setScale(prev => Math.min(Math.max(prev - (e.deltaY * 0.001), 0.05), 10)); 
    };
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = (e) => { 
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    if (selectedTool === 'obstacle' && placementMode === 'click') {
      setIsRotatingObstacle(true);
    } else {
      setIsDragging(true); 
      setHasDragged(false); 
    }
    setLastMousePos({ x: currentX, y: currentY }); 
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    if (isRotatingObstacle) {
      const mathCenterX = previewMathPos.x + obsWidth / 2;
      const mathCenterY = previewMathPos.y + obsHeight / 2;
      const screenCenter = mathToScreen(mathCenterX, mathCenterY);

      const dx = currentX - screenCenter.x;
      const dy = currentY - screenCenter.y;
      
      let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angleDeg < 0) angleDeg += 360;

      if (e.shiftKey) {
        angleDeg = Math.round(angleDeg / 15) * 15;
      } else {
        angleDeg = Math.round(angleDeg);
      }

      setObsAngle(angleDeg);

    } else if (isDragging) {
      if (Math.hypot(currentX - lastMousePos.x, currentY - lastMousePos.y) > 3) setHasDragged(true); 

      setOffset(prev => ({ 
        x: prev.x + (currentX - lastMousePos.x), 
        y: prev.y + (currentY - lastMousePos.y) 
      }));
    } else {
      if (selectedTool === 'obstacle' && placementMode === 'click') {
        const rawMath = screenToMath(currentX, currentY);
        const mathX = Math.round(rawMath.x / 10) * 10; 
        const mathY = Math.round(rawMath.y / 10) * 10;
        setPreviewMathPos({ x: mathX, y: mathY });
      }
    }
    setLastMousePos({ x: currentX, y: currentY });
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setIsRotatingObstacle(false);
  };

  const handleMouseUp = (e) => {
    // Якщо ми крутили перешкоду - при відпусканні кнопки ми її ставимо
    if (isRotatingObstacle) {
      setIsRotatingObstacle(false);
      placeObject(previewMathPos.x, previewMathPos.y); 
      return; 
    }

    setIsDragging(false);
    if (hasDragged || placementMode !== 'click') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const rawMath = screenToMath(e.clientX - rect.left, e.clientY - rect.top);
    
    const mathX = Math.round(rawMath.x / 10) * 10; 
    const mathY = Math.round(rawMath.y / 10) * 10;

    placeObject(mathX, mathY);
  };

  useEffect(() => {
    if (selectedTool !== 'obstacle') {
      setPreviewMathPos({ x: 0, y: 0 });
    }
  }, [selectedTool]);

  useEffect(() => {
    const canvas = canvasRef.current;
    
    if (!canvas) return; 

    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const zoomLevels = [
      { minScale: 3.0,  step: 10 },
      { minScale: 1.5,  step: 20 },
      { minScale: 0.8,  step: 50 },
      { minScale: 0.4,  step: 100 },
      { minScale: 0.15, step: 200 },
      { minScale: 0.05, step: 500 }
    ];
    const matchedLevel = zoomLevels.find(level => scale >= level.minScale);
    const gridStep = matchedLevel ? matchedLevel.step : 1000;

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#888'; 
    ctx.font = '10px Arial'; 
    
    const leftMath = screenToMath(0, 0).x;
    const rightMath = screenToMath(CANVAS_WIDTH, 0).x;
    const bottomMath = screenToMath(0, CANVAS_HEIGHT).y;
    const topMath = screenToMath(0, 0).y;

    const drawRotatedRect = (ctx, mathX, mathY, mathW, mathH, angle, color, isPreview = false) => {
      ctx.save();
      ctx.fillStyle = color;
      if (isPreview) ctx.globalAlpha = 0.5;

      const mathCenterX = mathX + mathW / 2;
      const mathCenterY = mathY + mathH / 2; 

      const screenCenter = mathToScreen(mathCenterX, mathCenterY);
      const screenW = mathW * scale;
      const screenH = mathH * scale;

      ctx.translate(screenCenter.x, screenCenter.y);
      ctx.rotate(((angle || 0) * Math.PI) / 180);
      
      ctx.fillRect(-screenW / 2, -screenH / 2, screenW, screenH);
      
      if (isPreview) {
        ctx.strokeStyle = 'rgba(139, 0, 0, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-screenW / 2, -screenH / 2, screenW, screenH);
      }
      ctx.restore();
    };

    for (let x = Math.floor(leftMath / gridStep) * gridStep; x <= rightMath; x += gridStep) {
      const sx = mathToScreen(x, 0).x;
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, CANVAS_HEIGHT); ctx.stroke();
      const xAxisScreenY = mathToScreen(0, 0).y;
      const textY = (xAxisScreenY >= 0 && xAxisScreenY <= CANVAS_HEIGHT) ? xAxisScreenY + 12 : CANVAS_HEIGHT - 5;
      if (x !== 0) ctx.fillText(x, sx + 2, textY); 
    }
    
    for (let y = Math.floor(bottomMath / gridStep) * gridStep; y <= topMath; y += gridStep) {
      const sy = mathToScreen(0, y).y;
      ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(CANVAS_WIDTH, sy); ctx.stroke();
      const yAxisScreenX = mathToScreen(0, 0).x;
      const textX = (yAxisScreenX >= 0 && yAxisScreenX <= CANVAS_WIDTH) ? yAxisScreenX + 5 : 5;
      if (y !== 0) ctx.fillText(y, textX, sy - 2);
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 2;
    const origin = mathToScreen(0, 0);
    
    if (origin.x >= 0 && origin.x <= CANVAS_WIDTH) {
      ctx.beginPath(); ctx.moveTo(origin.x, 0); ctx.lineTo(origin.x, CANVAS_HEIGHT); ctx.stroke();
    }
    if (origin.y >= 0 && origin.y <= CANVAS_HEIGHT) {
      ctx.beginPath(); ctx.moveTo(0, origin.y); ctx.lineTo(CANVAS_WIDTH, origin.y); ctx.stroke();
    }

    const drawStart = mathToScreen(startPos.x, startPos.y);
    ctx.fillStyle = 'rgba(0, 0, 255, 0.8)';
    ctx.beginPath(); 
    ctx.arc(drawStart.x, drawStart.y, 15 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'blue';
    ctx.font = 'bold 12px Arial';
    ctx.fillText("СТАРТ", drawStart.x - 20, drawStart.y + 25);

    const drawFinish = mathToScreen(finishPos.x, finishPos.y);
    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.beginPath(); 
    ctx.arc(drawFinish.x, drawFinish.y, 15 * scale, 0, Math.PI * 2); 
    ctx.fill();
    ctx.fillStyle = 'darkgreen';
    ctx.fillText("ФІНІШ", drawFinish.x - 20, drawFinish.y + 25);

    elements.forEach(el => {
      if (el.type === 'obstacle') {
        drawRotatedRect(ctx, el.posX, el.posY, el.width, el.height, el.angle, '#795548');
      }
      else if (el.type === 'Star') {
        const screenPos = mathToScreen(el.posX, el.posY);
        ctx.fillStyle = 'gold';
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, 10 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });

    if (selectedTool === 'obstacle' && placementMode === 'click' && !isDragging) {
      drawRotatedRect(ctx, previewMathPos.x, previewMathPos.y, obsWidth, obsHeight, obsAngle, 'rgba(244, 67, 54, 0.4)', true);
      
      const screenTL = mathToScreen(previewMathPos.x, previewMathPos.y + obsHeight);
      ctx.fillStyle = 'black';
      ctx.font = '10px Arial';
      ctx.fillText(`Прев'ю: ${obsWidth}x${obsHeight} ∠${obsAngle}°`, screenTL.x + 5, screenTL.y - 5);
    }

  }, [elements, startPos, finishPos, scale, offset, previewMathPos, selectedTool, placementMode, isDragging, obsWidth, obsHeight, obsAngle, isTesting]);

  const handleSaveLevel = () => {
    setIsSaving(true);
    const token = localStorage.getItem('mathRider_token');
    const userId = localStorage.getItem('mathRider_userId');

    const newLevelData = {
      name: levelName,
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
      alert("Рівень збережено!"); 
      
      if (onLevelSaved) {
        onLevelSaved();
      } else {
        onExit(); 
      }
    })
    .catch(error => { console.error(error); alert("Помилка збереження."); setIsSaving(false); });
  };

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
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
          <button 
            onClick={() => setIsTesting(false)} 
            style={{ padding: '10px 15px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Зупинити тест (повернутися в редактор)
          </button>
          <h2>Тест-драйв: {levelName}</h2>
          <div style={{width: '150px'}}></div>
        </div>
        
        <GameBoard 
          level={testLevel} 
          onLevelComplete={() => {
            alert("Рівень успішно пройдено! Тепер ви можете його зберегти.");
            setIsCleared(true);
            setIsTesting(false);
          }} 
        />
      </div>
    );
  } 
  return (
    <div style={{ maxWidth: `${CANVAS_WIDTH}px`, margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <button onClick={onExit} style={{ padding: '8px 15px', cursor: 'pointer' }}>⬅ Назад</button>
        <input type="text" value={levelName} onChange={(e) => setLevelName(e.target.value)} style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', padding: '5px' }} />
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setIsTesting(true)} 
            style={{ padding: '10px 20px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Тест-драйв
          </button>

          <button 
            onClick={handleSaveLevel} 
            disabled={!isCleared || isSaving} 
            title={!isCleared ? "Спочатку пройдіть рівень у Тест-драйві!" : "Зберегти рівень"}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: isCleared ? '#4CAF50' : '#ccc', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              fontWeight: 'bold', 
              cursor: isCleared ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.3s'
            }}
          >
            {isSaving ? 'Збереження...' : (isCleared ? '💾 Зберегти' : '🔒 Спочатку пройдіть')}
          </button>
        </div>
      </div>
      <div style={{ marginBottom: '10px', padding: '15px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ccc', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ fontWeight: 'bold' }}>Інструмент:</div>
          <button onClick={() => setSelectedTool('Start')} style={{ backgroundColor: selectedTool === 'Start' ? '#b3e5fc' : '#eee', border: '1px solid #ccc', padding: '5px 10px', cursor: 'pointer' }}>Старт</button>
          <button onClick={() => setSelectedTool('Finish')} style={{ backgroundColor: selectedTool === 'Finish' ? '#c8e6c9' : '#eee', border: '1px solid #ccc', padding: '5px 10px', cursor: 'pointer' }}>Фініш</button>
          <button onClick={() => setSelectedTool('Star')} style={{ backgroundColor: selectedTool === 'Star' ? 'gold' : '#eee', border: '1px solid #ccc', padding: '5px 10px', cursor: 'pointer' }}>Зірка</button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '10px', borderLeft: '2px solid #ccc' }}>
            <button onClick={() => setSelectedTool('obstacle')} style={{ backgroundColor: selectedTool === 'obstacle' ? '#f44336' : '#eee', color: selectedTool === 'obstacle' ? 'white' : 'black', border: '1px solid #ccc', padding: '5px 10px', cursor: 'pointer' }}>Перешкода</button>
            {selectedTool === 'obstacle' && (
              <span style={{ display: 'flex', gap: '5px', fontSize: '14px', alignItems: 'center' }}>
                <input type="number" placeholder="Ш" title="Ширина" value={obsWidth} onChange={e => setObsWidth(Number(e.target.value))} style={{ width: '45px' }} />
                <input type="number" placeholder="В" title="Висота" value={obsHeight} onChange={e => setObsHeight(Number(e.target.value))} style={{ width: '45px' }} />
                <span style={{ marginLeft: '5px' }}>∠</span>
                <input type="number" placeholder="Кут" title="Кут (в градусах)" value={obsAngle} onChange={e => setObsAngle(Number(e.target.value))} style={{ width: '50px' }} />
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingLeft: '20px', borderLeft: '2px solid #ccc' }}>
          <div style={{ fontWeight: 'bold' }}>Режим:</div>
          <select 
            value={placementMode} 
            onChange={(e) => setPlacementMode(e.target.value)}
            style={{ padding: '5px', borderRadius: '4px' }}
          >
            <option value="click">Тикати на сітці</option>
            <option value="coords">Ввести координати</option>
          </select>

          {placementMode === 'coords' && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              X: <input type="number" value={inputX} onChange={e => setInputX(e.target.value)} style={{ width: '60px' }} />
              Y: <input type="number" value={inputY} onChange={e => setInputY(e.target.value)} style={{ width: '60px' }} />
              <button onClick={handlePlaceByCoords} style={{ padding: '5px 15px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Поставити
              </button>
            </div>
          )}
        </div>

        <button onClick={() => setElements([])} style={{ marginLeft: 'auto', backgroundColor: '#ffebee', color: 'red', border: '1px solid red', padding: '5px 10px', cursor: 'pointer' }}>🗑️ Очистити</button>
      </div>

      <div style={{ minHeight: '24px', color: 'red', fontWeight: 'bold', marginBottom: '5px', textAlign: 'left' }}>
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
        style={{ border: '2px solid #333', cursor: placementMode === 'click' && !isDragging ? 'crosshair' : (isDragging ? 'grabbing' : 'default'), display: 'block', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
      />
    </div>
  );
}
