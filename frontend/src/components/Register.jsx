import { useState } from 'react';
import axios from 'axios';

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
    <div style={{ maxWidth: '300px', margin: '100px auto', textAlign: 'center', padding: '20px', border: '2px solid #ccc', borderRadius: '10px', backgroundColor: '#f9f9f9' }}>
      <h2>Реєстрація</h2>
      
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" 
          placeholder="Придумайте логін" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: '10px', fontSize: '16px' }}
          required
        />
        <input 
          type="password" 
          placeholder="Придумайте пароль" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '10px', fontSize: '16px' }}
          required
        />
        
        {error && <div style={{ color: 'red', fontWeight: 'bold', fontSize: '14px' }}>{error}</div>}
        
        <button 
          type="submit" 
          disabled={isLoading}
          style={{ padding: '10px', fontSize: '18px', cursor: 'pointer', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          {isLoading ? 'Створюємо...' : 'Зареєструватися'}
        </button>
      </form>

      <div style={{ marginTop: '20px', fontSize: '14px' }}>
        Вже маєте акаунт? <br/>
        <button 
          onClick={onSwitchToLogin} 
          style={{ background: 'none', color: 'blue', border: 'none', cursor: 'pointer', textDecoration: 'underline', marginTop: '5px' }}
        >
          Увійти тут
        </button>
      </div>
    </div>
  );
}