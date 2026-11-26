/**
 * Default `tanawa` tenant state and shared domain types for the Phase 01 port.
 * Values mirror `poster_pos_management_console_terminal (2).html` exactly:
 * three menu items, 14 stock rows worth ₱215.20, three finance accounts and
 * the 13 default finance categories.
 */

export type MenuItemType = "Product" | "Dish";
export type PaymentMethod = "Cash" | "Card" | "e-Wallet";
export type FinanceCategoryFlag = "displayOnPos" | "includeInPnl";
export type ServiceChargeFee = "Don't use" | "5%" | "10%";
export type LowStockAlert = "Do not notify" | "Daily digest" | "Immediate";

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
  enablePartialServing: boolean;
  roundOrderPrice: boolean;
  serviceChargeFee: ServiceChargeFee;
  cashRegisterShifts: boolean;
  useTaxes: boolean;
  useManufacturing: boolean;
  payrollTracking: boolean;
  lowStockAlert: LowStockAlert;
  logo: string;
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

export type AccessLevel = "Without access" | "View only" | "Full access";
export type ConsoleAccessArea =
  | "reports"
  | "finances"
  | "menu"
  | "inventory"
  | "marketing"
  | "accessSettings"
  | "accountSettings"
  | "securitySettings";

export type CommissionRate = {
  id: string;
  categoryId: string;
  percentage: number;
};

export type PositionRole = {
  id: string;
  title: string;
  color: string;
  systemRole: boolean;
  posAccess: boolean;
  editAllOrders: boolean;
  orderAdministration: boolean;
  consoleAccess: Record<ConsoleAccessArea, AccessLevel>;
  appInstallation: boolean;
  courier: boolean;
  payroll: {
    perHour: number;
    perShift: number;
    perMonth: number;
    commissionRates: CommissionRate[];
  };
};

export type EmployeeInvitation = {
  id: string;
  email: string;
  position: string;
  sentDate: string;
  status: "Pending";
};

export type UserSession = {
  id: string;
  employeeId: string;
  user: string;
  device: string;
  browser: string;
  ip: string;
  loginTime: string;
};

export type IntegrationPosFeature = "inventory-check" | "supply";

export type Integration = {
  id: string;
  employeeId: string;
  employeeName: string;
  application: string;
  token: string;
  masked: boolean;
  createdAt: string;
  active: boolean;
  posFeature?: IntegrationPosFeature;
};

export type Register = {
  id: string;
  number: number;
  title: string;
  type: "Standard";
  location: string;
  login: string;
  password: string;
};

