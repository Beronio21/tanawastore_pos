/**
 * Default `tanawa` tenant state and shared domain types for the Phase 01 port.
 * Values mirror `poster_pos_management_console_terminal (2).html` exactly:
 * three menu items, 14 stock rows worth ₱215.20, three finance accounts and
 * the 13 default finance categories.
 */

export type MenuItemType = "Product" | "Dish";
export type PaymentMethod = "Cash" | "Card" | "e-Wallet";
export type FinanceCategoryFlag = "displayOnPos" | "includeInPnl";

export type LocationSettings = {
  companyName: string;
  subdomain: string;
  address: string;
  timezone: string;
  shiftEndTime: string;
  currencySymbol: string;
  currencyLabel: string;
  language: string;
  vatRate: number;
  showFloorPlan: boolean;
  quickWaitersChange: boolean;
  cashRegisterShifts: boolean;
  payrollTracking: boolean;
};

export type Employee = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  login: string;
  pin: string;
  position: string;
  dotColor: string;
  lastLogin: string;
  hourlyRate?: number;
};

export type Station = {
  id: string;
  title: string;
  printTickets: boolean;
};

export type MenuCategory = {
  id: string;
  name: string;
  emoji: string;
  sales: number;
};

export type RecipeIngredient = {
  /** Ingredient row to deduct, when the recipe uses a raw ingredient directly. */
  stockId?: string;
  /** Nested preparation to expand before deducting its ingredients. */
  prepId?: string;
  qty: number;
};

export type MenuItem = {
  id: string;
  title: string;
  type: MenuItemType;
  category: string;
  station: string;
  emoji: string;
  /** Cost of the recipe/BOM without VAT. */
  cost: number;
  price: number;
  recipe: RecipeIngredient[];
};

export type PreparationItem = {
  id: string;
  title: string;
  totalWeight: string;
  cost: number;
  recipeLines: number;
  recipe: RecipeIngredient[];
};

export type StockItem = {
  id: string;
  title: string;
  type: "Product" | "Ingredient";
  category: string;
  stock: number;
  unit: string;
  cost: number;
  limit: number;
};

export type Customer = {
  id: string;
  name: string;
  profileNum: string;
  phone: string;
  group: string;
  discountPct: number;
  overallSum: number;
  cashSum: number;
  cardSum: number;
  receiptCount: number;
};

export type ReceiptItem = {
  menuId: string;
  name: string;
  qty: number;
  unitPrice: number;
};

export type Receipt = {
  receiptNum: number;
  staffId: string;
  staffName: string;
  tableName: string;
  openedAt: string;
  closedAt: string;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discountAmt: number;
  tax: number;
  profit: number;
  total: number;
  items: ReceiptItem[];
  tendered?: number;
  change?: number;
};

export type FinanceAccount = {
  id: string;
  name: string;
  isCashDrawer?: boolean;
  type: "Bank account" | "Cash" | "e-Wallet";
  balance: number;
};

export type FinanceCategory = {
  id: string;
  name: string;
  allowed: "All transactions" | "Expenses only" | "Income only";
  displayOnPos: boolean;
  includeInPnl: boolean;
  hasPosSwitch: boolean;
  expandable?: boolean;
  expanded?: boolean;
  children?: string[];
};

export type FinanceTransaction = {
  id: string;
  date: string;
  type: "income" | "expense";
  category: string;
  comment: string;
  sum: number;
  account: string;
};

export type StockMovement = {
  time: string;
  title: string;
  reason: string;
  delta: number;
  unit: string;
};

export type GuestFeedback = {
  stars: number;
  comment: string;
  time: string;
};

export type PosOrderItem = {
  uid: string;
  menuId: string;
  name: string;
  unitPrice: number;
  qty: number;
  sent: boolean;
};

export type PosOrderTab = {
  id: string;
  receiptNum: number;
  tableId: string;
  guests: number;
  staffId: string;
  customerId: string;
  discountPct: number;
  note: string;
  openedAt: string;
  items: PosOrderItem[];
};

export type KdsTicket = {
  id: string;
  receiptNum: number;
  tableName: string;
  station: string;
  time: string;
  items: { name: string; qty: number }[];
};

export type OnboardingProgress = {
  createdItem: boolean;
  madeSale: boolean;
  viewedReports: boolean;
};

export type CashFlowRowKey = "begin" | "end" | "net";

export type ToastKind = "info" | "success" | "blue";
export type Toast = { id: number; message: string; kind: ToastKind };

