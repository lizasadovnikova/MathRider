import { useRef, useEffect, useState, useLayoutEffect } from 'react';
import * as math from 'mathjs';
import ControlPanel from './ControlPanel.jsx';
import CanvasRenderer from './CanvasRenderer.jsx';
import '../styles/GameBoard.css';
import ExplosionManager from './ExplosionManager.jsx';
import AlertModal from './AlertModal.jsx';

const isCollidingWithRotatedRect = (carX, carY, carRadius, obs) => {
  const obsX = Number(obs.posX);
  const obsY = Number(obs.posY);
  const obsW = Number(obs.width);
  const obsH = Number(obs.height);
  const angle = Number(obs.angle) || 0;

  const cx = obsX + obsW / 2;
  const cy = obsY + obsH / 2;

  const dx = carX - cx;
  const dy = carY - cy;

  const angleRad = angle * (Math.PI / 180);
  const localX = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
  const localY = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);

  const closestX = Math.max(-obsW / 2, Math.min(localX, obsW / 2));
  const closestY = Math.max(-obsH / 2, Math.min(localY, obsH / 2));

  const distanceX = localX - closestX;
  const distanceY = localY - closestY;

  return (distanceX * distanceX + distanceY * distanceY) < (carRadius * carRadius);
};

const GameBoard = ({ level, onLevelComplete }) => {
  const startTimeRef = useRef(null);
  const canvasRef = useRef(null);
  const isPausedRef = useRef(false);
  const activeStarsRef = useRef([]);
  const [displayStars, setDisplayStars] = useState(() => {
    return level ? level.elements.filter(el => el.type === 'Star') : [];
  });
  const [renderTrigger, setRenderTrigger] = useState(0);
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
  const [isCrashed, setIsCrashed] = useState(false);

  const [showExplosion, setShowExplosion] = useState(false);
  const [explosionPosition, setExplosionPosition] = useState({ x: 0, y: 0 });
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const [modalConfig, setModalConfig] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    type: 'info',
    onConfirm: null
  });

  const showCustomAlert = (title, message, type = 'info', onConfirm = null) => {
    setModalConfig({ isOpen: true, title, message, type, onConfirm });
  };

  const closeCustomAlert = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
    if (modalConfig.onConfirm) {
      modalConfig.onConfirm();
    }
  };
  
  const speedRef = useRef(speedMultiplier);


