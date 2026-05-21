import { useState } from 'react';
import { RefreshIcon } from './UI/Icons';

export default function Settings({ settings, setSettings, onResetDatabase, showToast }) {
  const [storeName, setStoreName] = useState(settings?.storeName || 'Rosticerías "El Pechugón"');
  const [storeAddress, setStoreAddress] = useState(settings?.storeAddress || 'Calle Comercial #123, Col. Centro');
  const [storeRfc, setStoreRfc] = useState(settings?.storeRfc || 'PEC-850901-T01');
  const [taxRate, setTaxRate] = useState(settings?.taxRate?.toString() || '16');

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const rate = parseFloat(taxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      showToast('Por favor ingrese una tasa de IVA válida (0-100%)', 'error');
      return;
    }

    setSettings({
      storeName,
      storeAddress,
      storeRfc,
      taxRate: rate
    });
    showToast('Configuraciones guardadas con éxito', 'success');
  };

  const handleReset = () => {
    if (window.confirm('¿Estás seguro de reiniciar todo el sistema? Se borrarán todas las ventas, mermas, clientes y productos nuevos, y se restaurarán los valores de prueba originales.')) {
      onResetDatabase();
      showToast('Base de datos restablecida a valores iniciales', 'warning');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Configuración del Sistema</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Ajusta los datos del ticket de venta, tasas de impuesto y mantenimiento de base de datos.</p>
      </div>

      <div className="grid-2" style={{ gap: '20px', alignItems: 'start' }}>
        {/* Store Profile Settings Form */}
        <div className="card" style={styles.cardWrap}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            Datos del Establecimiento (Ticket)
          </h3>
          
          <form onSubmit={handleSaveSettings}>
            <div className="input-group" style={{ marginBottom: '12px' }}>
              <label>Nombre de la Tienda / Razón Social</label>
              <input
                type="text"
                className="input-field"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ej. Rosticerías El Pechugón"
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: '12px' }}>
              <label>Dirección Sucursal</label>
              <input
                type="text"
                className="input-field"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Ej. Av. Reforma 405, CDMX"
                required
              />
            </div>

            <div className="grid-2" style={{ marginBottom: '20px' }}>
              <div className="input-group">
                <label>Identificador Fiscal (RFC / RUT / NIT)</label>
                <input
                  type="text"
                  className="input-field"
                  value={storeRfc}
                  onChange={(e) => setStoreRfc(e.target.value)}
                  placeholder="Ej. RFC-123456"
                  required
                />
              </div>

              <div className="input-group">
                <label>Tasa IVA Predeterminada (%)</label>
                <input
                  type="number"
                  className="input-field"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="16"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
              Guardar Configuración
            </button>
          </form>
        </div>

        {/* Database Maintenance */}
        <div className="card" style={styles.cardWrap}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            Mantenimiento y Datos
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', marginBottom: '20px' }}>
            Esta herramienta restablece por completo la base de datos simulada en el navegador (LocalStorage). 
            Eliminará el historial de transacciones, cortes de caja y modificaciones al catálogo de productos, cargando los datos de muestra iniciales.
          </p>

          <button 
            type="button" 
            className="btn btn-danger" 
            onClick={handleReset}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center', padding: '12px' }}
          >
            <RefreshIcon size={16} /> Reiniciar Sistema (Valores de Fábrica)
          </button>
        </div>
      </div>
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
  cardWrap: {
    padding: '24px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border)'
  }
};