export type ConsoleModal =
  | "add-item"
  | "add-supply"
  | "add-tx"
  | "add-account"
  | "add-finance-category"
  | "add-customer"
  | "add-employee"
  | "postie-ai"
  | "subscription"
  | "qr-menu"
  | "pin-lock"
  | null;

export type ConsoleState = {
  theme: "light" | "dark";
  sidebarCollapsed: boolean;
  expandedAccordions: Record<string, boolean>;
  activeModal: ConsoleModal;
  receiptPreview: Receipt | null;
  toasts: Toast[];
  posLocked: boolean;
  isOnline: boolean;
  offlineQueued: number;

  onboarding: OnboardingProgress;
  settings: LocationSettings;
  accounts: FinanceAccount[];
  financeCategories: FinanceCategory[];
  cashFlowAccountFilter: string;
  cashFlowExpanded: Record<CashFlowRowKey, boolean>;
  pnlConnected: boolean;
  shiftOpenedAt: string;
  employees: Employee[];
  currentStaffId: string;
  menuItems: MenuItem[];
  preparations: PreparationItem[];
  menuCategories: MenuCategory[];
  stations: Station[];
  stockItems: StockItem[];
  stockMovements: StockMovement[];
  customers: Customer[];
  transactions: FinanceTransaction[];
  receipts: Receipt[];
  feedbackList: GuestFeedback[];
  nextReceiptNum: number;
  posOrders: PosOrderTab[];
  activePosOrderId: string;
  kdsTickets: KdsTicket[];
  posPayMethod: PaymentMethod;
};

export type FloorTable = { id: string; name: string; seats: number };

export type OrderTotals = {
  subtotal: number;
  discountAmt: number;
  tax: number;
  total: number;
  costTotal: number;
};

export const VAT_RATE = 0.12;

export const FLOOR_TABLES: FloorTable[] = [
  { id: "T1", name: "Table 1", seats: 2 },
  { id: "T2", name: "Table 2", seats: 2 },
  { id: "T3", name: "Table 3", seats: 4 },
  { id: "T4", name: "Table 4", seats: 4 },
  { id: "T5", name: "Table 5", seats: 6 },
  { id: "T6", name: "Table 6", seats: 2 },
  { id: "P1", name: "Patio 1", seats: 4 },
  { id: "P2", name: "Patio 2", seats: 4 },
];

export function floorTableName(tableId: string): string {
  if (tableId === "TAKEAWAY") return "Takeaway";
  return FLOOR_TABLES.find((table) => table.id === tableId)?.name ?? tableId;
}

export function accountDisplayName(account: FinanceAccount | undefined, companyName: string): string {
  if (!account) return "";
  return account.isCashDrawer ? `Cash drawer for ${companyName}` : account.name;
}

export function calcOrderTotals(
  order: PosOrderTab | undefined,
  menuItems: MenuItem[],
  vatRate = VAT_RATE,
): OrderTotals {
  if (!order) {
    return { subtotal: 0, discountAmt: 0, tax: 0, total: 0, costTotal: 0 };
  }
  const subtotal = order.items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const costTotal = order.items.reduce((sum, item) => {
    const menuItem = menuItems.find((entry) => entry.id === item.menuId);
    return sum + (menuItem?.cost ?? 0) * item.qty;
  }, 0);
  const discountAmt = subtotal * ((order.discountPct || 0) / 100);
  const afterDiscount = Math.max(0, subtotal - discountAmt);
  const tax = afterDiscount * vatRate;
  return { subtotal, discountAmt, tax, total: afterDiscount + tax, costTotal };
}

const INITIAL_SETTINGS: LocationSettings = {
  companyName: "tanawa",
  subdomain: "tanawa.joinposter.com",
  address: "tanawa.joinposter.com",
  timezone: "(+08:00) — Asia/Manila",
  shiftEndTime: "12:00 am",
  currencySymbol: "₱",
  currencyLabel: "Philippine peso, ₱",
  language: "English",
  vatRate: VAT_RATE,
  showFloorPlan: true,
  quickWaitersChange: true,
  cashRegisterShifts: false,
  payrollTracking: false,
};

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "emp-1",
    name: "Philip Venje Beronio",
    initials: "PV",
    phone: "00639758868962",
    login: "2201107938@student.buksu.edu.ph",
    pin: "0000",
    position: "Owner",
    dotColor: "bg-pink-500",
    lastLogin: "23 November, 7:55 pm",
    hourlyRate: 120,
  },
];

