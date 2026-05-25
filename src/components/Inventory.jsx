import { useState } from 'react';
import { PlusIcon, CloseIcon, TrashIcon, EditIcon, AlertIcon } from './UI/Icons';
import { getEffectiveStock, adjustProductStock } from '../utils/inventory';

export default function Inventory({ products, setProducts, categories, registerMerma, showToast }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Product Add/Edit Modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null means Add Mode
  
  // Form states
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('basicos');
  const [formCost, setFormCost] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formMinStock, setFormMinStock] = useState('');
  const [formColor, setFormColor] = useState('#3b82f6');

  // Merma Modal
  const [mermaModalOpen, setMermaModalOpen] = useState(false);
  const [mermaProduct, setMermaProduct] = useState(null);
  const [mermaQty, setMermaQty] = useState('1');
  const [mermaReason, setMermaReason] = useState('dañado');

  const getProductStock = (product) => {
    return getEffectiveStock(product, products);
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  // Open Modal to Add
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormSku('');
    setFormName('');
    setFormCategory('basicos');
    setFormCost('');
    setFormPrice('');
    setFormStock('');
    setFormMinStock('5');
    setFormColor('#3b82f6');
    setProductModalOpen(true);
  };

  // Open Modal to Edit
  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormSku(product.sku);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormCost(product.cost.toString());
    setFormPrice(product.price.toString());
    setFormStock(product.stock.toString());
    setFormMinStock(product.minStock.toString());
    setFormColor(product.color || '#3b82f6');
    setProductModalOpen(true);
  };

  // Submit Add/Edit Product
  const handleSubmitProduct = (e) => {
    e.preventDefault();

    if (!formSku || !formName || !formCost || !formPrice || (formStock === '' && !editingProduct?.isCombo)) {
      showToast('Por favor complete todos los campos obligatorios', 'error');
      return;
    }

    const skuMatch = products.find(p => p.sku === formSku);
    if (!editingProduct && skuMatch) {
      showToast('Ya existe un producto con este código SKU', 'error');
      return;
    }

    const newProd = {
      sku: formSku,
      name: formName,
      category: formCategory,
      cost: parseFloat(formCost),
      price: parseFloat(formPrice),
      stock: editingProduct?.isCombo || editingProduct?.baseProductSku ? 0 : parseFloat(formStock || 0),
      minStock: parseInt(formMinStock || 0),
      color: formColor,
      ...(editingProduct?.isCombo ? { isCombo: true, components: editingProduct.components } : {}),
      ...(editingProduct?.baseProductSku ? { baseProductSku: editingProduct.baseProductSku, baseEquivalence: editingProduct.baseEquivalence } : {})
    };

    if (editingProduct) {
      // Edit mode
      const updated = products.map(p => p.sku === editingProduct.sku ? newProd : p);
      setProducts(updated);
      showToast(`Producto '${newProd.name}' actualizado`, 'success');
    } else {
      // Add mode
      setProducts([...products, newProd]);
      showToast(`Producto '${newProd.name}' agregado al catálogo`, 'success');
    }

    setProductModalOpen(false);
  };

  // Delete Product
  const handleDeleteProduct = (sku, name) => {
    if (window.confirm(`¿Estás seguro de eliminar '${name}' del catálogo?`)) {
      setProducts(products.filter(p => p.sku !== sku));
      showToast(`Producto '${name}' eliminado`, 'warning');
    }
  };

  // Open Merma Modal
  const handleOpenMerma = (product) => {
    if (product.stock <= 0) {
      showToast('No hay unidades en stock para dar de baja como merma', 'error');
      return;
    }
    setMermaProduct(product);
    setMermaQty('1');
    setMermaReason('dañado');
    setMermaModalOpen(true);
  };

  // Submit Merma
  const handleSubmitMerma = (e) => {
    e.preventDefault();
    const qty = parseInt(mermaQty);
    if (isNaN(qty) || qty <= 0) {
      showToast('Ingrese una cantidad válida de merma', 'error');
      return;
    }

    if (qty > mermaProduct.stock) {
      showToast(`No puedes registrar más merma que el stock disponible (${mermaProduct.stock})`, 'error');
      return;
    }

    // Call callback to deduct stock and record in logs
    registerMerma(mermaProduct.sku, qty, mermaReason);
    setMermaModalOpen(false);
  };

  // Inline Quick Stock Adjustments
  const adjustStock = (sku, amount) => {
    const updated = adjustProductStock(products, sku, amount);
    const updatedProduct = updated.find(p => p.sku === sku);
    if (!updatedProduct) return;
    
    if (updatedProduct.baseProductSku) {
      const baseProduct = updated.find(p => p.sku === updatedProduct.baseProductSku);
      showToast(`Stock de '${updatedProduct.name}' ajustado (Base '${baseProduct.name}': ${baseProduct.stock})`, 'success');
    } else {
      showToast(`Stock ajustado de '${updatedProduct.name}': ${updatedProduct.stock}`, 'success');
    }
    setProducts(updated);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Control de Inventario</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Administra el catálogo de productos, ajusta stock y da de baja mermas.</p>
          </div>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <PlusIcon size={16} /> Agregar Producto
          </button>
        </div>
      </div>

      {/* Filter and search controls */}
      <div className="card" style={styles.filterCard}>
        <div style={styles.filtersGrid}>
          <div className="input-group">
            <label>Buscar Producto</label>
            <input
              type="text"
              className="input-field"
              placeholder="Buscar por Nombre o Código SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Filtrar por Categoría</label>
            <select
              className="input-field"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="table-wrap" style={{ marginTop: '20px' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: '40px' }}>Color</th>
              <th>SKU</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th style={{ textAlign: 'right' }}>Costo Compra</th>
              <th style={{ textAlign: 'right' }}>Precio Venta</th>
              <th style={{ textAlign: 'right' }}>Margen</th>
              <th style={{ textAlign: 'center' }}>Stock Actual</th>
              <th style={{ textAlign: 'center' }}>Stock Mínimo</th>
              <th style={{ width: '150px', textAlign: 'center' }}>Ajuste Rápido</th>
              <th style={{ width: '220px', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => {
              const displayStock = getProductStock(p);
              const isLow = displayStock > 0 && displayStock <= p.minStock;
              const isOut = displayStock === 0;
              const margin = ((p.price - p.cost) / p.price * 100).toFixed(1);

              return (
                <tr key={p.sku}>
                  <td>
                    <div style={{ ...styles.colorBox, backgroundColor: p.color || 'var(--accent)' }} />
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{p.sku}</td>
                  <td style={{ fontWeight: '600' }}>{p.name}</td>
                  <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                  <td style={{ textAlign: 'right' }}>${p.cost.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--accent)' }}>
                    ${p.price.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', color: '#10b981', fontSize: '13px' }}>
                    {margin}%
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: '800' }}>
                    <span className={isOut ? 'badge badge-danger' : isLow ? 'badge-warning' : 'badge-success'}>
                      {displayStock}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{p.minStock}</td>
                  <td>
                    {p.isCombo ? (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textAlign: 'center' }}>Combo</span>
                    ) : (
                      <div style={styles.quickAdjustCell}>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={styles.quickBtn}
                          onClick={() => adjustStock(p.sku, -1)}
                        >
                          -1
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={styles.quickBtn}
                          onClick={() => adjustStock(p.sku, 1)}
                        >
                          +1
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={styles.actionsCell}>
                      {!p.isCombo && (
                        <button 
                          className="btn btn-danger btn-sm" 
                          style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleOpenMerma(p)}
                        >
                          <TrashIcon size={12} /> Registrar Merma
                        </button>
                      )}
                      <button 
                        className="btn btn-secondary btn-sm" 
                        style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleOpenEdit(p)}
                      >
                        <EditIcon size={12} /> Editar
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => handleDeleteProduct(p.sku, p.name)}
                        title="Eliminar producto"
                      >
                        <CloseIcon size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No se encontraron productos en el inventario.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      {productModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button 
                onClick={() => setProductModalOpen(false)} 
                style={styles.modalCloseBtn}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct}>
              <div className="input-group" style={{ marginBottom: '12px' }}>
                <label>Código de Barras / SKU *</label>
                <input
                  type="text"
                  className="input-field"
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                  placeholder="Ej. 750123456789"
                  disabled={editingProduct !== null}
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: '12px' }}>
                <label>Nombre del Producto *</label>
                <input
                  type="text"
                  className="input-field"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Coca Cola Sin Azúcar 600ml"
                  required
                />
              </div>

              <div className="grid-2" style={{ marginBottom: '12px' }}>
                <div className="input-group">
                  <label>Categoría</label>
                  <select
                    className="input-field"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    {categories.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Color de Tarjeta (Frontera)</label>
                  <input
                    type="color"
                    className="input-field"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    style={{ padding: '2px 4px', height: '38px', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ marginBottom: '12px' }}>
                <div className="input-group">
                  <label>Costo de Compra ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Precio de Venta ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid-2" style={{ marginBottom: '20px' }}>
                <div className="input-group">
                  <label>Stock Inicial *</label>
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    value={editingProduct?.isCombo || editingProduct?.baseProductSku ? "" : formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder={
                      editingProduct?.isCombo 
                        ? "Calculado de ingredientes" 
                        : editingProduct?.baseProductSku 
                          ? "Calculado de producto base" 
                          : "0"
                    }
                    disabled={editingProduct?.isCombo === true || editingProduct?.baseProductSku !== undefined}
                    required={!editingProduct?.isCombo && !editingProduct?.baseProductSku}
                  />
                </div>

                <div className="input-group">
                  <label>Stock Mínimo (Alerta)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    placeholder="5"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setProductModalOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Merma Modal */}
      {mermaModalOpen && mermaProduct && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h3 className="modal-title" style={{ margin: 0, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertIcon size={20} /> Registrar Merma / Pérdida
              </h3>
              <button 
                onClick={() => setMermaModalOpen(false)} 
                style={styles.modalCloseBtn}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div style={styles.mermaWarningBox}>
              <span style={{ fontSize: '13px', fontWeight: '700' }}>{mermaProduct.name}</span>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Stock disponible: <b>{mermaProduct.stock} unidades</b> | Costo unitario: <b>${mermaProduct.cost.toFixed(2)}</b>
              </p>
            </div>

            <form onSubmit={handleSubmitMerma}>
              <div className="input-group" style={{ marginBottom: '12px' }}>
                <label>Cantidad de baja (Merma) *</label>
                <input
                  type="number"
                  min="1"
                  max={mermaProduct.stock}
                  className="input-field"
                  value={mermaQty}
                  onChange={(e) => setMermaQty(e.target.value)}
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: '20px' }}>
                <label>Motivo de la Merma</label>
                <select
                  className="input-field"
                  value={mermaReason}
                  onChange={(e) => setMermaReason(e.target.value)}
                >
                  <option value="dañado">Producto dañado / roto</option>
                  <option value="vencido">Producto caducado / vencido</option>
                  <option value="robo">Robo / Extravío</option>
                  <option value="otro">Otro motivo</option>
                </select>
              </div>

              <div style={styles.calculatedLossBox}>
                <span>Pérdida Financiera Estimada (Costo):</span>
                <span style={{ fontWeight: '800', color: 'var(--danger)' }}>
                  -${(parseFloat(mermaQty || 0) * mermaProduct.cost).toFixed(2)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setMermaModalOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-danger" 
                  style={{ flex: 1 }}
                >
                  Registrar Pérdida
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
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  colorBox: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    border: '1px solid var(--border)',
    margin: '0 auto'
  },
  quickAdjustCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },
  quickBtn: {
    padding: '2px 8px',
    fontSize: '11px'
  },
  actionsCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px'
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  mermaWarningBox: {
    backgroundColor: 'var(--bg-primary)',
    padding: '12px 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    marginBottom: '16px'
  },
  calculatedLossBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    border: '1px dashed var(--danger)',
    marginBottom: '20px',
    fontSize: '13px'
  }
};