export type BusinessLocation = {
  id: string;
  number: number;
  name: string;
  address: string;
  login: string;
  bankAccountId: string;
  cashAccountId: string;
  safeAccountId: string;
  storageLocations: string[];
  workingStart: string;
  workingEnd: string;
  is24_7: boolean;
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

export type IngredientCategory = {
  id: string;
  name: string;
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
  /** Optional SKU/barcode used by the POS quick-scan. */
  sku?: string;
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
  storageQuantities?: Record<string, number>;
};

export type Customer = {
  id: string;
  name: string;
  profileNum: string;
  phone: string;
  email?: string;
  birthday?: string;
  address?: string;
  gender?: string;
  comment?: string;
  group: string;
  discountPct: number;
  bonusBalance?: number;
  overallSum: number;
  cashSum: number;
  cardSum: number;
  receiptCount: number;
};

export type CustomerGroup = {
  id: string;
  title: string;
  loyaltyProgram: "Discount system" | "Bonus system";
  rate: number;
  deleted?: boolean;
};

export type LoyaltyTransitionCondition = {
  id: string;
  threshold: number;
  groupId: string;
};

export type LoyaltySettings = {
  maximumPct: number;
  registrationBonus: number;
  cashBackTransition: "yes" | "no";
  cashBackConditions: LoyaltyTransitionCondition[];
  discountTransition: "yes" | "no";
  discountConditions: LoyaltyTransitionCondition[];
};

export type PromotionRewardType = "Discount %" | "Fixed discount" | "Bonus points";
export type PromotionScope = "All menu items" | "Categories" | "Products";

export type Promotion = {
  id: string;
  title: string;
  beginningDate: string;
  expirationDate: string;
  rewardType: PromotionRewardType;
  rewardValue: number;
  scope: PromotionScope;
  categoryIds: string[];
  productIds: string[];
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
  /** Local sale date (`YYYY-MM-DD`) used by the Sales Report time series. */
  closedDate?: string;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discountAmt: number;
  tax: number;
  profit: number;
  total: number;
  cashBackRedeemed?: number;
  serviceCharge?: number;
  deliveryArea?: string;
  deliveryFee?: number;
  promotionTitle?: string;
  promotionDiscountAmt?: number;
  promotionBonus?: number;
  comment?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  refunded?: boolean;
  items: ReceiptItem[];
  tendered?: number;
  change?: number;
};

export type ReceiptReportStatus = "Open" | "Close";

/**
 * Unified row for Reports -> Receipts. Open rows come from the live POS checks,
 * closed rows from the receipt journal, so the table can show both at once.
 */
export type ReceiptReportRow = {
  key: string;
  number: number;
  waiter: string;
  openedAt: string;
  closedAt: string;
  paid: number;
  discount: number;
  profit: number;
  status: ReceiptReportStatus;
  paymentMethod: string;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  cashBack: number;
  items: ReceiptItem[];
};

/**
 * Poster's demo account ships with two anchor receipts so Reports -> Receipts
 * mirrors the reference screen before the first live check is closed.
 */
export function seedReceiptReportRows(now: Date = new Date()): ReceiptReportRow[] {
  const day = `${now.getDate()} ${now.toLocaleDateString("en-GB", { month: "long" })}`;
  return [
    {
      key: "seed-receipt-2",
      number: 2,
      waiter: "Philip Venje Beronio",
      openedAt: `${day}, 9:32 am`,
      closedAt: "",
      paid: 45,
      discount: 0,
      profit: 33,
      status: "Open",
      paymentMethod: "Cash",
      subtotal: 45,
      tax: 0,
      serviceCharge: 0,
      cashBack: 0,
      items: [{ menuId: "prod-2", name: "Capucino 250ml", qty: 1, unitPrice: 45 }],
    },
    {
      key: "seed-receipt-1",
      number: 1,
      waiter: "Philip Venje Beronio",
      openedAt: `${day}, 9:31 am`,
      closedAt: "9:32 am",
      paid: 0,
      discount: 64,
      profit: -7.82,
      status: "Close",
      paymentMethod: "Cash",
      subtotal: 64,
      tax: 0,
      serviceCharge: 0,
      cashBack: 0,
      items: [{ menuId: "prod-3", name: "Croissant with chocolate", qty: 1, unitPrice: 64 }],
    },
  ];
}

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

export type SupplyLineItem = {
  stockId: string;
  title: string;
  quantity: number;
  unit: string;
  cost: number;
};

export type SupplyRecord = {
  id: string;
  number: number;
  date: string;
  supplier: string;
  storage: string;
  account: string;
  comment: string;
  status: "Paid" | "Unpaid";
  sum: number;
  paymentDue: number;
  lines: SupplyLineItem[];
};

export type ButcheryLineItem = {
  stockId: string;
  title: string;
  quantity: number;
  unit: string;
};

export type ButcheryRecord = {
  id: string;
  date: string;
  storage: string;
  comment: string;
  primary: ButcheryLineItem;
  finals: ButcheryLineItem[];
  sum: number;
};

export type TransferLineItem = {
  stockId: string;
  title: string;
  quantity: number;
  unit: string;
  cost: number;
};

export type TransferRecord = {
  id: string;
  date: string;
  name: string;
  sum: number;
  employee: string;
  fromStorage: string;
  toStorage: string;
  comment: string;
  lines: TransferLineItem[];
};

export type StockDeductionLine = {
  stockId: string;
  title: string;
  quantity: number;
  unit: string;
  cost: number;
};

export type StockDeductionRecord = {
  id: string;
  date: string;
  storage: string;
  products: StockDeductionLine[];
  sum: number;
  employee: string;
  reason: string;
};

export type WasteReason = {
  id: string;
  name: string;
};

export type InventoryCheckLine = {
  stockId: string;
  title: string;
  expected: number;
  actual: number;
  unit: string;
  cost: number;
  discrepancyQty: number;
  discrepancyValue: number;
};

export type InventoryCheckRecord = {
  id: string;
  storage: string;
  startingDate: string;
  completedDate: string;
  type: "Full" | "Partial";
  totalValue: number;
  status: "Completed";
  lines: InventoryCheckLine[];
};

export type Supplier = {
  id: string;
  name: string;
  vatNumber: string;
  phone: string;
  address: string;
  comment: string;
};

export type StorageLocation = {
  id: string;
  title: string;
  address: string;
  comment: string;
};

export type OrderingUnit = {
  id: string;
  title: string;
  unit: "pcs" | "kg" | "l";
  quantity: number;
};

export type GuestFeedback = {
  stars: number;
  comment: string;
  time: string;
};

export type OrderSource = {
  id: string;
  title: string;
  displayOnPos: boolean;
  serviceFeePct: number;
};

export type PosPaymentType = "Cash" | "Cashless" | "Other";
export type PaymentMethodIcon = "cash" | "card" | "gift" | "wallet" | "muted";

export type PaymentMethodConfig = {
  id: string;
  title: string;
  paymentType: PosPaymentType;
  icon: PaymentMethodIcon;
  /** null renders as an em dash (no service fee configured). */
  serviceFeePct: number | null;
  displayedOnPos: boolean;
  systemLocked?: boolean;
  muted?: boolean;
  canEdit?: boolean;
  hasMenu?: boolean;
};

export type PosOrderItem = {
  uid: string;
  menuId: string;
  name: string;
  unitPrice: number;
  qty: number;
  sent: boolean;
};

export type DeliveryArea = {
  id: string;
  name: string;
  cost: number;
  serviceTimeMin: number;
};

export type FiscalReceiptMode = "During payment" | "Upon delivery" | "When creating an order" | "Don't print";

export type DeliverySettings = {
  enabled: boolean;
  orderStatuses: { ready: boolean; delivered: boolean };
  fiscalReceipt: FiscalReceiptMode;
  areas: DeliveryArea[];
};

export type ReceiptLanguage = "Account language" | "English" | "Filipino";
export type PrintOnReceipt = "Company name" | "Business name";

export type ReceiptSettings = {
  autoPrint: boolean;
  printReceiptNumber: boolean;
  printComments: boolean;
  printCustomerContact: boolean;
  printPredictions: boolean;
  predictions: string[];
  printWifi: boolean;
  wifiName: string;
  wifiPassword: string;
  printAddress: boolean;
  receiptLanguage: ReceiptLanguage;
  printOnReceipt: PrintOnReceipt;
};

export type AdminPasswordRule = "Always" | "After a check is printed" | "In cases..." | "Never";

export type SecuritySettings = {
  adminPassword: string;
  blockPrintBeforeClose: boolean;
  printTwoReceipts: boolean;
  magneticCardCustomer: boolean;
  autoKitchenTickets: "Never" | "When printing a check" | "When closing an order";
  kitchenTicketsAnyRegister: "Never" | "Always";
  adminRules: {
    deleteItem: AdminPasswordRule;
    deleteItemCases: { afterCheckPrinted: boolean; afterTicketPrinted: boolean };
    addDiscount: AdminPasswordRule;
    cancelPromotion: AdminPasswordRule;
    runReport: AdminPasswordRule;
    splitOrder: AdminPasswordRule;
    closeReceipt: AdminPasswordRule;
    addCustomer: AdminPasswordRule;
    viewOrdersHistory: AdminPasswordRule;
    addSupplyTablet: AdminPasswordRule;
    viewDevices: AdminPasswordRule;
  };
};

export type PosOrderTab = {
  id: string;
  receiptNum: number;
  tableId: string;
  source?: string;
  deliveryArea?: string;
  guests: number;
  staffId: string;
  customerId: string;
  discountPct: number;
  note: string;
  openedAt: string;
  items: PosOrderItem[];
  promotionId?: string;
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

export type PendingInvoice = {
  id: string;
  number: string;
  item: string;
  qty: number;
  amount: number;
  payBy: string;
  created: string;
};

export type PaidInvoice = {
  id: string;
  number: string;
  created: string;
  paid: string;
  amount: number;
};

export type BillingDetails = {
  taxId: string;
  companyName: string;
  registeredAddress: string;
  postalCode: string;
  phone: string;
  email: string;
};

export type AttachedCard = {
  brand: string;
  last4: string;
  name: string;
};

export type CashFlowRowKey = "begin" | "end" | "net";

export type ToastKind = "info" | "success" | "blue";
export type Toast = { id: number; message: string; kind: ToastKind };

export type ConsoleModal =
  | "add-item"
  | "add-supply"
  | "add-butchery"
  | "add-transfer"
  | "add-stock-deduction"
  | "add-waste-reason"
  | "add-inventory-check"
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

export type TenantProfile = {
  name: string;
  businessType: string;
  currency: string;
  timezone: string;
  registerLogin: string;
  registerTitle: string;
  locationName: string;
  address: string;
  openingFloat: number;
  completedAt: string;
};

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
  syncing: boolean;
  lastSyncedAt: string;
  syncedMutationIds: string[];

  plan: "starter" | "pro" | "enterprise";
  onboardingCompleted: boolean;
  tenantProfile: TenantProfile | null;
  onboarding: OnboardingProgress;
  settings: LocationSettings;
  accounts: FinanceAccount[];
  financeCategories: FinanceCategory[];
  cashFlowAccountFilter: string;
  cashFlowExpanded: Record<CashFlowRowKey, boolean>;
  pnlConnected: boolean;
  shiftOpenedAt: string;
  employees: Employee[];
  positions: PositionRole[];
  employeeInvitations: EmployeeInvitation[];
  userSessions: UserSession[];
  integrations: Integration[];
  accessLocations: string[];
  locations: BusinessLocation[];
  registers: Register[];
  currentStaffId: string;
  menuItems: MenuItem[];
  preparations: PreparationItem[];
  menuCategories: MenuCategory[];
  ingredientCategories: IngredientCategory[];
  stations: Station[];
  stockItems: StockItem[];
  stockMovements: StockMovement[];
  supplies: SupplyRecord[];
  butcheries: ButcheryRecord[];
  transfers: TransferRecord[];
  storageLocations: string[];
  storageLocationRecords: StorageLocation[];
  orderingUnits: OrderingUnit[];
  stockDeductions: StockDeductionRecord[];
  wasteReasons: WasteReason[];
  inventoryChecks: InventoryCheckRecord[];
  suppliers: Supplier[];
  customers: Customer[];
  customerGroups: CustomerGroup[];
  loyaltySettings: LoyaltySettings;
  excludedCategoryIds: string[];
  excludedProductIds: string[];
  promotions: Promotion[];
  transactions: FinanceTransaction[];
  receipts: Receipt[];
  feedbackList: GuestFeedback[];
  nextReceiptNum: number;
  posOrders: PosOrderTab[];
  activePosOrderId: string;
  kdsTickets: KdsTicket[];
  posPayMethod: PaymentMethod;
  subscriptionStatus: "Trial" | "Paid";
  pendingInvoice: PendingInvoice | null;
  paidInvoices: PaidInvoice[];
  billingDetails: BillingDetails;
  attachedCard: AttachedCard | null;
  orderSources: OrderSource[];
  paymentMethods: PaymentMethodConfig[];
  deliverySettings: DeliverySettings;
  securitySettings: SecuritySettings;
  receiptSettings: ReceiptSettings;
};

export type FloorTable = { id: string; name: string; seats: number };

export type OrderTotals = {
  subtotal: number;
  discountAmt: number;
  tax: number;
  total: number;
  costTotal: number;
  cashBackEligibleTotal: number;
  promotionDiscountAmt: number;
  promotionBonus: number;
  serviceCharge: number;
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
  excludedMenuItemIds: string[] = [],
  promotion?: Promotion,
  categories: MenuCategory[] = [],
  posRules: { serviceChargePct?: number; roundOrderPrice?: boolean } = {},
): OrderTotals {
  if (!order) {
    return { subtotal: 0, discountAmt: 0, tax: 0, total: 0, costTotal: 0, cashBackEligibleTotal: 0, promotionDiscountAmt: 0, promotionBonus: 0, serviceCharge: 0 };
  }
  const excludedIds = new Set(excludedMenuItemIds);
  const menuItemById = new Map(menuItems.map((item) => [item.id, item]));
  const categoryIdByName = new Map(categories.map((category) => [category.name, category.id]));
  const lineData = order.items.map((line) => {
    const menuItem = menuItemById.get(line.menuId);
    const amount = line.unitPrice * line.qty;
    const isPromotionItem =
      promotion?.scope === "All menu items" ||
      (promotion?.scope === "Categories" && promotion.categoryIds.includes(categoryIdByName.get(menuItem?.category ?? "") ?? "")) ||
      (promotion?.scope === "Products" && promotion.productIds.includes(line.menuId));
    return { line, amount, menuItem, excluded: excludedIds.has(line.menuId), isPromotionItem };
  });
  const subtotal = lineData.reduce((sum, row) => sum + row.amount, 0);
  const discountableSubtotal = lineData.reduce((sum, row) => sum + (row.excluded ? 0 : row.amount), 0);
  const costTotal = order.items.reduce((sum, item) => {
    return sum + (menuItemById.get(item.menuId)?.cost ?? 0) * item.qty;
  }, 0);
  const groupDiscount = discountableSubtotal * ((order.discountPct || 0) / 100);
  const promotionEligibleSubtotal = lineData.reduce(
    (sum, row) => sum + (row.isPromotionItem ? row.amount - (!row.excluded ? row.amount * ((order.discountPct || 0) / 100) : 0) : 0),
    0,
  );
  const promotionDiscountAmt = promotion?.rewardType === "Discount %"
    ? promotionEligibleSubtotal * Math.max(0, Math.min(100, promotion.rewardValue)) / 100
    : promotion?.rewardType === "Fixed discount"
      ? Math.min(promotionEligibleSubtotal, Math.max(0, promotion.rewardValue))
      : 0;
  const discountAmt = Math.min(subtotal, groupDiscount + promotionDiscountAmt);
  const afterDiscount = Math.max(0, subtotal - discountAmt);
  const tax = afterDiscount * vatRate;
  const cashbackBase = lineData.reduce((sum, row) => {
    if (row.excluded) return sum;
    const afterGroupDiscount = row.amount * (1 - (order.discountPct || 0) / 100);
    const promotionReduction = row.isPromotionItem && promotion?.rewardType === "Discount %"
      ? afterGroupDiscount * Math.max(0, Math.min(100, promotion.rewardValue)) / 100
      : row.isPromotionItem && promotion?.rewardType === "Fixed discount" && promotionEligibleSubtotal > 0
        ? promotionDiscountAmt * afterGroupDiscount / promotionEligibleSubtotal
        : 0;
    return sum + Math.max(0, afterGroupDiscount - promotionReduction);
  }, 0);
  const cashBackEligibleTotal = cashbackBase * (1 + vatRate);
  const hasPromotionItems = lineData.some((row) => row.isPromotionItem);
  const promotionBonus = promotion?.rewardType === "Bonus points" && hasPromotionItems
    ? Math.max(0, promotion.rewardValue)
    : 0;
  const baseTotal = afterDiscount + tax;
  const serviceCharge = posRules.serviceChargePct ? baseTotal * posRules.serviceChargePct / 100 : 0;
  const total = posRules.roundOrderPrice ? Math.floor(baseTotal + serviceCharge) : baseTotal + serviceCharge;
  return { subtotal, discountAmt, tax, total, costTotal, cashBackEligibleTotal, promotionDiscountAmt, promotionBonus, serviceCharge };
}

/** POS pricing rules derived from Settings → General (service charge & rounding). */
export function posPricingRules(settings: LocationSettings): { serviceChargePct: number; roundOrderPrice: boolean } {
  const fee = settings.serviceChargeFee ?? "Don't use";
  return {
    serviceChargePct: fee === "Don't use" ? 0 : Number(fee.replace("%", "")) || 0,
    roundOrderPrice: settings.roundOrderPrice === true,
  };
}

export function getActivePromotions(promotions: Promotion[], date = new Date()): Promotion[] {
  const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return promotions.filter((promotion) => promotion.beginningDate <= today && promotion.expirationDate >= today);
}

export function getExcludedMenuItemIds(
  menuItems: MenuItem[],
  categories: MenuCategory[],
  excludedCategoryIds: string[],
  excludedProductIds: string[],
): string[] {
  const excludedCategoryNames = new Set(
    categories.filter((category) => excludedCategoryIds.includes(category.id)).map((category) => category.name),
  );
  return menuItems
    .filter((item) => excludedProductIds.includes(item.id) || excludedCategoryNames.has(item.category))
    .map((item) => item.id);
}

const INITIAL_SETTINGS: LocationSettings = {
  companyName: "tanawa",
  subdomain: "tanawastore.pos",
  address: "tanawastore.pos",
  timezone: "(+08:00) — Asia/Manila",
  shiftEndTime: "12:00 am",
  currencySymbol: "₱",
  currencyLabel: "Philippine peso, ₱",
  language: "English",
  vatRate: VAT_RATE,
  showFloorPlan: false,
  quickWaitersChange: false,
  enablePartialServing: true,
  roundOrderPrice: false,
  serviceChargeFee: "Don't use",
  cashRegisterShifts: false,
  useTaxes: false,
  useManufacturing: false,
  payrollTracking: false,
  lowStockAlert: "Do not notify",
  logo: "",
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
    dotColor: "#D946EF",
    lastLogin: "24 November, 9:25 pm",
    hourlyRate: 120,
  },
];