const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: "prod-1",
    title: "Borjomi 0.5l",
    type: "Product",
    category: "Cold drinks",
    station: "Bar",
    cost: 0,
    price: 10,
    emoji: "🍶",
    recipe: [{ stockId: "stk-1", qty: 1 }],
  },
  {
    id: "prod-2",
    title: "Capucino 250ml",
    type: "Dish",
    category: "Coffee",
    station: "Bar",
    cost: 12.5,
    price: 120,
    emoji: "☕",
    recipe: [
      { stockId: "stk-2", qty: 0.018 },
      { stockId: "stk-8", qty: 0.2 },
      { stockId: "stk-10", qty: 1 },
      { stockId: "stk-4", qty: 1 },
      { stockId: "stk-3", qty: 1 },
    ],
  },
  {
    id: "prod-3",
    title: "Croissant with chocolate",
    type: "Dish",
    category: "Bakery",
    station: "Kitchen",
    cost: 14.2,
    price: 95,
    emoji: "🥐",
    recipe: [
      { stockId: "stk-7", qty: 0.12 },
      { stockId: "stk-5", qty: 0.03 },
      { stockId: "stk-6", qty: 1 },
      { stockId: "stk-12", qty: 0.015 },
    ],
  },
];

const INITIAL_STOCK_ITEMS: StockItem[] = [
  { id: "stk-1", title: "Borjomi 0.5l", type: "Product", category: "Cold drinks", stock: 20, unit: "pcs", cost: 4, limit: 0 },
  { id: "stk-2", title: "Coffee", type: "Ingredient", category: "", stock: 2, unit: "kg", cost: 30, limit: 0 },
  { id: "stk-3", title: "Coffee stirrer", type: "Ingredient", category: "", stock: 100, unit: "pcs", cost: 0.06, limit: 0 },
  { id: "stk-4", title: "Cover 250ml", type: "Ingredient", category: "", stock: 50, unit: "pcs", cost: 0.15, limit: 0 },
  { id: "stk-5", title: "Dark chocolate", type: "Ingredient", category: "", stock: 1, unit: "kg", cost: 10, limit: 0 },
  { id: "stk-6", title: "Egg", type: "Ingredient", category: "", stock: 6, unit: "pcs", cost: 0.1, limit: 0 },
  { id: "stk-7", title: "Flour", type: "Ingredient", category: "", stock: 3, unit: "kg", cost: 1.3, limit: 0 },
  { id: "stk-8", title: "Milk", type: "Ingredient", category: "", stock: 4, unit: "l", cost: 2, limit: 0 },
  { id: "stk-9", title: "Oil", type: "Ingredient", category: "", stock: 1, unit: "kg", cost: 8, limit: 0 },
  { id: "stk-10", title: "Paper cup 250ml", type: "Ingredient", category: "", stock: 100, unit: "pcs", cost: 0.2, limit: 0 },
  { id: "stk-11", title: "Salt", type: "Ingredient", category: "", stock: 1, unit: "kg", cost: 0.2, limit: 0 },
  { id: "stk-12", title: "Sugar", type: "Ingredient", category: "", stock: 2, unit: "kg", cost: 2, limit: 0 },
  { id: "stk-13", title: "Water", type: "Ingredient", category: "", stock: 10, unit: "l", cost: 0.5, limit: 0 },
  { id: "stk-14", title: "Yeast", type: "Ingredient", category: "", stock: 0.2, unit: "kg", cost: 10, limit: 0 },
];

const INITIAL_ACCOUNTS: FinanceAccount[] = [
  { id: "acc-bank", name: "Bank account", type: "Bank account", balance: 0 },
  { id: "acc-cash", name: "Cash drawer", isCashDrawer: true, type: "Cash", balance: 0 },
  { id: "acc-safe", name: "Safe deposit", type: "Cash", balance: 0 },
];

