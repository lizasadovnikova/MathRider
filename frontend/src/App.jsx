import { useState, useEffect } from 'react'
import axios from 'axios'
import GameBoard from './components/GameBoard.jsx'
import Login from './components/Login.jsx';
import LevelEditor from './components/LevelEditor.jsx';
import Register from './components/Register.jsx';

function App() {
  const [officialLevels, setOfficialLevels] = useState([]);
  const [customLevels, setCustomLevels] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('mathRider_token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('mathRider_role') || 'User');
  const [authView, setAuthView] = useState('login');
  
  const [currentView, setCurrentView] = useState('menu');
  const [activeLevel, setActiveLevel] = useState(null);
  const [activeLevelIndex, setActiveLevelIndex] = useState(0);
  const [maxUnlockedIndex, setMaxUnlockedIndex] = useState(0);

  const fetchLevels = () => {
    setIsLoading(true); 
    const token = localStorage.getItem('mathRider_token');
    const headers = { 'Authorization': `Bearer ${token}` };

    Promise.all([
      axios.get('https://localhost:7281/api/Levels/official', { headers }),
      axios.get('https://localhost:7281/api/Levels/sandbox', { headers })
    ])
    .then(([officialResponse, sandboxResponse]) => {
      setOfficialLevels(officialResponse.data);
      setCustomLevels(sandboxResponse.data);
    })
    .catch(error => {
      console.error("Помилка завантаження:", error);
      alert("Не вдалося завантажити рівні. Перевір бекенд!");
    })
    .finally(() => {
      setIsLoading(false); 
    });
  };

  useEffect(() => {
    if (isAuthenticated) {
      setUserRole(localStorage.getItem('mathRider_role') || 'User');
      fetchLevels();
    }
  }, [isAuthenticated]);

  const startOfficialGame = (level, index) => {
    setActiveLevel(level);
    setActiveLevelIndex(index);
    setCurrentView('game');
  };

  const startCustomGame = (level) => {
    setActiveLevel(level);
    setActiveLevelIndex(-1);
    setCurrentView('game');
  };

  const handleLevelComplete = () => {
    if (activeLevelIndex !== -1 && activeLevelIndex === maxUnlockedIndex && activeLevelIndex < officialLevels.length - 1) {
      setMaxUnlockedIndex(maxUnlockedIndex + 1);
    }
    setCurrentView('menu');
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setCurrentView('menu');
  };

  const handleDeleteLevel = (id, event) => {
    event.stopPropagation();
    
    if (!window.confirm("Ви впевнені, що хочете назавжди видалити цей рівень?")) return;

    const token = localStorage.getItem('mathRider_token');
    
    axios.delete(`https://localhost:7281/api/Levels/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(() => {
      fetchLevels();
    })
    .catch(error => {
      console.error("Помилка видалення:", error);
      alert("Не вдалося видалити рівень.");
    });
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
            authView === 'login' ? (
              <Login 
                onLoginSuccess={() => setIsAuthenticated(true)} 
                onSwitchToRegister={() => setAuthView('register')} 
              />
            ) : (
              <Register 
                onSwitchToLogin={() => setAuthView('login')} 
                onLoginSuccess={() => setIsAuthenticated(true)}
              />
            )
      ) : isLoading ? (
        <p> Завантажуються рівні з бази...</p>
      ) : currentView === 'menu' ? (
        
        <div>
          <button 
            onClick={() => setCurrentView('editor')}
            style={{ padding: '15px 30px', fontSize: '18px', backgroundColor: '#9c27b0', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}
          >
            Створити свій рівень
          </button>

          <div style={{ padding: '20px', backgroundColor: '#f0f8ff', borderRadius: '10px', marginBottom: '30px' }}>
            <h2 style={{ margin: '0 0 15px 0', color: '#333' }}>Кампанія</h2>
            {officialLevels.length === 0 ? (
              <p>Офіційних рівнів немає.</p>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
                {officialLevels.map((level, index) => {
                  // 👇 ТУТ МАГІЯ: Додали перевірку на Адміна через || (АБО) 👇
                  const isUnlocked = userRole === 'Admin' || index <= maxUnlockedIndex;
                  
                  return (
                    <div key={level.id} style={{ position: 'relative' }}>
                      <button 
                        onClick={() => startOfficialGame(level, index)}
                        disabled={!isUnlocked}
                        style={{
                          padding: '15px 25px', fontSize: '16px', cursor: isUnlocked ? 'pointer' : 'not-allowed',
                          backgroundColor: isUnlocked ? '#4CAF50' : '#9E9E9E', color: 'white', border: 'none', borderRadius: '10px',
                          boxShadow: isUnlocked ? '0 4px 6px rgba(0,0,0,0.2)' : 'none',
                          transform: isUnlocked ? 'scale(1)' : 'scale(0.95)', transition: 'all 0.2s',
                          minWidth: '140px'
                        }}
                      >
                        {isUnlocked ? `Рівень ${index + 1}` : `🔒 Заблоковано`}
                        <div style={{ fontSize: '14px', marginTop: '5px' }}>{level.name}</div>
                      </button>

                      {/* Кнопка видалення для Адміна */}
                      {userRole === 'Admin' && (
                        <button 
                          onClick={(e) => handleDeleteLevel(level.id, e)}
                          title="Видалити офіційний рівень"
                          style={{
                            position: 'absolute', top: '-10px', right: '-10px',
                            backgroundColor: '#f44336', color: 'white', border: 'none',
                            borderRadius: '50%', width: '30px', height: '30px',
                            cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            zIndex: 10 
                          }}
                        >
                          ✖
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ padding: '20px', backgroundColor: '#fff3e0', borderRadius: '10px' }}>
            <h2 style={{ margin: '0 0 15px 0', color: '#333' }}>Рівні спільноти</h2>
            {customLevels.length === 0 ? (
              <p style={{ color: '#666' }}>Гравці ще не створили жодного рівня. Будьте першим!</p>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
                {customLevels.map((level) => (
                  <div key={level.id} style={{ position: 'relative' }}> 
                    <button 
                      onClick={() => startCustomGame(level)}
                      style={{
                        padding: '15px 25px', fontSize: '16px', cursor: 'pointer',
                        backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '10px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.2)', width: '100%'
                      }}
                    >
                      <div>{level.name}</div>
                      {level.creator && <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>Автор: {level.creator.username}</div>}
                    </button>

                    {userRole === 'Admin' && (
                      <button 
                        onClick={(e) => handleDeleteLevel(level.id, e)}
                        title="Видалити рівень"
                        style={{
                          position: 'absolute', top: '-10px', right: '-10px',
                          backgroundColor: '#f44336', color: 'white', border: 'none',
                          borderRadius: '50%', width: '30px', height: '30px',
                          cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}
                      >
                        X
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      ) : currentView === 'editor' ? (
        
        <LevelEditor 
          onExit={() => setCurrentView('menu')} 
          onLevelSaved={() => {
            fetchLevels(); 
            setCurrentView('menu'); 
          }}
        />

      ) : (

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <button onClick={() => setCurrentView('menu')} style={{ padding: '10px 15px', cursor: 'pointer', borderRadius: '5px' }}>⬅ В меню</button>
            <h2>Граємо: {activeLevel?.name}</h2>
            <div style={{ width: '100px' }}></div>
          </div>
          
          {activeLevel && (
            <GameBoard level={activeLevel} onLevelComplete={handleLevelComplete} /> 
          )}
        </div>
      )}
    </div>
  )
}

export default App