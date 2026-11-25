import {
  INITIAL_CONSOLE_STATE,
  type ConsoleState,
  type Customer,
  type MenuItem,
  type PosOrderItem,
  type Receipt,
  type StockItem,
  type StockMovement,
} from "../../lib/console-data";

const STORAGE_KEY = "tanawastore_pos_v1";
const DAY_MS = 24 * 60 * 60 * 1000;

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function clockLabel(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }).toLowerCase();
}

/**
 * Builds a deterministic store with:
 * - 1,000 closed receipts across the last 30 days
 * - 300 menu products
 * - 300 stock items + 500 stock movements
 * - 300 customers
 */
export function buildLargeStoreState(now = new Date()): ConsoleState {
  const state = structuredClone(INITIAL_CONSOLE_STATE);

  const menuItems: MenuItem[] = Array.from({ length: 200 }, (_, index) => ({
    id: `perf-prod-${index}`,
    title: `Perf Product ${index}`,
    type: index % 2 === 0 ? "Product" : "Dish",
    category: index % 2 === 0 ? "Coffee" : "Pastry",
    station: index % 3 === 0 ? "Bar" : "Kitchen",
    emoji: index % 2 === 0 ? "☕" : "🥐",
    sku: `PERF-${index}`,
    cost: 10 + (index % 20),
    price: 50 + (index % 50),
    recipe: [{ stockId: "stk-2", qty: 0.01 }],
  }));

  const stockItems: StockItem[] = [
    ...state.stockItems,
    ...Array.from({ length: 286 }, (_, index) => ({
      id: `perf-stk-${index}`,
      title: `Perf Stock ${index}`,
      type: index % 2 === 0 ? "Ingredient" : "Product",
      category: "Bulk",
      stock: 10 + (index % 90),
      unit: "pcs",
      cost: 1 + (index % 9),
      limit: 0,
    } satisfies StockItem)),
  ];

  const customers: Customer[] = Array.from({ length: 300 }, (_, index) => ({
    id: `perf-cust-${index}`,
    name: `Perf Customer ${index}`,
    profileNum: `PC-${2000 + index}`,
    phone: `0999${String(index).padStart(7, "0")}`,
    group: "New customers",
    discountPct: 0,
    bonusBalance: index % 5 === 0 ? 50 : 0,
    overallSum: 0,
    cashSum: 0,
    cardSum: 0,
    receiptCount: 0,
  }));

  const receipts: Receipt[] = Array.from({ length: 1000 }, (_, index) => {
    const first = menuItems[index % menuItems.length];
    const second = menuItems[(index + 7) % menuItems.length];
    const soldAt = new Date(now.getTime() - (index % 30) * DAY_MS);
    soldAt.setHours(8 + (index % 12), (index * 7) % 60, 0, 0);
    const items = [
      { menuId: first.id, name: first.title, qty: 1, unitPrice: first.price },
      { menuId: second.id, name: second.title, qty: 2, unitPrice: second.price },
    ];
    const subtotal = items.reduce((sum, line) => sum + line.qty * line.unitPrice, 0);
    const cost = first.cost + second.cost * 2;
    const tax = subtotal * 0.12;
    const customer = customers[index % customers.length];
    return {
      receiptNum: index + 1,
      staffId: "emp-1",
      staffName: "Philip Venje Beronio",
      tableName: `Table ${(index % 8) + 1}`,
      openedAt: clockLabel(new Date(soldAt.getTime() - 20 * 60 * 1000)),
      closedAt: clockLabel(soldAt),
      closedDate: isoDate(soldAt),
      paymentMethod: index % 3 === 0 ? "Card" : "Cash",
      subtotal,
      discountAmt: 0,
      tax,
      profit: subtotal - cost,
      total: subtotal + tax,
      customerName: index % 4 === 0 ? customer.name : undefined,
      items,
    } satisfies Receipt;
  });

  const stockMovements: StockMovement[] = Array.from({ length: 500 }, (_, index) => ({
    time: clockLabel(new Date(now.getTime() - index * 60 * 1000)),
    title: index % 2 === 0 ? "Coffee" : `Perf Stock ${index % 286}`,
    reason: index % 2 === 0 ? "Supply delivery" : `Receipt #${(index % 1000) + 1} (Perf Product ${index % 200})`,
    delta: index % 2 === 0 ? 5 : -0.01,
    unit: index % 2 === 0 ? "kg" : "kg",
  }));

  const activeItems: PosOrderItem[] = [menuItems[0], menuItems[1], menuItems[2]].map((item, index) => ({
    uid: `perf-line-${index}`,
    menuId: item.id,
    name: item.title,
    unitPrice: item.price,
    qty: 1,
    sent: false,
  }));

  return {
    ...state,
    menuItems,
    stockItems,
    stockMovements,
    customers,
    receipts,
    nextReceiptNum: 1002,
    posOrders: [
      {
        id: "perf-ord-1001",
        receiptNum: 1001,
        tableId: "T1",
        source: "Dine-in",
        guests: 2,
        staffId: "emp-1",
        customerId: "",
        discountPct: 0,
        note: "",
        openedAt: "10:00 am",
        items: activeItems,
      },
    ],
    activePosOrderId: "perf-ord-1001",
    kdsTickets: [],
    transactions: [],
    customerGroups: state.customerGroups,
    excludedCategoryIds: [],
    excludedProductIds: [],
    promotions: [],
  };
}

/** Script payload consumed by `page.addInitScript` to hydrate localStorage. */
export function largeStoreInitScript(): { key: string; value: string } {
  return { key: STORAGE_KEY, value: JSON.stringify(buildLargeStoreState()) };
}
