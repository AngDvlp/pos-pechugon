import { useState } from 'react';
import { PlusIcon, CloseIcon } from './UI/Icons';

export default function Customers({ customers, setCustomers, showToast }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!name) {
      showToast('Por favor ingrese al menos el nombre', 'error');
      return;
    }

    const newCustomer = {
      id: 'c-' + Date.now(),
      name,
      phone: phone || 'N/A',
      email: email || 'N/A',
      points: 0,
      totalSpent: 0
    };

    setCustomers([...customers, newCustomer]);
    setName('');
    setPhone('');
    setEmail('');
    setModalOpen(false);
    showToast(`Cliente '${newCustomer.name}' registrado con éxito`, 'success');
  };

  const filteredCustomers = customers
    .filter(c => c.id !== 'c-general') // Do not show Publico General in the management directory
    .filter(c => {
      return c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             c.phone.includes(searchQuery) ||
             c.email.toLowerCase().includes(searchQuery.toLowerCase());
    });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Directorio de Clientes</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Gestiona los datos de los clientes y consulta sus puntos de fidelidad acumulados.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <PlusIcon size={16} /> Registrar Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Filter and search controls */}
      <div className="card" style={styles.filterCard}>
        <div className="input-group">
          <label>Buscar Cliente</label>
          <input
            type="text"
            className="input-field"
            placeholder="Buscar por Nombre, Teléfono o Correo Electrónico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrap" style={{ marginTop: '20px' }}>
        <table>
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Teléfono</th>
              <th>Correo Electrónico</th>
              <th style={{ textAlign: 'center' }}>Puntos Acumulados</th>
              <th style={{ textAlign: 'right' }}>Total Compras</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: '700' }}>{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.email}</td>
                <td style={{ textAlign: 'center', fontWeight: '800', color: 'var(--success)' }}>
                  {c.points} pts
                </td>
                <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--accent)' }}>
                  ${c.totalSpent.toFixed(2)}
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No se encontraron clientes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '420px' }}>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>Registrar Cliente</h3>
              <button 
                onClick={() => setModalOpen(false)} 
                style={styles.modalCloseBtn}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer}>
              <div className="input-group" style={{ marginBottom: '12px' }}>
                <label>Nombre Completo *</label>
                <input
                  type="text"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. María de la Cruz"
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: '12px' }}>
                <label>Teléfono</label>
                <input
                  type="text"
                  className="input-field"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. 555-987-6543"
                />
              </div>

              <div className="input-group" style={{ marginBottom: '20px' }}>
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej. maria@correo.com"
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
                  Registrar Cliente
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
  filterCard: {
    padding: '16px 20px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border)'
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