const checkStarCollection = (carX, carY, angleRad, carWidth, carHeight, starX, starY, starRadius) => {
  const dx = starX - carX;
  const dy = starY - carY;

  const localX = dx * Math.cos(-angleRad) - dy * Math.sin(-angleRad);
  const localY = dx * Math.sin(-angleRad) + dy * Math.cos(-angleRad);

  const isWithinX = Math.abs(localX) <= (carWidth / 2 + starRadius);

  const isWithinY = Math.abs(localY) <= (carHeight + starRadius);

  return isWithinX && isWithinY;
};

  useEffect(() => {
    speedRef.current = speedMultiplier;
  }, [speedMultiplier]);


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

      if (maxMathX < 10) maxMathX = 10;
      if (maxMathY < 10) maxMathY = 10;

      const calculatedScaleX = maxMathX > 0 ? (CANVAS_WIDTH * 0.4) / maxMathX : 1;
      const calculatedScaleY = maxMathY > 0 ? (CANVAS_HEIGHT * 0.4) / maxMathY : 1;
      
      const finalScale = Math.max(0.01, Math.min(calculatedScaleX, calculatedScaleY, 10)); 
  
      setScale(finalScale);
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

  const handleRestart = () => {
    if (!level) return;
    //isPausedRef.current = true;
    setIsRacing(false);
    setCarPos({ x: level.startPosX, y: level.startPosY });
    setCarAngle(0); 
    const initialStars = level.elements.filter(el => el.type === 'Star');
    if (activeStarsRef) activeStarsRef.current = [...initialStars];
    setStarsCollected(0); 
    setRenderTrigger(prev => prev + 1); 
    isPausedRef.current = false;
  };

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
        showCustomAlert('Максимум 2 параметричні функції!', 'Використовуйте класичні рівняння y=f(x).', 'warning');
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
              else setValidationError(`Траса має починатися на X=${level.startPosX} Y=${level.startPosY}.`);
            } else {
              const startX = compiledX.evaluate({ t: 0 });
              const startY = compiledY.evaluate({ t: 0 });
              if (Math.abs(level.startPosX - startX) <= 0.5 && Math.abs(level.startPosY - startY) <= 0.5) isMainValid = true;
              else setValidationError(`Траса має починатися на X=${level.startPosX} Y=${level.startPosY}.`);
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
    if (!targetDrawn) return showCustomAlert('Неможливо почати', 'Побудуйте траси спочатку!', 'warning');

    if (isRacing) {
      setQueuedTrackId(targetId);
    } else {
      if (targetDrawn.type === 'standard') {
        const targetY = targetDrawn.compiledY.evaluate({ x: level.startPosX });
        if (Math.abs(level.startPosY - targetY) <= 0.5) {
          setActiveTrackId(targetId); setValidationError(null); setIsReadyToRace(true);
        } else showCustomAlert('Неможливо почати','Ця траса не підключена до старту!', 'warning');
      } else {
        const startX = targetDrawn.compiledX.evaluate({ t: 0 });
        const startY = targetDrawn.compiledY.evaluate({ t: 0 });
        if (Math.abs(level.startPosX - startX) <= 0.5 && Math.abs(level.startPosY - startY) <= 0.5) {
          setActiveTrackId(targetId); setValidationError(null); setIsReadyToRace(true);
        } else showCustomAlert('Неможливо почати','Ця траса не підключена до старту!', 'warning');
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
    startTimeRef.current = Date.now();
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

  const handleExplosionEnd = () => {
    setShowExplosion(false);
    setIsCrashed(true);
    setIsRacing(false);
  };

  const handleRestartAfterCrash = () => {
    setShowExplosion(false);
    setIsCrashed(false);
    handleStopRace();

    if (level && level.elements) {
      const initialStars = level.elements.filter(e => e.type === 'Star');
      setActiveStars(initialStars);
    }
  };

  const restartLevel = () => {
    setIsCrashed(false);
    
    setCarPos({ x: level.startPosX, y: level.startPosY });
    
    const initialStars = level.elements ? level.elements.filter(e => e.type === 'Star') : [];
    setActiveStars(initialStars);
  };


  const ORIGIN_X = CANVAS_WIDTH / 2;
  const ORIGIN_Y = CANVAS_HEIGHT / 2;
  const EFFECTIVE_ORIGIN_X = ORIGIN_X + offset.x;
  const EFFECTIVE_ORIGIN_Y = ORIGIN_Y + offset.y;

  const toCanvasX = (mathX) => EFFECTIVE_ORIGIN_X + (mathX * scale);
  const toCanvasY = (mathY) => EFFECTIVE_ORIGIN_Y - (mathY * scale);


 useEffect(() => {
    if (!isRacing || drawnFormulas.length === 0 || !level) return;

    let animationFrameId;
    let keepRacing = true;
    
    const activeF = drawnFormulas.find(f => f.id === activeTrackId);
    if (!activeF) return;
    
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

      const BASE_SPEED = (level.enginePower || 5) * 0.3 * speedRef.current; 
      const GRAVITY_FACTOR = BASE_SPEED * 0.7;

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
        else if (activeF.type === 'parametric') {
          const t_step = BASE_SPEED * 0.1;
          const nextT = currentT + t_step;
          nextX = activeF.compiledX.evaluate({ t: nextT });
          nextY = activeF.compiledY.evaluate({ t: nextT });
          currentT = nextT;
        }

        const CAR_HITBOX_RADIUS = 3;

        const hasCrashed = level.elements.some(el => {
          if (el.type.toLowerCase() === 'obstacle') {
            return isCollidingWithRotatedRect(nextX, nextY, CAR_HITBOX_RADIUS, el);
          }
          return false;
        });

        if (hasCrashed) {
          cancelAnimationFrame(animationFrameId);
          isPausedRef.current = true;
          
          const crashX = toCanvasX(currentX);
          const crashY = toCanvasY(currentY);
          
          setCarPos({ x: currentX, y: currentY }); 
          
          setExplosionPosition({ x: crashX, y: crashY });
          setShowExplosion(true);
          
          // setCarPos({ x: null, y: null }); 
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
          const initialCount = activeStarsRef.current.length;

          const CAR_WIDTH = 6;
          const CAR_HEIGHT = 1;
          const STAR_RADIUS = 1;

          activeStarsRef.current = activeStarsRef.current.filter(star => {
            const isCollected = checkStarCollection(
              nextX, nextY, 
              currentAngle,
              CAR_WIDTH, CAR_HEIGHT, 
              star.posX, star.posY, 
              STAR_RADIUS
            );

            return !isCollected; 
          });

          if (activeStarsRef.current.length < initialCount) {
            setStarsCollected(totalStars - activeStarsRef.current.length);
            setDisplayStars([...activeStarsRef.current]);
          }
        }

        if (queuedTrackId && !isPausedRef.current) {
          const queuedF = drawnFormulas.find(f => f.id === queuedTrackId);
          if (queuedF) {
            
            const JUMP_HITBOX = 2; 
            
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
          setTimeout(() => showCustomAlert('О ні!','Машинка вилетіла за межі!','error'), 10);
          return; 
        }

        const distToFinish = Math.hypot(nextX - level.finishPosX, nextY - level.finishPosY);
        
        const finishRadius = 3;
        
        if (distToFinish <= finishRadius) {
            keepRacing = false; 
            setIsRacing(false); 
            //setCarPos({ x: level.finishPosX, y: level.finishPosY });

            const totalStars = level.elements ? level.elements.filter(el => el.type === 'Star').length : 0;
            const remainingStars = activeStarsRef.current.length;
            const collectedStarsCount = totalStars - remainingStars;

            const finalTime = (Date.now() - startTimeRef.current) / 1000;

            if (collectedStarsCount === totalStars && totalStars > 0) {
            showCustomAlert(
                'Ідеальна перемога!', 
                'Всі зірки зібрано!', 
                'success',
                () => {
                    if (onLevelComplete) onLevelComplete(finalTime, collectedStarsCount);
                }
            );
        } else {
            showCustomAlert(
                'Рівень пройдено!', 
                `Зібрано зірок: ${collectedStarsCount} з ${totalStars}.`, 
                'success',
                () => {
                    if (onLevelComplete) onLevelComplete(finalTime, collectedStarsCount);
                }
            );
        }
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
    <div className="game-board-container" style={{ position: 'relative' }}>
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
        speedMultiplier={speedMultiplier} 
        setSpeedMultiplier={setSpeedMultiplier}
        onRestart={handleRestart}
      />
      
      <CanvasRenderer 
        canvasRef={canvasRef}
        CANVAS_WIDTH={CANVAS_WIDTH}
        CANVAS_HEIGHT={CANVAS_HEIGHT}
        scale={scale}
        offset={offset}
        level={level}
        //activeStarsRef={activeStarsRef.current}
        //activeStars={displayStars}
        drawnFormulas={drawnFormulas}
        activeTrackId={activeTrackId}
        carPos={carPos}
        carAngle={carAngle}
        renderTrigger={renderTrigger}
        activeStarsRef={activeStarsRef} 
        renderTrigger={renderTrigger}
        //speedMultiplier={speedMultiplier}
      />
      
      <div style={{ position: 'relative', width: CANVAS_WIDTH, height: CANVAS_HEIGHT, margin: '0 auto' }}>
        {showExplosion && (
          <ExplosionManager 
            position={explosionPosition} 
            onAnimationEnd={handleExplosionEnd} 
          />
        )}

      {isCrashed && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', 
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', 
            zIndex: 100, borderRadius: '10px'
          }}>
            <h2 style={{ color: '#ff4c4c', fontSize: '48px', textShadow: '2px 2px 0 #000', margin: '0 0 20px 0' }}>
              💥 Аварія! 💥
            </h2>
            <button
              onClick={handleRestartAfterCrash}
              style={{ 
                padding: '15px 30px', fontSize: '20px', fontWeight: 'bold',
                backgroundColor: '#FF9800', color: 'white', border: 'none', 
                borderRadius: '10px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                transition: 'transform 0.1s'
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              🔄 Спробувати ще раз
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

    <AlertModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={closeCustomAlert}
      />
    </div>
  );
};

export default GameBoard;