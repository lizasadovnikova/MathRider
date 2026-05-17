import { useState, useEffect } from 'react';
import axios from 'axios';
import GameBoard from './components/GameBoard.jsx';
import Login from './components/Login.jsx';
import LevelEditor from './components/LevelEditor.jsx';
import Register from './components/Register.jsx';
import './styles/App.css';

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

  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [userProgress, setUserProgress] = useState([]);

  const fetchProgress = () => {
    const token = localStorage.getItem('mathRider_token');
    if (!token) return;

    axios.get('https://localhost:7281/api/Progress/my', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
      setUserProgress(response.data);
    })
    .catch(error => console.error("Помилка завантаження прогресу:", error));
  };

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
      fetchProgress();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (officialLevels.length > 0 && userProgress.length > 0) {
      let maxCompletedIndex = -1;

      officialLevels.forEach((level, index) => {
        const prog = userProgress.find(p => p.levelId === level.id);
        if (prog && prog.isCompleted) {
          maxCompletedIndex = Math.max(maxCompletedIndex, index);
        }
      });

      setMaxUnlockedIndex(maxCompletedIndex + 1);
    }
  }, [officialLevels, userProgress]);

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

  const handleLevelComplete = async (time = 0, stars = 0) => {
    if (activeLevelIndex !== -1 && activeLevelIndex === maxUnlockedIndex && activeLevelIndex < officialLevels.length - 1) {
      setMaxUnlockedIndex(maxUnlockedIndex + 1);
    }

    const token = localStorage.getItem('mathRider_token');
    if (activeLevel && token) {
      try {
        await axios.post('https://localhost:7281/api/Progress/save', {
          levelId: activeLevel.id,
          time: time,
          stars: stars
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        fetchProgress(); 
      } catch (error) {
        console.error("Помилка збереження прогресу:", error);
      }
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
    .then(() => fetchLevels())
    .catch(error => {
      console.error("Помилка видалення:", error);
      alert("Не вдалося видалити рівень.");
    });
  };

  const filteredLevels = customLevels.filter(level => {
    if (filterDifficulty !== 'all' && level.difficulty !== Number(filterDifficulty)) return false;
    if (filterCategory !== 'all' && level.category !== filterCategory) return false;
    return true;
  });
  //console.log("Рівні з бази:", officialLevels);
  //console.log("Прогрес з бази:", userProgress);

  return (
    <div className="app-container">
      
      {isAuthenticated && (
        <div className="user-info-panel">
          👤 Привіт, {localStorage.getItem('mathRider_username')}! | 
          <button onClick={handleLogout} className="btn-logout">Вийти</button>
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
          <button onClick={() => setCurrentView('editor')} className="btn-create-level">
            Створити свій рівень
          </button>

          <div className="campaign-section">
            <h2 className="section-title">Кампанія</h2>
            {officialLevels.length === 0 ? (
              <p>Офіційних рівнів немає.</p>
            ) : (
              <div className="levels-grid">
                {officialLevels.map((level, index) => {
                  const isUnlocked = userRole === 'Admin' || index <= maxUnlockedIndex;
                  
                  return (
                    <div key={level.id} className="level-card-wrapper">
                      <button 
                        onClick={() => startOfficialGame(level, index)}
                        disabled={!isUnlocked}
                        className={`btn-level btn-official ${isUnlocked ? 'unlocked' : 'locked'}`}
                      >
                        {isUnlocked ? `Рівень ${index + 1}` : `🔒 Заблоковано`}
                        <div className="level-meta">{level.name}</div>
                        
                      {/* відображення прогресу для кампанії */}
                      {(() => {
                        const progress = userProgress.find(p => p.levelId === level.id);
                        if (progress && progress.isCompleted) {
                          
                          let totalStars = 0;
                          if (Array.isArray(level.elements)) {
                            totalStars = level.elements.filter(el => el.type === 'Star').length;
                          }

                          return (
                            <div className="progress-tag-official">
                              ✅ {progress.bestTime ? progress.bestTime.toFixed(1) : 0}с | ⭐ {progress.starsCollected} {totalStars > 0 ? `/ ${totalStars}` : ''}
                            </div>
                          );
                        }
                        return null;
                      })()}

                      </button>

                      {userRole === 'Admin' && (
                        <button 
                          onClick={(e) => handleDeleteLevel(level.id, e)}
                          title="Видалити офіційний рівень"
                          className="btn-delete"
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

          <div className="community-section">
            <h2 className="section-title">Рівні спільноти</h2>
            
            {customLevels.length > 0 && (
              <div className="filters-panel">
                <div>
                  <b className="filter-item-label">Складність:</b>
                  <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)} className="filter-select">
                    <option value="all">Усі рівні</option>
                    <option value="1">🟢 1 Зірка (Легко)</option>
                    <option value="2">🟡 2 Зірки (Нормально)</option>
                    <option value="3">🟠 3 Зірки (Складно)</option>
                    <option value="4">🔴 4 Зірки (Експерт)</option>
                    <option value="5">💀 5 Зірок (Хардкор)</option>
                  </select>
                </div>
                
                <div>
                  <b className="filter-item-label">Категорія:</b>
                  <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="filter-select">
                    <option value="all">Усі жанри</option>
                    <option value="Головоломка">Головоломка</option>
                    <option value="Паркур">Паркур</option>
                    <option value="Лабіринт">Лабіринт</option>
                    <option value="Спідран">Спідран</option>
                  </select>
                </div>
              </div>
            )}

            {filteredLevels.length === 0 ? (
              <p className="empty-message">Рівнів з такими параметрами не знайдено.</p>
            ) : (
              <div className="levels-grid">
                {filteredLevels.map((level) => (
                  <div key={level.id} className="level-card-wrapper"> 
                    <button 
                      onClick={() => startCustomGame(level)}
                      className="btn-level btn-custom"
                    >
                      <div className="level-name">{level.name}</div>
                      
                      {/* відображення прогресу для кастомних рівнів */}
                      {(() => {
                        const progress = userProgress.find(p => p.levelId === level.id);
                        if (progress && progress.isCompleted) {
                          
                          let totalStars = 0;
                          if (Array.isArray(level.elements)) {
                            totalStars = level.elements.filter(el => el.type === 'Star').length;
                          }

                          return (
                            <div className="progress-tag">
                              ✅ Пройдено <br/>
                              ⏱️ {progress.bestTime ? progress.bestTime.toFixed(1) : 0}с | ⭐ {progress.starsCollected} {totalStars > 0 ? `/ ${totalStars}` : ''}
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      <div className="level-meta">
                        {level.difficulty === 1 && '🟢 1'}
                        {level.difficulty === 2 && '🟡 2'}
                        {level.difficulty === 3 && '🟠 3'}
                        {level.difficulty === 4 && '🔴 4'}
                        {level.difficulty === 5 && '💀 5'} 
                        {' | '} {level.category}
                      </div>

                      {level.creator && <div className="level-author">Автор: {level.creator.username}</div>}
                    </button>

                    {userRole === 'Admin' && (
                      <button 
                        onClick={(e) => handleDeleteLevel(level.id, e)}
                        title="Видалити рівень"
                        className="btn-delete"
                      >
                        ✖
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
          <div className="playing-header">
            <button onClick={() => setCurrentView('menu')} className="btn-back">⬅ В меню</button>
            <h2>Граємо: {activeLevel?.name}</h2>
            <div className="header-spacer"></div>
          </div>
          
          {activeLevel && (
            <GameBoard level={activeLevel} onLevelComplete={handleLevelComplete} /> 
          )}
        </div>
      )}
    </div>
  );
}

export default App;