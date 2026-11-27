/**
 * Workspace bootstrap payload and client hydration mapper.
 *
 * The server returns raw tenant-scoped rows; this module folds them into the
 * existing `ConsoleState` shape so the console and POS can hydrate without
 * changing their components.
 */
import {
  INITIAL_CONSOLE_STATE,
  type ConsoleState,
  type Customer,
  type Employee,
  type FinanceAccount,
  type FinanceTransaction,
  type KdsTicket,
  type MenuItem,
  type Receipt,
  type Register,
  type StockItem,
  type StockMovement,
} from "./console-data";
import { tenantStorageKeys } from "./tenant-keys";
import { applyReceiptMutation, readQueue } from "./offline-sync";

type Numeric = string | number | null;
type Timestamp = string | Date | null;

export type BootstrapResponse = {
  mode: "local" | "postgres";
  tenantId: string;
  role?: string;
  plan?: ConsoleState["plan"];
  onboardingRequired?: boolean;
  onboardingCompleted?: boolean;
  tenant?: { name?: string; plan?: ConsoleState["plan"]; trialEndsAt?: Timestamp } | null;
  settings?: {
    general?: Record<string, unknown> | null;
    delivery?: Record<string, unknown> | null;
    security?: Record<string, unknown> | null;
    receipt?: Record<string, unknown> | null;
    loyalty?: Record<string, unknown> | null;
  } | null;
  locations?: { id: string; name: string; address: string; registerLogin: string | null }[];
  registers?: { id: string; title: string; locationId: string; login: string; locationName?: string }[];
  positions?: { id: string; title: string; permissions?: Record<string, unknown> }[];
  employees?: { id: string; name: string; pin: string; positionId: string | null; positionTitle?: string | null }[];
  categories?: { id: string; name: string; type: "product" | "ingredient" }[];
  catalogItems?: {
    id: string;
    itemType: "product" | "dish" | "preparation" | "ingredient";
    categoryId: string | null;
    stationId: string | null;
    name: string;
    sku: string | null;
    unit: string;
    price: Numeric;
    cost: Numeric;
    recipe?: Record<string, unknown>[];
    imageUrl?: string | null;
  }[];
  stockBalances?: { id: string; itemId: string; storageId: string; quantity: Numeric; avgCost: Numeric; minLimit: Numeric }[];
  stockMovements?: {
    id: string; itemId: string; movementType: string; quantityDelta: Numeric; createdAt: Timestamp; referenceId?: string | null;
  }[];
  customers?: {
    id: string; name: string; phone: string | null; email: string | null; groupId: string | null;
    bonusBalance: Numeric; totalSpent: Numeric;
  }[];
  customerGroups?: { id: string; name: string; discountPercent: Numeric; cashbackPercent: Numeric }[];
  receipts?: {
    id: string; receiptNumber: number; tableLabel: string | null; employeeId: string | null;
    subtotal: Numeric; discountTotal: Numeric; taxTotal: Numeric; total: Numeric; profit: Numeric;
    paymentMethod: string | null; openedAt: Timestamp; closedAt: Timestamp; status: string;
  }[];
  receiptItems?: { receiptId: string; itemId: string | null; name: string; quantity: Numeric; unitPrice: Numeric }[];
  financeAccounts?: { id: string; name: string; type: "cash" | "bank" | "safe"; balance: Numeric }[];
  financeTransactions?: { id: string; accountId: string; type: "income" | "expense" | "transfer"; category: string; amount: Numeric; description: string | null; createdAt: Timestamp }[];
  kitchenTickets?: KdsTicket[];
};

const num = (value: Numeric): number => (value === null || value === undefined ? 0 : Number(value) || 0);
const iso = (value: Timestamp): string => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};
const clock = (value: Timestamp): string => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