const INITIAL_REGISTERS: Register[] = [
  {
    id: "register-1",
    number: 1,
    title: "Register in “tanawa”",
    type: "Standard",
    location: "tanawa",
    login: "tanawa",
    password: "m8hezbkf",
  },
];

const noConsoleAccess: Record<ConsoleAccessArea, AccessLevel> = {
  reports: "Without access",
  finances: "Without access",
  menu: "Without access",
  inventory: "Without access",
  marketing: "Without access",
  accessSettings: "Without access",
  accountSettings: "Without access",
  securitySettings: "Without access",
};

function consoleRights(overrides: Partial<Record<ConsoleAccessArea, AccessLevel>> = {}): Record<ConsoleAccessArea, AccessLevel> {
  return { ...noConsoleAccess, ...overrides };
}

const INITIAL_POSITIONS: PositionRole[] = [
  {
    id: "role-manager", title: "Manager", color: "#0077FF", systemRole: false,
    posAccess: true, editAllOrders: true, orderAdministration: true,
    consoleAccess: consoleRights(Object.fromEntries(
      Object.keys(noConsoleAccess).map((area) => [area, "Full access"]),
    ) as Record<ConsoleAccessArea, AccessLevel>),
    appInstallation: true, courier: true,
    payroll: { perHour: 0, perShift: 0, perMonth: 0, commissionRates: [] },
  },
  {
    id: "role-marketer", title: "Marketer", color: "#0EA5E9", systemRole: false,
    posAccess: false, editAllOrders: false, orderAdministration: false,
    consoleAccess: consoleRights({ reports: "Full access", marketing: "Full access" }),
    appInstallation: false, courier: false,
    payroll: { perHour: 0, perShift: 0, perMonth: 0, commissionRates: [] },
  },
  {
    id: "role-hall-manager", title: "Hall manager", color: "#22C55E", systemRole: false,
    posAccess: true, editAllOrders: false, orderAdministration: true,
    consoleAccess: consoleRights(),
    appInstallation: false, courier: false,
    payroll: { perHour: 0, perShift: 0, perMonth: 0, commissionRates: [] },
  },
  {
    id: "role-owner", title: "Owner", color: "#22C55E", systemRole: true,
    posAccess: true, editAllOrders: true, orderAdministration: true,
    consoleAccess: consoleRights(Object.fromEntries(
      Object.keys(noConsoleAccess).map((area) => [area, "Full access"]),
    ) as Record<ConsoleAccessArea, AccessLevel>),
    appInstallation: true, courier: true,
    payroll: { perHour: 0, perShift: 0, perMonth: 0, commissionRates: [] },
  },
  {
    id: "role-storekeeper", title: "Storekeeper", color: "#0EA5E9", systemRole: false,
    posAccess: false, editAllOrders: false, orderAdministration: false,
    consoleAccess: consoleRights({ menu: "Full access", inventory: "Full access" }),
    appInstallation: false, courier: false,
    payroll: { perHour: 0, perShift: 0, perMonth: 0, commissionRates: [] },
  },
  {
    id: "role-waiter", title: "Waiter", color: "#22C55E", systemRole: false,
    posAccess: true, editAllOrders: false, orderAdministration: false,
    consoleAccess: consoleRights(),
    appInstallation: false, courier: false,
    payroll: { perHour: 0, perShift: 0, perMonth: 0, commissionRates: [] },
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
    sku: "BORJOMI-05",
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
    sku: "CAPUCCINO-250",
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
    category: "Pastry",
    station: "Kitchen",
    cost: 14.2,
    price: 95,
    emoji: "🥐",
    sku: "CROISSANT-CHOC",
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

export const INITIAL_SUPPLY_RECORDS: SupplyRecord[] = [
  {
    id: "supply-1",
    number: 1,
    date: "23 November, 7:44 pm",
    supplier: "Supplier",
    storage: "Storage 1",
    account: "",
    comment: "",
    status: "Paid",
    sum: 202.1,
    paymentDue: 0,
    lines: [
      { stockId: "stk-1", title: "Borjomi 0.5l", quantity: 20, unit: "pcs", cost: 4 },
      { stockId: "stk-2", title: "Coffee", quantity: 2, unit: "kg", cost: 30 },
      { stockId: "stk-3", title: "Coffee stirrer", quantity: 100, unit: "pcs", cost: 0.06 },
      { stockId: "stk-4", title: "Cover 250ml", quantity: 50, unit: "pcs", cost: 0.15 },
      { stockId: "stk-5", title: "Dark chocolate", quantity: 1, unit: "kg", cost: 10 },
      { stockId: "stk-6", title: "Egg", quantity: 6, unit: "pcs", cost: 0.1 },
      { stockId: "stk-8", title: "Milk", quantity: 4, unit: "l", cost: 2 },
      { stockId: "stk-9", title: "Oil", quantity: 1, unit: "kg", cost: 8 },
      { stockId: "stk-10", title: "Paper cup 250ml", quantity: 100, unit: "pcs", cost: 0.2 },
      { stockId: "stk-14", title: "Yeast", quantity: 0.2, unit: "kg", cost: 10 },
    ],
  },
  {
    id: "supply-2",
    number: 2,
    date: "23 November, 7:44 pm",
    supplier: "Supplier",
    storage: "Storage 1",
    account: "",
    comment: "",
    status: "Paid",
    sum: 13.1,
    paymentDue: 0,
    lines: [
      { stockId: "stk-7", title: "Flour", quantity: 3, unit: "kg", cost: 1.3 },
      { stockId: "stk-11", title: "Salt", quantity: 1, unit: "kg", cost: 0.2 },
      { stockId: "stk-12", title: "Sugar", quantity: 2, unit: "kg", cost: 2 },
      { stockId: "stk-13", title: "Water", quantity: 10, unit: "l", cost: 0.5 },
    ],
  },
];

const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: "int-1",
    employeeId: "emp-1",
    employeeName: "Philip Venje Beronio",
    application: "Personal integration",
    token: "305637:5434277cbf00c8dfda541b03edda1781",
    masked: false,
    createdAt: "11/23/26, 2:44 PM",
    active: true,
  },
  {
    id: "int-2",
    employeeId: "emp-1",
    employeeName: "Philip Venje Beronio",
    application: "POS Inventory check",
    token: "305637:7c1f9a3e5b2d48f6a0c4e8b1d3f7a9c5",
    masked: true,
    createdAt: "11/23/26, 2:44 PM",
    active: true,
    posFeature: "inventory-check",
  },
  {
    id: "int-3",
    employeeId: "emp-1",
    employeeName: "Philip Venje Beronio",
    application: "Supply at the POS",
    token: "305637:2e8b4d6f1a3c49e7b5d0f2a8c6e4b1d9",
    masked: true,
    createdAt: "11/23/26, 2:44 PM",
    active: true,
    posFeature: "supply",
  },
];

