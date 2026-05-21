import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

import { AlertIcon, CheckIcon } from './UI/Icons';

export default function Dashboard({ transactions, mermas, products }) {
  // Filter for completed transactions only
  const completedTransactions = transactions.filter(t => t.status === 'completado');

  // KPI Calculations
  const totalSales = completedTransactions.reduce((sum, t) => sum + t.total, 0);
  
  const totalCost = completedTransactions.reduce((sum, t) => {
    const transactionCost = t.items.reduce((itemSum, item) => itemSum + (item.cost * item.quantity), 0);
    return sum + transactionCost;
  }, 0);

  // Gross profit
  const grossProfit = totalSales - totalCost;

  const totalTransactions = completedTransactions.length;
  
  const totalMermaLoss = mermas.reduce((sum, m) => sum + m.totalLoss, 0);

  // Stock alerts
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  // 1. Line Chart Data: Sales in the last 7 days
  const getSalesHistoryData = () => {
    const salesByDate = {};
    
    // Fill last 7 days with 0s
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      salesByDate[dateString] = 0;
    }

    completedTransactions.forEach(t => {
      const dateString = new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      if (salesByDate[dateString] !== undefined) {
        salesByDate[dateString] += t.total;
      }
    });

    const labels = Object.keys(salesByDate);
    const data = Object.values(salesByDate);

    return {
      labels,
      datasets: [
        {
          label: 'Ventas ($)',
          data,
          borderColor: '#f59e0b', // var(--accent)
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.3,
          fill: true,
          pointBorderColor: '#f59e0b',
          pointBackgroundColor: '#0a0e1a',
          pointHoverBackgroundColor: '#f59e0b',
          pointHoverBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
  };

  // 2. Doughnut Chart Data: Payment Methods distribution
  const getPaymentMethodsData = () => {
    let cash = 0, card = 0, transfer = 0;
    completedTransactions.forEach(t => {
      if (t.paymentMethod === 'efectivo') cash += t.total;
      else if (t.paymentMethod === 'tarjeta') card += t.total;
      else if (t.paymentMethod === 'transferencia') transfer += t.total;
    });

    return {
      labels: ['Efectivo', 'Tarjeta', 'Transferencia'],
      datasets: [
        {
          data: [cash, card, transfer],
          backgroundColor: ['#10b981', '#3b82f6', '#a855f7'], // Green, Blue, Purple
          borderColor: '#1a2236',
          borderWidth: 2
        }
      ]
    };
  };

  // 3. Top Selling Products
  const getTopSellingProducts = () => {
    const salesBySku = {};
    completedTransactions.forEach(t => {
      t.items.forEach(item => {
        if (!salesBySku[item.sku]) {
          salesBySku[item.sku] = { name: item.name, quantity: 0, revenue: 0 };
        }
        salesBySku[item.sku].quantity += item.quantity;
        salesBySku[item.sku].revenue += item.price * item.quantity;
      });
    });

    return Object.values(salesBySku)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  const topSellers = getTopSellingProducts();

  const lineChartData = getSalesHistoryData();
  const doughnutChartData = getPaymentMethodsData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8', // var(--text-secondary)
          font: { family: 'Inter' }
        }
      },
      tooltip: {
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'Inter' }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter' } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter' } }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 12 }
        }
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Panel de Analíticas</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Métricas financieras y desempeño del negocio en tiempo real.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-label">Ingresos Totales</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>${totalSales.toFixed(2)}</div>
          <div className="stat-change" style={{ color: 'var(--success)' }}>
            Ventas Netas
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Ganancia Bruta</div>
          <div className="stat-value" style={{ color: '#10b981' }}>${grossProfit.toFixed(2)}</div>
          <div className="stat-change" style={{ color: 'var(--text-muted)' }}>
            Margen: {totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(1) : 0}%
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Transacciones</div>
          <div className="stat-value">{totalTransactions}</div>
          <div className="stat-change" style={{ color: 'var(--text-muted)' }}>
            Tickets completados
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Pérdida por Mermas</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>${totalMermaLoss.toFixed(2)}</div>
          <div className="stat-change" style={{ color: 'var(--text-muted)' }}>
            {mermas.length} registros de desecho
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid-3" style={{ gap: '20px', marginBottom: '24px' }}>
        {/* Line Chart */}
        <div className="card" style={{ gridColumn: 'span 2', height: '320px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ marginBottom: '10px' }}>
            <h3 className="card-title">Ventas de los Últimos 7 Días</h3>
          </div>
          <div style={{ flexGrow: 1, position: 'relative' }}>
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="card" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ marginBottom: '10px' }}>
            <h3 className="card-title">Métodos de Pago</h3>
          </div>
          <div style={{ flexGrow: 1, position: 'relative' }}>
            {totalSales > 0 ? (
              <Doughnut data={doughnutChartData} options={doughnutOptions} />
            ) : (
              <div style={styles.noData}>No hay ventas registradas.</div>
            )}
          </div>
        </div>
      </div>

      {/* Lists section */}
      <div className="grid-2" style={{ gap: '20px' }}>
        {/* Top Selling Products */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Productos Más Vendidos</h3>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style={{ textAlign: 'center' }}>Unidades Vendidas</th>
                  <th style={{ textAlign: 'right' }}>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {topSellers.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600' }}>{item.name}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--accent)' }}>
                      ${item.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {topSellers.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      Aún no hay ventas registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Critical Stock Alert */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertIcon size={20} style={{ color: 'var(--warning)' }} /> Alerta de Stock Bajo/Crítico
            </h3>
            <span className="badge badge-danger">{lowStockProducts.length} productos</span>
          </div>
          <div className="table-wrap" style={{ maxHeight: '250px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style={{ textAlign: 'center' }}>Stock Actual</th>
                  <th style={{ textAlign: 'center' }}>Mínimo Requerido</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map(p => {
                  const isOut = p.stock === 0;
                  return (
                    <tr key={p.sku}>
                      <td style={{ fontWeight: '600' }}>{p.name}</td>
                      <td style={{ textAlign: 'center', fontWeight: '700', color: isOut ? 'var(--danger)' : 'var(--warning)' }}>
                        {p.stock}
                      </td>
                      <td style={{ textAlign: 'center' }}>{p.minStock}</td>
                      <td>
                        <span className={`badge ${isOut ? 'badge-danger' : 'badge-warning'}`}>
                          {isOut ? 'Agotado' : 'Bajo Stock'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {lowStockProducts.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--success)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
                        <CheckIcon size={16} /> Todos los niveles de stock están saludables.
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
  noData: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-muted)',
    fontSize: '14px'
  }
};