/** Fold a `/api/v1/bootstrap` payload into a hydrated ConsoleState. */
export function applyBootstrap(base: ConsoleState, payload: BootstrapResponse): ConsoleState {
  const state: ConsoleState = structuredClone(base);
  const general = asObject(payload.settings?.general);
  const receipt = asObject(payload.settings?.receipt);
  const delivery = asObject(payload.settings?.delivery);
  const security = asObject(payload.settings?.security);

  if (general.companyName) state.settings.companyName = String(general.companyName);
  if (typeof general.logoUrl === "string") {
    state.settings.logoUrl = general.logoUrl;
    state.settings.logo = general.logoUrl;
  }
  if (typeof general.tin === "string") state.settings.tin = general.tin;
  if (general.currencySymbol) state.settings.currencySymbol = String(general.currencySymbol);
  if (receipt.paperWidth === "58mm" || receipt.paperWidth === "80mm") {
    state.receiptSettings.paperWidth = receipt.paperWidth;
  }
  if (typeof receipt.printReceiptNumber === "boolean") state.receiptSettings.printReceiptNumber = receipt.printReceiptNumber;
  if (typeof receipt.printComments === "boolean") state.receiptSettings.printComments = receipt.printComments;
  if (typeof receipt.autoPrint === "boolean") state.receiptSettings.autoPrint = receipt.autoPrint;
  if (Object.keys(security).length) state.securitySettings = { ...state.securitySettings, ...security };
  if (Object.keys(delivery).length) state.deliverySettings = { ...state.deliverySettings, ...delivery };

  if (payload.plan) state.plan = payload.plan;
  if (payload.tenant?.name) state.settings.companyName = payload.tenant.name;

  const locations = payload.locations ?? [];
  if (locations.length) {
    state.locations = locations.map((location, index) => ({
      id: location.id,
      number: index + 1,
      name: location.name,
      address: location.address,
      login: location.registerLogin ?? location.name.toLowerCase().replace(/[^a-z0-9]+/g, ""),
      bankAccountId: "acc-bank",
      cashAccountId: "acc-cash",
      safeAccountId: "acc-safe",
      storageLocations: state.storageLocations.length ? state.storageLocations : ["Storage 1"],
      workingStart: "10:00",
      workingEnd: "23:00",
      is24_7: false,
    }));
    state.accessLocations = locations.map((location) => location.name);
  }

  const registers = payload.registers ?? [];
  if (registers.length) {
    state.registers = registers.map((register, index): Register => ({
      id: register.id,
      number: index + 1,
      title: register.title,
      type: "Standard",
      location: register.locationName ?? locations.find((location) => location.id === register.locationId)?.name ?? "",
      login: register.login,
      password: "",
    }));
  }

  const categories = payload.categories ?? [];
  const productCategories = categories.filter((category) => category.type === "product");
  const ingredientCategories = categories.filter((category) => category.type === "ingredient");
  const categoryName = new Map(categories.map((category) => [category.id, category.name]));

  if (productCategories.length) {
    state.menuCategories = productCategories.map((category) => ({
      id: category.id,
      name: category.name,
      emoji: "🍽️",
      sales: 0,
    }));
  }
  if (ingredientCategories.length) {
    state.ingredientCategories = ingredientCategories.map((category) => ({ id: category.id, name: category.name }));
  }

  const items = payload.catalogItems ?? [];
  const itemById = new Map(items.map((item) => [item.id, item]));
  if (items.length) {
    state.menuItems = items
      .filter((item) => item.itemType === "product" || item.itemType === "dish")
      .map((item): MenuItem => ({
        id: item.id,
        title: item.name,
        type: item.itemType === "dish" ? "Dish" : "Product",
        category: item.categoryId ? categoryName.get(item.categoryId) ?? "" : "",
        station: state.stations.find((station) => station.id === item.stationId)?.title ?? "Kitchen",
        emoji: "🍽️",
        sku: item.sku ?? undefined,
        cost: num(item.cost),
        price: num(item.price),
        recipe: (item.recipe ?? []) as MenuItem["recipe"],
        imageUrl: item.imageUrl ?? undefined,
      }));
  }

  const balances = payload.stockBalances ?? [];
  if (balances.length) {
    state.stockItems = balances.map((balance): StockItem => {
      const catalog = itemById.get(balance.itemId);
      return {
        id: balance.itemId,
        title: catalog?.name ?? balance.itemId,
        type: catalog?.itemType === "ingredient" ? "Ingredient" : "Product",
        category: catalog?.categoryId ? categoryName.get(catalog.categoryId) ?? "" : "",
        stock: num(balance.quantity),
        unit: catalog?.unit ?? "pcs",
        cost: num(balance.avgCost),
        limit: num(balance.minLimit),
      };
    });
  }

  const movements = payload.stockMovements ?? [];
  if (movements.length) {
    state.stockMovements = movements.map((movement): StockMovement => {
      const item = itemById.get(movement.itemId);
      return {
        time: clock(movement.createdAt),
        title: item?.name ?? movement.itemId,
        reason: movement.movementType.replaceAll("_", " "),
        delta: num(movement.quantityDelta),
        unit: item?.unit ?? "",
      };
    });
  }

  const groups = payload.customerGroups ?? [];
  const groupName = new Map(groups.map((group) => [group.id, group.name]));
  if (groups.length) {
    state.customerGroups = groups.map((group) => ({
      id: group.id,
      title: group.name,
      loyaltyProgram: num(group.cashbackPercent) > 0 ? "Bonus system" : "Discount system",
      rate: num(group.cashbackPercent) > 0 ? num(group.cashbackPercent) : num(group.discountPercent),
    }));
  }

  const customers = payload.customers ?? [];
  if (customers.length) {
    state.customers = customers.map((customer, index): Customer => ({
      id: customer.id,
      name: customer.name,
      profileNum: String(index + 1).padStart(4, "0"),
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      group: customer.groupId ? groupName.get(customer.groupId) ?? "" : "",
      discountPct: 0,
      bonusBalance: num(customer.bonusBalance),
      overallSum: num(customer.totalSpent),
      cashSum: 0,
      cardSum: 0,
      receiptCount: 0,
    }));
  }

  const employees = payload.employees ?? [];
  if (employees.length) {
    state.employees = employees.map((employee): Employee => ({
      id: employee.id,
      name: employee.name,
      initials: employee.name.split(/\s+/).map((part) => part[0] ?? "").join("").slice(0, 2).toUpperCase(),
      phone: "",
      login: employee.name.toLowerCase().replace(/[^a-z0-9]+/g, "."),
      pin: employee.pin,
      position: employee.positionTitle ?? payload.positions?.find((position) => position.id === employee.positionId)?.title ?? "Cashier",
      dotColor: "#1A73E8",
      lastLogin: "",
    }));
    state.currentStaffId = employees[0].id;
  }

  const accounts = payload.financeAccounts ?? [];
  if (accounts.length) {
    state.accounts = accounts.map((account): FinanceAccount => ({
      id: account.id,
      name: account.name,
      type: account.type === "bank" ? "Bank account" : account.type === "safe" ? "Cash" : "Cash",
      balance: num(account.balance),
      isCashDrawer: account.type === "cash" && /cash/i.test(account.name),
    }));
  }

  const transactions = payload.financeTransactions ?? [];
  if (transactions.length) {
    state.transactions = transactions.map((transaction): FinanceTransaction => ({
      id: transaction.id,
      date: transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : "",
      type: transaction.type === "transfer" ? "expense" : transaction.type,
      category: transaction.category,
      comment: transaction.description ?? "",
      sum: num(transaction.amount),
      account: state.accounts.find((account) => account.id === transaction.accountId)?.name ?? "",
    }));
  }

  const receiptRows = payload.receipts ?? [];
  const lineRows = payload.receiptItems ?? [];
  if (receiptRows.length) {
    state.receipts = receiptRows.map((receipt): Receipt => ({
      receiptNum: receipt.receiptNumber,
      staffId: receipt.employeeId ?? "",
      staffName: state.employees.find((employee) => employee.id === receipt.employeeId)?.name ?? "",
      tableName: receipt.tableLabel ?? "Takeaway",
      openedAt: clock(receipt.openedAt),
      closedAt: clock(receipt.closedAt),
      closedDate: receipt.closedAt ? iso(receipt.closedAt).slice(0, 10) : undefined,
      paymentMethod: (receipt.paymentMethod ?? "Cash") as Receipt["paymentMethod"],
      subtotal: num(receipt.subtotal),
      discountAmt: num(receipt.discountTotal),
      tax: num(receipt.taxTotal),
      profit: num(receipt.profit),
      total: num(receipt.total),
      refunded: receipt.status === "refunded",
      items: lineRows
        .filter((line) => line.receiptId === receipt.id)
        .map((line) => ({
          menuId: line.itemId ?? "",
          name: line.name,
          qty: num(line.quantity),
          unitPrice: num(line.unitPrice),
        })),
    }));
    const highest = Math.max(0, ...state.receipts.map((receipt) => receipt.receiptNum));
    state.nextReceiptNum = Math.max(state.nextReceiptNum, highest + 1);
  }

  if (payload.kitchenTickets?.length) state.kdsTickets = payload.kitchenTickets;
  return state;
}

