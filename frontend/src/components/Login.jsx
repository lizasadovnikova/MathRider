import { useState } from 'react';
import axios from 'axios';
import '../styles/Login.css';

export default function Login({ onLoginSuccess, onSwitchToRegister }) {
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
      const { token, userId, username, role } = response.data;
      
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
    <div className="login-container">
      <h2>Вхід у MathRider</h2>
      
      <form onSubmit={handleLogin} className="login-form">
        <input 
          type="text" 
          placeholder="Логін" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="login-input"
          required
        />
        <input 
          type="password" 
          placeholder="Пароль" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
          required
        />
        
        {error && <div className="login-error">{error}</div>}
        
        <button type="submit" className="btn-login">
          Грати!
        </button>
      </form>

      <div className="login-footer">
        Вперше у грі? <br/>
        <button 
          onClick={onSwitchToRegister} 
          className="login-link-btn"
        >
          Створити акаунт
        </button>
      </div>
    </div>
  );
}