import { useState, useEffect } from 'react'
import axios from 'axios'
import GameBoard from './components/GameBoard.jsx'

function App() {
  const [levels, setLevels] = useState([]);

  useEffect(() => {
    const backendUrl = 'https://localhost:7281/api/Levels'; 

    axios.get(backendUrl)
      .then(response => {
        setLevels(response.data);
      })
      .catch(error => {
        console.error("Помилка підключення:", error);
      });
  }, []);

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>MathRider</h1>
      
      {levels.length === 0 ? (
        <p>Завантажуються рівні з бази...</p>
      ) : (
        <div>
          <h2>Рівень: {levels[0].name}</h2>
          <GameBoard level={levels[0]} /> 
        </div>
      )}
    </div>
  )
}

export default App