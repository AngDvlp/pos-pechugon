import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import PosTerminal from './components/PosTerminal';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import History from './components/History';
import Customers from './components/Customers';
import Users from './components/Users';
import Settings from './components/Settings';
import CashCut from './components/CashCut';
import StockDeclaration from './components/StockDeclaration';
import { CheckIcon, AlertIcon } from './components/UI/Icons';
import { 
  initialProducts, 
  initialCustomers, 
  initialUsers, 
  initialTransactions, 
  initialCashCuts, 
  initialMermas 
} from './data/mockData';

// Generadores de IDs definidos fuera del componente para cumplir con las reglas de pureza de React 19
const generateToastId = () => Date.now() + Math.random().toString(36).substring(2, 9);
const generateMermaId = () => 'M-' + Date.now();
const generateSessionId = () => 'SES-' + Date.now();
const calculateLockoutTime = (seconds) => Date.now() + seconds * 1000;

function App() {
  // ----------------------------------------------------
  // LocalStorage state loading helpers
  // ----------------------------------------------------
  const getLocalData = (key, defaultValue) => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
      console.error(`Error loading state for ${key}`, e);
      return defaultValue;
    }
  };

  // ----------------------------------------------------
  // Global States
  // ----------------------------------------------------
  const [users, setUsers] = useState(() => {
    const loaded = getLocalData('pos_users', initialUsers);
    const hasBranchUsers = loaded.some(u => u.name === 'Sucursal San Francisco' || u.name === 'Pechumóvil');
    const adminUser = loaded.find(u => u.id === 'u-1');
    const hasNewAdminPassword = adminUser && adminUser.pin === 'PechugonAdmin2026';
    
    if (!hasBranchUsers || !hasNewAdminPassword) {
      try {
        localStorage.removeItem('pos_users');
        localStorage.removeItem('pos_active_session');
        localStorage.removeItem('pos_current_user');
      } catch (e) {
        console.error(e);
      }
      return initialUsers;
    }
    return loaded;
  });
  
  const [products, setProducts] = useState(() => {
    const loaded = getLocalData('pos_products', initialProducts);
    const hasPechugon = loaded.some(p => p.sku === 'B-001');
    if (!hasPechugon) {
      // Clear old database records from localStorage to prevent mismatch
      try {
        localStorage.removeItem('pos_products');
        localStorage.removeItem('pos_transactions');
        localStorage.removeItem('pos_cash_cuts');
        localStorage.removeItem('pos_mermas');
        localStorage.removeItem('pos_active_session');
      } catch (e) {
        console.error(e);
      }
      return initialProducts;
    }
    return loaded;
  });

  const [customers, setCustomers] = useState(() => getLocalData('pos_customers', initialCustomers));

  const [transactions, setTransactions] = useState(() => {
    const loaded = getLocalData('pos_transactions', initialTransactions);
    const loadedProducts = getLocalData('pos_products', initialProducts);
    if (!loadedProducts.some(p => p.sku === 'B-001')) {
      return initialTransactions;
    }
    return loaded;
  });

  const [cashCuts, setCashCuts] = useState(() => {
    const loaded = getLocalData('pos_cash_cuts', initialCashCuts);
    const loadedProducts = getLocalData('pos_products', initialProducts);
    if (!loadedProducts.some(p => p.sku === 'B-001')) {
      return initialCashCuts;
    }
    return loaded;
  });

  const [mermas, setMermas] = useState(() => {
    const loaded = getLocalData('pos_mermas', initialMermas);
    const loadedProducts = getLocalData('pos_products', initialProducts);
    if (!loadedProducts.some(p => p.sku === 'B-001')) {
      return initialMermas;
    }
    return loaded;
  });

  const [cashSession, setCashSession] = useState(() => {
    const loadedProducts = getLocalData('pos_products', initialProducts);
    if (!loadedProducts.some(p => p.sku === 'B-001')) {
      return null;
    }
    return getLocalData('pos_active_session', null);
  });

  const [settings, setSettings] = useState(() => getLocalData('pos_settings', {
    storeName: 'Rosticerías "El Pechugón"',
    storeAddress: 'Calle Comercial #123, Ciudad de México',
    storeRfc: 'PEC-850901-T01',
    taxRate: 16
  }));

  // App control states
  const [currentUser, setCurrentUser] = useState(() => getLocalData('pos_current_user', null));
  const [activeView, setActiveView] = useState('pos');
  const [toasts, setToasts] = useState([]);
  
  // Login input states
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [loginMode, setLoginMode] = useState('pin'); // 'pin' or 'password'
  const [passwordInput, setPasswordInput] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(null); // Timestamp of when lockout ends
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Lockout countdown effect
  useEffect(() => {
    if (!lockoutTime) return;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((lockoutTime - Date.now()) / 1000));
      setTimeRemaining(remaining);
      if (remaining === 0) {
        setLockoutTime(null);
        setFailedAttempts(0);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockoutTime]);

  // ----------------------------------------------------
  // Synchronize States to LocalStorage
  // ----------------------------------------------------
  useEffect(() => {
    localStorage.setItem('pos_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('pos_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pos_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('pos_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('pos_cash_cuts', JSON.stringify(cashCuts));
  }, [cashCuts]);

  useEffect(() => {
    localStorage.setItem('pos_mermas', JSON.stringify(mermas));
  }, [mermas]);

  useEffect(() => {
    localStorage.setItem('pos_active_session', JSON.stringify(cashSession));
  }, [cashSession]);

  useEffect(() => {
    localStorage.setItem('pos_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('pos_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // ----------------------------------------------------
  // Toast Notifications system
  // ----------------------------------------------------
  const showToast = (message, type = 'success') => {
    const id = generateToastId();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    
    // Clear toast after 3 seconds
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(t => t.id !== id));
    }, 3000);
  };

  // ----------------------------------------------------
  // Login handlers
  // ----------------------------------------------------
  const handlePinKeyPress = (digit) => {
    if (lockoutTime) return;
    if (pinInput.length < 4) {
      const newPin = pinInput + digit;
      setPinInput(newPin);
      
      // Auto-validate once 4 digits are completed
      if (newPin.length === 4) {
        validatePin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    if (lockoutTime) return;
    setPinInput(prev => prev.slice(0, -1));
    setLoginError(false);
  };

  const validatePin = (pin) => {
    if (lockoutTime) return;
    
    // Only allow 'encargado' (sucursales) on the PIN keypad
    const foundUser = users.find(u => u.pin === pin && u.role === 'encargado');
    if (foundUser) {
      setCurrentUser(foundUser);
      setPinInput('');
      setLoginError(false);
      setFailedAttempts(0);
      setActiveView('pos');
      showToast(`Sesión iniciada: Bienvenido ${foundUser.name}`, 'success');
    } else {
      setLoginError(true);
      setPinInput('');
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        const lockUntil = calculateLockoutTime(30);
        setLockoutTime(lockUntil);
        setTimeRemaining(30);
        showToast('Demasiados intentos fallidos. Bloqueo temporal por 30 segundos.', 'error');
      } else {
        showToast(`PIN incorrecto. Intentos: ${newAttempts}/3`, 'error');
      }
      
      // Shake animation trigger
      setTimeout(() => setLoginError(false), 500);
    }
  };

  const handlePasswordSubmit = (e) => {
    if (e) e.preventDefault();
    if (lockoutTime) return;

    // Only allow 'supervisor' (administración) on the password screen
    const foundUser = users.find(u => u.role === 'supervisor' && u.pin === passwordInput);
    if (foundUser) {
      setCurrentUser(foundUser);
      setPasswordInput('');
      setLoginError(false);
      setFailedAttempts(0);
      setActiveView('dashboard');
      showToast(`Sesión iniciada: Administración`, 'success');
    } else {
      setLoginError(true);
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        const lockUntil = calculateLockoutTime(30);
        setLockoutTime(lockUntil);
        setTimeRemaining(30);
        showToast('Demasiados intentos fallidos. Bloqueo temporal por 30 segundos.', 'error');
      } else {
        showToast(`Contraseña incorrecta. Intentos: ${newAttempts}/3`, 'error');
      }
      
      // Shake animation trigger
      setTimeout(() => setLoginError(false), 500);
    }
  };

  // Logout/Lock
  const handleLock = () => {
    setCurrentUser(null);
    showToast('Terminal bloqueada', 'warning');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Sesión cerrada correctamente', 'success');
  };

  // ----------------------------------------------------
  // Cash Session Management
  // ----------------------------------------------------
  const startSession = (initialCash) => {
    const newSession = {
      id: generateSessionId(),
      openedAt: new Date().toISOString(),
      cashier: currentUser?.name || 'Sucursal',
      initialCash: initialCash
    };
    setCashSession(newSession);
  };

  const closeSession = (cutReport) => {
    setCashCuts([cutReport, ...cashCuts]);
    setCashSession(null);
  };

  // ----------------------------------------------------
  // Transaction processing callbacks
  // ----------------------------------------------------
  const addTransaction = (newTx) => {
    setTransactions([newTx, ...transactions]);
  };

  // Process a refund (cancel sale) and restock inventory
  const refundTransaction = (txId) => {
    const updatedTxs = transactions.map(t => {
      if (t.id === txId) {
        return { ...t, status: 'devuelto' };
      }
      return t;
    });

    // Find the refunded transaction to restore items stock
    const tx = transactions.find(t => t.id === txId);
    if (tx) {
      const restocks = {};

      tx.items.forEach(item => {
        const catalogProduct = products.find(p => p.sku === item.sku);
        if (catalogProduct && catalogProduct.isCombo) {
          // If it was a combo, restock its components
          catalogProduct.components.forEach(comp => {
            restocks[comp.sku] = (restocks[comp.sku] || 0) + (comp.quantity * item.quantity);
          });
        } else {
          // Normal product
          restocks[item.sku] = (restocks[item.sku] || 0) + item.quantity;
        }
      });

      const updatedProducts = products.map(product => {
        const addQty = restocks[product.sku];
        if (addQty) {
          return {
            ...product,
            stock: product.stock + addQty
          };
        }
        return product;
      });
      setProducts(updatedProducts);
    }

    setTransactions(updatedTxs);
  };

  // ----------------------------------------------------
  // Merma recording callback
  // ----------------------------------------------------
  const registerMerma = (sku, qty, reason) => {
    const product = products.find(p => p.sku === sku);
    if (!product) return;

    const costLoss = product.cost * qty;
    const newMerma = {
      id: generateMermaId(),
      date: new Date().toISOString(),
      sku: sku,
      name: product.name,
      quantity: qty,
      cost: product.cost,
      totalLoss: costLoss,
      reason: reason,
      cashier: currentUser?.name || 'Supervisor'
    };

    // Deduct inventory stock
    const updatedProducts = products.map(p => {
      if (p.sku === sku) {
        return {
          ...p,
          stock: Math.max(0, p.stock - qty)
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    setMermas([newMerma, ...mermas]);
    showToast(`Merma registrada: -${qty} ${product.name} (${reason})`, 'warning');
  };

  // ----------------------------------------------------
  // System Reset (Wipe Database)
  // ----------------------------------------------------
  const handleResetDatabase = () => {
    localStorage.clear();
    window.location.reload();
  };

  // ----------------------------------------------------
  // Render View Selector
  // ----------------------------------------------------
  const renderView = () => {
    switch (activeView) {
      case 'pos':
        return (
          <PosTerminal
            products={products}
            setProducts={setProducts}
            customers={customers}
            setCustomers={setCustomers}
            currentUser={currentUser}
            cashSession={cashSession}
            addTransaction={addTransaction}
            showToast={showToast}
            settings={settings}
            setActiveView={setActiveView}
          />
        );
      case 'cashcut':
        return (
          <CashCut
            currentUser={currentUser}
            cashSession={cashSession}
            startSession={startSession}
            closeSession={closeSession}
            transactions={transactions}
            mermas={mermas}
            showToast={showToast}
          />
        );
      case 'stock_declaration':
        return (
          <StockDeclaration
            products={products}
            setProducts={setProducts}
            showToast={showToast}
          />
        );
      case 'dashboard':
        return (
          <Dashboard
            transactions={transactions}
            mermas={mermas}
            products={products}
          />
        );
      case 'inventory':
        return (
          <Inventory
            products={products}
            setProducts={setProducts}
            categories={[
              { id: 'all', name: 'Todas las Categorías' },
              { id: 'basicos', name: 'Básicos' },
              { id: 'promocion', name: 'Promoción' },
              { id: 'varios', name: 'Varios' },
              { id: 'paquetes', name: 'Paquetes' },
              { id: 'complementos', name: 'Complementos' },
              { id: 'postres', name: 'Postres' }
            ]}
            registerMerma={registerMerma}
            showToast={showToast}
          />
        );
      case 'history':
        return (
          <History
            transactions={transactions}
            refundTransaction={refundTransaction}
            cashCuts={cashCuts}
            mermas={mermas}
            showToast={showToast}
            settings={settings}
          />
        );
      case 'customers':
        return (
          <Customers
            customers={customers}
            setCustomers={setCustomers}
            showToast={showToast}
          />
        );
      case 'users':
        return (
          <Users
            users={users}
            setUsers={setUsers}
            showToast={showToast}
          />
        );
      case 'settings':
        return (
          <Settings
            settings={settings}
            setSettings={setSettings}
            onResetDatabase={handleResetDatabase}
            showToast={showToast}
          />
        );
      default:
        return <div>Vista no encontrada</div>;
    }
  };

  // ----------------------------------------------------
  // IF NOT LOGGED IN: Render Lock / Login Screen
  // ----------------------------------------------------
  if (!currentUser) {
    return (
      <div style={styles.loginContainer}>
        {/* Toast notifications container */}
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {toast.type === 'success' ? <CheckIcon size={16} /> : <AlertIcon size={16} />}
              </span>
              <span>{toast.message}</span>
            </div>
          ))}
        </div>

        <div style={{ ...styles.loginCard, transform: loginError ? 'translateX(10px)' : 'none' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ display: 'block', marginBottom: '12px' }}>
              <img src="/logo.png" alt="Rosticerías El Pechugón" style={{ height: '110px', width: 'auto', margin: '0 auto' }} />
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '1px', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
              Rosticerías <span style={{ color: 'var(--accent)' }}>El Pechugón</span>
            </h2>
          </div>

          {timeRemaining > 0 ? (
            <div style={{ textAlign: 'center', width: '100%', padding: '20px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                <span style={{ color: 'var(--danger)' }}>🚨</span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--danger)', marginBottom: '8px' }}>
                Acceso Bloqueado
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.4', marginBottom: '20px' }}>
                Demasiados intentos fallidos. Por seguridad, la terminal se encuentra bloqueada temporalmente.
              </p>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '800', 
                color: 'var(--accent)', 
                backgroundColor: 'var(--bg-secondary)', 
                padding: '12px', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--border)',
                display: 'inline-block',
                minWidth: '80px'
              }}>
                {timeRemaining}s
              </div>
            </div>
          ) : loginMode === 'password' ? (
            <form onSubmit={handlePasswordSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Contraseña de Administración
                </p>
              </div>
              <div>
                <input 
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Ingrese contraseña..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    textAlign: 'center',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
                    transition: 'border-color 0.2s',
                    marginBottom: '4px'
                  }}
                  autoFocus
                  required
                />
              </div>
              <button 
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 4px 12px var(--accent-glow)'
                }}
              >
                Iniciar Sesión
              </button>
            </form>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Ingrese su PIN de Sucursal
                </p>
              </div>
              {/* Visual feedback circles for PIN length */}
              <div style={styles.pinCircles}>
                {[0, 1, 2, 3].map(index => (
                  <div 
                    key={index} 
                    style={{
                      ...styles.pinCircle,
                      backgroundColor: pinInput.length > index ? 'var(--accent)' : 'transparent',
                      borderColor: loginError ? 'var(--danger)' : 'var(--border)',
                      boxShadow: pinInput.length > index ? '0 0 10px var(--accent-glow)' : 'none'
                    }}
                  />
                ))}
              </div>

              {/* Keyboard Numeric Pad */}
              <div style={styles.keypad}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button 
                    key={num} 
                    onClick={() => handlePinKeyPress(num.toString())}
                    style={styles.keypadBtn}
                  >
                    {num}
                  </button>
                ))}
                <button onClick={() => setPinInput('')} style={{ ...styles.keypadBtn, color: 'var(--danger)', fontSize: '14px' }}>
                  Limpiar
                </button>
                <button onClick={() => handlePinKeyPress('0')} style={styles.keypadBtn}>
                  0
                </button>
                <button onClick={handleBackspace} style={{ ...styles.keypadBtn, color: 'var(--text-muted)', fontSize: '14px' }}>
                  ⌫
                </button>
              </div>
            </>
          )}

          {timeRemaining === 0 && (
            <div style={{ marginTop: '24px', width: '100%', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  setLoginMode(loginMode === 'pin' ? 'password' : 'pin');
                  setPinInput('');
                  setPasswordInput('');
                  setLoginError(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  margin: '0 auto',
                  textDecoration: 'underline'
                }}
              >
                {loginMode === 'pin' ? '🔒 Acceso Administrativo (Contraseña)' : '🏢 Acceso de Sucursales (PIN)'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // LOGGED IN: Render App Layout
  // ----------------------------------------------------
  return (
    <div style={styles.appLayout}>
      {/* Toast notifications container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              {toast.type === 'success' ? <CheckIcon size={16} /> : <AlertIcon size={16} />}
            </span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        currentUser={currentUser}
        onLock={handleLock}
        onLogout={handleLogout}
        cashSession={cashSession}
      />

      <main style={styles.mainContainer}>
        {renderView()}
      </main>
    </div>
  );
}

const styles = {
  loginContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    backgroundColor: 'var(--bg-primary)'
  },
  loginCard: {
    backgroundColor: 'var(--bg-glass)',
    backdropFilter: 'blur(8px)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '36px',
    width: '320px',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'transform 0.1s ease-in-out'
  },
  pinCircles: {
    display: 'flex',
    gap: '16px',
    marginBottom: '28px',
    justifyContent: 'center'
  },
  pinCircle: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '2px solid',
    transition: 'all 0.15s ease'
  },
  keypad: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    width: '100%',
    marginBottom: '20px'
  },
  keypadBtn: {
    height: '56px',
    borderRadius: '50%',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '20px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition)',
    userSelect: 'none',
    '&:active': {
      backgroundColor: 'var(--bg-card-hover)',
      transform: 'scale(0.92)'
    }
  },
  loginHelper: {
    width: '100%',
    borderTop: '1px solid var(--border)',
    paddingTop: '16px',
    marginTop: '4px'
  },
  appLayout: {
    display: 'flex',
    height: '100%',
    width: '100%',
    overflow: 'hidden'
  },
  mainContainer: {
    flex: '1 1 0',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-primary)',
    position: 'relative'
  }
};

export default App;
