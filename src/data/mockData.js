export const initialCategories = [
  { id: 'all', name: 'Todos los Productos', icon: 'all' },
  { id: 'basicos', name: 'Básicos', icon: 'fast-food' },
  { id: 'promocion', name: 'Promoción', icon: 'tag' },
  { id: 'varios', name: 'Varios', icon: 'box' },
  { id: 'paquetes', name: 'Paquetes', icon: 'package' },
  { id: 'complementos', name: 'Complementos', icon: 'cookie' },
  { id: 'postres', name: 'Postres', icon: 'ice-cream' }
];

export const initialProducts = [
  // ================= BÁSICOS =================
  { sku: 'B-001', name: 'PECHUGÓN', category: 'basicos', cost: 110.00, price: 209.00, stock: 0, minStock: 5, color: '#f97316' },
  { sku: 'B-002', name: 'PESCUEZO', category: 'basicos', cost: 2.00, price: 5.00, stock: 0, minStock: 10, color: '#f97316' },
  { sku: 'B-003', name: 'ORDEN DE 8 TACOS', category: 'basicos', cost: 35.00, price: 74.00, stock: 0, minStock: 5, color: '#f97316' },
  { sku: 'B-004', name: '1/2 PECHUGÓN', category: 'basicos', cost: 60.00, price: 114.00, stock: 0, minStock: 3, color: '#f97316' },
  { sku: 'B-005', name: '1/4 PECHUGÓN', category: 'basicos', cost: 35.00, price: 70.00, stock: 0, minStock: 3, color: '#f97316' },
  { sku: 'B-006', name: 'TACO', category: 'basicos', cost: 5.00, price: 11.00, stock: 0, minStock: 15, color: '#f97316' },
  { sku: 'B-007', name: 'ORDEN DE 5 TACOS', category: 'basicos', cost: 22.00, price: 49.00, stock: 0, minStock: 5, color: '#f97316' },
  { sku: 'B-008', name: 'ORDEN DE PAPAS', category: 'basicos', cost: 15.00, price: 35.00, stock: 0, minStock: 8, color: '#eab308' },
  { sku: 'B-009', name: '1/2 ORDEN DE PAPAS', category: 'basicos', cost: 8.00, price: 19.00, stock: 0, minStock: 8, color: '#eab308' },
  { sku: 'B-010', name: '5 TACOS JUEVES', category: 'basicos', cost: 20.00, price: 45.00, stock: 0, minStock: 5, color: '#f97316' },
  { sku: 'B-011', name: 'TACOS 10 X', category: 'basicos', cost: 30.00, price: 69.00, stock: 0, minStock: 5, color: '#f97316' },
  { sku: 'B-012', name: '1/2 ORDEN COSTILLAS', category: 'basicos', cost: 28.00, price: 59.00, stock: 0, minStock: 3, color: '#f97316' },
  { sku: 'B-013', name: '1 COSTILLA', category: 'basicos', cost: 7.00, price: 15.00, stock: 0, minStock: 5, color: '#f97316' },
  { sku: 'B-014', name: 'COSTILLAS 8-PZAS', category: 'basicos', cost: 55.00, price: 109.00, stock: 0, minStock: 2, color: '#f97316' },
  { sku: 'B-015', name: 'CHILES RELLENOS', category: 'basicos', cost: 7.00, price: 15.00, stock: 0, minStock: 4, color: '#f97316' },
  { sku: 'B-016', name: '4 CHILES RELLENOS', category: 'basicos', cost: 22.00, price: 49.00, stock: 0, minStock: 3, color: '#f97316' },
  { sku: 'B-017', name: '2 CHILES RELLENOS', category: 'basicos', cost: 14.00, price: 30.00, stock: 0, minStock: 3, color: '#f97316' },
  { sku: 'B-018', name: '20 PEZCUESOS X 39', category: 'basicos', cost: 18.00, price: 39.00, stock: 0, minStock: 5, color: '#f97316' },
  { sku: 'B-019', name: 'LONCHESITOS (3)', category: 'basicos', cost: 18.00, price: 39.00, stock: 0, minStock: 5, color: '#f97316' },

  // ================= COMPLEMENTOS =================
  { sku: 'C-001', name: 'ESPAGUETI', category: 'complementos', cost: 15.00, price: 35.00, stock: 0, minStock: 5, color: '#3b82f6' },
  { sku: 'C-002', name: 'TORTILLAS', category: 'complementos', cost: 2.00, price: 5.00, stock: 0, minStock: 10, color: '#3b82f6' },
  { sku: 'C-003', name: 'ENSALADA DE CODITO', category: 'complementos', cost: 15.00, price: 35.00, stock: 0, minStock: 5, color: '#3b82f6' },
  { sku: 'C-004', name: 'ENSALADA DE COL', category: 'complementos', cost: 15.00, price: 35.00, stock: 0, minStock: 5, color: '#3b82f6' },
  { sku: 'C-005', name: 'REFRESCO 600ML', category: 'complementos', cost: 12.00, price: 25.00, stock: 0, minStock: 10, color: '#3b82f6' },
  { sku: 'C-006', name: 'REFRESCO 1.5L', category: 'complementos', cost: 20.00, price: 42.00, stock: 0, minStock: 8, color: '#3b82f6' },
  { sku: 'C-007', name: 'AGUA 1L', category: 'complementos', cost: 8.00, price: 22.00, stock: 0, minStock: 8, color: '#3b82f6' },
  { sku: 'C-008', name: 'SALSA', category: 'complementos', cost: 6.00, price: 15.00, stock: 0, minStock: 10, color: '#3b82f6' },
  { sku: 'C-009', name: 'SALSA GRANDE', category: 'complementos', cost: 12.00, price: 30.00, stock: 0, minStock: 5, color: '#3b82f6' },
  { sku: 'C-010', name: 'TORTILLAS 1/2 KG', category: 'complementos', cost: 6.00, price: 15.00, stock: 0, minStock: 5, color: '#3b82f6' },
  { sku: 'C-011', name: 'CHAMOYADA', category: 'complementos', cost: 20.00, price: 45.00, stock: 0, minStock: 4, color: '#3b82f6' },

  // ================= PROMOCIÓN =================
  {
    sku: 'P-PROM01',
    name: 'PARA MAMA CON AMOR',
    category: 'promocion',
    cost: 160.00,
    price: 299.00,
    stock: 0,
    minStock: 3,
    isCombo: true,
    components: [
      { sku: 'B-001', quantity: 1 },
      { sku: 'C-001', quantity: 1 },
      { sku: 'C-003', quantity: 1 },
      { sku: 'C-006', quantity: 1 }
    ],
    color: '#a855f7'
  },

  // ================= VARIOS =================
  { sku: 'V-001', name: 'SALSA BARBECUE', category: 'varios', cost: 0.00, price: 0.00, stock: 0, minStock: 20, color: '#10b981' },
  { sku: 'V-002', name: 'SALSA BUFALO', category: 'varios', cost: 0.00, price: 0.00, stock: 0, minStock: 20, color: '#10b981' },
  { sku: 'V-003', name: 'SALSA HABANERO', category: 'varios', cost: 0.00, price: 0.00, stock: 0, minStock: 20, color: '#10b981' },
  { sku: 'V-004', name: 'ALITAS 10 PIEZAS', category: 'varios', cost: 40.00, price: 89.00, stock: 0, minStock: 5, color: '#10b981' },
  { sku: 'V-005', name: 'ALITAS 5 PIEZAS', category: 'varios', cost: 22.00, price: 49.00, stock: 0, minStock: 5, color: '#10b981' },
  { sku: 'V-006', name: 'TORTA', category: 'varios', cost: 15.00, price: 35.00, stock: 0, minStock: 3, color: '#10b981' },

  // ================= PAQUETES (COMBOS) =================
  {
    sku: 'K-001',
    name: 'PAQUETE DUO',
    category: 'paquetes',
    cost: 80.00,
    price: 127.00,
    stock: 0,
    minStock: 5,
    isCombo: true,
    components: [
      { sku: 'B-004', quantity: 1 },
      { sku: 'B-009', quantity: 1 },
      { sku: 'C-005', quantity: 1 }
    ],
    color: '#ec4899'
  },
  {
    sku: 'K-002',
    name: 'PAQUETE CLÁSICO',
    category: 'paquetes',
    cost: 145.00,
    price: 269.00,
    stock: 0,
    minStock: 5,
    isCombo: true,
    components: [
      { sku: 'B-001', quantity: 1 },
      { sku: 'B-008', quantity: 1 },
      { sku: 'C-006', quantity: 1 }
    ],
    color: '#ec4899'
  },
  {
    sku: 'K-003',
    name: 'PAQUETE JUMBO',
    category: 'paquetes',
    cost: 220.00,
    price: 359.00,
    stock: 0,
    minStock: 2,
    isCombo: true,
    components: [
      { sku: 'B-001', quantity: 1 },
      { sku: 'B-004', quantity: 1 },
      { sku: 'B-008', quantity: 1 },
      { sku: 'C-001', quantity: 1 },
      { sku: 'C-006', quantity: 1 }
    ],
    color: '#ec4899'
  },
  {
    sku: 'K-004',
    name: 'PA REFRESCAR',
    category: 'paquetes',
    cost: 136.00,
    price: 279.00,
    stock: 0,
    minStock: 3,
    isCombo: true,
    components: [
      { sku: 'B-001', quantity: 1 },
      { sku: 'C-006', quantity: 1 },
      { sku: 'C-008', quantity: 1 }
    ],
    color: '#ec4899'
  },
  {
    sku: 'K-005',
    name: 'PAQUETE FAMILIAR',
    category: 'paquetes',
    cost: 166.00,
    price: 304.00,
    stock: 0,
    minStock: 3,
    isCombo: true,
    components: [
      { sku: 'B-001', quantity: 1 },
      { sku: 'C-001', quantity: 1 },
      { sku: 'C-004', quantity: 1 },
      { sku: 'C-010', quantity: 1 },
      { sku: 'C-006', quantity: 1 }
    ],
    color: '#ec4899'
  },
  {
    sku: 'K-006',
    name: 'INDIVIDUAL',
    category: 'paquetes',
    cost: 55.00,
    price: 85.00,
    stock: 0,
    minStock: 5,
    isCombo: true,
    components: [
      { sku: 'B-005', quantity: 1 },
      { sku: 'B-009', quantity: 1 },
      { sku: 'C-005', quantity: 1 }
    ],
    color: '#ec4899'
  },
  {
    sku: 'K-007',
    name: 'PA DISFRUTAR',
    category: 'paquetes',
    cost: 124.00,
    price: 234.00,
    stock: 0,
    minStock: 3,
    isCombo: true,
    components: [
      { sku: 'B-001', quantity: 1 },
      { sku: 'B-009', quantity: 1 },
      { sku: 'C-008', quantity: 1 }
    ],
    color: '#ec4899'
  },

  // ================= POSTRES =================
  { sku: 'D-001', name: 'FLAN CASERO', category: 'postres', cost: 12.00, price: 30.00, stock: 0, minStock: 3, color: '#eab308' },
  { sku: 'D-002', name: 'GELATINA', category: 'postres', cost: 5.00, price: 15.00, stock: 0, minStock: 5, color: '#eab308' }
];

export const initialCustomers = [
  {
    id: 'c-general',
    name: 'Público General',
    phone: 'N/A',
    email: 'N/A',
    points: 0,
    totalSpent: 0
  }
];

export const initialUsers = [
  {
    id: 'u-1',
    name: 'Administración',
    role: 'supervisor',
    pin: 'PechugonAdmin2026'
  },
  {
    id: 'u-2',
    name: 'Sucursal San Francisco',
    role: 'encargado',
    pin: '4321'
  },
  {
    id: 'u-3',
    name: 'Pechumóvil',
    role: 'encargado',
    pin: '2580'
  }
];

export const initialTransactions = [];

export const initialCashCuts = [];

export const initialMermas = [];
