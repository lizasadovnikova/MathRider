import { useRef, useEffect, useState } from 'react';
import * as math from 'mathjs';
import ControlPanel from './ControlPanel.jsx';
import CanvasRenderer from './CanvasRenderer.jsx';
import '../styles/GameBoard.css';

const GameBoard = ({ level, onLevelComplete }) => {
  const canvasRef = useRef(null);
  const isPausedRef = useRef(false);
  const activeStarsRef = useRef([]); 
  const [starsCollected, setStarsCollected] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
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
  const [crashMessage, setCrashMessage] = useState(null);

  useEffect(() => {
    if (level) {
      let maxMathX = Math.max(Math.abs(level.startPosX), Math.abs(level.finishPosX));
      let maxMathY = Math.max(Math.abs(level.startPosY), Math.abs(level.finishPosY));

      if (level.elements) {
        level.elements.forEach(el => {
          maxMathX = Math.max(maxMathX, Math.abs(el.posX));
          maxMathY = Math.max(maxMathY, Math.abs(el.posY));
        });
      }

      const calculatedScaleX = maxMathX > 0 ? (CANVAS_WIDTH * 0.4) / maxMathX : 1;
      const calculatedScaleY = maxMathY > 0 ? (CANVAS_HEIGHT * 0.4) / maxMathY : 1;
      
      setScale(Math.max(0.01, Math.min(calculatedScaleX, calculatedScaleY, 4)));
      setOffset({ x: 0, y: 0 }); 
      setCarPos({ x: level.startPosX, y: level.startPosY });
      setCarT(0);
      setCarAngle(0); 
      setQueuedTrackId(null);
      const levelStars = level.elements ? level.elements.filter(e => e.type === 'Star') : [];
      activeStarsRef.current = [...levelStars];
      setTotalStars(levelStars.length);
      setStarsCollected(0);
    }
  }, [level]);

  const handleAddFormula = () => { if (formulas.length < 5) setFormulas([...formulas, { id: Date.now(), type: 'standard', textX: 't', textY: '' }]); };
  const handleRemoveFormula = (id) => {
    if (formulas.length === 1) return;
    const newFormulas = formulas.filter(f => f.id !== id);
    setFormulas(newFormulas);
    setDrawnFormulas(prevDrawn => prevDrawn.filter(f => f.id !== id));

    if (activeTrackId === id) { 
      setActiveTrackId(newFormulas[0].id); 
      setIsReadyToRace(false); 
    }
    if (queuedTrackId === id) setQueuedTrackId(null);
  };
  const handleFormulaChange = (id, field, newText) => setFormulas(formulas.map(f => f.id === id ? { ...f, [field]: newText } : f));
  const handleFormulaTypeChange = (id, newType) => {
    if (newType === 'parametric') {
      const currentParametricCount = formulas.filter(f => f.type === 'parametric' && f.id !== id).length;
      if (currentParametricCount >= 2) {
        alert("Максимум 2 параметричні функції! Використовуйте класичні рівняння y=f(x).");
        return;
      }
    }
    setFormulas(formulas.map(f => f.id === id ? { ...f, type: newType } : f));
  };

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

  const handleStartRace = () => { 
    setCarPos({ x: level.startPosX, y: level.startPosY }); 
    setCarT(0); 
    setCarAngle(0); 
    setQueuedTrackId(null); 
    setCrashMessage(null);
    isPausedRef.current = false;
    setIsRacing(true); 
  };
  
  const handleStopRace = () => { 
    setIsRacing(false); 
    setCarPos({ x: level.startPosX, y: level.startPosY }); 
    setCarT(0); 
    setCarAngle(0); 
    setQueuedTrackId(null); 
    setCrashMessage(null);
    isPausedRef.current = false;
  };

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

      if (isPausedRef.current) {
        animationFrameId = requestAnimationFrame(renderLoop);
        return;
      }

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
        }
        if (level.elements && level.elements.length > 0) {
          const hitWall = level.elements.some(el => {
            if (el.type.toLowerCase() !== 'obstacle') return false; 
            
            const obsX = Number(el.posX);
            const obsY = Number(el.posY);
            const obsW = Number(el.width);
            const obsH = Number(el.height);

            const inX = nextX >= obsX && nextX <= (obsX + obsW);
            const inY = nextY >= obsY && nextY <= (obsY + obsH);

            // console.log(`Машинка: X=${nextX.toFixed(2)}, Y=${nextY.toFixed(2)} | Стіна: X[${obsX}..${obsX+obsW}], Y[${obsY}..${obsY+obsH}] | inX: ${inX}, inY: ${inY}`);

            return inX && inY;
          });

          if (hitWall) {
            cancelAnimationFrame(animationFrameId);
            isPausedRef.current = true;
            
            setCarPos({ x: currentX, y: currentY }); 
            
            setTimeout(() => {
              alert("Аварія! Ви врізалися в перешкоду.");
              setIsRacing(false);
              handleStopRace();
            }, 50); 
            
            return;
          }
        }

        const dx = nextX - currentX;
        const dy = nextY - currentY;
        
        if (Math.hypot(dx, dy) > 0.001) {
          currentAngle = Math.atan2(-dy, dx); 
          if (activeF.type === 'standard') {
            currentDirectionXForStandard = dx >= 0 ? 1 : -1;
          }
        }

        if (activeStarsRef.current.length > 0) {
          const HIT_RADIUS = 15 / scale; 
          const initialCount = activeStarsRef.current.length;

          activeStarsRef.current = activeStarsRef.current.filter(star => {
            const distToStar = Math.hypot(nextX - star.posX, nextY - star.posY);
            return distToStar > HIT_RADIUS; 
          });

          if (activeStarsRef.current.length < initialCount) {
            setStarsCollected(totalStars - activeStarsRef.current.length);
          }
        }

        if (queuedTrackId && !isPausedRef.current) {
          const queuedF = drawnFormulas.find(f => f.id === queuedTrackId);
          if (queuedF) {
            
            const JUMP_HITBOX = 15 / scale; 
            
            let dist = Infinity;
            let queuedNextT = 0;
            let newDirectionX = currentDirectionXForStandard;

            if (queuedF.type === 'standard') {
              const qY = queuedF.compiledY.evaluate({ x: nextX });
              dist = Math.abs(nextY - qY);
              
              if (dist <= JUMP_HITBOX && activeF.type === 'parametric') {
                const pastX = activeF.compiledX.evaluate({ t: Math.max(0, currentT - 0.05) });
                newDirectionX = nextX < pastX ? -1 : 1; 
              }
            } else if (queuedF.type === 'parametric') {
              let minDistSq = Infinity;
              for (let t = 0; t <= 300; t += 0.05) {
              try {
                const px = queuedF.compiledX.evaluate({ t });
                const py = queuedF.compiledY.evaluate({ t });
                
                if (isNaN(px) || isNaN(py)) {
                }
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

            if (dist <= JUMP_HITBOX) {
              let newAngle = 0;

              if (queuedF.type === 'standard') {
                const y1 = queuedF.compiledY.evaluate({ x: nextX });
                const y2 = queuedF.compiledY.evaluate({ x: nextX + EPSILON });
                const math_dy = y2 - y1;
                newAngle = Math.atan2(-(math_dy * newDirectionX), EPSILON * newDirectionX);
              } else if (queuedF.type === 'parametric') {
                const px1 = queuedF.compiledX.evaluate({ t: queuedNextT });
                const py1 = queuedF.compiledY.evaluate({ t: queuedNextT });
                const px2 = queuedF.compiledX.evaluate({ t: queuedNextT + EPSILON });
                const py2 = queuedF.compiledY.evaluate({ t: queuedNextT + EPSILON });
                newAngle = Math.atan2(-(py2 - py1), px2 - px1);
              }

              let angleDiff = Math.abs(currentAngle - newAngle);
              if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff; 

              const MAX_ANGLE_DEG = 85;
              const MAX_ANGLE_RAD = MAX_ANGLE_DEG * Math.PI / 180;

              if (angleDiff > MAX_ANGLE_RAD) {
                const degrees = (angleDiff * 180 / Math.PI).toFixed(0);
                
                isPausedRef.current = true;
                setQueuedTrackId(null);
                setCrashMessage(`Стрибок відхилено! Кут занадто різкий (${degrees}° > ${MAX_ANGLE_DEG}).`);
                
              } else {
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
        }

        if (nextY > 2000 || nextY < -2000 || nextX > level.finishPosX + 2000 || nextX < level.startPosX - 2000 || currentT > 500) {
          keepRacing = false; setIsRacing(false); handleStopRace();
          setTimeout(() => alert(`Машинка вилетіла за межі!`), 10);
          return; 
        }

        const distToFinish = Math.hypot(nextX - level.finishPosX, nextY - level.finishPosY);
        
        const finishRadius = 15 / scale;
        
        if (distToFinish <= finishRadius) {
          if (activeStarsRef.current.length > 0) {
            keepRacing = false; setIsRacing(false); handleStopRace();
            setTimeout(() => alert(`Ви доїхали до фінішу, але зібрали не всі зірки! Залишилось: ${activeStarsRef.current.length}.`), 10);
            return;
          } else {
            keepRacing = false; setIsRacing(false); 
            setCarPos({ x: level.finishPosX, y: level.finishPosY });

            setTimeout(() => {
              alert("Перемога! Всі зірки зібрано!");
              if (onLevelComplete) {
                 onLevelComplete(); 
              }
            }, 10);
            return;
          }
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
        activeStars={activeStarsRef.current}
        drawnFormulas={drawnFormulas}
        activeTrackId={activeTrackId}
        carPos={carPos}
        carAngle={carAngle}
      />

      {crashMessage && (
        <div style={{
          position: 'absolute', 
          top: '20%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          background: 'rgba(244, 67, 54, 0.95)', 
          color: 'white', 
          padding: '20px 30px',
          borderRadius: '10px', 
          fontSize: '20px', 
          fontWeight: 'bold', 
          zIndex: 100,
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div>{crashMessage}</div>
          <button 
            onClick={() => {
              isPausedRef.current = false;
              setCrashMessage(null);
            }}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#F44336',
              background: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
          >
            Продовжити рух
          </button>
        </div>
      )}

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