const INITIAL_ORDER_SOURCES: OrderSource[] = [
  { id: "os-dinein", title: "Dine-in", displayOnPos: true, serviceFeePct: 0 },
  { id: "os-takeout", title: "Takeout", displayOnPos: false, serviceFeePct: 0 },
];

const INITIAL_PAYMENT_METHODS: PaymentMethodConfig[] = [
  { id: "pm-cash", title: "Cash", paymentType: "Cash", icon: "cash", serviceFeePct: 0, displayedOnPos: true, systemLocked: true },
  { id: "pm-card", title: "Card", paymentType: "Cashless", icon: "card", serviceFeePct: 0, displayedOnPos: true },
  { id: "pm-gift", title: "Gift card", paymentType: "Other", icon: "gift", serviceFeePct: null, displayedOnPos: true, hasMenu: true },
  { id: "pm-ewallet", title: "e-Wallet", paymentType: "Other", icon: "wallet", serviceFeePct: 0, displayedOnPos: true, canEdit: false, hasMenu: true },
  { id: "pm-ubereats", title: "Uber Eats", paymentType: "Cashless", icon: "muted", serviceFeePct: 0, displayedOnPos: false, muted: true, hasMenu: true },
  { id: "pm-wolt", title: "Wolt", paymentType: "Cashless", icon: "muted", serviceFeePct: 0, displayedOnPos: false, muted: true, hasMenu: true },
  { id: "pm-justeat", title: "Just Eat", paymentType: "Cashless", icon: "muted", serviceFeePct: 0, displayedOnPos: false, muted: true, hasMenu: true },
  { id: "pm-glovo", title: "Glovo", paymentType: "Cashless", icon: "muted", serviceFeePct: 0, displayedOnPos: false, muted: true, hasMenu: true },
];

