import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function LevelEditor({ onExit }) {
  const canvasRef = useRef(null);
  
  const [levelName, setLevelName] = useState('Мій супер рівень');
  const [elements, setElements] = useState([]);
  const [selectedTool, setSelectedTool] = useState('Star');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.fillRect(700, 250, 80, 80);
    ctx.fillStyle = 'black';
    ctx.fillText("ФІНІШ", 720, 290);

    elements.forEach(el => {
      if (el.type === 'obstacle') {
        ctx.fillStyle = '#f44336';
        ctx.fillRect(el.posX, el.posY, el.width, el.height);
      } else if (el.type === 'Star') {
        ctx.fillStyle = 'gold';
        ctx.beginPath();
        ctx.arc(el.posX + el.width/2, el.posY + el.height/2, el.width/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });
  }, [elements]);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const newElement = {
      type: selectedTool,
      posX: clickX,
      posY: clickY,
      width: selectedTool === 'obstacle' ? 40 : 20,
      height: selectedTool === 'obstacle' ? 40 : 20
    };

    setElements(prev => [...prev, newElement]);
  };

  const handleSaveLevel = () => {
    setIsSaving(true);
    
    const token = localStorage.getItem('mathRider_token');
    const userId = localStorage.getItem('mathRider_userId');

    const newLevelData = {
      name: levelName,
      startPosX: 50,
      startPosY: 300,
      finishPosX: 740,
      finishPosY: 290,
      vehicleMass: 10,
      enginePower: 15,
      userId: parseInt(userId),
      elements: elements
    };

    axios.post('https://localhost:7281/api/Levels', newLevelData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      alert("Рівень успішно збережено в Пісочницю!");
      onExit();
    })
    .catch(error => {
      console.error(error);
      alert("Помилка збереження. Перевірте консоль.");
      setIsSaving(false);
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <button onClick={onExit} style={{ padding: '8px 15px' }}>⬅ Назад</button>
        
        <input 
          type="text" 
          value={levelName} 
          onChange={(e) => setLevelName(e.target.value)}
          style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', padding: '5px' }}
        />

        <button 
          onClick={handleSaveLevel} 
          disabled={isSaving}
          style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {isSaving ? 'Збереження...' : 'Зберегти рівень'}
        </button>
      </div>

      <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ccc' }}>
        <span style={{ fontWeight: 'bold', marginRight: '15px' }}>Інструменти:</span>
        <button onClick={() => setSelectedTool('Star')} style={{ marginRight: '10px', backgroundColor: selectedTool === 'Star' ? 'gold' : '#eee' }}>⭐ Зірка</button>
        <button onClick={() => setSelectedTool('obstacle')} style={{ marginRight: '10px', backgroundColor: selectedTool === 'obstacle' ? '#f44336' : '#eee', color: selectedTool === 'obstacle' ? 'white' : 'black' }}>🧱 Перешкода</button>
        <button onClick={() => setElements([])} style={{ backgroundColor: '#ffebee', color: 'red', border: '1px solid red' }}>🗑️ Очистити</button>
      </div>

      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600} 
        onClick={handleCanvasClick}
        style={{ border: '2px dashed #999', cursor: 'crosshair' }}
      />
    </div>
  );
}