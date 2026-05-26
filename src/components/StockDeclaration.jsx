import { useState, useEffect } from 'react';
import { FoodIcon, PlusIcon, MinusIcon, CheckIcon, RefreshIcon } from './UI/Icons';

export default function StockDeclaration({ 
  products, 
  setProducts, 
  showToast, 
  transactions = [], 
  kitchenBatches = [],
  setKitchenBatches,
  forceReadyBatch,
  resetDailyInventory
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [quantities, setQuantities] = useState({}); // Stores input quantities per product SKU
  const [saveMode, setSaveMode] = useState('set'); // 'set' = override/set total, 'add' = add to stock

  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'basicos', name: 'Básicos' },
    { id: 'complementos', name: 'Complementos' },
    { id: 'postres', name: 'Postres' },
    { id: 'varios', name: 'Varios' }
  ];

  // Filter products to show only relevant ones (Prepared food & sides & drinks)
  const filteredProducts = products.filter(p => {
    return !p.isCombo && !p.baseProductSku && (selectedCategory === 'all' || p.category === selectedCategory);
  });

  // Handle value change for a specific SKU
  const handleQtyChange = (sku, val) => {
    const parsed = parseFloat(val);
    setQuantities(prev => ({
      ...prev,
      [sku]: isNaN(parsed) ? '' : Math.max(0, parsed)
    }));
  };

  // Adjust input quantity using step buttons (+/-)
  const stepQty = (sku, step) => {
    const currentInputVal = quantities[sku] === '' || quantities[sku] === undefined ? 0 : quantities[sku];
    const newVal = Math.max(0, currentInputVal + step);
    setQuantities(prev => ({
      ...prev,
      [sku]: newVal
    }));
  };

  const [currentTime, setCurrentTime] = useState(() => Date.now());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatRemainingTime = (ms) => {
    if (ms <= 0) return '¡Listo!';
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs > 0 ? hrs + 'h ' : ''}${mins}m ${secs}s`;
  };

  const timedSkus = ['B-001', 'B-014', 'B-015', 'B-002', 'V-004'];
  const KITCHEN_TIMES = {
    'B-001': 120, // Pechugón: 2h
    'B-014': 80,  // Costilla: 1h 20m
    'B-002': 80,  // Pescuezo: 1h 20m
    'B-015': 30,  // Chiles: 30m
    'V-004': 10   // Alitas: 10m
  };

  // Handle Save
  const handleSaveAll = (e) => {
    e.preventDefault();

    // Check if there's any value entered
    const skusWithInputs = Object.keys(quantities).filter(sku => quantities[sku] !== '' && quantities[sku] !== undefined);
    if (skusWithInputs.length === 0) {
      showToast('No has ingresado ninguna cantidad para actualizar', 'warning');
      return;
    }

    let newKitchenBatches = [];
    const now = Date.now();

    // Update global products list
    const updatedProducts = products.map(p => {
      const inputVal = quantities[p.sku];
      if (inputVal !== undefined && inputVal !== '') {
        const qty = parseFloat(inputVal);

        // Kitchen Queue logic for timed products
        if (saveMode === 'add' && timedSkus.includes(p.sku)) {
          const cookTimeMin = KITCHEN_TIMES[p.sku];
          const readyTime = now + cookTimeMin * 60 * 1000;
          newKitchenBatches.push({
            id: 'BATCH-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900) + '-' + p.sku,
            sku: p.sku,
            name: p.name,
            quantity: qty,
            status: 'cooking',
            startedAt: new Date(now).toISOString(),
            readyAt: new Date(readyTime).toISOString(),
            completedAt: null
          });
          return p; // Stock is not updated immediately
        }

        // Salad batches logic
        if (p.sku === 'C-003' || p.sku === 'C-004') {
          let batches = p.saladBatches ? p.saladBatches.map(b => ({ ...b })) : [];
          if (batches.length === 0 && p.stock > 0) {
            batches = [{ quantity: p.stock, age: 0 }];
          }
          if (saveMode === 'set') {
            batches = [{ quantity: qty, age: 0 }];
          } else {
            const idx0 = batches.findIndex(b => b.age === 0);
            if (idx0 >= 0) {
              batches[idx0].quantity = Math.round((batches[idx0].quantity + qty) * 1000) / 1000;
            } else {
              batches.push({ quantity: qty, age: 0 });
            }
          }
          const calculatedStock = batches.reduce((sum, b) => sum + b.quantity, 0);
          return {
            ...p,
            saladBatches: batches,
            stock: Math.round(calculatedStock * 1000) / 1000
          };
        }

        // Default direct update
        const newStock = saveMode === 'set' ? qty : p.stock + qty;
        return {
          ...p,
          stock: newStock
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    if (newKitchenBatches.length > 0) {
      setKitchenBatches(prev => [...prev, ...newKitchenBatches]);
      showToast(`${newKitchenBatches.length} tanda(s) enviada(s) a cocina.`, 'info');
    } else {
      showToast(
        saveMode === 'set' 
          ? 'Inventario físico establecido con éxito' 
          : 'Producción añadida al inventario con éxito', 
        'success'
      );
    }
    setQuantities({}); // Clear inputs
  };

  const handleClearInputs = () => {
    setQuantities({});
    
    const activeProductsWithStock = products.filter(p => !p.isCombo && !p.baseProductSku && p.stock > 0);
    if (activeProductsWithStock.length > 0) {
      if (window.confirm("¿Deseas reiniciar a 0 el stock restante en inventario (lo que no se vendió, excepto ensaladas que envejecen y pollo convertido a tacos) para iniciar un nuevo día?")) {
        resetDailyInventory("No vendido (Limpieza de cocina)");
        showToast("Inventario de cocina reiniciado: sobrantes a merma, pollo convertido a tacos y ensaladas envejecidas.", "success");
      }
    }
  };

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FoodIcon size={26} style={{ color: 'var(--accent)' }} /> Registrar Existencias de Cocina
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Ingresa las porciones listas de pollos, costillas, tacos y complementos para la venta.
          </p>
        </div>
      </div>

      {/* Control Panel: Save Mode Selector & Actions */}
      <div className="card" style={styles.controlCard}>
        <div style={styles.controlRow}>
          <div style={styles.modeSection}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Método de Registro:
            </span>
            <div style={styles.btnGroup}>
              <button
                type="button"
                onClick={() => setSaveMode('set')}
                style={{
                  ...styles.modeBtn,
                  backgroundColor: saveMode === 'set' ? 'var(--accent)' : 'var(--bg-primary)',
                  borderColor: saveMode === 'set' ? 'var(--accent)' : 'var(--border)',
                  color: saveMode === 'set' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                Establecer Total (Conteo Físico)
              </button>
              <button
                type="button"
                onClick={() => setSaveMode('add')}
                style={{
                  ...styles.modeBtn,
                  backgroundColor: saveMode === 'add' ? 'var(--accent)' : 'var(--bg-primary)',
                  borderColor: saveMode === 'add' ? 'var(--accent)' : 'var(--border)',
                  color: saveMode === 'add' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                Añadir al Stock (Nueva Tanda/Cocinado)
              </button>
            </div>
          </div>

          <div style={styles.actionButtons}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleClearInputs}
              style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshIcon size={14} /> Limpiar Campos
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleSaveAll}
              style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <CheckIcon size={16} /> Guardar Cambios
            </button>
          </div>
        </div>
      </div>

      {/* Active Cooking Batches Queue Panel */}
      {kitchenBatches.filter(b => b.status === 'cooking').length > 0 && (
        <div className="card" style={styles.queueCard}>
          <h3 style={styles.queueTitle}>
            🔥 Monitoreo de Cocina (Tandas en Preparación)
          </h3>
          <div style={styles.queueGrid}>
            {kitchenBatches.filter(b => b.status === 'cooking').map(batch => {
              const start = new Date(batch.startedAt).getTime();
              const end = new Date(batch.readyAt).getTime();
              const total = end - start;
              const elapsed = currentTime - start;
              const remaining = Math.max(0, end - currentTime);
              const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));

              return (
                <div key={batch.id} style={styles.queueItem}>
                  <div style={styles.queueItemHeader}>
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>{batch.name}</span>
                    <span className="badge badge-warning" style={{ fontSize: '11px' }}>
                      {batch.quantity} pzas
                    </span>
                  </div>
                  
                  {/* Countdown Timer */}
                  <div style={styles.countdownRow}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tiempo restante:</span>
                    <span style={{ fontWeight: '800', color: 'var(--accent)', fontFamily: 'monospace', fontSize: '14px' }}>
                      {formatRemainingTime(remaining)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={styles.progressBarContainer}>
                    <div style={{ ...styles.progressBar, width: `${progress}%` }} />
                  </div>

                  {/* Action Button: Bajar antes (Force Ready) */}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => forceReadyBatch(batch.id)}
                    style={{ marginTop: '12px', width: '100%', padding: '6px 12px', fontSize: '12px', fontWeight: '700' }}
                  >
                    Bajar antes (Autorizar)
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div style={styles.tabBar}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              ...styles.tabBtn,
              backgroundColor: selectedCategory === cat.id ? 'var(--bg-secondary)' : 'transparent',
              borderColor: selectedCategory === cat.id ? 'var(--accent)' : 'transparent',
              color: selectedCategory === cat.id ? 'var(--accent)' : 'var(--text-muted)'
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid of Product Cards */}
      <div style={styles.productGrid}>
        {filteredProducts.map(p => {
          const inputValue = quantities[p.sku] !== undefined ? quantities[p.sku] : '';
          const isZeroStock = p.stock === 0;

          return (
            <div 
              key={p.sku} 
              style={{ 
                ...styles.productCard, 
                borderLeftColor: p.color || 'var(--accent)' 
              }}
            >
              {/* Product header info */}
              <div style={styles.cardHeader}>
                <h4 style={styles.productName}>{p.name}</h4>
                <span style={styles.skuText}>SKU: {p.sku}</span>
              </div>

              {/* Current stock status */}
              <div style={styles.stockStatus}>
                <span style={{ color: 'var(--text-secondary)' }}>Existencia actual:</span>
                <span 
                  className={`badge ${isZeroStock ? 'badge-danger' : p.stock <= p.minStock ? 'badge-warning' : 'badge-success'}`}
                  style={styles.stockBadge}
                >
                  {p.stock} piezas
                </span>
              </div>

              {/* Input section with stepper buttons */}
              <div style={styles.inputArea}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {saveMode === 'set' ? 'Declarar total:' : 'Sumar al stock:'}
                </span>
                
                <div style={styles.stepperContainer}>
                  <button 
                    type="button" 
                    onClick={() => stepQty(p.sku, -5)} 
                    style={styles.stepBtn}
                    title="Restar 5"
                  >
                    -5
                  </button>
                  <button 
                    type="button" 
                    onClick={() => stepQty(p.sku, -1)} 
                    style={styles.stepBtn}
                    title="Restar 1"
                  >
                    <MinusIcon size={12} />
                  </button>
                  
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={inputValue}
                    onChange={(e) => handleQtyChange(p.sku, e.target.value)}
                    style={styles.qtyInput}
                  />

                  <button 
                    type="button" 
                    onClick={() => stepQty(p.sku, 1)} 
                    style={styles.stepBtn}
                    title="Sumar 1"
                  >
                    <PlusIcon size={12} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => stepQty(p.sku, 5)} 
                    style={styles.stepBtn}
                    title="Sumar 5"
                  >
                    +5
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sales History Summary */}
      <div className="card" style={styles.historyCard}>
        <h3 style={styles.historyTitle}>
          Historial de Ventas Pasadas (Referencia para Cocina)
        </h3>
        {transactions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Aún no hay ventas registradas en el sistema.</p>
        ) : (
          <div style={styles.historyGrid}>
            {products.filter(p => !p.isCombo && !p.baseProductSku).map(p => {
              // Calculate total units sold (including portions converted to base units!)
              let totalSoldBase = 0;
              transactions.filter(t => t.status === 'completado').forEach(t => {
                t.items.forEach(item => {
                  const itemProduct = products.find(prod => prod.sku === item.sku);
                  if (itemProduct) {
                    const itemBaseSku = itemProduct.baseProductSku || itemProduct.sku;
                    if (itemBaseSku === p.sku) {
                      const itemEquivalence = itemProduct.baseEquivalence || 1.0;
                      totalSoldBase += item.quantity * itemEquivalence;
                    }
                  }
                });
              });

              if (totalSoldBase === 0) return null;

              return (
                <div key={p.sku} style={styles.historyItem}>
                  <span style={{ fontWeight: '600' }}>{p.name}</span>
                  <span style={{ color: 'var(--accent)', fontWeight: '700' }}>{totalSoldBase} pzas vendidas</span>
                </div>
              );
            }).filter(Boolean)}
          </div>
        )}
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
    marginBottom: '20px'
  },
  controlCard: {
    padding: '16px 20px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    marginBottom: '20px'
  },
  controlRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px'
  },
  modeSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  btnGroup: {
    display: 'flex',
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    border: '1px solid var(--border)'
  },
  modeBtn: {
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    transition: 'var(--transition)'
  },
  actionButtons: {
    display: 'flex',
    gap: '10px'
  },
  tabBar: {
    display: 'flex',
    gap: '8px',
    borderBottom: '1px solid var(--border)',
    marginBottom: '20px',
    paddingBottom: '2px'
  },
  tabBtn: {
    padding: '8px 16px',
    border: 'none',
    borderBottom: '3px solid transparent',
    backgroundColor: 'transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'var(--transition)'
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
    paddingBottom: '30px'
  },
  productCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderLeft: '4px solid var(--accent)',
    borderRadius: 'var(--radius-sm)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '180px',
    transition: 'var(--transition)'
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  productName: {
    fontSize: '15px',
    fontWeight: '700',
    margin: 0,
    color: 'var(--text-primary)',
    display: '-webkit-box',
    WebkitLineClamp: '2',
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: '1.3'
  },
  skuText: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontFamily: 'monospace'
  },
  stockStatus: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '12px 0',
    fontSize: '13px'
  },
  stockBadge: {
    fontSize: '12px',
    padding: '4px 8px',
    fontWeight: '700'
  },
  inputArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  stepperContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    height: '34px'
  },
  stepBtn: {
    width: '32px',
    height: '100%',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition)',
    ':hover': {
      backgroundColor: 'var(--bg-card-hover)',
      color: 'var(--text-primary)'
    }
  },
  qtyInput: {
    flexGrow: 1,
    width: '40px',
    height: '100%',
    border: 'none',
    borderLeft: '1px solid var(--border)',
    borderRight: '1px solid var(--border)',
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: 'inherit',
    outline: 'none',
    WebkitAppearance: 'none',
    margin: 0
  },
  historyCard: {
    marginTop: '32px',
    padding: '20px 24px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)'
  },
  historyTitle: {
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '16px',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '8px',
    color: 'var(--text-primary)'
  },
  historyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px'
  },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 14px',
    backgroundColor: 'var(--bg-primary)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    fontSize: '13px'
  },
  queueCard: {
    padding: '20px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    marginBottom: '24px'
  },
  queueTitle: {
    fontSize: '15px',
    fontWeight: '700',
    marginBottom: '16px',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  queueGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '14px'
  },
  queueItem: {
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: 'var(--shadow-sm)'
  },
  queueItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  countdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  progressBarContainer: {
    backgroundColor: 'var(--border)',
    height: '6px',
    borderRadius: '3px',
    overflow: 'hidden',
    width: '100%'
  },
  progressBar: {
    backgroundColor: 'var(--accent)',
    height: '100%',
    transition: 'width 1.5s ease-in-out'
  }
};