const INITIAL_ACCOUNTS: FinanceAccount[] = [
  { id: "acc-bank", name: "Bank account", type: "Bank account", balance: 0 },
  { id: "acc-cash", name: "Cash drawer", isCashDrawer: true, type: "Cash", balance: 0 },
  { id: "acc-safe", name: "Safe deposit", type: "Cash", balance: 0 },
];

const INITIAL_LOCATIONS: BusinessLocation[] = [
  {
    id: "loc-1",
    number: 1,
    name: "tanawa",
    address: "",
    login: "tanawa",
    bankAccountId: "acc-bank",
    cashAccountId: "acc-cash",
    safeAccountId: "acc-safe",
    storageLocations: ["Storage 1"],
    workingStart: "10:00",
    workingEnd: "11:00",
    is24_7: false,
  },
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
  { id: "fc-14", name: "Stock deductions", allowed: "Expenses only", displayOnPos: false, includeInPnl: true, hasPosSwitch: false },
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
  syncing: false,
  lastSyncedAt: "",
  syncedMutationIds: [],

  plan: "pro",
  onboardingCompleted: true,
  tenantProfile: null,
  onboarding: { createdItem: false, madeSale: false, viewedReports: false },
  settings: INITIAL_SETTINGS,
  accounts: INITIAL_ACCOUNTS,
  financeCategories: INITIAL_FINANCE_CATEGORIES,
  cashFlowAccountFilter: "All",
  cashFlowExpanded: { begin: false, end: false, net: false },
  pnlConnected: false,
  shiftOpenedAt: "23 Nov, 8:00 pm",
  employees: INITIAL_EMPLOYEES,
  positions: INITIAL_POSITIONS,
  employeeInvitations: [],
  userSessions: [
    {
      id: "session-1",
      employeeId: "emp-1",
      user: "Philip Venje Beronio",
      device: "Windows 10",
      browser: "Chrome 158",
      ip: "138.84.127.164",
      loginTime: "11/23/26, 7:53 PM",
    },
  ],
  accessLocations: ["tanawa"],
  integrations: INITIAL_INTEGRATIONS,
  locations: INITIAL_LOCATIONS,
  registers: INITIAL_REGISTERS,
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
    { id: "mc-2", name: "Pastry", emoji: "🥐", sales: 0 },
    { id: "mc-3", name: "Cold drinks", emoji: "🍶", sales: 0 },
  ],
  ingredientCategories: [],
  stations: [
    { id: "st-bar", title: "Bar", printTickets: true },
    { id: "st-kitchen", title: "Kitchen", printTickets: true },
  ],
  stockItems: INITIAL_STOCK_ITEMS,
  stockMovements: [],
  supplies: INITIAL_SUPPLY_RECORDS,
  butcheries: [],
  transfers: [],
  storageLocations: ["Storage 1"],
  storageLocationRecords: [
    { id: "sl-1", title: "Storage 1", address: "", comment: "" },
  ],
  orderingUnits: [],
  stockDeductions: [],
  wasteReasons: [
    { id: "wr-1", name: "Spoilage / Expired" },
    { id: "wr-2", name: "Damaged / Spilled" },
    { id: "wr-3", name: "Staff meal" },
    { id: "wr-4", name: "Quality check" },
  ],
  inventoryChecks: [],
  suppliers: [
    { id: "sup-1", name: "Supplier", vatNumber: "", phone: "", address: "", comment: "" },
  ],
  customers: [],
  customerGroups: [
    { id: "cgrp-1", title: "New customers", loyaltyProgram: "Discount system", rate: 0 },
  ],
  loyaltySettings: {
    maximumPct: 50,
    registrationBonus: 0,
    cashBackTransition: "yes",
    cashBackConditions: [{ id: "loyalty-cb-initial", threshold: 0, groupId: "" }],
    discountTransition: "no",
    discountConditions: [{ id: "loyalty-discount-initial", threshold: 0, groupId: "" }],
  },
  excludedCategoryIds: [],
  excludedProductIds: [],
  promotions: [],
  transactions: [],
  receipts: [],
  feedbackList: [],
  nextReceiptNum: 2,
  posOrders: [
    {
      id: "ord-1",
      receiptNum: 1,
      tableId: "T1",
      source: "Dine-in",
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
  activePosOrderId: "ord-1",
  kdsTickets: [],
  posPayMethod: "Cash",
  subscriptionStatus: "Trial",
  pendingInvoice: {
    id: "inv-305637",
    number: "305637",
    item: "Poster Pro per month",
    qty: 1,
    amount: 3795,
    payBy: "December 7, 2026",
    created: "23 November, 2026",
  },
  paidInvoices: [],
  billingDetails: {
    taxId: "",
    companyName: "tanawa",
    registeredAddress: "",
    postalCode: "",
    phone: "00639758868962",
    email: "2201107938@student.buksu.edu.ph",
  },
  attachedCard: null,
  orderSources: INITIAL_ORDER_SOURCES,
  paymentMethods: INITIAL_PAYMENT_METHODS,
  deliverySettings: {
    enabled: true,
    orderStatuses: { ready: false, delivered: false },
    fiscalReceipt: "During payment",
    areas: [{ id: "da-1", name: "Main area", cost: 0, serviceTimeMin: 60 }],
  },
  securitySettings: {
    adminPassword: "1234",
    blockPrintBeforeClose: false,
    printTwoReceipts: false,
    magneticCardCustomer: false,
    autoKitchenTickets: "Never",
    kitchenTicketsAnyRegister: "Never",
    adminRules: {
      deleteItem: "In cases...",
      deleteItemCases: { afterCheckPrinted: true, afterTicketPrinted: false },
      addDiscount: "After a check is printed",
      cancelPromotion: "Never",
      runReport: "Never",
      splitOrder: "Never",
      closeReceipt: "Never",
      addCustomer: "Never",
      viewOrdersHistory: "Never",
      addSupplyTablet: "Never",
      viewDevices: "Never",
    },
  },
  receiptSettings: {
    autoPrint: false,
    printReceiptNumber: true,
    printComments: false,
    printCustomerContact: false,
    printPredictions: true,
    predictions: [
      "Reach for joy and all else will follow",
      "An exciting opportunity lies ahead of you",
      "Love is something that finds you",
      "Move in the direction of your dreams",
      "Go take a rest, you deserve it",
      "A pleasant surprise is waiting for you",
    ],
    printWifi: false,
    wifiName: "",
    wifiPassword: "",
    printAddress: false,
    receiptLanguage: "Account language",
    printOnReceipt: "Company name",
  },
};

/** Total inventory valuation across all stock on hand (₱215.20 for the seed). */
export const INVENTORY_VALUE = INITIAL_STOCK_ITEMS.reduce(
  (total, item) => total + item.stock * item.cost,
  0,
);
