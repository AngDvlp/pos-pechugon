import { 
  POSIcon, 
  DashboardIcon, 
  InventoryIcon, 
  HistoryIcon, 
  UsersIcon, 
  CustomersIcon, 
  SettingsIcon, 
  CashCutIcon,
  LockIcon,
  LogOutIcon,
  FoodIcon
} from './UI/Icons';

export default function Sidebar({ activeView, setActiveView, currentUser, onLock, onLogout, cashSession }) {
  const isSupervisor = currentUser?.role === 'supervisor';

  const menuItems = [
    { id: 'pos', name: 'Terminal POS', icon: <POSIcon />, roles: ['supervisor', 'encargado'] },
    { id: 'stock_declaration', name: 'Cocina', icon: <FoodIcon />, roles: ['supervisor', 'encargado'] },
    { id: 'cashcut', name: 'Corte de Caja', icon: <CashCutIcon />, roles: ['supervisor', 'encargado'] },
    { id: 'dashboard', name: 'Dashboard', icon: <DashboardIcon />, roles: ['supervisor'] },
    { id: 'inventory', name: 'Inventario', icon: <InventoryIcon />, roles: ['supervisor'] },
    { id: 'history', name: 'Historial', icon: <HistoryIcon />, roles: ['supervisor', 'encargado'] },
    { id: 'customers', name: 'Clientes', icon: <CustomersIcon />, roles: ['supervisor'] },
    { id: 'users', name: 'Sucursales / Acceso', icon: <UsersIcon />, roles: ['supervisor'] },
    { id: 'settings', name: 'Configuración', icon: <SettingsIcon />, roles: ['supervisor'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(currentUser?.role));

  const getShortName = (name) => {
    if (!name) return '';
    if (name === 'Sucursal San Francisco') return 'S. Francisco';
    if (name === 'Pechumóvil') return 'Pechumóvil';
    if (name === 'Administración') return 'Admin';
    return name.split(' ')[0];
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.header}>
        <div style={styles.logoContainer}>
          <img src="/logo.png" alt="Rosticerías El Pechugón" style={{ height: '36px', width: 'auto', borderRadius: '4px' }} />
          <span style={styles.logoText}>EL <span style={{color: 'var(--accent)'}}>PECHUGÓN</span></span>
        </div>
        <div style={styles.userBadge}>
          <div style={styles.userName} title={currentUser?.name}>{getShortName(currentUser?.name)}</div>
          <span className={`badge ${isSupervisor ? 'badge-warning' : 'badge-info'}`} style={styles.roleBadge}>
            {isSupervisor ? 'Supervisor' : 'Encargado'}
          </span>
        </div>
        {cashSession ? (
          <div style={styles.sessionStatus}>
            <span style={styles.sessionDot}></span>
            <span>Caja Abierta: ${cashSession.initialCash.toFixed(2)}</span>
          </div>
        ) : (
          <div style={styles.sessionStatusClosed}>
            <span style={styles.sessionDotClosed}></span>
            <span>Caja Cerrada</span>
          </div>
        )}
      </div>

      <nav style={styles.nav}>
        {filteredItems.map(item => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              style={{
                ...styles.navLink,
                backgroundColor: isActive ? 'var(--bg-card-hover)' : 'transparent',
                borderColor: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)'
              }}
            >
              <span style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}>
                {item.icon}
              </span>
              <span style={styles.navText}>{item.name}</span>
              {isActive && <div style={styles.activeIndicator} />}
            </button>
          );
        })}
      </nav>

      <div style={styles.footer}>
        <button className="btn btn-secondary" onClick={onLock} style={styles.actionBtn} title="Bloquear Terminal">
          <LockIcon size={16} />
          <span style={styles.navText}>Bloquear</span>
        </button>
        <button className="btn btn-danger btn-sm" onClick={onLogout} style={{ ...styles.actionBtn, marginTop: '8px' }} title="Cerrar Sesión">
          <LogOutIcon size={16} />
          <span style={styles.navText}>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '240px',
    backgroundColor: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flexShrink: 0,
    zIndex: 10,
    transition: 'var(--transition)'
  },
  header: {
    padding: '24px 20px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  logoIcon: {
    fontSize: '22px',
    lineHeight: 1
  },
  logoText: {
    fontSize: '18px',
    fontWeight: '800',
    letterSpacing: '1px',
    color: 'var(--text-primary)'
  },
  userBadge: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--bg-primary)',
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    marginTop: '4px'
  },
  userName: {
    fontWeight: '600',
    fontSize: '13px',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '90px'
  },
  roleBadge: {
    fontSize: '10px',
    padding: '2px 8px',
    textTransform: 'uppercase'
  },
  sessionStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: 'var(--success)',
    fontWeight: '500'
  },
  sessionDot: {
    width: '6px',
    height: '6px',
    backgroundColor: 'var(--success)',
    borderRadius: '50%',
    display: 'inline-block',
    boxShadow: '0 0 8px var(--success)'
  },
  sessionStatusClosed: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: 'var(--danger)',
    fontWeight: '500'
  },
  sessionDotClosed: {
    width: '6px',
    height: '6px',
    backgroundColor: 'var(--danger)',
    borderRadius: '50%',
    display: 'inline-block'
  },
  nav: {
    flex: '1 1 0',
    padding: '20px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflowY: 'auto'
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    border: 'none',
    borderLeft: '3px solid transparent',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'var(--transition)',
    position: 'relative'
  },
  navText: {
    flexGrow: 1
  },
  activeIndicator: {
    position: 'absolute',
    right: '12px',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent)'
  },
  footer: {
    padding: '20px 16px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column'
  },
  actionBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '10px',
    padding: '8px 12px',
    fontSize: '13px'
  }
};
