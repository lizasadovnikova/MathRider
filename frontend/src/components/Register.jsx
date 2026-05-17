import { useState } from 'react';
import axios from 'axios';
import '../styles/Register.css';

export default function Register({ onSwitchToLogin, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      return setError('Пароль має містити мінімум 8 символів.');
    }
    
    if (!/[a-zA-Zа-яА-ЯіІїЇєЄґҐ]/.test(password)) {
      return setError('Пароль має містити хоча б одну літеру.');
    }

    setIsLoading(true);

    axios.post('https://localhost:7281/api/Auth/register', {
      username: username,
      password: password
    })
    .then(() => {
      return axios.post('https://localhost:7281/api/Auth/login', {
        username: username,
        password: password
      });
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
      setIsLoading(false);
    });
  };

  return (
    <div className="register-container">
      <h2>Реєстрація</h2>
      
      <form onSubmit={handleRegister} className="register-form">
        <input 
          type="text" 
          placeholder="Придумайте логін" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="register-input"
          required
        />
        <input 
          type="password" 
          placeholder="Придумайте пароль" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="register-input"
          required
        />
        
        {error && <div className="register-error">{error}</div>}
        
        <button 
          type="submit" 
          disabled={isLoading}
          className="btn-submit"
        >
          {isLoading ? 'Створюємо...' : 'Зареєструватися'}
        </button>
      </form>

      <div className="register-footer">
        Вже маєте акаунт? <br/>
        <button 
          onClick={onSwitchToLogin} 
          className="auth-link-btn"
        >
          Увійти тут
        </button>
      </div>
    </div>
  );
}