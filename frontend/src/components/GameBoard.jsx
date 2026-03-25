import { useRef, useEffect, useState } from 'react';
import * as math from 'mathjs';
import ControlPanel from './ControlPanel.jsx';
import CanvasRenderer from './CanvasRenderer.jsx';
import '../styles/GameBoard.css';

const GameBoard = ({ level }) => {
  const canvasRef = useRef(null);
  const CANVAS_WIDTH = 1000; 
  const CANVAS_HEIGHT = 600; 

  const [formulas, setFormulas] = useState([{ id: Date.now(), type: 'standard', textX: 't', textY: 'x^2 / 50' }]); 
  const [activeTrackId, setActiveTrackId] = useState(formulas[0].id); 
  const [drawnFormulas, setDrawnFormulas] = useState([]); 
  const [queuedTrackId, setQueuedTrackId] = useState(null); 
  
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 }); 
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const [validationError, setValidationError] = useState(null);
  const [isReadyToRace, setIsReadyToRace] = useState(false);
  
  const [carPos, setCarPos] = useState({ x: null, y: null }); 
  const [carT, setCarT] = useState(0); 
  const [isRacing, setIsRacing] = useState(false); 
  const [carAngle, setCarAngle] = useState(0); 

  useEffect(() => {
    if (level) {
      const maxMathX = Math.max(Math.abs(level.startPosX), Math.abs(level.finishPosX));
      const maxMathY = Math.max(Math.abs(level.startPosY), Math.abs(level.finishPosY));
      setScale(Math.max(0.1, Math.min(maxMathX > 0 ? 400 / maxMathX : 1, maxMathY > 0 ? 200 / maxMathY : 1, 4)));
      setOffset({ x: 0, y: 0 }); 
      setCarPos({ x: level.startPosX, y: level.startPosY });
      setCarT(0);
      setCarAngle(0); 
      setQueuedTrackId(null);
    }
  }, [level]); 

  const handleAddFormula = () => { if (formulas.length < 5) setFormulas([...formulas, { id: Date.now(), type: 'standard', textX: 't', textY: '' }]); };
  const handleRemoveFormula = (id) => {
    if (formulas.length === 1) return;
    const newFormulas = formulas.filter(f => f.id !== id);
    setFormulas(newFormulas);
    if (activeTrackId === id) { setActiveTrackId(newFormulas[0].id); setIsReadyToRace(false); }
    if (queuedTrackId === id) setQueuedTrackId(null);
  };
  const handleFormulaChange = (id, field, newText) => setFormulas(formulas.map(f => f.id === id ? { ...f, [field]: newText } : f));
  const handleFormulaTypeChange = (id, newType) => setFormulas(formulas.map(f => f.id === id ? { ...f, type: newType } : f));

  const handleDrawClick = () => {
    try {
      const newDrawnFormulas = [];
      let isMainValid = false;

      formulas.forEach(f => {
        if (f.textY.trim() && (f.type === 'standard' || f.textX.trim())) {
          const compiledY = math.compile(f.textY);
          const compiledX = f.type === 'parametric' ? math.compile(f.textX) : null;
          newDrawnFormulas.push({ id: f.id, type: f.type, compiledX, compiledY });

          if (f.id === activeTrackId) {
            if (f.type === 'standard') {
              const startY = compiledY.evaluate({ x: level.startPosX });
              if (Math.abs(level.startPosY - startY) <= 0.5) isMainValid = true;
              else setValidationError(`Траса має починатися на Y=${level.startPosY}.`);
            } else {
              const startX = compiledX.evaluate({ t: 0 });
              const startY = compiledY.evaluate({ t: 0 });
              if (Math.abs(level.startPosX - startX) <= 0.5 && Math.abs(level.startPosY - startY) <= 0.5) isMainValid = true;
              else setValidationError(`Траса має починатися на Y=${level.startPosY}.`);
            }
          }
        }
      });

      if (isMainValid) { setValidationError(null); setIsReadyToRace(true); } 
      else { setIsReadyToRace(false); }

      setDrawnFormulas(newDrawnFormulas);
      setCarPos({ x: level.startPosX, y: level.startPosY });
      setCarT(0);
      setCarAngle(0); 
      setQueuedTrackId(null);
      setIsRacing(false);       
    } catch (err) {
      setValidationError("Помилка синтаксису! Використовуйте x для звичайної та t для параметричної.");
      setIsReadyToRace(false);
    }
  };

  const handleSwitchTrack = (targetId) => {
    const targetDrawn = drawnFormulas.find(f => f.id === targetId);
    if (!targetDrawn) return alert("Побудуйте траси спочатку!");

    if (isRacing) {
      setQueuedTrackId(targetId);
    } else {
      if (targetDrawn.type === 'standard') {
        const targetY = targetDrawn.compiledY.evaluate({ x: level.startPosX });
        if (Math.abs(level.startPosY - targetY) <= 0.5) {
          setActiveTrackId(targetId); setValidationError(null); setIsReadyToRace(true);
        } else alert(`Ця траса не підключена до старту!`);
      } else {
        const startX = targetDrawn.compiledX.evaluate({ t: 0 });
        const startY = targetDrawn.compiledY.evaluate({ t: 0 });
        if (Math.abs(level.startPosX - startX) <= 0.5 && Math.abs(level.startPosY - startY) <= 0.5) {
          setActiveTrackId(targetId); setValidationError(null); setIsReadyToRace(true);
        } else alert(`Ця траса не підключена до старту!`);
      }
    }
  };

  const handleStartRace = () => { setCarPos({ x: level.startPosX, y: level.startPosY }); setCarT(0); setCarAngle(0); setQueuedTrackId(null); setIsRacing(true); };
  const handleStopRace = () => { setIsRacing(false); setCarPos({ x: level.startPosX, y: level.startPosY }); setCarT(0); setCarAngle(0); setQueuedTrackId(null); };

  useEffect(() => {
    if (!isRacing || drawnFormulas.length === 0 || !level) return;

    let animationFrameId;
    let keepRacing = true; 
    
    const activeF = drawnFormulas.find(f => f.id === activeTrackId);
    if (!activeF) return;
    
    const BASE_SPEED = (level.enginePower || 5) * 0.8; 
    const GRAVITY_FACTOR = BASE_SPEED * 0.7;
    const EPSILON = 0.001;
    
    let currentX = carPos.x; 
    let currentY = carPos.y;
    let currentT = carT;
    let currentAngle = carAngle;

    let currentDirectionXForStandard = Math.cos(carAngle) >= 0 ? 1 : -1;

    const renderLoop = () => {
      if (!keepRacing) return;
      let nextX, nextY, mathNextX, mathNextY;

      try {
        if (activeF.type === 'standard') {
          const y1 = currentY;
          const y2 = activeF.compiledY.evaluate({ x: currentX + EPSILON });
          const slope = (y2 - y1) / EPSILON;
          
          const sinTheta = (slope / Math.sqrt(1 + slope * slope)) * currentDirectionXForStandard;
          
          const currentSpeed = Math.max(BASE_SPEED * 0.2, BASE_SPEED - GRAVITY_FACTOR * sinTheta);
          
          const dx_step = (currentSpeed / Math.sqrt(1 + slope * slope)) * currentDirectionXForStandard;
          
          mathNextX = currentX + dx_step;
          mathNextY = activeF.compiledY.evaluate({ x: mathNextX });
          
          nextX = mathNextX;
          nextY = mathNextY;
        } else {
          const px1 = currentX;
          const py1 = currentY;
          const px2 = activeF.compiledX.evaluate({ t: currentT + EPSILON });
          const py2 = activeF.compiledY.evaluate({ t: currentT + EPSILON });
          
          const dx_dt = (px2 - px1) / EPSILON;
          const dy_dt = (py2 - py1) / EPSILON;
          const derivativeLength = Math.hypot(dx_dt, dy_dt);

          let sinTheta = 0;
          if (derivativeLength > 0.0001) {
            sinTheta = dy_dt / derivativeLength;
          }

          const currentSpeed = Math.max(BASE_SPEED * 0.2, BASE_SPEED - GRAVITY_FACTOR * sinTheta);
          
          const dt_step = derivativeLength > 0.0001 ? (currentSpeed / derivativeLength) : 0.01;

          currentT += dt_step;
          mathNextX = activeF.compiledX.evaluate({ t: currentT });
          mathNextY = activeF.compiledY.evaluate({ t: currentT });
          
          nextX = mathNextX;
          nextY = mathNextY;
        }

        const dx = nextX - currentX;
        const dy = nextY - currentY;
        if (Math.hypot(dx, dy) > 0.001) {
          currentAngle = Math.atan2(-dy, dx); 
          if (activeF.type === 'standard') {
            currentDirectionXForStandard = dx >= 0 ? 1 : -1;
          }
        }

        if (queuedTrackId) {
          const queuedF = drawnFormulas.find(f => f.id === queuedTrackId);
          if (queuedF) {
            let dist = Infinity;
            let queuedNextT = 0;
            let newDirectionX = currentDirectionXForStandard;

            if (queuedF.type === 'standard') {
              const qY = queuedF.compiledY.evaluate({ x: nextX });
              dist = Math.abs(nextY - qY);
              
              if (dist <= 4 && activeF.type === 'parametric') {
                const pastX = activeF.compiledX.evaluate({ t: Math.max(0, currentT - 0.05) });
                newDirectionX = nextX < pastX ? -1 : 1; 
              }
            } else if (queuedF.type === 'parametric') {
              let minDistSq = Infinity;
              for (let t = 0; t <= 300; t += 0.05) {
                try {
                  const px = queuedF.compiledX.evaluate({ t });
                  const py = queuedF.compiledY.evaluate({ t });
                  const deltaX = px - nextX;
                  const deltaY = py - nextY;
                  const dSq = deltaX * deltaX + deltaY * deltaY;
                  if (dSq < minDistSq) { 
                    minDistSq = dSq; 
                    queuedNextT = t; 
                  }
                } catch (e) {}
              }
              dist = Math.sqrt(minDistSq);
            }

            if (dist <= 4) {
              setQueuedTrackId(null);
              setActiveTrackId(queuedTrackId);
              
              if (queuedF.type === 'parametric') {
                currentT = queuedNextT; 
                setCarT(queuedNextT);
                nextX = queuedF.compiledX.evaluate({ t: currentT });
                nextY = queuedF.compiledY.evaluate({ t: currentT });
              } else {
                currentDirectionXForStandard = newDirectionX; 
              }
            }
          }
        }

        if (nextY > 2000 || nextY < -2000 || nextX > level.finishPosX + 2000 || nextX < level.startPosX - 2000 || currentT > 500) {
          keepRacing = false; setIsRacing(false); handleStopRace();
          setTimeout(() => alert(`Машинка вилетіла за межі!`), 10);
          return; 
        }

        const distToFinish = Math.hypot(nextX - level.finishPosX, nextY - level.finishPosY);
        if (distToFinish <= 3) {
          keepRacing = false; setIsRacing(false); setCarPos({ x: level.finishPosX, y: level.finishPosY });
          setTimeout(() => alert("Фініш! Машинка доїхала до цілі!"), 10);
          return;
        }

        currentX = nextX;
        currentY = nextY;
        setCarPos({ x: nextX, y: nextY });
        setCarT(currentT); 
        setCarAngle(currentAngle); 

      } catch (e) { keepRacing = false; setIsRacing(false); }

      if (keepRacing) animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isRacing, drawnFormulas, activeTrackId, queuedTrackId, level]); 

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheel = (e) => { e.preventDefault(); setScale(prev => Math.min(Math.max(prev - (e.deltaY * 0.001), 0.05), 10)); };
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = (e) => { setIsDragging(true); setLastMousePos({ x: e.clientX, y: e.clientY }); };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset(prev => ({ x: prev.x + (e.clientX - lastMousePos.x), y: prev.y + (e.clientY - lastMousePos.y) }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  return (
    <div className="game-board-container">
      <ControlPanel 
        formulas={formulas} 
        activeTrackId={activeTrackId}
        queuedTrackId={queuedTrackId} 
        onFormulaChange={handleFormulaChange} 
        onFormulaTypeChange={handleFormulaTypeChange}
        onAddFormula={handleAddFormula}
        onRemoveFormula={handleRemoveFormula}
        onDrawClick={handleDrawClick} 
        error={validationError}
        isReady={isReadyToRace}
        isRacing={isRacing} 
        onStartRace={handleStartRace}
        onStopRace={handleStopRace}
        onSwitchTrack={handleSwitchTrack} 
      />
      
      <CanvasRenderer 
        canvasRef={canvasRef}
        CANVAS_WIDTH={CANVAS_WIDTH}
        CANVAS_HEIGHT={CANVAS_HEIGHT}
        scale={scale}
        offset={offset}
        level={level}
        drawnFormulas={drawnFormulas}
        activeTrackId={activeTrackId}
        carPos={carPos}
        carAngle={carAngle}
      />

      <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT} 
        onMouseDown={handleMouseDown} 
        onMouseMove={handleMouseMove} 
        onMouseUp={handleMouseUp} 
        onMouseLeave={handleMouseLeave}
        className={`game-canvas ${isDragging ? 'grabbing' : 'grab'}`} 
      />
    </div>
  );
};

export default GameBoard;