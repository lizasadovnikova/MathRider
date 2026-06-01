import React from 'react';

const CreditsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Про застосунок (Credits)</h2>
          <button style={styles.closeButton} onClick={onClose}>&times;</button>
        </div>

        <div style={styles.content}>
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Науково-методичний контекст</h3>
            <p style={styles.text}>
              <strong>Тема проєкту:</strong> Розробка програмного забезпечення для гейміфікації освітнього процесу.
            </p>
            <p style={styles.text}>
              <strong>Призначення:</strong> Інтерактивне середовище для моделювання кінематики руху вздовж аналітично заданих траєкторій (стандартних та параметричних функцій).
            </p>
            <p style={styles.text}>
              Розроблено в межах курсової роботи студентки 3-го курсу кафедри теорії та технології програмування факультету комп’ютерних наук та кібернетики КНУ ім. Тараса Шевченка.
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Технологічний стек</h3>
            <ul style={styles.list}>
              <li><strong>Frontend:</strong> React, HTML5 Canvas API, math.js</li>
              <li><strong>Backend & DB:</strong> C# (.NET), ASP.NET Core Web API, Entity Framework Core, MS SQL Server</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Використані графічні ліцензії</h3>
            <p style={styles.text}>
              Усі графічні асети симулятора використовуються відповідно до умов безкоштовних ліцензій правовласників із зазначенням авторства:
            </p>
            <div style={styles.attributionBox}>
              <div style={styles.attributionItem}>
                <span>Елемент «Зірка»:</span>
                <a 
                  href="https://www.flaticon.com/free-icons/star" 
                  title="star icons" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={styles.link}
                >
                  Star icons created by Freepik - Flaticon
                </a>
              </div>
              <div style={styles.attributionItem}>
                <span>Елемент «Машинка»:</span>
                <a 
                  href="https://www.flaticon.com/free-icons/cars" 
                  title="car icons" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={styles.link}
                >
                  Cars icons created by BZZRINCANTATION - Flaticon
                </a>
              </div>
              <div style={styles.attributionItem}>
                <span>Елемент «Перешкода»:</span>
                <a 
                  href="https://www.flaticon.com/free-icons/brick-wall" 
                  title="brick wall icons" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={styles.link}
                >
                  Brick wall icons created by Freepik - Flaticon
                </a>
              </div>
              <div style={styles.attributionItem}>
                <span>Елемент «Старт»:</span>
                <a 
                  href="https://www.flaticon.com/free-icons/ground" 
                  title="start icons" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={styles.link}
                >
                  ground icons created by juicy_fish - Flaticon
                </a>
              </div>
              <div style={styles.attributionItem}>
                <span>Елемент «Фініш»:</span>
                <a 
                  href="https://www.flaticon.com/free-icons/entrance" 
                  title="finish icons" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={styles.link}
                >
                  Entrance icons created by Freepik - Flaticon
                </a>
              </div>
            </div>
          </section>
        </div>

        <div style={styles.footer}>
          <button style={styles.actionButton} onClick={onClose}>Зрозуміло</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(3px)',
  },
  modal: {
    backgroundColor: '#1e1e1e',
    color: '#e0e0e0',
    width: '90%',
    maxWidth: '550px',
    borderRadius: '12px',
    border: '1px solid #333',
    padding: '24px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '85vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'between',
    alignItems: 'center',
    borderBottom: '1px solid #333',
    paddingBottom: '12px',
    marginBottom: '16px',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    color: '#2196F3',
    fontWeight: '600',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0 5px',
    transition: 'color 0.2s',
  },
  content: {
    overflowY: 'auto',
    paddingRight: '8px',
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    margin: '0 0 8px 0',
    fontSize: '15px',
    color: '#ff9800',
    fontWeight: '600',
  },
  text: {
    margin: '0 0 8px 0',
    fontSize: '13.5px',
    lineHeight: '1.5',
    color: '#cccccc',
  },
  list: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '13.5px',
    lineHeight: '1.6',
    color: '#cccccc',
  },
  attributionBox: {
    backgroundColor: '#151515',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    padding: '12px',
    marginTop: '8px',
  },
  attributionItem: {
    fontSize: '13px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '5px',
  },
  link: {
    color: '#4caf50',
    textDecoration: 'none',
    borderBottom: '1px dashed #4caf50',
    transition: 'color 0.2s',
  },
  footer: {
    borderTop: '1px solid #333',
    paddingTop: '16px',
    marginTop: '8px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  actionButton: {
    backgroundColor: '#2196F3',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 20px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.2s',
  },
};

export default CreditsModal;