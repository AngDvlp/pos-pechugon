import { useState } from 'react';
import { CloseIcon, HistoryIcon, CashCutIcon, CashIcon, CardIcon, TransferIcon, RefundIcon } from './UI/Icons';

const getShortName = (name) => {
  if (!name) return '';
  if (name === 'Sucursal San Francisco') return 'S. Francisco';
  if (name === 'Pechumóvil') return 'Pechumóvil';
  if (name === 'Administración') return 'Admin';
  return name.split(' ')[0];
};

export default function History({ 
  transactions, 
  refundTransaction, 
  cashCuts, 
  showToast,
  settings
}) {
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' or 'cuts'
  
  // Sales filters
  const [salesSearch, setSalesSearch] = useState('');
  const [salesMethod, setSalesMethod] = useState('all');
  const [salesStatus, setSalesStatus] = useState('all');

  // Details modals
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedCut, setSelectedCut] = useState(null);

  // Filter Sales Transactions
  const filteredSales = transactions.filter(t => {
    const matchesSearch = t.id.toLowerCase().includes(salesSearch.toLowerCase()) || 
                          t.cashier.toLowerCase().includes(salesSearch.toLowerCase()) ||
                          t.customerName.toLowerCase().includes(salesSearch.toLowerCase());
    const matchesMethod = salesMethod === 'all' || t.paymentMethod === salesMethod;
    const matchesStatus = salesStatus === 'all' || t.status === salesStatus;
    
    return matchesSearch && matchesMethod && matchesStatus;
  });

  // Handle Refund
  const handleRefund = (transactionId) => {
    if (window.confirm(`¿Estás seguro de cancelar la venta ${transactionId}? Los productos regresarán al stock del inventario.`)) {
      refundTransaction(transactionId);
      setSelectedSale(null);
      showToast(`Venta ${transactionId} reembolsada con éxito`, 'success');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Registros Históricos</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Consulta transacciones pasadas, reembolsa ventas y audita cierres de caja.</p>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <button
          onClick={() => setActiveTab('sales')}
          style={{
            ...styles.tabBtn,
            borderBottomColor: activeTab === 'sales' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'sales' ? 'var(--accent)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <HistoryIcon size={18} /> Historial de Ventas
        </button>
        <button
          onClick={() => setActiveTab('cuts')}
          style={{
            ...styles.tabBtn,
            borderBottomColor: activeTab === 'cuts' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'cuts' ? 'var(--accent)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CashCutIcon size={18} /> Cortes de Caja Realizados
        </button>
      </div>

      {/* SALES TAB */}
      {activeTab === 'sales' && (
        <div>
          {/* Sales Filters */}
          <div className="card" style={styles.filterCard}>
            <div style={styles.filtersGrid}>
              <div className="input-group">
                <label>Buscar Folio, Sucursal o Cliente</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej. T-1001..."
                  value={salesSearch}
                  onChange={(e) => setSalesSearch(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>Método de Pago</label>
                <select
                  className="input-field"
                  value={salesMethod}
                  onChange={(e) => setSalesMethod(e.target.value)}
                >
                  <option value="all">Todos los Métodos</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>

              <div className="input-group">
                <label>Estado</label>
                <select
                  className="input-field"
                  value={salesStatus}
                  onChange={(e) => setSalesStatus(e.target.value)}
                >
                  <option value="all">Todos los Estados</option>
                  <option value="completado">Completadas</option>
                  <option value="devuelto">Canceladas/Devueltas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sales Table */}
          <div className="table-wrap" style={{ marginTop: '20px' }}>
            <table>
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Sucursal</th>
                  <th style={{ textAlign: 'center' }}>Método</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th style={{ textAlign: 'right' }}>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map(t => (
                  <tr key={t.id} style={{ opacity: t.status === 'devuelto' ? 0.6 : 1 }}>
                    <td style={{ fontWeight: '700', fontFamily: 'monospace' }}>{t.id}</td>
                    <td>{new Date(t.date).toLocaleString()}</td>
                    <td>{t.customerName}</td>
                    <td>{getShortName(t.cashier)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center', textTransform: 'capitalize' }}>
                        {t.paymentMethod === 'efectivo' ? (
                          <><CashIcon size={16} /> Efectivo</>
                        ) : t.paymentMethod === 'tarjeta' ? (
                          <><CardIcon size={16} /> Tarjeta</>
                        ) : (
                          <><TransferIcon size={16} /> Transfer.</>
                        )}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: t.status === 'devuelto' ? 'var(--text-muted)' : 'var(--accent)' }}>
                      ${t.total.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${t.status === 'completado' ? 'badge-success' : 'badge-danger'}`}>
                        {t.status === 'completado' ? 'Exitosa' : 'Devuelta'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedSale(t)}
                      >
                        Ver Ticket
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No se encontraron transacciones con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CASH CUTS TAB */}
      {activeTab === 'cuts' && (
        <div>
          {/* Cuts Table */}
          <div className="table-wrap" style={{ marginTop: '20px' }}>
            <table>
              <thead>
                <tr>
                  <th>Folio Corte</th>
                  <th>Fecha de Cierre</th>
                  <th>Sucursal Encargada</th>
                  <th style={{ textAlign: 'right' }}>Fondo Inicial</th>
                  <th style={{ textAlign: 'right' }}>Ventas Efectivo</th>
                  <th style={{ textAlign: 'right' }}>Efectivo Esperado</th>
                  <th style={{ textAlign: 'right' }}>Efectivo Real</th>
                  <th style={{ textAlign: 'right' }}>Diferencia (Arqueo)</th>
                  <th style={{ textAlign: 'right' }}>Total Mermas</th>
                  <th style={{ textAlign: 'right' }}>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {cashCuts.map(cut => {
                  return (
                    <tr key={cut.id}>
                      <td style={{ fontWeight: '700', fontFamily: 'monospace' }}>{cut.id}</td>
                      <td>{new Date(cut.date).toLocaleString()}</td>
                      <td>{cut.cashier}</td>
                      <td style={{ textAlign: 'right' }}>${cut.initialCash.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--success)' }}>+${cut.salesCash.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>${cut.expectedCash.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>${cut.actualCash.toFixed(2)}</td>
                      <td style={{ 
                        textAlign: 'right', 
                        fontWeight: '700',
                        color: cut.discrepancy === 0 ? 'var(--success)' : cut.discrepancy < 0 ? 'var(--danger)' : 'var(--warning)'
                      }}>
                        {cut.discrepancy === 0 ? '$0.00' : cut.discrepancy > 0 ? `+$${cut.discrepancy.toFixed(2)}` : `-$${Math.abs(cut.discrepancy).toFixed(2)}`}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--danger)' }}>-${cut.totalMermas.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedCut(cut)}
                        >
                          Ver Reporte
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {cashCuts.length === 0 && (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No se han realizado cierres de caja todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sale Details Ticket Modal */}
      {selectedSale && (
        <div className="modal-overlay">
          <div className="modal" style={styles.ticketModal}>
            <div className="flex-between" style={{ borderBottom: '1px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', color: '#000', fontWeight: 'bold' }}>TICKET DIGITAL DETALLE</span>
              <button 
                onClick={() => setSelectedSale(null)} 
                style={styles.modalCloseBtnBlack}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div style={styles.ticketHeader}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '4px 0' }}>{settings?.storeName || 'Rosticerías "El Pechugón"'}</h3>
              <p style={{ fontSize: '11px', color: '#555' }}>Copia de Auditoría</p>
              <div style={styles.ticketDivider} />
              <p style={{ fontSize: '12px' }}>Folio Venta: <b>{selectedSale.id}</b></p>
              <p style={{ fontSize: '11px', color: '#333' }}>Fecha: {new Date(selectedSale.date).toLocaleString()}</p>
              <p style={{ fontSize: '11px', color: '#333' }}>Sucursal: {selectedSale.cashier}</p>
              <p style={{ fontSize: '11px', color: '#333' }}>Cliente: {selectedSale.customerName}</p>
            </div>
            
            <div style={styles.ticketDivider} />
            
            <div style={styles.ticketItems}>
              {selectedSale.items.map(item => (
                <div key={item.sku} style={styles.ticketItemRow}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: '#444' }}>
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
                <span>${selectedSale.subtotal.toFixed(2)}</span>
              </div>
              {selectedSale.discount > 0 && (
                <div style={{ ...styles.ticketSummaryRow, color: 'red' }}>
                  <span>Descuento:</span>
                  <span>-${selectedSale.discount.toFixed(2)}</span>
                </div>
              )}
              <div style={styles.ticketSummaryRow}>
                <span>IVA Incluido:</span>
                <span>${selectedSale.tax.toFixed(2)}</span>
              </div>
              <div style={{ ...styles.ticketSummaryRow, fontSize: '15px', fontWeight: '800' }}>
                <span>TOTAL:</span>
                <span>${selectedSale.total.toFixed(2)}</span>
              </div>
              
              <div style={styles.ticketDivider} />

              <div style={styles.ticketSummaryRow}>
                <span>Método de Pago:</span>
                <span style={{ textTransform: 'capitalize' }}>{selectedSale.paymentMethod}</span>
              </div>
              <div style={styles.ticketSummaryRow}>
                <span>Estado Venta:</span>
                <span style={{ 
                  fontWeight: '700', 
                  color: selectedSale.status === 'completado' ? 'green' : 'red' 
                }}>
                  {selectedSale.status === 'completado' ? 'EXITOSA' : 'DEVUELTA/CANCELADA'}
                </span>
              </div>
            </div>

            {selectedSale.status === 'completado' && (
              <div style={{ marginTop: '20px' }}>
                <button 
                  className="btn btn-danger" 
                  onClick={() => handleRefund(selectedSale.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <RefundIcon size={16} /> Realizar Devolución Total
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cash Cut Details Report Modal */}
      {selectedCut && (
        <div className="modal-overlay">
          <div className="modal" style={styles.ticketModal}>
            <div className="flex-between" style={{ borderBottom: '1px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', color: '#000', fontWeight: 'bold' }}>REPORTE DE ARQUEO DIGITAL</span>
              <button 
                onClick={() => setSelectedCut(null)} 
                style={styles.modalCloseBtnBlack}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '4px 0' }}>COMPROBANTE DE CORTE</h3>
              <p style={{ fontSize: '11px', color: '#333' }}>Fecha: {new Date(selectedCut.date).toLocaleString()}</p>
              <p style={{ fontSize: '11px', color: '#333' }}>Sucursal: {selectedCut.cashier}</p>
            </div>

            <div style={styles.ticketDivider} />

            <div style={styles.ticketSection}>
              <div style={styles.ticketRow}>
                <span>Fondo Inicial:</span>
                <span>${selectedCut.initialCash.toFixed(2)}</span>
              </div>
              <div style={styles.ticketRow}>
                <span>Ventas Efectivo:</span>
                <span>+${selectedCut.salesCash.toFixed(2)}</span>
              </div>
              <div style={{ ...styles.ticketRow, fontWeight: '700' }}>
                <span>Efectivo Esperado:</span>
                <span>${selectedCut.expectedCash.toFixed(2)}</span>
              </div>
              <div style={{ ...styles.ticketRow, fontWeight: '700' }}>
                <span>Efectivo Declarado:</span>
                <span>${selectedCut.actualCash.toFixed(2)}</span>
              </div>
              <div style={{ 
                ...styles.ticketRow, 
                fontWeight: '800',
                color: selectedCut.discrepancy === 0 ? 'green' : selectedCut.discrepancy > 0 ? 'orange' : 'red' 
              }}>
                <span>Diferencia (Arqueo):</span>
                <span>
                  {selectedCut.discrepancy === 0 ? 'DIFERENCIA: $0.00' : selectedCut.discrepancy > 0 ? `SOBRANTE: +$${selectedCut.discrepancy.toFixed(2)}` : `FALTANTE: -$${Math.abs(selectedCut.discrepancy).toFixed(2)}`}
                </span>
              </div>
            </div>

            <div style={styles.ticketDivider} />

            <div style={styles.ticketSection}>
              <div style={styles.ticketRow}>
                <span>Ventas Tarjeta:</span>
                <span>${selectedCut.cardsTotal.toFixed(2)}</span>
              </div>
              <div style={styles.ticketRow}>
                <span>Transferencias:</span>
                <span>${selectedCut.transfersTotal.toFixed(2)}</span>
              </div>
              <div style={{ ...styles.ticketRow, fontWeight: '700' }}>
                <span>Ventas Totales:</span>
                <span>${(selectedCut.salesCash + selectedCut.cardsTotal + selectedCut.transfersTotal).toFixed(2)}</span>
              </div>
            </div>

            <div style={styles.ticketDivider} />

            <div style={styles.ticketSection}>
              <div style={{ ...styles.ticketRow, color: 'red', fontWeight: '700' }}>
                <span>Mermas de Caja:</span>
                <span>-${selectedCut.totalMermas.toFixed(2)}</span>
              </div>
            </div>

            {selectedCut.salesBreakdown && selectedCut.salesBreakdown.length > 0 && (
              <>
                <div style={styles.ticketDivider} />
                <div style={{ textAlign: 'left', fontSize: '11px', fontWeight: '700', marginBottom: '8px' }}>
                  DETALLE DE ARTÍCULOS VENDIDOS
                </div>
                <div style={styles.ticketSection}>
                  {selectedCut.salesBreakdown.map(item => (
                    <div key={item.sku} style={styles.ticketRow}>
                      <span style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name} (x{item.quantity})
                      </span>
                      <span>${item.totalRevenue.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selectedCut.notes && (
              <>
                <div style={styles.ticketDivider} />
                <div style={{ fontSize: '11px', textAlign: 'left', color: '#333' }}>
                  <b>Notas Sucursal:</b> {selectedCut.notes}
                </div>
              </>
            )}

            <div style={styles.ticketDivider} />
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => setSelectedCut(null)}
              style={{ width: '100%', color: '#000', borderColor: '#000' }}
            >
              Cerrar Reporte
            </button>
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
  tabsContainer: {
    display: 'flex',
    gap: '20px',
    borderBottom: '1px solid var(--border)',
    marginBottom: '20px'
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    borderBottom: '3px solid transparent',
    padding: '12px 6px',
    fontFamily: 'inherit',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition)'
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
  ticketModal: {
    maxWidth: '380px',
    backgroundColor: '#fff',
    color: '#000',
    padding: '24px 20px',
    fontFamily: 'monospace'
  },
  modalCloseBtnBlack: {
    background: 'none',
    border: 'none',
    color: '#000',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '4px'
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
    margin: '10px 0'
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
  ticketSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  ticketRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px'
  }
};