/**
 * Merge the local offline queue on top of server state so un-flushed POS sales
 * are never overwritten by a refresh.
 */
export function mergeOfflineQueue(state: ConsoleState, storage: Storage | null, tenantId: string): ConsoleState {
  if (!storage) return state;
  const queue = readQueue(storage, tenantId).filter((mutation) => mutation.type === "receipt");
  return queue.reduce((current, mutation) => applyReceiptMutation(current, mutation).state, state);
}

/** Fetch + hydrate; returns null when local mode or onboarding is pending. */
export async function fetchBootstrap(
  tenantId: string,
  storage: Storage | null = typeof window !== "undefined" ? window.localStorage : null,
): Promise<ConsoleState | null> {
  if (typeof fetch !== "function") return null;
  const response = await fetch("/api/v1/bootstrap", { headers: { accept: "application/json" } });
  if (!response.ok) return null;
  const payload = (await response.json()) as BootstrapResponse;
  if (payload.mode !== "postgres" || payload.onboardingRequired) return null;

  const local = storage ? readLocalState(storage, tenantId) : null;
  const hydrated = applyBootstrap(INITIAL_CONSOLE_STATE, payload);
  const merged = mergeOfflineQueue(hydrated, storage, tenantId);
  if (local) {
    merged.theme = local.theme;
    merged.sidebarCollapsed = local.sidebarCollapsed;
    merged.posLocked = local.posLocked ?? merged.posLocked;
    const openOrders = (local.posOrders ?? []).filter((order) => order.items.length > 0);
    if (openOrders.length) {
      merged.posOrders = openOrders;
      merged.activePosOrderId = local.activePosOrderId ?? openOrders[0].id;
    }
    merged.receiptSettings = { ...merged.receiptSettings, ...(local.receiptSettings ?? {}) };
  }
  return merged;
}

function readLocalState(storage: Storage, tenantId: string): ConsoleState | null {
  try {
    const raw = storage.getItem(tenantStorageKeys(tenantId).state);
    return raw ? (JSON.parse(raw) as ConsoleState) : null;
  } catch {
    return null;
  }
}
