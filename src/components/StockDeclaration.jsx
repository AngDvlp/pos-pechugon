import { useState } from 'react';
import { FoodIcon, PlusIcon, MinusIcon, CheckIcon, RefreshIcon } from './UI/Icons';

export default function StockDeclaration({ products, setProducts, showToast }) {
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

  // Handle Save
  const handleSaveAll = (e) => {
    e.preventDefault();

    // Check if there's any value entered
    const skusWithInputs = Object.keys(quantities).filter(sku => quantities[sku] !== '' && quantities[sku] !== undefined);
    if (skusWithInputs.length === 0) {
      showToast('No has ingresado ninguna cantidad para actualizar', 'warning');
      return;
    }

    // Update global products list
    const updatedProducts = products.map(p => {
      const inputVal = quantities[p.sku];
      if (inputVal !== undefined && inputVal !== '') {
        const qty = parseFloat(inputVal);
        const newStock = saveMode === 'set' ? qty : p.stock + qty;
        return {
          ...p,
          stock: newStock
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    setQuantities({}); // Clear inputs
    showToast(
      saveMode === 'set' 
        ? 'Inventario físico establecido con éxito' 
        : 'Producción añadida al inventario con éxito', 
      'success'
    );
  };

  const handleClearInputs = () => {
    setQuantities({});
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
  }
};
