import { useState } from 'react';
import axios from 'axios';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    axios.post('https://localhost:7281/api/Auth/login', {
      username: username,
      password: password
    })
    .then(response => {
      const { token, userId, role } = response.data;
      
      localStorage.setItem('mathRider_token', token);
      localStorage.setItem('mathRider_userId', userId);
      localStorage.setItem('mathRider_username', username);
      localStorage.setItem('mathRider_role', role);

      onLoginSuccess(); 
    })
    .catch(err => {
      if (err.response && err.response.data) {
        setError(err.response.data);
      } else {
        setError('Помилка підключення до сервера');
      }
    });
  };

  return (
    <div style={{ maxWidth: '300px', margin: '100px auto', textAlign: 'center', padding: '20px', border: '2px solid #ccc', borderRadius: '10px' }}>
      <h2>Вхід у MathRider</h2>
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" 
          placeholder="Логін (напр. Admin)" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: '10px', fontSize: '16px' }}
          required
        />
        <input 
          type="password" 
          placeholder="Пароль" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '10px', fontSize: '16px' }}
          required
        />
        
        {error && <div style={{ color: 'red', fontWeight: 'bold' }}>{error}</div>}
        
        <button type="submit" style={{ padding: '10px', fontSize: '18px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>
          Грати!
        </button>
      </form>
    </div>
  );
}