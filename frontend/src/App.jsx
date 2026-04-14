import { useState, useEffect } from 'react'
import axios from 'axios'
import GameBoard from './components/GameBoard.jsx'
import Login from './components/Login.jsx';
import LevelEditor from './components/LevelEditor.jsx';

function App() {
  const [levels, setLevels] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('mathRider_token'));
  
  const [currentView, setCurrentView] = useState('menu');
  const [activeLevelIndex, setActiveLevelIndex] = useState(0);
  const [maxUnlockedIndex, setMaxUnlockedIndex] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    const backendUrl = 'https://localhost:7281/api/Levels/official'; 

    axios.get(backendUrl)
      .then(response => {
        setLevels(response.data);
      })
      .catch(error => {
        console.error("Помилка підключення:", error);
      });
  }, [isAuthenticated]);

  const startGame = (index) => {
    setActiveLevelIndex(index);
    setCurrentView('game');
  };

  const handleLevelComplete = () => {
    if (activeLevelIndex === maxUnlockedIndex && activeLevelIndex < levels.length - 1) {
      setMaxUnlockedIndex(maxUnlockedIndex + 1);
    }
    setCurrentView('menu');
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setCurrentView('menu');
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      
      {isAuthenticated && (
        <div style={{ textAlign: 'right', marginBottom: '-40px' }}>
          👤 Привіт, {localStorage.getItem('mathRider_username')}! | 
          <button onClick={handleLogout} style={{ marginLeft: '10px', cursor: 'pointer', backgroundColor: 'transparent', border: '1px solid black', borderRadius: '3px' }}>Вийти</button>
        </div>
      )}
      
      <h1>MathRider</h1>
      
      {!isAuthenticated ? (
        <Login onLoginSuccess={() => setIsAuthenticated(true)} />
      ) : levels.length === 0 ? (
        <p>Завантажуються рівні з бази...</p>
      ) : currentView === 'menu' ? (
        
        <div>
          <h2>Кампанія: Вибір рівня</h2>
          
          <button 
            onClick={() => setCurrentView('editor')}
            style={{ padding: '15px 30px', fontSize: '18px', backgroundColor: '#9c27b0', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}
          >
            Створити свій рівень
          </button>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', marginTop: '10px' }}>
            {levels.map((level, index) => {
              const isUnlocked = index <= maxUnlockedIndex;
              return (
                <button 
                  key={level.id} 
                  onClick={() => startGame(index)}
                  disabled={!isUnlocked}
                  style={{
                    padding: '20px 30px',
                    fontSize: '18px',
                    cursor: isUnlocked ? 'pointer' : 'not-allowed',
                    backgroundColor: isUnlocked ? '#4CAF50' : '#9E9E9E',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    boxShadow: isUnlocked ? '0 4px 6px rgba(0,0,0,0.2)' : 'none',
                    transform: isUnlocked ? 'scale(1)' : 'scale(0.95)',
                    transition: 'all 0.2s'
                  }}
                >
                  {isUnlocked ? `Рівень ${index + 1}` : `🔒 Заблоковано`}
                  <div style={{ fontSize: '14px', marginTop: '5px' }}>{level.name}</div>
                </button>
              );
            })}
          </div>
        </div>

      ) : currentView === 'editor' ? (
        
        <LevelEditor onExit={() => setCurrentView('menu')} />

      ) : (

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <button 
              onClick={() => setCurrentView('menu')} 
              style={{ padding: '10px 15px', cursor: 'pointer', borderRadius: '5px' }}
            >
              ⬅ В меню
            </button>
            <h2>Граємо: {levels[activeLevelIndex].name}</h2>
            <div style={{ width: '100px' }}></div>
          </div>
          
          <GameBoard 
            level={levels[activeLevelIndex]} 
            onLevelComplete={handleLevelComplete} 
          /> 
        </div>
      )}
    </div>
  )
}

export default App