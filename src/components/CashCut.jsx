import { useState } from 'react';
import { CashCutIcon, CheckIcon, AlertIcon, TrashIcon, DashboardIcon, PrintIcon } from './UI/Icons';

const generateCutId = () => 'CUT-' + Math.floor(1000 + Math.random() * 9000);

export default function CashCut({ 
  currentUser, 
  cashSession, 
  startSession, 
  closeSession, 
  transactions, 
  mermas, 
  showToast 
}) {
  const [initialCashInput, setInitialCashInput] = useState('1000.00');
  const [actualCashInput, setActualCashInput] = useState('');
  const [notes, setNotes] = useState('');
  const [showCutReceipt, setShowCutReceipt] = useState(null);

  // Derive transactions during this session
  const sessionTransactions = transactions.filter(t => t.cashSessionId === cashSession?.id);
  const sessionMermas = mermas.filter(m => m.date >= cashSession?.openedAt);

  // Calculations for cash sales
  const salesCash = sessionTransactions
    .filter(t => t.paymentMethod === 'efectivo' && t.status === 'completado')
    .reduce((sum, t) => sum + t.total, 0);

  const refundsCash = sessionTransactions
    .filter(t => t.paymentMethod === 'efectivo' && t.status === 'devuelto')
    .reduce((sum, t) => sum + t.total, 0);

  const initialCash = cashSession ? cashSession.initialCash : 0;
  const expectedCash = initialCash + salesCash - refundsCash;

  // Other payment methods
  const salesCard = sessionTransactions
    .filter(t => t.paymentMethod === 'tarjeta' && t.status === 'completado')
    .reduce((sum, t) => sum + t.total, 0);

  const salesTransfer = sessionTransactions
    .filter(t => t.paymentMethod === 'transferencia' && t.status === 'completado')
    .reduce((sum, t) => sum + t.total, 0);

  const totalSalesCount = sessionTransactions.filter(t => t.status === 'completado').length;
  const totalRefundsCount = sessionTransactions.filter(t => t.status === 'devuelto').length;

  const totalSalesCaja = salesCash + salesCard + salesTransfer;

  // Merma calculations
  const totalMermaCost = sessionMermas.reduce((sum, m) => sum + m.totalLoss, 0);

  // Discrepancy calculations
  const actualCash = parseFloat(actualCashInput) || 0;
  const discrepancy = cashSession && actualCashInput !== '' ? actualCash - expectedCash : 0;

  // Open Caja
  const handleOpenSession = (e) => {
    e.preventDefault();
    const cash = parseFloat(initialCashInput);
    if (isNaN(cash) || cash < 0) {
      showToast('Por favor ingrese un fondo inicial válido', 'error');
      return;
    }
    startSession(cash);
    showToast(`Caja abierta con fondo de $${cash.toFixed(2)}`, 'success');
  };

  // Close Caja / Perform Cash Cut
  const handleCloseSession = (e) => {
    e.preventDefault();
    if (actualCashInput === '') {
      showToast('Por favor ingrese el efectivo contado en caja', 'error');
      return;
    }

    const countedCash = parseFloat(actualCashInput);
    
    // Aggregate item sales breakdown
    const salesBreakdown = [];
    const breakdownMap = {};

    sessionTransactions
      .filter(t => t.status === 'completado')
      .forEach(t => {
        t.items.forEach(item => {
          if (!breakdownMap[item.sku]) {
            breakdownMap[item.sku] = {
              sku: item.sku,
              name: item.name,
              quantity: 0,
              totalRevenue: 0
            };
          }
          breakdownMap[item.sku].quantity += item.quantity;
          breakdownMap[item.sku].totalRevenue += item.quantity * item.price;
        });
      });

    // Subtract refunds from breakdown
    sessionTransactions
      .filter(t => t.status === 'devuelto')
      .forEach(t => {
        t.items.forEach(item => {
          if (!breakdownMap[item.sku]) {
            breakdownMap[item.sku] = {
              sku: item.sku,
              name: item.name,
              quantity: 0,
              totalRevenue: 0
            };
          }
          breakdownMap[item.sku].quantity -= item.quantity;
          breakdownMap[item.sku].totalRevenue -= item.quantity * item.price;
        });
      });

    Object.keys(breakdownMap).forEach(sku => {
      const itemBreakdown = breakdownMap[sku];
      if (itemBreakdown.quantity > 0) {
        salesBreakdown.push(itemBreakdown);
      }
    });
    
    const cutReport = {
      id: generateCutId(),
      date: new Date().toISOString(),
      cashier: currentUser?.name || 'Cajero',
      initialCash: initialCash,
      salesCash: salesCash - refundsCash,
      expectedCash: expectedCash,
      actualCash: countedCash,
      discrepancy: discrepancy,
      cardsTotal: salesCard,
      transfersTotal: salesTransfer,
      totalMermas: totalMermaCost,
      notes: notes,
      salesBreakdown: salesBreakdown,
      status: 'cerrado'
    };

    closeSession(cutReport);
    setShowCutReceipt(cutReport);
    setActualCashInput('');
    setNotes('');
    showToast('Caja cerrada e historial registrado', 'success');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Corte y Cierre de Caja</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Módulo de control de efectivo, arqueo diario y pérdidas por merma.</p>
      </div>

      <div className="grid-2" style={{ gap: '20px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Open Box form or Closed receipt */}
        {!cashSession ? (
          <div className="card" style={styles.cardWrap}>
            <div style={styles.iconBox}>
              <CashCutIcon size={32} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Caja Cerrada</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              No hay una sesión de caja activa para la sucursal actual. Ingresa el dinero de fondo disponible en el cajón de dinero para abrir la caja.
            </p>

            <form onSubmit={handleOpenSession}>
              <div className="input-group" style={{ marginBottom: '20px' }}>
                <label>Fondo Inicial de Caja (Efectivo)</label>
                <input
                  type="number"
                  className="input-field"
                  value={initialCashInput}
                  onChange={(e) => setInitialCashInput(e.target.value)}
                  placeholder="Ej. 1000.00"
                  required
                  style={{ fontSize: '16px', fontWeight: '600' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                Abrir Caja
              </button>
            </form>
          </div>
        ) : (
          <div className="card" style={styles.cardWrap}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              Realizar Corte de Caja
            </h3>
            
            <form onSubmit={handleCloseSession}>
              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label>Fondo de Apertura: <b>${initialCash.toFixed(2)}</b></label>
              </div>

              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label>Efectivo Físico en Caja ($)</label>
                <input
                  type="number"
                  className="input-field"
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  placeholder="Cuenta el dinero físico e ingrésalo"
                  required
                  style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent)' }}
                />
              </div>

              <div className="input-group" style={{ marginBottom: '20px' }}>
                <label>Notas / Observaciones del Corte</label>
                <textarea
                  className="input-field"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Escribe alguna diferencia detectada o aclaraciones sobre el dinero o mermas..."
                  style={{ minHeight: '80px', fontFamily: 'inherit', resize: 'none' }}
                />
              </div>

              {/* Dynamic status helper */}
              {actualCashInput !== '' && (
                <div style={{
                  ...styles.alertBox,
                  borderColor: discrepancy === 0 ? 'var(--success)' : discrepancy < 0 ? 'var(--danger)' : 'var(--warning)',
                  backgroundColor: discrepancy === 0 ? 'var(--success-bg)' : discrepancy < 0 ? 'var(--danger-bg)' : 'var(--warning-bg)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {discrepancy === 0 ? <CheckIcon size={16} /> : <AlertIcon size={16} />}
                    <span style={{ fontWeight: '700', fontSize: '14px' }}>
                      {discrepancy === 0 ? 'Caja Cuadrada' : discrepancy < 0 ? 'Faltante de Efectivo' : 'Sobrante de Efectivo'}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>
                    Efectivo Esperado: <b>${expectedCash.toFixed(2)}</b> | Diferencia:{' '}
                    <span style={{ fontWeight: '700' }}>
                      {discrepancy >= 0 ? `+$${discrepancy.toFixed(2)}` : `-$${Math.abs(discrepancy).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-danger btn-lg" style={{ width: '100%', marginTop: '10px' }}>
                Cerrar Caja y Registrar Corte
              </button>
            </form>
          </div>
        )}

        {/* RIGHT COLUMN: Real-time statistics summary of active shift */}
        {cashSession && (
          <div className="card" style={styles.cardWrap}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              Resumen de Caja Actual
            </h3>
            
            <div style={styles.statsSummary}>
              <div style={styles.sessionMeta}>
                <div>Sucursal: <b>{cashSession.cashier}</b></div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Abierta: {new Date(cashSession.openedAt).toLocaleString()}
                </div>
              </div>

              <div style={styles.statsTable}>
                {/* Produced sales */}
                <div style={styles.statsTableRow}>
                  <span>Fondo Inicial (Efectivo)</span>
                  <span style={{ fontWeight: '600' }}>${initialCash.toFixed(2)}</span>
                </div>
                <div style={styles.statsTableRow}>
                  <span>Ventas en Efectivo (+)</span>
                  <span style={{ color: 'var(--success)' }}>+${salesCash.toFixed(2)}</span>
                </div>
                <div style={styles.statsTableRow}>
                  <span>Devoluciones Efectivo (-)</span>
                  <span style={{ color: 'var(--danger)' }}>-${refundsCash.toFixed(2)}</span>
                </div>
                <div style={{ ...styles.statsTableRow, borderTop: '1px dashed var(--border)', fontWeight: '700', paddingTop: '8px' }}>
                  <span>Efectivo Esperado en Caja</span>
                  <span style={{ color: 'var(--accent)' }}>${expectedCash.toFixed(2)}</span>
                </div>

                {/* Non-cash sales */}
                <div style={{ ...styles.statsTableRow, marginTop: '12px' }}>
                  <span>Ventas con Tarjeta (Terminal)</span>
                  <span>${salesCard.toFixed(2)}</span>
                </div>
                <div style={styles.statsTableRow}>
                  <span>Ventas por Transferencia</span>
                  <span>${salesTransfer.toFixed(2)}</span>
                </div>
                <div style={{ ...styles.statsTableRow, fontWeight: '700' }}>
                  <span>Ventas Totales Netas de Caja</span>
                  <span>${totalSalesCaja.toFixed(2)}</span>
                </div>
                <div style={{ ...styles.statsTableRow, fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>Tickets emitidos</span>
                  <span>{totalSalesCount} exitosos / {totalRefundsCount} devueltos</span>
                </div>

                {/* Waste / Merma */}
                <div style={{ ...styles.statsTableRow, marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrashIcon size={16} /> Mermas de Caja
                  </span>
                  <span style={{ color: 'var(--danger)', fontWeight: '600' }}>
                    -${totalMermaCost.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Show list of session mermas */}
              {sessionMermas.length > 0 && (
                <div style={styles.mermaDetailsList}>
                  <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Detalle de productos en merma:
                  </div>
                  {sessionMermas.map(m => (
                    <div key={m.id} style={styles.mermaListItem}>
                      <span>{m.name} (x{m.quantity})</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {m.reason} • -${m.totalLoss.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cash Cut Historical Receipt Modal */}
      {showCutReceipt && (
        <div className="modal-overlay">
          <div className="modal" style={styles.cutReceiptModal}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#333', display: 'inline-flex', justifyContent: 'center', marginBottom: '8px' }}>
                <DashboardIcon size={32} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '8px 0' }}>COMPROBANTE DE CORTE DE CAJA</h2>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Caja Cerrada Exitosamente</p>
              <div style={styles.ticketDivider} />
              <p style={{ fontSize: '12px' }}>Folio Corte: <b>{showCutReceipt.id}</b></p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Fecha Cierre: {new Date(showCutReceipt.date).toLocaleString()}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Sucursal: {showCutReceipt.cashier}</p>
            </div>

            <div style={styles.ticketDivider} />

            <div style={styles.ticketSection}>
              <div style={styles.ticketRow}>
                <span>Fondo Inicial:</span>
                <span>${showCutReceipt.initialCash.toFixed(2)}</span>
              </div>
              <div style={styles.ticketRow}>
                <span>Ventas Efectivo Neto:</span>
                <span>+${showCutReceipt.salesCash.toFixed(2)}</span>
              </div>
              <div style={{ ...styles.ticketRow, fontWeight: '700' }}>
                <span>Efectivo Esperado:</span>
                <span>${showCutReceipt.expectedCash.toFixed(2)}</span>
              </div>
              <div style={{ ...styles.ticketRow, fontWeight: '700' }}>
                <span>Efectivo Declarado:</span>
                <span style={{ color: 'var(--accent)' }}>${showCutReceipt.actualCash.toFixed(2)}</span>
              </div>
              <div style={{ 
                ...styles.ticketRow, 
                fontWeight: '800',
                color: showCutReceipt.discrepancy === 0 ? 'var(--success)' : showCutReceipt.discrepancy < 0 ? 'var(--danger)' : 'var(--warning)' 
              }}>
                <span>Diferencia (Arqueo):</span>
                <span>
                  {showCutReceipt.discrepancy === 0 ? 'CUADRADA ($0.00)' : showCutReceipt.discrepancy > 0 ? `SOBRANTE: +$${showCutReceipt.discrepancy.toFixed(2)}` : `FALTANTE: -$${Math.abs(showCutReceipt.discrepancy).toFixed(2)}`}
                </span>
              </div>
            </div>

            <div style={styles.ticketDivider} />

            <div style={styles.ticketSection}>
              <div style={styles.ticketRow}>
                <span>Tarjeta (Terminal):</span>
                <span>${showCutReceipt.cardsTotal.toFixed(2)}</span>
              </div>
              <div style={styles.ticketRow}>
                <span>Transferencias:</span>
                <span>${showCutReceipt.transfersTotal.toFixed(2)}</span>
              </div>
              <div style={{ ...styles.ticketRow, fontWeight: '700' }}>
                <span>Total Ventas:</span>
                <span>${(showCutReceipt.salesCash + showCutReceipt.cardsTotal + showCutReceipt.transfersTotal).toFixed(2)}</span>
              </div>
            </div>

            <div style={styles.ticketDivider} />

            <div style={styles.ticketSection}>
              <div style={{ ...styles.ticketRow, color: 'var(--danger)', fontWeight: '700' }}>
                <span>Mermas / Desechos:</span>
                <span>-${showCutReceipt.totalMermas.toFixed(2)}</span>
              </div>
            </div>

            {showCutReceipt.salesBreakdown && showCutReceipt.salesBreakdown.length > 0 && (
              <>
                <div style={styles.ticketDivider} />
                <div style={{ textAlign: 'left', fontSize: '11px', fontWeight: '700', marginBottom: '8px' }}>
                  DETALLE DE ARTÍCULOS VENDIDOS
                </div>
                <div style={styles.ticketSection}>
                  {showCutReceipt.salesBreakdown.map(item => (
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

            {showCutReceipt.notes && (
              <>
                <div style={styles.ticketDivider} />
                <div style={{ fontSize: '11px', textAlign: 'left' }}>
                  <b>Notas:</b> {showCutReceipt.notes}
                </div>
              </>
            )}

            <div style={styles.ticketDivider} />

            <div style={styles.ticketActions}>
              <button className="btn btn-secondary" onClick={() => {
                showToast('Imprimiendo reporte de corte... (Simulación)', 'success');
              }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <PrintIcon size={16} /> Imprimir Reporte
              </button>
              <button className="btn btn-primary" onClick={() => setShowCutReceipt(null)} style={{ flex: 1 }}>
                Aceptar
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
    padding: '24px',
    height: '100%',
    overflowY: 'auto',
    width: '100%'
  },
  header: {
    marginBottom: '24px'
  },
  cardWrap: {
    padding: '28px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border)'
  },
  iconBox: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px'
  },
  sessionMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--bg-primary)',
    padding: '12px 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    marginBottom: '16px'
  },
  statsSummary: {
    display: 'flex',
    flexDirection: 'column'
  },
  statsTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  statsTableRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px'
  },
  mermaDetailsList: {
    marginTop: '16px',
    backgroundColor: 'var(--bg-primary)',
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)'
  },
  mermaListItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    padding: '4px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    '&:last-child': { borderBottom: 'none' }
  },
  alertBox: {
    border: '1px solid',
    padding: '14px',
    borderRadius: 'var(--radius-sm)',
    marginBottom: '20px',
    color: 'var(--text-primary)'
  },
  cutReceiptModal: {
    maxWidth: '380px',
    backgroundColor: '#fff',
    color: '#000',
    padding: '24px 20px',
    fontFamily: 'monospace'
  },
  ticketDivider: {
    borderTop: '1px dashed #000',
    width: '100%',
    margin: '12px 0'
  },
  ticketSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  ticketRow: {
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
