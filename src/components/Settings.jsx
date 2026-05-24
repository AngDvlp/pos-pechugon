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

  const handleExportBackup = () => {
    try {
      const backupData = {
        products: localStorage.getItem('pos_products'),
        transactions: localStorage.getItem('pos_transactions'),
        cashCuts: localStorage.getItem('pos_cash_cuts'),
        mermas: localStorage.getItem('pos_mermas'),
        customers: localStorage.getItem('pos_customers'),
        users: localStorage.getItem('pos_users'),
        settings: localStorage.getItem('pos_settings')
      };
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `pechugon_backup_${date}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Copia de seguridad exportada con éxito', 'success');
    } catch (e) {
      console.error(e);
      showToast('Error al exportar copia de seguridad', 'error');
    }
  };

  const handleImportBackup = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed.products || !parsed.users) {
          showToast('El archivo de respaldo no es válido o está incompleto', 'error');
          return;
        }

        // Restore to localStorage
        if (parsed.products) localStorage.setItem('pos_products', parsed.products);
        if (parsed.transactions) localStorage.setItem('pos_transactions', parsed.transactions);
        if (parsed.cashCuts) localStorage.setItem('pos_cash_cuts', parsed.cashCuts);
        if (parsed.mermas) localStorage.setItem('pos_mermas', parsed.mermas);
        if (parsed.customers) localStorage.setItem('pos_customers', parsed.customers);
        if (parsed.users) localStorage.setItem('pos_users', parsed.users);
        if (parsed.settings) localStorage.setItem('pos_settings', parsed.settings);

        showToast('Respaldo restaurado con éxito. Reiniciando...', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err) {
        console.error(err);
        showToast('Error al procesar el archivo de respaldo', 'error');
      }
    };
    fileReader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('¿Estás seguro de reiniciar todo el sistema? Se borrarán todas las ventas, mermas y existencias locales de producción, y se iniciará con un catálogo limpio en ceros.')) {
      onResetDatabase();
      showToast('Base de datos local limpia en ceros', 'warning');
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

        {/* Database Maintenance & Backup */}
        <div className="card" style={styles.cardWrap}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            Mantenimiento y Respaldo de Datos
          </h3>
          
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>💾 Respaldar Datos Localmente</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.4', marginBottom: '12px' }}>
              Descarga un archivo con toda tu información (ventas, catálogo de productos, cortes y mermas). Puedes guardarlo en la tablet o en una memoria USB.
            </p>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleExportBackup}
              style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              Exportar Copia de Seguridad (JSON)
            </button>
          </div>

          <div style={{ marginBottom: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>📂 Restaurar Copia de Seguridad</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.4', marginBottom: '12px' }}>
              Selecciona un archivo de respaldo generado anteriormente (`pechugon_backup_*.json`) para recuperar todos tus datos.
            </p>
            <label 
              className="btn btn-secondary" 
              style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', textAlign: 'center' }}
            >
              Cargar Archivo de Respaldo
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportBackup} 
                style={{ display: 'none' }} 
              />
            </label>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: 'var(--danger)' }}>⚠️ Restablecer Sistema</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.4', marginBottom: '12px' }}>
              Borrara todas las transacciones, cortes de caja y cambios en existencias locales. Restaura la base de datos de producción limpia en ceros.
            </p>
            <button 
              type="button" 
              className="btn btn-danger" 
              onClick={handleReset}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center', padding: '10px' }}
            >
              <RefreshIcon size={14} /> Limpiar Base de Datos (Todo en Cero)
            </button>
          </div>
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
