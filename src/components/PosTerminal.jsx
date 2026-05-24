import { useState, useRef } from 'react';
import { 
  SearchIcon, 
  BarcodeIcon, 
  PlusIcon, 
  MinusIcon, 
  TrashIcon, 
  UserPlusIcon,
  CloseIcon,
  LockIcon,
  CartIcon,
  PrintIcon,
  CashIcon,
  CardIcon,
  TransferIcon,
  ArrowRightIcon
} from './UI/Icons';

const generateTransactionId = () => 'T-' + Math.floor(1000 + Math.random() * 9000);

export default function PosTerminal({ 
  products, 
  setProducts, 
  customers, 
  setCustomers, 
  currentUser, 
  cashSession, 
  addTransaction, 
  showToast,
  settings,
  setActiveView
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0] || null);
  const [discount, setDiscount] = useState(0); // in percentage
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [receipt, setReceipt] = useState(null);
  
  // Inline add customer modal
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');

  const searchInputRef = useRef(null);

  // Categories list derived from products
  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'basicos', name: 'Básicos' },
    { id: 'promocion', name: 'Promoción' },
    { id: 'varios', name: 'Varios' },
    { id: 'paquetes', name: 'Paquetes' },
    { id: 'complementos', name: 'Complementos' },
    { id: 'postres', name: 'Postres' }
  ];

  // Handle barcode simulation or SKU exact match
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const cleanQuery = searchQuery.trim();
    if (!cleanQuery) return;

    // Look for exact SKU match
    const matchedProduct = products.find(p => p.sku === cleanQuery);
    if (matchedProduct) {
      addToCart(matchedProduct);
      setSearchQuery('');
      showToast(`Producto escaneado: ${matchedProduct.name}`, 'success');
    }
  };

  // Quick scan simulation
  const simulateBarcodeScan = (sku) => {
    setSearchQuery(sku);
    setTimeout(() => {
      const matchedProduct = products.find(p => p.sku === sku);
      if (matchedProduct) {
        addToCart(matchedProduct);
        setSearchQuery('');
        showToast(`Escaneo simulado: ${matchedProduct.name}`, 'success');
      }
    }, 100);
  };

  const getProductStock = (product) => {
    if (product.isCombo) {
      return Math.min(...product.components.map(comp => {
        const p = products.find(prod => prod.sku === comp.sku);
        return p ? Math.floor(p.stock / comp.quantity) : 0;
      }));
    }
    return product.stock;
  };

  // Add item to cart
  const addToCart = (product) => {
    const availableStock = getProductStock(product);
    if (availableStock <= 0) {
      showToast('Producto agotado (sin stock)', 'error');
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.sku === product.sku);
      const currentQty = existingItem ? existingItem.quantity : 0;

      if (currentQty >= availableStock) {
        showToast(`Stock máximo alcanzado (${availableStock} disponibles)`, 'warning');
        return prevCart;
      }

      if (existingItem) {
        return prevCart.map(item => 
          item.product.sku === product.sku 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

  // Remove / subtract item from cart
  const removeFromCart = (sku, subtractOnly = false) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.sku === sku);
      if (!existingItem) return prevCart;

      if (subtractOnly && existingItem.quantity > 1) {
        return prevCart.map(item => 
          item.product.sku === sku 
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        return prevCart.filter(item => item.product.sku !== sku);
      }
    });
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    showToast('Carrito vaciado', 'warning');
  };

  // Calculate pricing
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const discountAmount = (subtotal * discount) / 100;
  const taxableAmount = subtotal - discountAmount;
  
  // Let's assume price includes tax, so we back-calculate IVA for receipt
  const taxRate = settings?.taxRate || 16;
  const total = taxableAmount;
  const calculatedTax = total - (total / (1 + (taxRate / 100)));

  // Filter products by category and search
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.sku.includes(searchQuery) ||
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate change for cash payment
  const changeAmount = paymentMethod === 'efectivo' && receivedAmount
    ? parseFloat(receivedAmount) - total
    : 0;

  // Handle Checkout submission
  const handleCheckout = () => {
    if (cart.length === 0) {
      showToast('El carrito está vacío', 'error');
      return;
    }
    
    if (paymentMethod === 'efectivo') {
      const received = parseFloat(receivedAmount);
      if (isNaN(received) || received < total) {
        showToast('Efectivo recibido insuficiente', 'error');
        return;
      }
    }

    // Process Transaction
    const transactionId = generateTransactionId();
    const newTransaction = {
      id: transactionId,
      date: new Date().toISOString(),
      items: cart.map(item => ({
        sku: item.product.sku,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        cost: item.product.cost
      })),
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(calculatedTax.toFixed(2)),
      discount: parseFloat(discountAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      paymentMethod,
      cashier: currentUser?.name || 'Sucursal',
      customerName: selectedCustomer?.name || 'Público General',
      status: 'completado',
      cashSessionId: cashSession?.id
    };

    // Update inventory stock levels
    const updatedProducts = products.map(product => {
      let deductedStock = 0;
      cart.forEach(item => {
        // If it's the product itself, deduct its quantity
        if (item.product.sku === product.sku) {
          deductedStock += item.quantity;
        }
        // If it's a combo, check if this product is one of its components
        if (item.product.isCombo) {
          const comp = item.product.components.find(c => c.sku === product.sku);
          if (comp) {
            deductedStock += comp.quantity * item.quantity;
          }
        }
      });

      if (deductedStock > 0) {
        return {
          ...product,
          stock: Math.max(0, product.stock - deductedStock)
        };
      }
      return product;
    });

    // Update Customer loyalty points (1 point per 10 currency spent)
    if (selectedCustomer && selectedCustomer.id !== 'c-general') {
      const earnedPoints = Math.floor(total / 10);
      const updatedCustomers = customers.map(cust => {
        if (cust.id === selectedCustomer.id) {
          return {
            ...cust,
            points: cust.points + earnedPoints,
            totalSpent: cust.totalSpent + total
          };
        }
        return cust;
      });
      setCustomers(updatedCustomers);
      newTransaction.pointsEarned = earnedPoints;
    }

    setProducts(updatedProducts);
    addTransaction(newTransaction);

    // Save Receipt to show user
    setReceipt({
      ...newTransaction,
      receivedAmount: paymentMethod === 'efectivo' ? parseFloat(receivedAmount) : total,
      changeAmount: paymentMethod === 'efectivo' ? changeAmount : 0
    });

    showToast('¡Venta realizada con éxito!', 'success');
    setCheckoutModalOpen(false);
  };

  const handleAddNewCustomer = (e) => {
    e.preventDefault();
    if (!newCustomerName) {
      showToast('Por favor, ingresa un nombre', 'error');
      return;
    }
    const newCust = {
      id: 'c-' + Date.now(),
      name: newCustomerName,
      phone: newCustomerPhone || 'N/A',
      email: newCustomerEmail || 'N/A',
      points: 0,
      totalSpent: 0
    };
    const updatedCustomers = [...customers, newCust];
    setCustomers(updatedCustomers);
    setSelectedCustomer(newCust);
    setCustomerModalOpen(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerEmail('');
    showToast(`Cliente '${newCust.name}' registrado`, 'success');
  };

  const resetTerminal = () => {
    setCart([]);
    setDiscount(0);
    setReceivedAmount('');
    setReceipt(null);
    setSelectedCustomer(customers[0] || null);
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  // If cash drawer is closed, show warning and redirect button
  if (!cashSession) {
    return (
      <div style={styles.closedContainer}>
        <div className="card" style={styles.closedCard}>
          <div style={styles.closedIcon}>
            <LockIcon size={60} style={{ color: 'var(--text-muted)' }} />
          </div>
          <h2>Caja Registradora Cerrada</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '12px 0 24px' }}>
            Para realizar ventas, es necesario abrir la caja e ingresar el fondo inicial de efectivo.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => setActiveView('cashcut')}>
            Ir a Apertura de Caja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Left panel: Product search, categories and catalog */}
      <div style={styles.catalogPanel}>
        <div style={styles.searchHeader}>
          <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
            <div style={styles.searchContainer}>
              <span style={styles.searchIcon}><SearchIcon /></span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar por Nombre, Categoría o Escanear Código SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
              <span style={styles.barcodeIndicator} title="Simular escaneo de barra al presionar Enter en código exacto">
                <BarcodeIcon /> SKU
              </span>
            </div>
          </form>

          {/* Quick barcode simulation buttons for testing */}
          <div style={styles.quickScanBar}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Escáner rápido:</span>
            {products.slice(0, 4).map(p => (
              <button 
                key={p.sku} 
                className="btn btn-secondary btn-sm" 
                style={styles.quickScanBtn}
                onClick={() => simulateBarcodeScan(p.sku)}
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={styles.categoriesBar}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                ...styles.categoryPill,
                backgroundColor: selectedCategory === cat.id ? 'var(--accent)' : 'var(--bg-card)',
                color: selectedCategory === cat.id ? '#000' : 'var(--text-primary)',
                borderColor: selectedCategory === cat.id ? 'var(--accent)' : 'var(--border)'
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div style={styles.productsGrid}>
          {filteredProducts.map(product => {
            const displayStock = getProductStock(product);
            const isLowStock = displayStock > 0 && displayStock <= product.minStock;
            const isOutOfStock = displayStock <= 0;
            
            return (
              <div 
                key={product.sku} 
                onClick={() => !isOutOfStock && addToCart(product)}
                className="card"
                style={{
                  ...styles.productCard,
                  borderColor: isOutOfStock ? 'var(--danger-bg)' : 'var(--border)',
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  opacity: isOutOfStock ? 0.6 : 1,
                  borderTop: `4px solid ${product.color || 'var(--accent)'}`
                }}
              >
                <div style={styles.productDetails}>
                  <span style={styles.productSku}>{product.sku}</span>
                  <h4 style={styles.productName}>{product.name}</h4>
                  <div style={styles.productMeta}>
                    <span style={styles.productPrice}>${product.price.toFixed(2)}</span>
                    <span style={{
                      ...styles.stockIndicator,
                      color: isOutOfStock ? 'var(--danger)' : isLowStock ? 'var(--warning)' : 'var(--success)'
                    }}>
                      {isOutOfStock ? 'Agotado' : product.isCombo ? `Combo: ${displayStock}` : `Stock: ${displayStock}`}
                    </span>
                  </div>
                </div>
                {isOutOfStock && (
                  <span className="badge badge-danger" style={styles.productBadge}>Sin Stock</span>
                )}
                {!isOutOfStock && isLowStock && (
                  <span className="badge badge-warning" style={styles.productBadge}>Bajo Stock</span>
                )}
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div style={styles.emptyGrid}>
              <p style={{ color: 'var(--text-muted)' }}>No se encontraron productos coincidentes.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right panel: Active Cart & Checkout details */}
      <div style={styles.cartPanel}>
        {/* Customer Selector */}
        <div style={styles.customerSection}>
          <div style={styles.customerHeader}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Cliente</span>
            <button 
              className="btn btn-secondary btn-sm" 
              style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => setCustomerModalOpen(true)}
            >
              <UserPlusIcon size={12} /> Registrar
            </button>
          </div>
          <select 
            value={selectedCustomer?.id || ''} 
            onChange={(e) => {
              const cust = customers.find(c => c.id === e.target.value);
              setSelectedCustomer(cust);
            }}
            className="input-field"
            style={styles.customerSelect}
          >
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.id !== 'c-general' ? `(${c.points} pts)` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Cart List */}
        <div style={styles.cartList}>
          <div style={styles.cartHeader}>
            <span style={{ fontWeight: '700' }}>Detalle de Venta</span>
            {cart.length > 0 && (
              <button 
                onClick={clearCart} 
                style={styles.clearCartBtn}
                title="Vaciar Carrito"
              >
                Limpiar
              </button>
            )}
          </div>
          
          <div style={styles.cartItemsWrap}>
            {cart.map(item => (
              <div key={item.product.sku} style={styles.cartItem}>
                <div style={styles.cartItemInfo}>
                  <div style={styles.cartItemName} title={item.product.name}>{item.product.name}</div>
                  <div style={styles.cartItemPrice}>
                    ${item.product.price.toFixed(2)} c/u • <span style={{color: 'var(--text-muted)'}}>${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
                <div style={styles.cartItemControls}>
                  <button 
                    onClick={() => removeFromCart(item.product.sku, true)} 
                    style={styles.qtyBtn}
                  >
                    <MinusIcon size={12} />
                  </button>
                  <span style={styles.qtyText}>{item.quantity}</span>
                  <button 
                    onClick={() => addToCart(item.product)} 
                    style={styles.qtyBtn}
                  >
                    <PlusIcon size={12} />
                  </button>
                  <button 
                    onClick={() => removeFromCart(item.product.sku, false)} 
                    style={styles.deleteBtn}
                  >
                    <TrashIcon size={12} />
                  </button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div style={styles.emptyCart}>
                <div style={styles.emptyCartIcon}>
                  <CartIcon size={44} style={{ color: 'var(--text-muted)', opacity: 0.5, margin: '0 auto' }} />
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>El carrito está vacío</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>Escanea o haz clic en los productos para agregarlos.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Summary */}
        <div style={styles.cartSummary}>
          <div style={styles.discountRow}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Descuento: {discount}%</label>
            <input 
              type="range" 
              min="0" 
              max="30" 
              step="5" 
              value={discount} 
              onChange={(e) => setDiscount(parseInt(e.target.value))}
              style={styles.discountSlider}
            />
          </div>

          <div style={styles.summaryDetails}>
            <div className="flex-between" style={styles.summaryRow}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex-between" style={{ ...styles.summaryRow, color: 'var(--danger)' }}>
                <span>Descuento</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex-between" style={styles.summaryRow}>
              <span>IVA ({taxRate}%) <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(incluido)</span></span>
              <span style={{ color: 'var(--text-muted)' }}>${calculatedTax.toFixed(2)}</span>
            </div>
            <div className="flex-between" style={styles.totalRow}>
              <span>Total Neto</span>
              <span style={{ color: 'var(--accent)' }}>${total.toFixed(2)}</span>
            </div>
          </div>

          <button 
            className="btn btn-primary btn-lg" 
            disabled={cart.length === 0} 
            onClick={() => {
              setReceivedAmount('');
              setCheckoutModalOpen(true);
            }}
            style={styles.checkoutBtn}
          >
            Pagar Venta (${total.toFixed(2)})
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {checkoutModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={styles.checkoutModal}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>Método de Pago</h3>
              <button 
                onClick={() => setCheckoutModalOpen(false)} 
                style={styles.modalCloseBtn}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div style={styles.modalTotalBox}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total a cobrar</span>
              <span style={styles.modalTotalAmount}>${total.toFixed(2)}</span>
            </div>

            {/* Payment Method Tabs */}
            <div style={styles.paymentTabs}>
              {['efectivo', 'tarjeta', 'transferencia'].map(method => (
                <button
                  key={method}
                  onClick={() => {
                    setPaymentMethod(method);
                    if (method !== 'efectivo') setReceivedAmount(total.toString());
                    else setReceivedAmount('');
                  }}
                  style={{
                    ...styles.paymentTab,
                    backgroundColor: paymentMethod === method ? 'var(--accent)' : 'var(--bg-input)',
                    color: paymentMethod === method ? '#000' : 'var(--text-primary)',
                    borderColor: paymentMethod === method ? 'var(--accent)' : 'var(--border)'
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center', width: '100%' }}>
                    {method === 'efectivo' ? <CashIcon size={16} /> : method === 'tarjeta' ? <CardIcon size={16} /> : <TransferIcon size={16} />}
                    <span>{method === 'efectivo' ? 'Efectivo' : method === 'tarjeta' ? 'Tarjeta' : 'Transfer.'}</span>
                  </span>
                </button>
              ))}
            </div>

            {/* Cash details (change calculator) */}
            {paymentMethod === 'efectivo' && (
              <div style={styles.cashCalculation}>
                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label>Efectivo Recibido ($)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={receivedAmount}
                    placeholder="Monto entregado por cliente"
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    style={{ fontSize: '18px', fontWeight: '700' }}
                    autoFocus
                  />
                </div>

                {/* Quick Bills Shortcuts */}
                <div style={styles.quickBillsGrid}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setReceivedAmount(total.toFixed(2))}
                    style={styles.quickBillBtn}
                  >
                    Exacto
                  </button>
                  {[50, 100, 200, 500, 1000].map(val => (
                    <button 
                      key={val}
                      className="btn btn-secondary" 
                      onClick={() => setReceivedAmount(val.toString())}
                      style={{
                        ...styles.quickBillBtn,
                        display: val >= total ? 'block' : 'none' // Only show bills larger or equal to total
                      }}
                    >
                      ${val}
                    </button>
                  ))}
                </div>

                {/* Change calculator display */}
                <div style={{
                  ...styles.changeBox,
                  borderColor: changeAmount >= 0 ? 'var(--success)' : 'var(--border)',
                  backgroundColor: changeAmount >= 0 ? 'rgba(16, 185, 129, 0.05)' : 'transparent'
                }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Cambio a entregar:</span>
                  <span style={{ 
                    fontSize: '24px', 
                    fontWeight: '800', 
                    color: changeAmount >= 0 ? 'var(--success)' : 'var(--danger)' 
                  }}>
                    {changeAmount >= 0 ? `$${changeAmount.toFixed(2)}` : 'Incompleto'}
                  </span>
                </div>
              </div>
            )}

            {paymentMethod !== 'efectivo' && (
              <div style={styles.cardCalculation}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '20px 0', textAlign: 'center' }}>
                  Procesa el pago por terminal bancaria externa o transferencia electrónica de <b>${total.toFixed(2)}</b>.
                </p>
              </div>
            )}

            <div style={styles.modalActions}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setCheckoutModalOpen(false)}
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleCheckout}
                disabled={paymentMethod === 'efectivo' && (changeAmount < 0 || !receivedAmount)}
                style={{ flex: 2 }}
              >
                Completar Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Register Customer Modal */}
      {customerModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Registrar Nuevo Cliente</h3>
            <form onSubmit={handleAddNewCustomer}>
              <div className="input-group" style={{ marginBottom: '12px' }}>
                <label>Nombre Completo</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  required
                />
              </div>
              <div className="input-group" style={{ marginBottom: '12px' }}>
                <label>Teléfono</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="Ej. 555-1234"
                />
              </div>
              <div className="input-group" style={{ marginBottom: '20px' }}>
                <label>Correo Electrónico</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  placeholder="Ej. juan@correo.com"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setCustomerModalOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket/Receipt Digital View Modal */}
      {receipt && (
        <div className="modal-overlay">
          <div className="modal" style={styles.ticketModal}>
            <div style={styles.ticketHeader}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '4px 0' }}>{settings?.storeName || 'Rosticerías "El Pechugón"'}</h2>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{settings?.storeAddress || 'Calle Comercial #123'}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RUT/RFC: {settings?.storeRfc || 'RFC-123456789-001'}</p>
              <div style={styles.ticketDivider} />
              <h3 style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase' }}>TICKET DE VENTA</h3>
              <p style={{ fontSize: '12px' }}>Folio: <b>{receipt.id}</b></p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Fecha: {new Date(receipt.date).toLocaleString()}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Sucursal: {receipt.cashier}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cliente: {receipt.customerName}</p>
            </div>
            
            <div style={styles.ticketDivider} />
            
            {/* Items ticket list */}
            <div style={styles.ticketItems}>
              {receipt.items.map(item => (
                <div key={item.sku} style={styles.ticketItemRow}>
                  <div style={{ flexGrow: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {item.quantity} x ${item.price.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>
                    ${(item.quantity * item.price).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.ticketDivider} />

            <div style={styles.ticketSummary}>
              <div style={styles.ticketSummaryRow}>
                <span>Subtotal:</span>
                <span>${receipt.subtotal.toFixed(2)}</span>
              </div>
              {receipt.discount > 0 && (
                <div style={{ ...styles.ticketSummaryRow, color: 'var(--danger)' }}>
                  <span>Descuento:</span>
                  <span>-${receipt.discount.toFixed(2)}</span>
                </div>
              )}
              <div style={styles.ticketSummaryRow}>
                <span>IVA ({taxRate}%) Incluido:</span>
                <span>${receipt.tax.toFixed(2)}</span>
              </div>
              <div style={{ ...styles.ticketSummaryRow, fontSize: '16px', fontWeight: '800' }}>
                <span>TOTAL NETO:</span>
                <span style={{ color: 'var(--accent)' }}>${receipt.total.toFixed(2)}</span>
              </div>
              
              <div style={styles.ticketDivider} />

              <div style={styles.ticketSummaryRow}>
                <span>Método de Pago:</span>
                <span style={{ textTransform: 'capitalize' }}>{receipt.paymentMethod}</span>
              </div>
              {receipt.paymentMethod === 'efectivo' && (
                <>
                  <div style={styles.ticketSummaryRow}>
                    <span>Efectivo Entregado:</span>
                    <span>${receipt.receivedAmount.toFixed(2)}</span>
                  </div>
                  <div style={styles.ticketSummaryRow}>
                    <span>Cambio Entregado:</span>
                    <span>${receipt.changeAmount.toFixed(2)}</span>
                  </div>
                </>
              )}
              {receipt.pointsEarned > 0 && (
                <div style={{ ...styles.ticketSummaryRow, color: 'var(--success)', fontWeight: '600', marginTop: '6px' }}>
                  <span>Puntos acumulados:</span>
                  <span>+{receipt.pointsEarned} pts</span>
                </div>
              )}
            </div>

            <div style={styles.ticketDivider} />
            <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              ¡Gracias por su compra!
            </div>

            <div style={styles.ticketActions}>
              <button className="btn btn-secondary" onClick={() => {
                try {
                  const iframe = document.createElement('iframe');
                  iframe.style.position = 'fixed';
                  iframe.style.right = '0';
                  iframe.style.bottom = '0';
                  iframe.style.width = '0';
                  iframe.style.height = '0';
                  iframe.style.border = '0';
                  document.body.appendChild(iframe);

                  const doc = iframe.contentWindow.document;
                  const formattedDate = new Date(receipt.date).toLocaleString('es-MX', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                  });

                  const itemsHtml = receipt.items.map(item => `
                    <tr>
                      <td style="padding: 3px 0; font-family: monospace; font-size: 11px;">
                        ${item.name.toUpperCase()}<br/>
                        ${item.quantity} x $${item.price.toFixed(2)}
                      </td>
                      <td style="text-align: right; vertical-align: top; padding: 3px 0; font-family: monospace; font-size: 11px;">
                        $${(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  `).join('');

                  doc.write(`
                    <html>
                      <head>
                        <title>Imprimir Ticket</title>
                        <style>
                          @page { margin: 0; size: auto; }
                          body {
                            font-family: 'Courier New', Courier, monospace;
                            width: 58mm; /* standard 58mm thermal print width */
                            margin: 0;
                            padding: 4px;
                            color: #000;
                            font-size: 11px;
                            line-height: 1.2;
                          }
                          .text-center { text-align: center; }
                          .text-right { text-align: right; }
                          .bold { font-weight: bold; }
                          .divider { border-top: 1px dashed #000; margin: 6px 0; }
                          .totals-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
                          .items-table { width: 100%; border-collapse: collapse; }
                          .success-text { font-size: 10px; font-weight: bold; }
                        </style>
                      </head>
                      <body>
                        <div class="text-center">
                          <span class="bold" style="font-size: 12px;">${settings?.storeName || 'ROSTICERÍAS EL PECHUGÓN'}</span><br/>
                          <span style="font-size: 9px;">${settings?.storeAddress || ''}</span><br/>
                          <span style="font-size: 9px;">RFC: ${settings?.storeRfc || ''}</span>
                        </div>
                        
                        <div class="divider"></div>
                        
                        <div>
                          <strong>TICKET:</strong> ${receipt.id}<br/>
                          <strong>FECHA:</strong> ${formattedDate}<br/>
                          <strong>CAJERO:</strong> ${receipt.cashier}<br/>
                          <strong>CLIENTE:</strong> ${receipt.customerName}
                        </div>
                        
                        <div class="divider"></div>
                        
                        <table class="items-table">
                          ${itemsHtml}
                        </table>
                        
                        <div class="divider"></div>
                        
                        <table class="totals-table">
                          <tr>
                            <td style="font-family: monospace; font-size: 11px;">Subtotal:</td>
                            <td class="text-right" style="font-family: monospace; font-size: 11px;">$${receipt.subtotal.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style="font-family: monospace; font-size: 11px;">IVA (${settings?.taxRate || 16}%):</td>
                            <td class="text-right" style="font-family: monospace; font-size: 11px;">$${receipt.tax.toFixed(2)}</td>
                          </tr>
                          ${receipt.discount > 0 ? `
                          <tr>
                            <td style="font-family: monospace; font-size: 11px;">Descuento:</td>
                            <td class="text-right" style="font-family: monospace; font-size: 11px;">-$${receipt.discount.toFixed(2)}</td>
                          </tr>
                          ` : ''}
                          <tr class="bold">
                            <td style="font-family: monospace; font-size: 12px;">TOTAL:</td>
                            <td class="text-right" style="font-family: monospace; font-size: 12px;">$${receipt.total.toFixed(2)}</td>
                          </tr>
                        </table>
                        
                        <div class="divider"></div>
                        
                        <div>
                          <strong>PAGO:</strong> ${receipt.paymentMethod.toUpperCase()}<br/>
                          ${receipt.pointsEarned > 0 ? `<span class="success-text">PUNTOS GANADOS: +${receipt.pointsEarned} pts</span><br/>` : ''}
                        </div>
                        
                        <div class="divider"></div>
                        
                        <div class="text-center" style="margin-top: 6px; font-size: 10px;">
                          ¡GRACIAS POR SU COMPRA!<br/>
                          ROSTICERÍAS "EL PECHUGÓN"
                        </div>
                        
                        <div style="height: 35px;"></div>
                      </body>
                    </html>
                  `);
                  doc.close();

                  iframe.contentWindow.focus();
                  setTimeout(() => {
                    iframe.contentWindow.print();
                    setTimeout(() => {
                      document.body.removeChild(iframe);
                    }, 1000);
                  }, 250);

                  showToast('Enviando ticket a impresora térmica', 'success');
                } catch (err) {
                  console.error(err);
                  showToast('Error al imprimir ticket', 'error');
                }
              }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <PrintIcon size={16} /> Imprimir Ticket
              </button>
              <button className="btn btn-primary" onClick={resetTerminal} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                Nueva Venta <ArrowRightIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100%',
    width: '100%',
    overflow: 'hidden'
  },
  closedContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    backgroundColor: 'var(--bg-primary)'
  },
  closedCard: {
    maxWidth: '450px',
    textAlign: 'center',
    padding: '40px',
    border: '1px solid var(--border)'
  },
  closedIcon: {
    fontSize: '60px',
    marginBottom: '20px'
  },
  catalogPanel: {
    flex: '1 1 0',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    borderRight: '1px solid var(--border)',
    overflow: 'hidden'
  },
  searchHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--border)',
    backgroundColor: 'var(--bg-secondary)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  searchForm: {
    width: '100%'
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '2px 14px',
    position: 'relative'
  },
  searchIcon: {
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    marginRight: '8px'
  },
  searchInput: {
    flexGrow: 1,
    padding: '10px 0',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    fontSize: '14px',
    outline: 'none'
  },
  barcodeIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: 'var(--text-muted)',
    borderLeft: '1px solid var(--border)',
    paddingLeft: '10px'
  },
  quickScanBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '2px'
  },
  quickScanBtn: {
    padding: '3px 8px',
    fontSize: '10px',
    borderRadius: '4px'
  },
  categoriesBar: {
    display: 'flex',
    gap: '8px',
    padding: '12px 20px',
    overflowX: 'auto',
    backgroundColor: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border)',
    scrollbarWidth: 'none', // Firefox
    '&::-webkit-scrollbar': { display: 'none' } // Safari & Chrome
  },
  categoryPill: {
    padding: '8px 16px',
    borderRadius: '100px',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'var(--transition)'
  },
  productsGrid: {
    flex: '1 1 0',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '16px',
    padding: '20px',
    overflowY: 'auto',
    alignContent: 'start'
  },
  productCard: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '16px',
    minHeight: '130px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    position: 'relative',
    '&:hover': {
      transform: 'translateY(-2px)'
    }
  },
  productDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  productSku: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    fontFamily: 'monospace'
  },
  productName: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    lineHeight: '1.3',
    margin: '4px 0',
    display: '-webkit-box',
    WebkitLineClamp: '2',
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  productMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '6px'
  },
  productPrice: {
    fontWeight: '800',
    fontSize: '15px',
    color: 'var(--text-primary)'
  },
  stockIndicator: {
    fontSize: '11px',
    fontWeight: '500'
  },
  productBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    fontSize: '9px',
    padding: '2px 6px'
  },
  emptyGrid: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '40px'
  },
  cartPanel: {
    width: '380px',
    backgroundColor: 'var(--bg-secondary)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flexShrink: 0
  },
  customerSection: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  customerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  customerSelect: {
    width: '100%',
    padding: '8px 12px'
  },
  cartList: {
    flex: '1 1 0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  cartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px 8px',
    borderBottom: '1px solid var(--border)'
  },
  clearCartBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--danger)',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  cartItemsWrap: {
    flex: '1 1 0',
    overflowY: 'auto',
    padding: '10px 20px'
  },
  cartItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid var(--border)'
  },
  cartItemInfo: {
    flex: '1 1 0',
    paddingRight: '10px',
    overflow: 'hidden'
  },
  cartItemName: {
    fontSize: '13px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  cartItemPrice: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginTop: '2px'
  },
  cartItemControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  qtyBtn: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  qtyText: {
    fontSize: '13px',
    fontWeight: '700',
    minWidth: '20px',
    textAlign: 'center'
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '4px',
    '&:hover': {
      color: 'var(--danger)'
    }
  },
  emptyCart: {
    textAlign: 'center',
    padding: '60px 20px'
  },
  emptyCartIcon: {
    fontSize: '44px',
    marginBottom: '10px',
    opacity: 0.5
  },
  cartSummary: {
    padding: '20px',
    borderTop: '1px solid var(--border)',
    backgroundColor: 'var(--bg-primary)'
  },
  discountRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '16px'
  },
  discountSlider: {
    width: '100%',
    accentColor: 'var(--accent)'
  },
  summaryDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '20px'
  },
  summaryRow: {
    fontSize: '13px',
    color: 'var(--text-secondary)'
  },
  totalRow: {
    fontSize: '18px',
    fontWeight: '800',
    borderTop: '1px dashed var(--border)',
    paddingTop: '10px',
    marginTop: '4px'
  },
  checkoutBtn: {
    width: '100%',
    padding: '12px'
  },
  checkoutModal: {
    maxWidth: '480px'
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  modalTotalBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'var(--bg-input)',
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    marginBottom: '20px'
  },
  modalTotalAmount: {
    fontSize: '32px',
    fontWeight: '900',
    color: 'var(--accent)',
    marginTop: '4px'
  },
  paymentTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px'
  },
  paymentTab: {
    flex: 1,
    padding: '12px 6px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid',
    fontWeight: '700',
    fontSize: '12px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'var(--transition)'
  },
  cashCalculation: {
    display: 'flex',
    flexDirection: 'column'
  },
  quickBillsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginBottom: '20px'
  },
  quickBillBtn: {
    padding: '8px',
    fontSize: '13px',
    fontWeight: '600'
  },
  changeBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid',
    marginBottom: '20px'
  },
  modalActions: {
    display: 'flex',
    gap: '12px'
  },
  ticketModal: {
    maxWidth: '380px',
    backgroundColor: '#fff',
    color: '#000',
    padding: '24px 20px',
    fontFamily: 'monospace'
  },
  ticketHeader: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  ticketDivider: {
    borderTop: '1px dashed #000',
    width: '100%',
    margin: '12px 0'
  },
  ticketItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  ticketItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px'
  },
  ticketSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  ticketSummaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px'
  },
  ticketActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '20px'
  }
};