const INITIAL_FINANCE_CATEGORIES: FinanceCategory[] = [
  { id: "fc-1", name: "Adjustment", allowed: "All transactions", displayOnPos: false, includeInPnl: true, hasPosSwitch: true },
  { id: "fc-2", name: "Banking services and commission fees", allowed: "Expenses only", displayOnPos: false, includeInPnl: true, hasPosSwitch: true },
  { id: "fc-3", name: "e-Wallet top up", allowed: "Income only", displayOnPos: false, includeInPnl: true, hasPosSwitch: true },
  { id: "fc-4", name: "Household expenses", allowed: "Expenses only", displayOnPos: true, includeInPnl: true, hasPosSwitch: true },
  { id: "fc-5", name: "Labour cost", allowed: "Expenses only", displayOnPos: true, includeInPnl: true, hasPosSwitch: true },
  { id: "fc-6", name: "Marketing", allowed: "Expenses only", displayOnPos: false, includeInPnl: true, hasPosSwitch: true },
  { id: "fc-7", name: "Rent", allowed: "Expenses only", displayOnPos: false, includeInPnl: true, hasPosSwitch: true },
  { id: "fc-8", name: "Supplies", allowed: "Expenses only", displayOnPos: true, includeInPnl: false, hasPosSwitch: true },
  {
    id: "fc-9",
    name: "Utility bills",
    allowed: "Expenses only",
    displayOnPos: false,
    includeInPnl: true,
    hasPosSwitch: true,
    expandable: true,
    expanded: false,
    children: ["Electricity", "Water supply", "Internet & Telecom"],
  },
  { id: "fc-10", name: "Cash shifts", allowed: "All transactions", displayOnPos: false, includeInPnl: false, hasPosSwitch: false },
  { id: "fc-11", name: "POS Sales", allowed: "Income only", displayOnPos: false, includeInPnl: true, hasPosSwitch: true },
  { id: "fc-12", name: "Safe drop", allowed: "All transactions", displayOnPos: true, includeInPnl: false, hasPosSwitch: true },
  { id: "fc-13", name: "Tips", allowed: "Income only", displayOnPos: true, includeInPnl: false, hasPosSwitch: true },
];

export const INITIAL_CONSOLE_STATE: ConsoleState = {
  theme: "light",
  sidebarCollapsed: false,
  expandedAccordions: { "get-started": true },
  activeModal: null,
  receiptPreview: null,
  toasts: [],
  posLocked: false,
  isOnline: true,
  offlineQueued: 0,

  onboarding: { createdItem: false, madeSale: false, viewedReports: false },
  settings: INITIAL_SETTINGS,
  accounts: INITIAL_ACCOUNTS,
  financeCategories: INITIAL_FINANCE_CATEGORIES,
  cashFlowAccountFilter: "All",
  cashFlowExpanded: { begin: false, end: false, net: false },
  pnlConnected: false,
  shiftOpenedAt: "23 Nov, 8:00 pm",
  employees: INITIAL_EMPLOYEES,
  currentStaffId: "emp-1",
  menuItems: INITIAL_MENU_ITEMS,
  preparations: [
    {
      id: "prep-1",
      title: "Pastry for croissants",
      totalWeight: "1.490 kg",
      cost: 5.25,
      recipeLines: 4,
      recipe: [
        { stockId: "stk-7", qty: 0.12 },
        { stockId: "stk-5", qty: 0.03 },
        { stockId: "stk-6", qty: 1 },
        { stockId: "stk-12", qty: 0.015 },
      ],
    },
  ],
  menuCategories: [
    { id: "mc-1", name: "Coffee", emoji: "☕", sales: 0 },
    { id: "mc-2", name: "Bakery", emoji: "🥐", sales: 0 },
    { id: "mc-3", name: "Cold drinks", emoji: "🍶", sales: 0 },
  ],
  stations: [
    { id: "st-bar", title: "Bar", printTickets: true },
    { id: "st-kitchen", title: "Kitchen", printTickets: true },
  ],
  stockItems: INITIAL_STOCK_ITEMS,
  stockMovements: [],
  customers: [],
  transactions: [],
  receipts: [],
  feedbackList: [],
  nextReceiptNum: 1001,
  posOrders: [
    {
      id: "ord-1001",
      receiptNum: 1001,
      tableId: "T1",
      guests: 2,
      staffId: "emp-1",
      customerId: "",
      discountPct: 0,
      note: "",
      openedAt: "8:10 pm",
      items: [
        { uid: "li-1", menuId: "prod-2", name: "Capucino 250ml", unitPrice: 120, qty: 1, sent: false },
        { uid: "li-2", menuId: "prod-3", name: "Croissant with chocolate", unitPrice: 95, qty: 1, sent: false },
      ],
    },
  ],
  activePosOrderId: "ord-1001",
  kdsTickets: [],
  posPayMethod: "Cash",
};

/** Total inventory valuation across all stock on hand (₱215.20 for the seed). */
export const INVENTORY_VALUE = INITIAL_STOCK_ITEMS.reduce(
  (total, item) => total + item.stock * item.cost,
  0,
);
