import '../styles/ControlPanel.css';

const ControlPanel = ({ 
  formulas, activeTrackId, queuedTrackId, onFormulaChange, onFormulaTypeChange, 
  onAddFormula, onRemoveFormula, onDrawClick, error, isReady, isRacing, 
  onStartRace, onStopRace, onSwitchTrack 
}) => {
  return (
    <div className="control-panel">
      
      {formulas.map((f) => {
        const isActive = f.id === activeTrackId;
        const isQueued = f.id === queuedTrackId;
        const isParametric = f.type === 'parametric';

        return (
          <div key={f.id} className="formula-row">
            <span className={`track-indicator ${isActive ? 'active' : 'inactive'}`}>
              {isActive ? '=>' : ''}
            </span>
            
            <select 
              value={f.type || 'standard'} 
              onChange={(e) => onFormulaTypeChange(f.id, e.target.value)}
              className="formula-select"
            >
              <option value="standard">y = f(x)</option>
              <option value="parametric">x(t), y(t)</option>
            </select>

            {!isParametric ? (
              <div className="input-group">
                <span className="label-bold">y =</span>
                <input 
                  type="text" 
                  value={f.textY} 
                  onChange={(e) => onFormulaChange(f.id, 'textY', e.target.value)}
                  placeholder="x^2 / 10"
                  className={`formula-input standard ${isActive ? 'active' : 'inactive'}`}
                />
              </div>
            ) : (
              <div className="parametric-group">
                <div className="input-group">
                  <span className="label-x">x(t) =</span>
                  <input 
                    type="text" 
                    value={f.textX} 
                    onChange={(e) => onFormulaChange(f.id, 'textX', e.target.value)}
                    placeholder="10 * cos(t)"
                    className={`formula-input parametric ${isActive ? 'active' : 'inactive'}`}
                  />
                </div>
                <div className="input-group">
                  <span className="label-y">y(t) =</span>
                  <input 
                    type="text" 
                    value={f.textY} 
                    onChange={(e) => onFormulaChange(f.id, 'textY', e.target.value)}
                    placeholder="10 * sin(t)"
                    className={`formula-input parametric ${isActive ? 'active' : 'inactive'}`}
                  />
                </div>
              </div>
            )}
            
            {!isActive && (
              <button 
                onClick={() => onSwitchTrack(f.id)} 
                className={`btn btn-icon btn-switch ${isQueued ? 'queued' : ''}`}
                title="Запланувати стрибок на цю трасу"
              >
                {isQueued ? 'Очікування...' : 'Стрибнути'}
              </button>
            )}

            {formulas.length > 1 && (
              <button 
                onClick={() => onRemoveFormula(f.id)} 
                className="btn btn-icon btn-remove"
                title="Видалити трасу"
              >
                X
              </button>
            )}
          </div>
        );
      })}

      <div className="action-panel">
        {formulas.length < 5 && (
          <button onClick={onAddFormula} className="btn btn-small btn-add">
            ➕ Додати графік
          </button>
        )}
        <button onClick={onDrawClick} className="btn btn-text btn-draw">
          Побудувати траси
        </button>
        {isReady && !isRacing && (
          <button onClick={onStartRace} className="btn btn-text btn-start">
            Поїхали!
          </button>
        )}
        {isRacing && (
          <button onClick={onStopRace} className="btn btn-text btn-stop">
            Зупинити
          </button>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}
    </div>
  );
};

export default ControlPanel;