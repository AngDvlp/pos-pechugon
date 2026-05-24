import { useState } from 'react';
import { PlusIcon, CloseIcon } from './UI/Icons';
import { sha256 } from '../utils/security';

export default function Users({ users, setUsers, showToast }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('encargado');
  const [pin, setPin] = useState('');

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!name || !pin) {
      showToast('Por favor complete todos los campos', 'error');
      return;
    }

    if (role === 'encargado') {
      if (pin.length !== 4 || isNaN(parseInt(pin))) {
        showToast('El PIN de sucursal debe ser numérico y exactamente de 4 dígitos', 'error');
        return;
      }
    } else {
      if (pin.length < 6) {
        showToast('La contraseña de administración debe tener al menos 6 caracteres', 'error');
        return;
      }
    }

    // Encrypt the pin using SHA-256 for local storage security
    let hashedPin;
    try {
      hashedPin = await sha256(pin);
    } catch (err) {
      console.error(err);
      showToast('Error al procesar el PIN de seguridad', 'error');
      return;
    }

    // Check PIN/password uniqueness using the hash
    const pinConflict = users.find(u => u.pin === hashedPin);
    if (pinConflict) {
      showToast(role === 'encargado' ? 'Este PIN ya está en uso por otra sucursal' : 'Esta contraseña ya está en uso', 'error');
      return;
    }

    const newUser = {
      id: 'u-' + Date.now(),
      name,
      role,
      pin: hashedPin
    };

    setUsers([...users, newUser]);
    setName('');
    setRole('encargado');
    setPin('');
    setModalOpen(false);
    showToast(`Usuario '${newUser.name}' creado con éxito`, 'success');
  };

  const handleDeleteUser = (id, userName) => {
    if (users.length <= 1) {
      showToast('No puedes eliminar el único usuario del sistema', 'error');
      return;
    }
    
    if (window.confirm(`¿Estás seguro de eliminar el acceso de '${userName}'?`)) {
      setUsers(users.filter(u => u.id !== id));
      showToast(`Usuario '${userName}' eliminado`, 'warning');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Control de Sucursales y Acceso</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Administra los accesos de Sucursales y Supervisores del sistema.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <PlusIcon size={16} /> Crear Nuevo Acceso
          </button>
        </div>
      </div>

      <div className="table-wrap" style={{ marginTop: '20px' }}>
        <table>
          <thead>
            <tr>
              <th>Nombre / Sucursal</th>
              <th>Rol / Perfil</th>
              <th style={{ textAlign: 'center' }}>PIN de Acceso</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: '700' }}>{u.name}</td>
                <td>
                  <span className={`badge ${u.role === 'supervisor' ? 'badge-warning' : 'badge-info'}`}>
                    {u.role === 'supervisor' ? 'Supervisor' : 'Encargado'}
                  </span>
                </td>
                <td style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '15px' }}>
                  ••••
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteUser(u.id, u.name)}
                    style={{ padding: '6px 12px' }}
                  >
                    Eliminar Acceso
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '420px' }}>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>Crear Cuenta de Sucursal / Supervisor</h3>
              <button 
                onClick={() => setModalOpen(false)} 
                style={styles.modalCloseBtn}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="input-group" style={{ marginBottom: '12px' }}>
                <label>Nombre de la Sucursal / Supervisor *</label>
                <input
                  type="text"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Sucursal San Francisco"
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: '12px' }}>
                <label>Perfil / Rol *</label>
                <select
                  className="input-field"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="encargado">Encargado (Sucursal - Ventas y Corte)</option>
                  <option value="supervisor">Supervisor (Administrador - Acceso Total)</option>
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: '20px' }}>
                <label>{role === 'encargado' ? 'PIN de Acceso (4 dígitos) *' : 'Contraseña de Administración (Mín. 6 caracteres) *'}</label>
                <input
                  type="password"
                  maxLength={role === 'encargado' ? 4 : 32}
                  className="input-field"
                  value={pin}
                  onChange={(e) => setPin(role === 'encargado' ? e.target.value.replace(/\D/g, '') : e.target.value)}
                  placeholder={role === 'encargado' ? 'Ej. 9876' : 'Ej. PechugonAdmin2026'}
                  required
                  style={role === 'encargado' ? { fontFamily: 'monospace', letterSpacing: '4px', textAlign: 'center', fontSize: '18px' } : { textAlign: 'center', fontSize: '16px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                >
                  Crear Acceso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    height: '100%',
    overflowY: 'auto',
    width: '100%'
  },
  header: {
    marginBottom: '24px'
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  }
};
