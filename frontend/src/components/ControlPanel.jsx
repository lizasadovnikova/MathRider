const ControlPanel = ({ formula, onFormulaChange, onDrawClick }) => {
  return (
    <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
      <span style={{ fontSize: '20px', fontWeight: 'bold' }}>y = </span>
      
      <input 
        type="text" 
        value={formula}
        onChange={(e) => onFormulaChange(e.target.value)}
        placeholder="Наприклад: x^2 / 10"
        style={{ 
          padding: '8px', 
          fontSize: '16px', 
          borderRadius: '5px', 
          border: '1px solid #ccc', 
          width: '250px' 
        }}
      />
      
      <button 
        onClick={onDrawClick}
        style={{ 
          padding: '8px 15px', 
          fontSize: '16px', 
          backgroundColor: '#2196F3', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px', 
          cursor: 'pointer',
          fontWeight: 'bold',
          transition: 'background 0.3s'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#1976D2'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#2196F3'}
      >
        Побудувати трасу
      </button>
    </div>
  );
};

export default ControlPanel;
