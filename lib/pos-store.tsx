"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  INITIAL_CONSOLE_STATE,
  accountDisplayName,
  calcOrderTotals,
  floorTableName,
  getActivePromotions,
  getExcludedMenuItemIds,
  type ConsoleModal,
  type ConsoleState,
  type Customer,
  type CustomerGroup,
  type LoyaltySettings,
  type Promotion,
  type Employee,
  type FinanceCategory,
  type FinanceCategoryFlag,
  type FinanceTransaction,
  type GuestFeedback,
  type KdsTicket,
  type LocationSettings,
  type MenuItem,
  type MenuItemType,
  type PaymentMethod,
  type PositionRole,
  type Register,
  type Receipt,
  type StockMovement,
  type SupplyLineItem,
  type ButcheryLineItem,
  type TransferLineItem,
  type StockDeductionLine,
  type InventoryCheckLine,
  type Supplier,
  type StorageLocation,
  type OrderingUnit,
  type BusinessLocation,
  type ToastKind,
} from "./console-data";
import { formatTime, formatTimestamp } from "./format";

const STORAGE_KEY = "tanawastore_pos_v1";
const THEME_KEY = "tanawa-theme";

let uidCounter = 0;
function uid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}-${Date.now()}-${uidCounter}`;
}

function customerDiscountRate(state: ConsoleState, customer: Customer): number {
  const group = state.customerGroups.find((entry) => entry.title === customer.group);
  if (group) {
    return !group.deleted && group.loyaltyProgram === "Discount system" ? group.rate : 0;
  }
  return customer.discountPct;
}

type NewMenuItem = {
  title: string;
  type: MenuItemType;
  category: string;
  station: string;
  cost: number;
  price: number;
  emoji?: string;
  recipe?: { stockId?: string; prepId?: string; qty: number }[];
};

type NewCustomer = {
  name: string;
  profileNum?: string;
  phone?: string;
  email?: string;
  birthday?: string;
  comment?: string;
  group?: string;
  discountPct?: number;
};

type CustomerGroupInput = Omit<CustomerGroup, "id" | "deleted">;
type PromotionInput = Omit<Promotion, "id">;
type PositionInput = Omit<PositionRole, "id" | "systemRole">;
type RegisterInput = Omit<Register, "id" | "number" | "login" | "type">;
type BusinessLocationInput = Omit<BusinessLocation, "id" | "number">;

type NewEmployee = {
  name: string;
  phone?: string;
  login?: string;
  position: string;
  pin: string;
};

type NewFinanceTx = {
  type: "income" | "expense";
  category: string;
  comment: string;
  sum: number;
  accountId: string;
};

type NewSupply = {
  supplier: string;
  storage: string;
  accountId: string;
  comment: string;
  status: "Paid" | "Unpaid";
  lines: SupplyLineItem[];
};

type NewButchery = {
  date: string;
  storage: string;
  comment: string;
  primary: ButcheryLineItem;
  finals: ButcheryLineItem[];
};

type NewTransfer = {
  date: string;
  name: string;
  comment: string;
  employee: string;
  fromStorage: string;
  toStorage: string;
  lines: TransferLineItem[];
};

type NewStockDeduction = {
  date: string;
  storage: string;
  employee: string;
  reason: string;
  lines: StockDeductionLine[];
};

type NewInventoryCheck = {
  storage: string;
  type: "Full" | "Partial";
  startingDate: string;
  completedDate: string;
  lines: InventoryCheckLine[];
};

type SupplierInput = Omit<Supplier, "id">;
type StorageLocationInput = Omit<StorageLocation, "id">;
type OrderingUnitInput = Omit<OrderingUnit, "id">;

type Actions = {
  toggleTheme: () => void;
  toggleSidebar: () => void;
  toggleAccordion: (sectionId: string) => void;
  setActiveEmployee: (id: string) => void;
  lockPosTerminal: () => void;
  unlockPosWithPin: (pin: string) => boolean;
  unlockPosWithRegisterPassword: (password: string) => boolean;
  markReportsViewed: () => void;
  toggleNetworkMode: () => void;

  showToast: (message: string, kind?: ToastKind) => void;
  openModal: (modal: ConsoleModal) => void;
  closeModal: () => void;
  setReceiptPreview: (receipt: Receipt | null) => void;
  resetDemoData: () => void;

  createOrderTab: (tableId?: string) => void;
  selectOrderTab: (tabId: string) => void;
  closeOrderTab: (tabId: string) => void;
  assignTableToOrder: (tabId: string, tableId: string) => void;
  attachCustomerToOrder: (tabId: string, customerId: string) => void;
  setOrderPromotion: (tabId: string, promotionId: string) => void;
  setOrderDiscount: (tabId: string, pct: number) => void;
  addItemToOrder: (menuItemId: string) => void;
  updateOrderItemQty: (lineUid: string, delta: number) => void;
  sendOrderToKitchen: (tabId: string) => void;
  bumpKdsTicket: (ticketId: string) => void;
  setPosPayMethod: (method: PaymentMethod) => void;
  completePosSale: (tabId: string, method: PaymentMethod, amountTendered: number, cashBackRedeemed?: number) => Receipt | null;

  createMenuItem: (input: NewMenuItem) => void;
  deleteMenuItem: (id: string) => void;
  createMenuCategory: (name: string, emoji?: string) => void;
  updateMenuCategory: (id: string, name: string) => void;
  deleteMenuCategory: (id: string) => void;
  createIngredientCategory: (name: string) => void;
  updateIngredientCategory: (id: string, name: string) => void;
  deleteIngredientCategory: (id: string) => void;
  createStation: (title: string, printTickets: boolean) => void;
  updateStation: (id: string, title: string, printTickets: boolean) => void;
  deleteStation: (id: string) => void;
  createSupply: (stockId: string, qty: number, unitCost: number) => void;
  createSupplyDelivery: (input: NewSupply) => void;
  createButchery: (input: NewButchery) => void;
  createTransfer: (input: NewTransfer) => void;
  createStockDeductionRecord: (input: NewStockDeduction) => void;
  createInventoryCheck: (input: NewInventoryCheck) => void;
  saveSupplier: (id: string | null, input: SupplierInput) => string;
  deleteSupplier: (id: string) => void;
  saveStorageLocation: (id: string | null, input: StorageLocationInput) => string;
  deleteStorageLocation: (id: string) => void;
  saveOrderingUnit: (id: string | null, input: OrderingUnitInput) => string;
  deleteOrderingUnit: (id: string) => void;
  addWasteReason: (name: string) => void;
  createStockDeduction: (stockId: string, qty: number, reason: string) => void;
  createFinanceTx: (input: NewFinanceTx) => void;
  createAccount: (name: string, type: "Bank account" | "Cash" | "e-Wallet", balance: number) => void;
  createFinanceCategory: (
    name: string,
    allowed: FinanceCategory["allowed"],
    displayOnPos: boolean,
    includeInPnl: boolean,
  ) => void;
  toggleFinanceCategoryFlag: (id: string, field: FinanceCategoryFlag) => void;
  toggleFinanceCategoryExpand: (id: string) => void;
  deleteFinanceCategory: (id: string) => void;
  setCashFlowAccountFilter: (accountId: string) => void;
  toggleCashFlowRow: (key: "begin" | "end" | "net") => void;
  setPnlConnected: (connected: boolean) => void;
  enablePayrollTracking: () => void;
  createCustomerGroup: (input: CustomerGroupInput) => void;
  updateCustomerGroup: (id: string, input: CustomerGroupInput) => void;
  deleteCustomerGroup: (id: string) => void;
  restoreCustomerGroup: (id: string) => void;
  saveLoyaltySettings: (settings: LoyaltySettings) => void;
  savePromotion: (promotion: PromotionInput, id?: string) => void;
  deletePromotion: (id: string) => void;
  addExcludedCategory: (id: string) => void;
  removeExcludedCategory: (id: string) => void;
  addExcludedProduct: (id: string) => void;
  removeExcludedProduct: (id: string) => void;
  createCustomer: (input: NewCustomer) => void;
  updateCustomer: (id: string, input: NewCustomer) => void;
  createEmployee: (input: NewEmployee) => void;
  updateEmployee: (id: string, input: NewEmployee) => void;
  resendEmployeeInvitation: (id: string) => void;
  revokeEmployeeInvitation: (id: string) => void;
  terminateUserSession: (id: string) => void;
  savePosition: (id: string | null, input: PositionInput) => void;
  duplicatePosition: (id: string) => void;
  deletePosition: (id: string) => void;
  saveRegister: (id: string | null, input: RegisterInput) => void;
  deleteRegister: (id: string) => void;
  saveBusinessLocation: (id: string | null, input: BusinessLocationInput) => string;
  updateSettings: (patch: Partial<LocationSettings>) => void;
  submitGuestFeedback: (stars: number, comment: string) => void;
  runPostieAiImport: () => void;
};

type PosStoreValue = { state: ConsoleState; actions: Actions };

const PosStoreContext = createContext<PosStoreValue | null>(null);

function persistable(state: ConsoleState): ConsoleState {
  return {
    ...state,
    toasts: [],
    activeModal: null,
    receiptPreview: null,
  };
}

export function PosStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConsoleState>(INITIAL_CONSOLE_STATE);
  const stateRef = useRef(state);
  const hydratedRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const update = useCallback((mutate: (draft: ConsoleState) => void) => {
    setState((prev) => {
      const draft = structuredClone(prev);
      mutate(draft);
      stateRef.current = draft;
      return draft;
    });
  }, []);

  // Restore the saved demo state after mount so server HTML stays deterministic.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ConsoleState>;
        const savedPositions = Array.isArray(parsed.positions) && parsed.positions.length > 0 && typeof parsed.positions[0] === "string"
          ? structuredClone(INITIAL_CONSOLE_STATE.positions)
          : parsed.positions;
        const merged: ConsoleState = {
          ...structuredClone(INITIAL_CONSOLE_STATE),
          ...parsed,
          positions: savedPositions ?? structuredClone(INITIAL_CONSOLE_STATE.positions),
          toasts: [],
          activeModal: null,
          receiptPreview: null,
        };
        queueMicrotask(() => {
          setState(merged);
          stateRef.current = merged;
        });
      }
    } catch {
      // Corrupted demo data — fall back to the fresh seed.
    }
    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = state.theme;
    try {
      window.localStorage.setItem(THEME_KEY, state.theme);
    } catch {
      // Storage can be unavailable in private mode.
    }
  }, [state.theme]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable(state)));
    } catch {
      // Ignore quota errors; the UI stays usable in memory.
    }
  }, [state]);

  const toastTimers = useRef<number[]>([]);
  useEffect(() => {
    const timers = toastTimers.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const showToast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setState((prev) => ({ ...prev, toasts: [...prev.toasts, { id, message, kind }] }));
    const timer = window.setTimeout(() => {
      setState((prev) => ({ ...prev, toasts: prev.toasts.filter((toast) => toast.id !== id) }));
    }, 2900);
    toastTimers.current.push(timer);
  }, []);

  const openModal = useCallback((modal: ConsoleModal) => update((draft) => { draft.activeModal = modal; }), [update]);
  const closeModal = useCallback(() => update((draft) => { draft.activeModal = null; }), [update]);
  const setReceiptPreview = useCallback(
    (receipt: Receipt | null) => update((draft) => { draft.receiptPreview = receipt; }),
    [update],
  );

  const actions = useMemo<Actions>(() => {
    const getOrder = (s: ConsoleState, tabId?: string) =>
      s.posOrders.find((order) => order.id === (tabId ?? s.activePosOrderId)) ?? s.posOrders[0];

    const addMovement = (draft: ConsoleState, movement: StockMovement) => {
      draft.stockMovements.unshift(movement);
    };

    const changeStorageQty = (
      draft: ConsoleState,
      itemId: string,
      storage: string,
      delta: number,
      preferredLocations: string[] = [],
    ) => {
      const item = draft.stockItems.find((entry) => entry.id === itemId);
      if (!item) return;
      const defaultStorage = draft.storageLocations[0] ?? "Storage 1";
      if (!item.storageQuantities) item.storageQuantities = { [defaultStorage]: item.stock };
      if (delta >= 0) {
        const quantity = (item.storageQuantities[storage] ?? 0) + delta;
        delete item.storageQuantities[storage];
        item.storageQuantities[storage] = quantity;
        return;
      }
      let remaining = Math.abs(delta);
      const allLocations = Object.keys(item.storageQuantities);
      const selectedLocations = preferredLocations.length ? preferredLocations : [storage, ...allLocations];
      const mostRecentlyChanged = [...allLocations].reverse().filter((location) => selectedLocations.includes(location));
      const orderedLocations = preferredLocations.length
        ? [...new Set([...mostRecentlyChanged, ...selectedLocations.slice().reverse()])]
        : [...new Set([storage, ...allLocations])];
      for (const location of orderedLocations) {
        const available = item.storageQuantities[location] ?? 0;
        const deducted = Math.min(available, remaining);
        item.storageQuantities[location] = available - deducted;
        remaining -= deducted;
        if (remaining <= 0) break;
      }
    };

    /** Deduct a recipe line, expanding nested preparations. */
    const deductRecipe = (
      draft: ConsoleState,
      recipe: MenuItem["recipe"],
      qty: number,
      reason: string,
      time: string,
      preferredLocations: string[],
    ) => {
      recipe.forEach((line) => {
        if (line.prepId) {
          const prep = draft.preparations.find((entry) => entry.id === line.prepId);
          if (prep) deductRecipe(draft, prep.recipe, line.qty * qty, reason, time, preferredLocations);
          return;
        }
        if (!line.stockId) return;
        const stock = draft.stockItems.find((item) => item.id === line.stockId);
        if (!stock) return;
        const used = line.qty * qty;
        stock.stock = Math.max(0, stock.stock - used);
        const preferredStorage = preferredLocations[0] ?? draft.storageLocations[0] ?? "Storage 1";
        changeStorageQty(draft, stock.id, preferredStorage, -used, preferredLocations);
        addMovement(draft, {
          time,
          title: stock.title,
          reason,
          delta: -used,
          unit: stock.unit,
        });
      });
    };

    const actionsObject: Actions = {
      toggleTheme: () =>
        update((draft) => { draft.theme = draft.theme === "light" ? "dark" : "light"; }),

      toggleSidebar: () => update((draft) => { draft.sidebarCollapsed = !draft.sidebarCollapsed; }),

      toggleAccordion: (sectionId) =>
        update((draft) => {
          draft.expandedAccordions[sectionId] = !draft.expandedAccordions[sectionId];
        }),

      setActiveEmployee: (id) => {
        const employee = stateRef.current.employees.find((entry) => entry.id === id);
        update((draft) => { draft.currentStaffId = id; });
        if (employee) showToast(`Switched active user to ${employee.name}`, "blue");
      },

      lockPosTerminal: () => update((draft) => { draft.posLocked = true; }),

      unlockPosWithPin: (pin) => {
        const employee = stateRef.current.employees.find((entry) => entry.pin === pin);
        if (!employee) return false;
        update((draft) => {
          draft.currentStaffId = employee.id;
          draft.posLocked = false;
        });
        showToast(`Unlocked — welcome, ${employee.name}!`, "success");
        return true;
      },

      unlockPosWithRegisterPassword: (password) => {
        const register = stateRef.current.registers[0];
        if (!register || register.password !== password) return false;
        update((draft) => { draft.posLocked = false; });
        showToast(`Register ${register.login} unlocked.`, "success");
        return true;
      },

      markReportsViewed: () => {
        if (stateRef.current.onboarding.viewedReports) return;
        update((draft) => { draft.onboarding.viewedReports = true; });
      },

      toggleNetworkMode: () => {
        const wasOnline = stateRef.current.isOnline;
        const queued = stateRef.current.offlineQueued;
        if (wasOnline) {
          update((draft) => { draft.isOnline = false; });
          showToast("Offline mode: receipts will queue locally.", "info");
          return;
        }
        update((draft) => {
          draft.isOnline = true;
          draft.offlineQueued = 0;
        });
        if (queued > 0) {
          showToast(`Synced ${queued} offline receipt(s) to Management Console!`, "success");
        }
      },

      showToast,
      openModal,
      closeModal,
      setReceiptPreview,

      resetDemoData: () => {
        const fresh = structuredClone(INITIAL_CONSOLE_STATE);
        setState(fresh);
        stateRef.current = fresh;
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          // Ignore storage failures.
        }
        showToast("Demo data reset to the original tanawa seed.", "success");
      },

      createOrderTab: (tableId = "TAKEAWAY") => {
        update((draft) => {
          const num = draft.nextReceiptNum++;
          const order = {
            id: `ord-${num}`,
            receiptNum: num,
            tableId,
            guests: 1,
            staffId: draft.currentStaffId,
            customerId: "",
            discountPct: 0,
            note: "",
            openedAt: formatTime(),
            items: [],
          };
          draft.posOrders.unshift(order);
          draft.activePosOrderId = order.id;
        });
      },

      selectOrderTab: (tabId) => update((draft) => { draft.activePosOrderId = tabId; }),

      closeOrderTab: (tabId) => {
        update((draft) => {
          draft.posOrders = draft.posOrders.filter((order) => order.id !== tabId);
          if (draft.activePosOrderId === tabId) {
            draft.activePosOrderId = draft.posOrders[0]?.id ?? "";
          }
          if (draft.posOrders.length === 0) {
            const num = draft.nextReceiptNum++;
            const fresh = {
              id: `ord-${num}`,
              receiptNum: num,
              tableId: "TAKEAWAY",
              guests: 1,
              staffId: draft.currentStaffId,
              customerId: "",
              discountPct: 0,
              note: "",
              openedAt: formatTime(),
              items: [],
            };
            draft.posOrders.unshift(fresh);
            draft.activePosOrderId = fresh.id;
          }
        });
        showToast("Check closed.", "info");
      },

      assignTableToOrder: (tabId, tableId) =>
        update((draft) => {
          const order = draft.posOrders.find((entry) => entry.id === tabId);
          if (order) order.tableId = tableId;
        }),

      attachCustomerToOrder: (tabId, customerId) =>
        update((draft) => {
          const order = draft.posOrders.find((entry) => entry.id === tabId);
          if (!order) return;
          const customer = draft.customers.find((entry) => entry.id === customerId);
          order.customerId = customerId;
          if (customer) order.discountPct = customerDiscountRate(draft, customer);
          else order.discountPct = 0;
        }),

      setOrderPromotion: (tabId, promotionId) =>
        update((draft) => {
          const order = draft.posOrders.find((entry) => entry.id === tabId);
          if (!order) return;
          order.promotionId = promotionId;
        }),

      setOrderDiscount: (tabId, pct) =>
        update((draft) => {
          const order = draft.posOrders.find((entry) => entry.id === tabId);
          if (order) order.discountPct = Math.min(100, Math.max(0, pct));
        }),

      addItemToOrder: (menuItemId) =>
        update((draft) => {
          const order = getOrder(draft);
          const menuItem = draft.menuItems.find((entry) => entry.id === menuItemId);
          if (!order || !menuItem) return;
          const existing = order.items.find((line) => line.menuId === menuItemId && !line.sent);
          if (existing) {
            existing.qty += 1;
            return;
          }
          order.items.push({
            uid: uid("li"),
            menuId: menuItem.id,
            name: menuItem.title,
            unitPrice: menuItem.price,
            qty: 1,
            sent: false,
          });
        }),

      updateOrderItemQty: (lineUid, delta) =>
        update((draft) => {
          const order = getOrder(draft);
          if (!order) return;
          const index = order.items.findIndex((line) => line.uid === lineUid);
          if (index === -1) return;
          order.items[index].qty += delta;
          if (order.items[index].qty <= 0) order.items.splice(index, 1);
        }),

      sendOrderToKitchen: (tabId) => {
        const order = getOrder(stateRef.current, tabId);
        if (!order) return;
        const unsent = order.items.filter((line) => !line.sent);
        if (unsent.length === 0) {
          showToast("All items already sent to Kitchen Kit.", "info");
          return;
        }
        const tableName = floorTableName(order.tableId);
        const time = formatTime();
        update((draft) => {
          const draftOrder = draft.posOrders.find((entry) => entry.id === order.id);
          if (!draftOrder) return;
          const itemsByStation = new Map<string, { name: string; qty: number }[]>();
          draftOrder.items
            .filter((line) => !line.sent)
            .forEach((line) => {
              const station = draft.menuItems.find((entry) => entry.id === line.menuId)?.station ?? "Kitchen";
              const bucket = itemsByStation.get(station) ?? [];
              bucket.push({ name: line.name, qty: line.qty });
              itemsByStation.set(station, bucket);
            });
          itemsByStation.forEach((items, station) => {
            const ticket: KdsTicket = {
              id: uid("kds"),
              receiptNum: draftOrder.receiptNum,
              tableName,
              station,
              time,
              items,
            };
            draft.kdsTickets.unshift(ticket);
          });
          draftOrder.items.forEach((line) => { line.sent = true; });
        });
        showToast(`Sent ${unsent.length} item(s) to Kitchen Kit!`, "success");
      },

      bumpKdsTicket: (ticketId) => {
        update((draft) => {
          draft.kdsTickets = draft.kdsTickets.filter((ticket) => ticket.id !== ticketId);
        });
        showToast("Kitchen ticket completed!", "success");
      },

      setPosPayMethod: (method) => update((draft) => { draft.posPayMethod = method; }),

      completePosSale: (tabId, method, amountTendered, requestedCashBack = 0) => {
        const snapshot = stateRef.current;
        const order = snapshot.posOrders.find((entry) => entry.id === tabId);
        if (!order || order.items.length === 0) return null;

        const activePromotions = getActivePromotions(snapshot.promotions);
        const promotion = order.promotionId === undefined
          ? activePromotions[0]
          : activePromotions.find((entry) => entry.id === order.promotionId);
        const totals = calcOrderTotals(
          order,
          snapshot.menuItems,
          snapshot.settings.vatRate,
          getExcludedMenuItemIds(snapshot.menuItems, snapshot.menuCategories, snapshot.excludedCategoryIds, snapshot.excludedProductIds),
          promotion,
          snapshot.menuCategories,
        );
        const saleCustomer = snapshot.customers.find((entry) => entry.id === order.customerId);
        const maxCashBack = saleCustomer
          ? Math.min(
              saleCustomer.bonusBalance ?? 0,
              totals.cashBackEligibleTotal * Math.max(0, Math.min(100, snapshot.loyaltySettings.maximumPct)) / 100,
            )
          : 0;
        const cashBackRedeemed = Math.max(0, Math.min(requestedCashBack, maxCashBack));
        const amountDue = Math.max(0, totals.total - cashBackRedeemed);
        const employee = snapshot.employees.find((entry) => entry.id === snapshot.currentStaffId) ?? snapshot.employees[0];
        const tableName = floorTableName(order.tableId);
        const registerLocation = snapshot.registers[0]?.location;
        const saleLocation = snapshot.locations.find((entry) =>
          entry.id === registerLocation || entry.name === registerLocation,
        ) ?? snapshot.locations[0];
        const deductionStorages = saleLocation?.storageLocations ?? [];
        const now = new Date();
        const time = formatTime(now);
        const profit = Math.max(0, totals.subtotal - totals.discountAmt - totals.costTotal);

        const receipt: Receipt = {
          receiptNum: order.receiptNum,
          staffId: employee.id,
          staffName: employee.name,
          tableName,
          openedAt: order.openedAt || time,
          closedAt: time,
          paymentMethod: method,
          subtotal: totals.subtotal,
          discountAmt: totals.discountAmt,
          tax: totals.tax,
          profit,
          total: totals.total,
          cashBackRedeemed,
          promotionTitle: promotion?.title,
          promotionDiscountAmt: totals.promotionDiscountAmt,
          promotionBonus: totals.promotionBonus,
          items: order.items.map((line) => ({
            menuId: line.menuId,
            name: line.name,
            qty: line.qty,
            unitPrice: line.unitPrice,
          })),
          tendered: amountTendered,
          change: Math.max(0, amountTendered - amountDue),
        };

        update((draft) => {
          const draftOrder = draft.posOrders.find((entry) => entry.id === order.id);
          if (!draftOrder) return;

          draftOrder.items.forEach((line) => {
            const menuItem = draft.menuItems.find((entry) => entry.id === line.menuId);
            if (!menuItem) return;
            deductRecipe(
              draft,
              menuItem.recipe,
              line.qty,
              `Receipt #${draftOrder.receiptNum} (${menuItem.title})`,
              time,
              deductionStorages,
            );
          });

          if (draftOrder.customerId) {
            const customer = draft.customers.find((entry) => entry.id === draftOrder.customerId);
            if (customer) {
              customer.overallSum += totals.total;
              if (method === "Cash") customer.cashSum += amountDue;
              else customer.cardSum += amountDue;
              customer.receiptCount += 1;
              customer.bonusBalance = Math.max(0, (customer.bonusBalance ?? 0) - cashBackRedeemed);
              const group = draft.customerGroups.find((entry) => !entry.deleted && entry.title === customer.group);
              if (group?.loyaltyProgram === "Bonus system") {
                customer.bonusBalance = (customer.bonusBalance ?? 0) +
                  Math.max(0, totals.subtotal - totals.discountAmt) * group.rate / 100;
              }
              customer.bonusBalance = (customer.bonusBalance ?? 0) + totals.promotionBonus;

              const eligibleConditions = [
                ...(draft.loyaltySettings.cashBackTransition === "yes" ? draft.loyaltySettings.cashBackConditions : []),
                ...(draft.loyaltySettings.discountTransition === "yes" ? draft.loyaltySettings.discountConditions : []),
              ]
                .filter((condition) => condition.groupId && condition.threshold > 0 && condition.threshold <= customer.overallSum)
                .sort((left, right) => right.threshold - left.threshold);
              const transition = eligibleConditions
                .map((condition) => ({
                  condition,
                  group: draft.customerGroups.find((entry) => !entry.deleted && entry.id === condition.groupId),
                }))
                .find((entry) => entry.group);
              if (transition?.group) {
                customer.group = transition.group.title;
                draft.posOrders.forEach((activeOrder) => {
                  if (activeOrder.customerId === customer.id) {
                    activeOrder.discountPct = customerDiscountRate(draft, customer);
                  }
                });
              }
            }
          }

          draft.receipts.unshift(receipt);

          const accountId = method === "Cash" ? saleLocation?.cashAccountId : saleLocation?.bankAccountId;
          const account = draft.accounts.find((entry) => entry.id === accountId) ??
            (method === "Cash"
              ? draft.accounts.find((entry) => entry.isCashDrawer)
              : draft.accounts.find((entry) => entry.id === "acc-bank"));
          if (account) account.balance += amountDue;

          const transaction: FinanceTransaction = {
            id: uid("tx-sale"),
            date: formatTimestamp(now),
            type: "income",
            category: "POS Sales",
            comment: `Receipt #${draftOrder.receiptNum} (${tableName})`,
            sum: amountDue,
            account: accountDisplayName(account, draft.settings.companyName),
          };
          draft.transactions.unshift(transaction);

          if (!draft.isOnline) draft.offlineQueued += 1;
          draft.onboarding.madeSale = true;
          draft.receiptPreview = receipt;

          draft.posOrders = draft.posOrders.filter((entry) => entry.id !== draftOrder.id);
          if (draft.posOrders.length === 0) {
            const num = draft.nextReceiptNum++;
            const fresh = {
              id: `ord-${num}`,
              receiptNum: num,
              tableId: "TAKEAWAY",
              guests: 1,
              staffId: draft.currentStaffId,
              customerId: "",
              discountPct: 0,
              note: "",
              openedAt: time,
              items: [],
            };
            draft.posOrders.unshift(fresh);
            draft.activePosOrderId = fresh.id;
          } else {
            draft.activePosOrderId = draft.posOrders[0].id;
          }
        });

        showToast(`Check #${receipt.receiptNum} synced to Reports, Stock & Finances!`, "success");
        return receipt;
      },

      createMenuItem: (input) => {
        update((draft) => {
          const menuItem: MenuItem = {
            id: uid("prod"),
            title: input.title,
            type: input.type,
            category: input.category,
            station: input.station,
            cost: input.cost,
            price: input.price,
            emoji: input.emoji ?? "🍽️",
            recipe: input.recipe ?? [],
          };
          draft.menuItems.push(menuItem);
          draft.onboarding.createdItem = true;
          if (!draft.menuCategories.some((category) => category.name === input.category)) {
            draft.menuCategories.push({
              id: uid("mc"),
              name: input.category,
              emoji: "🍽️",
              sales: 0,
            });
          }
        });
        showToast(`Added "${input.title}" to Menu & POS Register!`, "success");
      },

      deleteMenuItem: (id) => {
        update((draft) => { draft.menuItems = draft.menuItems.filter((item) => item.id !== id); });
        showToast("Item removed from menu.", "info");
      },

      createMenuCategory: (name, emoji = "🍽️") => {
        const cleanName = name.trim();
        if (!cleanName) return;
        if (stateRef.current.menuCategories.some((category) => category.name.toLowerCase() === cleanName.toLowerCase())) {
          showToast(`Category "${cleanName}" already exists.`, "info");
          return;
        }
        update((draft) => {
          draft.menuCategories.push({ id: uid("mc"), name: cleanName, emoji, sales: 0 });
        });
        showToast(`Added "${cleanName}" to Menu & POS Register!`, "success");
      },

      updateMenuCategory: (id, name) => {
        const cleanName = name.trim();
        if (!cleanName) return;
        const existing = stateRef.current.menuCategories.find((category) => category.id === id);
        if (!existing) return;
        if (stateRef.current.menuCategories.some((category) => category.id !== id && category.name.toLowerCase() === cleanName.toLowerCase())) {
          showToast(`Category "${cleanName}" already exists.`, "info");
          return;
        }
        update((draft) => {
          const category = draft.menuCategories.find((entry) => entry.id === id);
          if (!category) return;
          const previousName = category.name;
          category.name = cleanName;
          draft.menuItems.forEach((item) => {
            if (item.category === previousName) item.category = cleanName;
          });
        });
        showToast(`Renamed "${existing.name}" to "${cleanName}".`, "success");
      },

      deleteMenuCategory: (id) => {
        const existing = stateRef.current.menuCategories.find((category) => category.id === id);
        if (!existing) return;
        update((draft) => {
          draft.menuCategories = draft.menuCategories.filter((category) => category.id !== id);
          draft.menuItems.forEach((item) => {
            if (item.category === existing.name) item.category = "";
          });
        });
        showToast(`Deleted "${existing.name}" from Menu & POS Register.`, "info");
      },

      createIngredientCategory: (name) => {
        const cleanName = name.trim();
        if (!cleanName) return;
        if (stateRef.current.ingredientCategories.some((category) => category.name.toLowerCase() === cleanName.toLowerCase())) {
          showToast(`Ingredient category "${cleanName}" already exists.`, "info");
          return;
        }
        update((draft) => {
          draft.ingredientCategories.push({ id: uid("ic"), name: cleanName });
        });
        showToast(`Added ingredient category "${cleanName}".`, "success");
      },

      updateIngredientCategory: (id, name) => {
        const cleanName = name.trim();
        const existing = stateRef.current.ingredientCategories.find((category) => category.id === id);
        if (!cleanName || !existing) return;
        if (stateRef.current.ingredientCategories.some((category) => category.id !== id && category.name.toLowerCase() === cleanName.toLowerCase())) {
          showToast(`Ingredient category "${cleanName}" already exists.`, "info");
          return;
        }
        update((draft) => {
          const category = draft.ingredientCategories.find((entry) => entry.id === id);
          if (!category) return;
          const previousName = category.name;
          category.name = cleanName;
          draft.stockItems.forEach((item) => {
            if (item.category === previousName) item.category = cleanName;
          });
        });
        showToast(`Renamed "${existing.name}" to "${cleanName}".`, "success");
      },

      deleteIngredientCategory: (id) => {
        const existing = stateRef.current.ingredientCategories.find((category) => category.id === id);
        if (!existing) return;
        update((draft) => {
          draft.ingredientCategories = draft.ingredientCategories.filter((category) => category.id !== id);
          draft.stockItems.forEach((item) => {
            if (item.category === existing.name) item.category = "";
          });
        });
        showToast(`Deleted ingredient category "${existing.name}".`, "info");
      },

      createStation: (title, printTickets) => {
        const cleanTitle = title.trim();
        if (!cleanTitle) return;
        if (stateRef.current.stations.some((station) => station.title.toLowerCase() === cleanTitle.toLowerCase())) {
          showToast(`Station "${cleanTitle}" already exists.`, "info");
          return;
        }
        update((draft) => {
          draft.stations.push({ id: uid("station"), title: cleanTitle, printTickets });
        });
        showToast(`Added station "${cleanTitle}".`, "success");
      },

      updateStation: (id, title, printTickets) => {
        const cleanTitle = title.trim();
        const existing = stateRef.current.stations.find((station) => station.id === id);
        if (!cleanTitle || !existing) return;
        if (stateRef.current.stations.some((station) => station.id !== id && station.title.toLowerCase() === cleanTitle.toLowerCase())) {
          showToast(`Station "${cleanTitle}" already exists.`, "info");
          return;
        }
        update((draft) => {
          const station = draft.stations.find((entry) => entry.id === id);
          if (!station) return;
          const previousTitle = station.title;
          station.title = cleanTitle;
          station.printTickets = printTickets;
          draft.menuItems.forEach((item) => {
            if (item.station === previousTitle) item.station = cleanTitle;
          });
          draft.kdsTickets.forEach((ticket) => {
            if (ticket.station === previousTitle) ticket.station = cleanTitle;
          });
        });
        showToast(`Renamed "${existing.title}" to "${cleanTitle}".`, "success");
      },

      deleteStation: (id) => {
        const existing = stateRef.current.stations.find((station) => station.id === id);
        if (!existing) return;
        update((draft) => {
          draft.stations = draft.stations.filter((station) => station.id !== id);
          draft.menuItems.forEach((item) => {
            if (item.station === existing.title) item.station = "";
          });
          draft.kdsTickets = draft.kdsTickets.filter((ticket) => ticket.station !== existing.title);
        });
        showToast(`Deleted station "${existing.title}".`, "info");
      },

      createSupply: (stockId, qty, unitCost) => {
        const stock = stateRef.current.stockItems.find((item) => item.id === stockId);
        if (!stock || qty <= 0) return;
        update((draft) => {
          const draftStock = draft.stockItems.find((item) => item.id === stockId);
          if (!draftStock) return;
          const previousValue = draftStock.stock * draftStock.cost;
          changeStorageQty(draft, draftStock.id, draft.storageLocations[0] ?? "Storage 1", qty);
          draftStock.stock += qty;
          draftStock.cost = draftStock.stock > 0 ? (previousValue + qty * unitCost) / draftStock.stock : unitCost;
          addMovement(draft, {
            time: formatTime(),
            title: draftStock.title,
            reason: "Supply delivery",
            delta: qty,
            unit: draftStock.unit,
          });
          const cashDrawer = draft.accounts.find((entry) => entry.isCashDrawer);
          const sum = qty * unitCost;
          if (cashDrawer) cashDrawer.balance -= sum;
          draft.transactions.unshift({
            id: uid("tx"),
            date: formatTimestamp(),
            type: "expense",
            category: "Supplies",
            comment: `Supply: +${qty} ${draftStock.unit} ${draftStock.title}`,
            sum,
            account: accountDisplayName(cashDrawer, draft.settings.companyName),
          });
          draft.supplies.unshift({
            id: uid("supply"),
            number: draft.supplies.reduce((max, supply) => Math.max(max, supply.number), 0) + 1,
            date: formatTimestamp(),
            supplier: "Supplier",
            storage: "Storage 1",
            account: accountDisplayName(cashDrawer, draft.settings.companyName),
            comment: "",
            status: "Paid",
            sum,
            paymentDue: 0,
            lines: [{ stockId: draftStock.id, title: draftStock.title, quantity: qty, unit: draftStock.unit, cost: unitCost }],
          });
        });
        showToast(`Restocked ${stock.title} (+${qty} ${stock.unit})`, "success");
      },

      createSupplyDelivery: (input) => {
        const lines = input.lines.filter((line) => line.quantity > 0);
        if (!lines.length) return;
        update((draft) => {
          const total = lines.reduce((sum, line) => sum + line.quantity * line.cost, 0);
          const account = draft.accounts.find((entry) => entry.id === input.accountId);
          for (const line of lines) {
            const draftStock = draft.stockItems.find((item) => item.id === line.stockId);
            if (!draftStock) continue;
            const previousValue = draftStock.stock * draftStock.cost;
            changeStorageQty(draft, draftStock.id, input.storage || "Storage 1", line.quantity);
            draftStock.stock += line.quantity;
            draftStock.cost = draftStock.stock > 0
              ? (previousValue + line.quantity * line.cost) / draftStock.stock
              : line.cost;
            addMovement(draft, {
              time: formatTime(),
              title: draftStock.title,
              reason: "Supply delivery",
              delta: line.quantity,
              unit: draftStock.unit,
            });
          }
          if (input.status === "Paid" && account) {
            account.balance -= total;
          }
          draft.supplies.unshift({
            id: uid("supply"),
            number: draft.supplies.reduce((max, supply) => Math.max(max, supply.number), 0) + 1,
            date: formatTimestamp(),
            supplier: input.supplier || "Supplier",
            storage: input.storage || "Storage 1",
            account: input.status === "Paid" ? accountDisplayName(account, draft.settings.companyName) : "",
            comment: input.comment,
            status: input.status,
            sum: total,
            paymentDue: input.status === "Unpaid" ? total : 0,
            lines,
          });
          if (input.status === "Paid") {
            draft.transactions.unshift({
              id: uid("tx"),
              date: formatTimestamp(),
              type: "expense",
              category: "Supplies",
              comment: `Supply #${draft.supplies[0].number}: ${lines.map((line) => line.title).join(", ")}`,
              sum: total,
              account: accountDisplayName(account, draft.settings.companyName),
            });
          }
        });
        showToast("Supply saved and inventory updated", "success");
      },

      createButchery: (input) => {
        const finals = input.finals.filter((line) => line.quantity > 0);
        if (!input.primary || input.primary.quantity <= 0 || !finals.length) return;
        update((draft) => {
          const primary = draft.stockItems.find((item) => item.id === input.primary.stockId);
          if (!primary || primary.stock < input.primary.quantity) {
            showToast("Not enough primary stock for this butchery", "info");
            return;
          }

          const primaryValue = input.primary.quantity * primary.cost;
          const finalTotalQty = finals.reduce((sum, line) => sum + line.quantity, 0);
          const allocatedUnitCost = finalTotalQty > 0 ? primaryValue / finalTotalQty : primary.cost;

          changeStorageQty(draft, primary.id, input.storage || "Storage 1", -input.primary.quantity);
          primary.stock = Math.max(0, primary.stock - input.primary.quantity);
          addMovement(draft, {
            time: formatTime(),
            title: primary.title,
            reason: "Butchery conversion",
            delta: -input.primary.quantity,
            unit: primary.unit,
          });

          for (const line of finals) {
            const target = draft.stockItems.find((item) => item.id === line.stockId);
            if (!target) continue;
            const previousValue = target.stock * target.cost;
            changeStorageQty(draft, target.id, input.storage || "Storage 1", line.quantity);
            target.stock += line.quantity;
            target.cost = target.stock > 0
              ? (previousValue + line.quantity * allocatedUnitCost) / target.stock
              : allocatedUnitCost;
            addMovement(draft, {
              time: formatTime(),
              title: target.title,
              reason: "Butchery conversion",
              delta: line.quantity,
              unit: target.unit,
            });
          }

          draft.butcheries.unshift({
            id: uid("butchery"),
            date: input.date || formatTimestamp(),
            storage: input.storage || "Storage 1",
            comment: input.comment,
            primary: input.primary,
            finals,
            sum: primaryValue,
          });
        });
        showToast("Butchery saved and stock converted", "success");
      },

      createTransfer: (input) => {
        const lines = input.lines.filter((line) => line.quantity > 0);
        if (!lines.length || input.fromStorage === input.toStorage) return;
        update((draft) => {
          const validLines: TransferLineItem[] = [];
          for (const line of lines) {
            const item = draft.stockItems.find((entry) => entry.id === line.stockId);
            if (!item) continue;
            item.storageQuantities = item.storageQuantities ?? {};
            if (!draft.storageLocations?.includes(input.fromStorage)) draft.storageLocations = [...(draft.storageLocations ?? []), input.fromStorage];
            if (!draft.storageLocations?.includes(input.toStorage)) draft.storageLocations = [...draft.storageLocations, input.toStorage];
            const sourceQty = item.storageQuantities[input.fromStorage] ?? (input.fromStorage === "Storage 1" ? item.stock : 0);
            if (sourceQty < line.quantity) continue;
            item.storageQuantities[input.fromStorage] = sourceQty - line.quantity;
            item.storageQuantities[input.toStorage] = (item.storageQuantities[input.toStorage] ?? 0) + line.quantity;
            validLines.push({ ...line, title: item.title, unit: item.unit, cost: item.cost });
            addMovement(draft, {
              time: formatTime(),
              title: item.title,
              reason: `Transfer: ${input.fromStorage} → ${input.toStorage}`,
              delta: line.quantity,
              unit: item.unit,
            });
          }
          if (!validLines.length) return;
          draft.transfers.unshift({
            id: uid("transfer"),
            date: input.date || formatTimestamp(),
            name: input.name || input.comment || "Transfer",
            sum: validLines.reduce((sum, line) => {
              const item = draft.stockItems.find((entry) => entry.id === line.stockId);
              return sum + line.quantity * (item?.cost ?? line.cost);
            }, 0),
            employee: input.employee,
            fromStorage: input.fromStorage,
            toStorage: input.toStorage,
            comment: input.comment,
            lines: validLines,
          });
        });
        showToast("Transfer saved and stock locations updated", "success");
      },

      createStockDeductionRecord: (input) => {
        const lines = input.lines.filter((line) => line.quantity > 0);
        if (!lines.length) return;
        update((draft) => {
          const validLines: StockDeductionLine[] = [];
          for (const line of lines) {
            const item = draft.stockItems.find((entry) => entry.id === line.stockId);
            if (!item || item.stock < line.quantity) continue;
            changeStorageQty(draft, item.id, input.storage || "Storage 1", -line.quantity);
            item.stock = Math.max(0, item.stock - line.quantity);
            const cost = item.cost;
            validLines.push({ ...line, title: item.title, unit: item.unit, cost });
            addMovement(draft, {
              time: formatTime(),
              title: item.title,
              reason: `Stock deduction: ${input.reason}`,
              delta: -line.quantity,
              unit: item.unit,
            });
          }
          if (!validLines.length) return;
          const sum = validLines.reduce((total, line) => total + line.quantity * line.cost, 0);
          draft.stockDeductions.unshift({
            id: uid("deduction"),
            date: input.date || formatTimestamp(),
            storage: input.storage || "Storage 1",
            products: validLines,
            sum,
            employee: input.employee,
            reason: input.reason,
          });
          draft.transactions.unshift({
            id: uid("tx-deduction"),
            date: formatTimestamp(),
            type: "expense",
            category: "Stock deductions",
            comment: `Stock deduction: ${validLines.map((line) => line.title).join(", ")}`,
            sum,
            account: "",
          });
        });
        showToast("Stock deduction saved and P&L updated", "success");
      },

      addWasteReason: (name) => {
        const cleanName = name.trim();
        if (!cleanName) return;
        update((draft) => {
          if (draft.wasteReasons.some((reason) => reason.name.toLowerCase() === cleanName.toLowerCase())) return;
          draft.wasteReasons.push({ id: uid("wr"), name: cleanName });
        });
        showToast(`Waste reason "${cleanName}" added`, "success");
      },

      createInventoryCheck: (input) => {
        update((draft) => {
          let totalValue = 0;
          for (const line of input.lines) {
            const item = draft.stockItems.find((entry) => entry.id === line.stockId);
            if (!item) continue;
            const discrepancyQty = line.actual - line.expected;
            const discrepancyValue = discrepancyQty * item.cost;
            changeStorageQty(draft, item.id, input.storage, discrepancyQty);
            item.stock = Math.max(0, item.stock + discrepancyQty);
            totalValue += discrepancyValue;
            if (discrepancyQty > 0) {
              addMovement(draft, {
                time: formatTime(),
                title: item.title,
                reason: "Inventory check surplus",
                delta: discrepancyQty,
                unit: item.unit,
              });
            } else if (discrepancyQty < 0) {
              addMovement(draft, {
                time: formatTime(),
                title: item.title,
                reason: "Inventory check shortage",
                delta: discrepancyQty,
                unit: item.unit,
              });
            }
            line.actual = Math.max(0, line.actual);
            line.discrepancyQty = discrepancyQty;
            line.discrepancyValue = discrepancyValue;
            line.cost = item.cost;
          }
          draft.inventoryChecks.unshift({
            id: uid("check"),
            storage: input.storage,
            startingDate: input.startingDate,
            completedDate: input.completedDate,
            type: input.type,
            totalValue,
            status: "Completed",
            lines: input.lines,
          });
        });
        showToast("Inventory check completed", "success");
      },

      saveSupplier: (id, input) => {
        const supplierId = id ?? uid("supplier");
        update((draft) => {
          const existing = draft.suppliers.find((supplier) => supplier.id === supplierId);
          if (existing) {
            Object.assign(existing, input);
            const oldName = stateRef.current.suppliers.find((supplier) => supplier.id === supplierId)?.name;
            if (oldName && oldName !== input.name) {
              draft.supplies.forEach((supply) => {
                if (supply.supplier === oldName) supply.supplier = input.name;
              });
            }
          } else {
            draft.suppliers.push({ id: supplierId, ...input });
          }
        });
        showToast(id ? "Supplier updated" : "Supplier created", "success");
        return supplierId;
      },

      deleteSupplier: (id) => {
        update((draft) => {
          draft.suppliers = draft.suppliers.filter((supplier) => supplier.id !== id);
        });
        showToast("Supplier deleted", "success");
      },

      saveStorageLocation: (id, input) => {
        const locationId = id ?? uid("storage");
        update((draft) => {
          const existing = draft.storageLocationRecords.find((location) => location.id === locationId);
          if (existing) {
            const oldTitle = existing.title;
            Object.assign(existing, input);
            if (oldTitle !== input.title) {
              draft.storageLocations = draft.storageLocations.map((title) => title === oldTitle ? input.title : title);
              draft.stockItems.forEach((item) => {
                if (!item.storageQuantities || item.storageQuantities[oldTitle] === undefined) return;
                item.storageQuantities[input.title] = (item.storageQuantities[input.title] ?? 0) + item.storageQuantities[oldTitle];
                delete item.storageQuantities[oldTitle];
              });
              draft.supplies.forEach((supply) => { if (supply.storage === oldTitle) supply.storage = input.title; });
              draft.butcheries.forEach((butchery) => { if (butchery.storage === oldTitle) butchery.storage = input.title; });
              draft.inventoryChecks.forEach((check) => { if (check.storage === oldTitle) check.storage = input.title; });
              draft.stockDeductions.forEach((deduction) => { if (deduction.storage === oldTitle) deduction.storage = input.title; });
              draft.transfers.forEach((transfer) => {
                if (transfer.fromStorage === oldTitle) transfer.fromStorage = input.title;
                if (transfer.toStorage === oldTitle) transfer.toStorage = input.title;
              });
            }
          } else {
            draft.storageLocationRecords.push({ id: locationId, ...input });
            draft.storageLocations.push(input.title);
          }
          draft.storageLocations = [...new Set(draft.storageLocations)];
        });
        showToast(id ? "Storage location updated" : "Storage location created", "success");
        return locationId;
      },

      deleteStorageLocation: (id) => {
        update((draft) => {
          const location = draft.storageLocationRecords.find((entry) => entry.id === id);
          if (!location || draft.storageLocationRecords.length <= 1) return;
          const replacement = draft.storageLocationRecords.find((entry) => entry.id !== id);
          if (!replacement) return;
          draft.storageLocationRecords = draft.storageLocationRecords.filter((entry) => entry.id !== id);
          draft.storageLocations = draft.storageLocations.filter((title) => title !== location.title);
          draft.stockItems.forEach((item) => {
            if (!item.storageQuantities) return;
            const quantity = item.storageQuantities[location.title] ?? 0;
            if (quantity > 0) item.storageQuantities[replacement.title] = (item.storageQuantities[replacement.title] ?? 0) + quantity;
            delete item.storageQuantities[location.title];
          });
          draft.supplies.forEach((supply) => { if (supply.storage === location.title) supply.storage = replacement.title; });
          draft.butcheries.forEach((butchery) => { if (butchery.storage === location.title) butchery.storage = replacement.title; });
          draft.inventoryChecks.forEach((check) => { if (check.storage === location.title) check.storage = replacement.title; });
          draft.stockDeductions.forEach((deduction) => { if (deduction.storage === location.title) deduction.storage = replacement.title; });
          draft.transfers.forEach((transfer) => {
            if (transfer.fromStorage === location.title) transfer.fromStorage = replacement.title;
            if (transfer.toStorage === location.title) transfer.toStorage = replacement.title;
          });
        });
        showToast("Storage location deleted", "success");
      },

      saveOrderingUnit: (id, input) => {
        const unitId = id ?? uid("ordering-unit");
        update((draft) => {
          const existing = draft.orderingUnits.find((unit) => unit.id === unitId);
          if (existing) Object.assign(existing, input);
          else draft.orderingUnits.push({ id: unitId, ...input });
        });
        showToast(id ? "Ordering unit updated" : "Ordering unit created", "success");
        return unitId;
      },

      deleteOrderingUnit: (id) => {
        update((draft) => {
          draft.orderingUnits = draft.orderingUnits.filter((unit) => unit.id !== id);
        });
        showToast("Ordering unit deleted", "success");
      },

      createStockDeduction: (stockId, qty, reason) => {
        const stock = stateRef.current.stockItems.find((item) => item.id === stockId);
        if (!stock || qty <= 0) return;
        update((draft) => {
          const draftStock = draft.stockItems.find((item) => item.id === stockId);
          if (!draftStock) return;
          changeStorageQty(draft, draftStock.id, draft.storageLocations[0] ?? "Storage 1", -qty);
          draftStock.stock = Math.max(0, draftStock.stock - qty);
          addMovement(draft, {
            time: formatTime(),
            title: draftStock.title,
            reason: reason || "Manual deduction",
            delta: -qty,
            unit: draftStock.unit,
          });
        });
        showToast(`Deducted ${qty} ${stock.unit} of ${stock.title}`, "success");
      },

      createFinanceTx: ({ type, category, comment, sum, accountId }) => {
        update((draft) => {
          const account = draft.accounts.find((entry) => entry.id === accountId) ?? draft.accounts[0];
          if (account) account.balance += type === "income" ? sum : -sum;
          draft.transactions.unshift({
            id: uid("tx"),
            date: formatTimestamp(),
            type,
            category,
            comment,
            sum,
            account: accountDisplayName(account, draft.settings.companyName),
          });
        });
        showToast("Transaction saved to Finances & Account balance updated.", "success");
      },

      createAccount: (name, type, balance) => {
        update((draft) => {
          draft.accounts.push({ id: uid("acc"), name, type, balance });
        });
        showToast(`Account "${name}" added!`, "success");
      },

      createFinanceCategory: (name, allowed, displayOnPos, includeInPnl) => {
        update((draft) => {
          draft.financeCategories.push({
            id: uid("fc"),
            name,
            allowed,
            displayOnPos,
            includeInPnl,
            hasPosSwitch: true,
          });
        });
        showToast(`Finance category "${name}" added!`, "success");
      },

      toggleFinanceCategoryFlag: (id, field) =>
        update((draft) => {
          const category = draft.financeCategories.find((entry) => entry.id === id);
          if (category) category[field] = !category[field];
        }),

      toggleFinanceCategoryExpand: (id) =>
        update((draft) => {
          const category = draft.financeCategories.find((entry) => entry.id === id);
          if (category) category.expanded = !category.expanded;
        }),

      deleteFinanceCategory: (id) => {
        update((draft) => {
          draft.financeCategories = draft.financeCategories.filter((entry) => entry.id !== id);
        });
        showToast("Category removed.", "info");
      },

      setCashFlowAccountFilter: (accountId) =>
        update((draft) => { draft.cashFlowAccountFilter = accountId; }),

      toggleCashFlowRow: (key) =>
        update((draft) => { draft.cashFlowExpanded[key] = !draft.cashFlowExpanded[key]; }),

      setPnlConnected: (connected) => {
        update((draft) => { draft.pnlConnected = connected; });
        showToast(
          connected ? `Connected live Profit and Loss report for ${stateRef.current.settings.companyName}!` : "Showing sample P&L preview.",
          connected ? "success" : "info",
        );
      },

      enablePayrollTracking: () => {
        update((draft) => { draft.settings.payrollTracking = true; });
        showToast("Staff time tracking & payroll calculation enabled!", "success");
      },

      saveLoyaltySettings: (settings) => {
        update((draft) => {
          draft.loyaltySettings = {
            ...settings,
            maximumPct: Math.max(0, Math.min(100, settings.maximumPct)),
            registrationBonus: Math.max(0, settings.registrationBonus),
            cashBackConditions: settings.cashBackConditions.map((condition) => ({
              ...condition,
              threshold: Math.max(0, condition.threshold),
            })),
            discountConditions: settings.discountConditions.map((condition) => ({
              ...condition,
              threshold: Math.max(0, condition.threshold),
            })),
          };
        });
        showToast("Loyalty program settings saved.", "success");
      },

      savePromotion: (promotion, id) => {
        const cleanTitle = promotion.title.trim();
        if (!cleanTitle || promotion.expirationDate < promotion.beginningDate) return;
        update((draft) => {
          const existing = id ? draft.promotions.find((entry) => entry.id === id) : undefined;
          if (existing) Object.assign(existing, { ...promotion, title: cleanTitle });
          else draft.promotions.push({ ...promotion, title: cleanTitle, id: uid("promo") });
        });
        showToast(`Promotion "${cleanTitle}" saved.`, "success");
      },

      deletePromotion: (id) => {
        const existing = stateRef.current.promotions.find((entry) => entry.id === id);
        if (!existing) return;
        update((draft) => {
          draft.promotions = draft.promotions.filter((entry) => entry.id !== id);
          draft.posOrders.forEach((order) => {
            if (order.promotionId === id) order.promotionId = "";
          });
        });
        showToast(`Promotion "${existing.title}" deleted.`, "info");
      },

      addExcludedCategory: (id) => {
        if (!stateRef.current.menuCategories.some((category) => category.id === id)) return;
        update((draft) => {
          if (!draft.excludedCategoryIds.includes(id)) draft.excludedCategoryIds.push(id);
        });
      },

      removeExcludedCategory: (id) => update((draft) => {
        draft.excludedCategoryIds = draft.excludedCategoryIds.filter((entry) => entry !== id);
      }),

      addExcludedProduct: (id) => {
        if (!stateRef.current.menuItems.some((item) => item.id === id)) return;
        update((draft) => {
          if (!draft.excludedProductIds.includes(id)) draft.excludedProductIds.push(id);
        });
      },

      removeExcludedProduct: (id) => update((draft) => {
        draft.excludedProductIds = draft.excludedProductIds.filter((entry) => entry !== id);
      }),

      createCustomerGroup: (input) => {
        const title = input.title.trim();
        if (!title) return;
        if (stateRef.current.customerGroups.some((group) => group.title.toLowerCase() === title.toLowerCase())) {
          showToast(`Customer group "${title}" already exists.`, "info");
          return;
        }
        update((draft) => {
          draft.customerGroups.push({ ...input, title, id: uid("cgrp") });
        });
        showToast(`Customer group "${title}" added!`, "success");
      },

      updateCustomerGroup: (id, input) => {
        const title = input.title.trim();
        const existing = stateRef.current.customerGroups.find((group) => group.id === id);
        if (!title || !existing) return;
        if (stateRef.current.customerGroups.some((group) => group.id !== id && group.title.toLowerCase() === title.toLowerCase())) {
          showToast(`Customer group "${title}" already exists.`, "info");
          return;
        }
        update((draft) => {
          const group = draft.customerGroups.find((entry) => entry.id === id);
          if (!group) return;
          const previousTitle = group.title;
          group.title = title;
          group.loyaltyProgram = input.loyaltyProgram;
          group.rate = Math.max(0, Math.min(100, input.rate));
          draft.customers.forEach((customer) => {
            if (customer.group === previousTitle) customer.group = title;
          });
          draft.posOrders.forEach((order) => {
            const customer = draft.customers.find((entry) => entry.id === order.customerId);
            if (customer) order.discountPct = customerDiscountRate(draft, customer);
          });
        });
        showToast(`Customer group "${title}" updated!`, "success");
      },

      deleteCustomerGroup: (id) => {
        const wasDeleted = stateRef.current.customerGroups.find((entry) => entry.id === id)?.deleted ?? false;
        update((draft) => {
          const group = draft.customerGroups.find((entry) => entry.id === id);
          if (!group) return;
          if (group.deleted) {
            draft.customerGroups = draft.customerGroups.filter((entry) => entry.id !== id);
            const fallbackGroup = draft.customerGroups.find((entry) => !entry.deleted);
            draft.customers.forEach((customer) => {
              if (customer.group === group.title) {
                customer.group = fallbackGroup?.title ?? "";
                customer.discountPct = 0;
              }
            });
          } else {
            group.deleted = true;
          }
          draft.posOrders.forEach((order) => {
            const customer = draft.customers.find((entry) => entry.id === order.customerId);
            if (customer) order.discountPct = customerDiscountRate(draft, customer);
          });
        });
        showToast(wasDeleted ? "Customer group deleted permanently." : "Customer group moved to Trash.", "info");
      },

      restoreCustomerGroup: (id) => {
        update((draft) => {
          const group = draft.customerGroups.find((entry) => entry.id === id);
          if (group) group.deleted = false;
          draft.posOrders.forEach((order) => {
            const customer = draft.customers.find((entry) => entry.id === order.customerId);
            if (customer) order.discountPct = customerDiscountRate(draft, customer);
          });
        });
        showToast("Customer group restored.", "success");
      },

      createCustomer: ({
        name,
        profileNum,
        phone = "",
        email = "",
        birthday = "",
        comment = "",
        group = "",
        discountPct = 0,
      }) => {
        update((draft) => {
          const customer: Customer = {
            id: uid("cust"),
            name,
            profileNum: profileNum?.trim() || `C-${1000 + draft.customers.length + 1}`,
            phone,
            email,
            birthday,
            comment,
            group: group || draft.customerGroups.find((entry) => !entry.deleted)?.title || "New customers",
            discountPct,
            bonusBalance: stateRef.current.loyaltySettings.registrationBonus,
            overallSum: 0,
            cashSum: 0,
            cardSum: 0,
            receiptCount: 0,
          };
          draft.customers.push(customer);
        });
        showToast(`Customer "${name}" added!`, "success");
      },

      updateCustomer: (id, input) => {
        const name = input.name.trim();
        if (!name) return;
        update((draft) => {
          const customer = draft.customers.find((entry) => entry.id === id);
          if (!customer) return;
          customer.name = name;
          customer.profileNum = input.profileNum?.trim() || customer.profileNum;
          customer.phone = input.phone?.trim() ?? "";
          customer.email = input.email?.trim() ?? "";
          customer.birthday = input.birthday ?? "";
          customer.comment = input.comment?.trim() ?? "";
          customer.group = input.group ?? "Standard";
          customer.discountPct = input.discountPct ?? 0;
        });
        showToast(`Customer "${name}" updated!`, "success");
      },

      createEmployee: ({ name, phone = "", login, position, pin }) => {
        const cleanName = name.trim();
        if (!cleanName || !/^\d{4}$/.test(pin)) {
          showToast("Enter an employee name and a valid 4-digit PIN.", "info");
          return;
        }
        update((draft) => {
          const initials = cleanName
            .split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          const employee: Employee = {
            id: uid("emp"),
            name: cleanName,
            initials,
            phone,
            login: login?.trim() || `${cleanName.toLowerCase().replace(/\s+/g, ".")}@tanawa.ph`,
            pin,
            position,
            dotColor: position === "Owner" ? "#D946EF" : "#1A73E8",
            lastLogin: "Just now",
            hourlyRate: 120,
          };
          draft.employees.push(employee);
        });
        showToast(`Employee "${cleanName}" added.`, "success");
      },

      updateEmployee: (id, input) => {
        const name = input.name.trim();
        if (!name || !/^\d{4}$/.test(input.pin)) return;
        const existing = stateRef.current.employees.find((employee) => employee.id === id);
        if (!existing) return;
        update((draft) => {
          const employee = draft.employees.find((entry) => entry.id === id);
          if (!employee) return;
          employee.name = name;
          employee.initials = name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
          employee.phone = input.phone?.trim() ?? "";
          employee.login = input.login?.trim() ?? "";
          employee.pin = input.pin;
          employee.position = input.position;
          employee.dotColor = input.position === "Owner" ? "#D946EF" : "#1A73E8";
          draft.userSessions.forEach((session) => {
            if (session.employeeId === id) session.user = name;
          });
        });
        showToast(`Employee "${name}" updated.`, "success");
      },

      resendEmployeeInvitation: (id) => {
        const invitation = stateRef.current.employeeInvitations.find((entry) => entry.id === id);
        if (invitation) showToast(`Invitation resent to ${invitation.email}.`, "success");
      },

      revokeEmployeeInvitation: (id) => {
        update((draft) => {
          draft.employeeInvitations = draft.employeeInvitations.filter((entry) => entry.id !== id);
        });
        showToast("Employee invitation revoked.", "info");
      },

      terminateUserSession: (id) => {
        update((draft) => {
          draft.userSessions = draft.userSessions.filter((session) => session.id !== id);
        });
        showToast("User session terminated.", "info");
      },

      savePosition: (id, input) => {
        const title = input.title.trim();
        const existing = id ? stateRef.current.positions.find((position) => position.id === id) : undefined;
        if (!title) return;
        if (existing?.systemRole) {
          showToast("The Owner system role cannot be edited.", "info");
          return;
        }
        if (stateRef.current.positions.some((position) => position.id !== id && position.title.toLowerCase() === title.toLowerCase())) {
          showToast(`Position "${title}" already exists.`, "info");
          return;
        }
        const cleanInput: PositionInput = {
          ...input,
          title,
          payroll: {
            perHour: Math.max(0, input.payroll.perHour),
            perShift: Math.max(0, input.payroll.perShift),
            perMonth: Math.max(0, input.payroll.perMonth),
            commissionRates: input.payroll.commissionRates.map((rate) => ({
              ...rate,
              percentage: Math.max(0, Math.min(100, rate.percentage)),
            })),
          },
        };
        update((draft) => {
          if (existing && id) {
            const position = draft.positions.find((entry) => entry.id === id);
            if (!position) return;
            const previousTitle = position.title;
            Object.assign(position, cleanInput);
            draft.employees.forEach((employee) => {
              if (employee.position === previousTitle) employee.position = title;
            });
          } else {
            draft.positions.push({ ...cleanInput, id: uid("role"), systemRole: false });
          }
        });
        showToast(`Position "${title}" saved.`, "success");
      },

      duplicatePosition: (id) => {
        const source = stateRef.current.positions.find((position) => position.id === id);
        if (!source || source.systemRole) return;
        const baseTitle = `${source.title} copy`;
        let title = baseTitle;
        let suffix = 2;
        while (stateRef.current.positions.some((position) => position.title.toLowerCase() === title.toLowerCase())) {
          title = `${baseTitle} ${suffix++}`;
        }
        update((draft) => {
          const current = draft.positions.find((position) => position.id === id);
          if (!current) return;
          draft.positions.push({
            ...structuredClone(current),
            id: uid("role"),
            title,
            systemRole: false,
            payroll: {
              ...structuredClone(current.payroll),
              commissionRates: current.payroll.commissionRates.map((rate) => ({ ...rate, id: uid("commission") })),
            },
          });
        });
        showToast(`Created "${title}".`, "success");
      },

      deletePosition: (id) => {
        const position = stateRef.current.positions.find((entry) => entry.id === id);
        if (!position || position.systemRole) return;
        update((draft) => {
          draft.positions = draft.positions.filter((entry) => entry.id !== id);
          const fallback = draft.positions.find((entry) => entry.title === "Manager") ?? draft.positions[0];
          draft.employees.forEach((employee) => {
            if (employee.position === position.title) employee.position = fallback?.title ?? "";
          });
        });
        showToast(`Position "${position.title}" deleted.`, "info");
      },

      saveRegister: (id, input) => {
        const title = input.title.trim();
        const location = input.location.trim();
        const password = input.password.trim();
        if (!title || !location || !password) {
          showToast("Location, password, and register name are required.", "info");
          return;
        }

        const existing = id ? stateRef.current.registers.find((register) => register.id === id) : undefined;
        if (id && !existing) {
          showToast("Register not found. Return to the register list and try again.", "info");
          return;
        }
        const availableLocations = stateRef.current.accessLocations;
        if (!existing && !availableLocations.includes(location)) {
          showToast("Choose a location from Access → Locations.", "info");
          return;
        }

        let login = existing?.login;
        if (!login) {
          const base = location.toLowerCase().replace(/[^a-z0-9]+/g, "") || "register";
          login = base;
          let suffix = 2;
          while (stateRef.current.registers.some((register) => register.login.toLowerCase() === login?.toLowerCase())) {
            login = `${base}${suffix}`;
            suffix += 1;
          }
        }

        update((draft) => {
          const register = id ? draft.registers.find((entry) => entry.id === id) : undefined;
          if (register) {
            register.location = location;
            register.password = password;
            register.title = title;
          } else {
            draft.registers.push({
              id: uid("register"),
              number: Math.max(0, ...draft.registers.map((entry) => entry.number)) + 1,
              title,
              type: "Standard",
              location,
              login: login ?? location,
              password,
            });
          }
        });
        showToast(`Register "${title}" saved.`, "success");
      },

      deleteRegister: (id) => {
        const register = stateRef.current.registers.find((entry) => entry.id === id);
        if (!register) return;
        update((draft) => {
          draft.registers = draft.registers.filter((entry) => entry.id !== id);
        });
        showToast(`Register "${register.title}" deleted.`, "info");
      },

      saveBusinessLocation: (id, input) => {
        const name = input.name.trim();
        const login = input.login.trim();
        if (!name || !login) {
          showToast("Business name and registers login are required.", "info");
          return "";
        }
        const locationId = id ?? uid("location");
        update((draft) => {
          const existing = draft.locations.find((entry) => entry.id === locationId);
          const previousName = existing?.name;
          const cleanInput = {
            ...input,
            name,
            address: input.address.trim(),
            login,
            storageLocations: [...new Set(input.storageLocations)],
          };
          if (existing) {
            Object.assign(existing, cleanInput);
          } else {
            draft.locations.push({
              ...cleanInput,
              id: locationId,
              number: Math.max(0, ...draft.locations.map((entry) => entry.number)) + 1,
            });
          }
          if (previousName && previousName !== name) {
            draft.registers.forEach((register) => {
              if (register.location === previousName) register.location = name;
            });
          }
          draft.accessLocations = [...new Set(draft.locations.map((entry) => entry.name))];
        });
        showToast(`Location "${name}" saved.`, "success");
        return locationId;
      },

      updateSettings: (patch) => {
        update((draft) => {
          draft.settings = { ...draft.settings, ...patch };
          if (patch.companyName) {
            draft.settings.address = `${patch.companyName.toLowerCase().replace(/\s+/g, "")}.joinposter.com`;
            draft.settings.subdomain = draft.settings.address;
          }
        });
        showToast("Company & POS settings saved!", "success");
      },

      submitGuestFeedback: (stars, comment) => {
        const feedback: GuestFeedback = { stars, comment, time: formatTime() };
        update((draft) => {
          draft.feedbackList.unshift(feedback);
          draft.activeModal = null;
        });
        showToast("QR rating posted to Reports -> Feedback!", "success");
      },

      runPostieAiImport: () => {
        update((draft) => {
          const aiLines = [
            { stockId: "stk-2", title: "Coffee", quantity: 2, unit: "kg", cost: 30 },
            { stockId: "stk-8", title: "Milk", quantity: 6, unit: "l", cost: 2 },
            { stockId: "stk-10", title: "Paper cup 250ml", quantity: 100, unit: "pcs", cost: 0.2 },
          ];
          for (const line of aiLines) {
            const item = draft.stockItems.find((entry) => entry.id === line.stockId);
            if (!item) continue;
            const previousValue = item.stock * item.cost;
            changeStorageQty(draft, item.id, draft.storageLocations[0] ?? "Storage 1", line.quantity);
            item.stock += line.quantity;
            item.cost = item.stock > 0 ? (previousValue + line.quantity * line.cost) / item.stock : line.cost;
            addMovement(draft, {
              time: formatTime(),
              title: item.title,
              reason: "Postie AI supply import",
              delta: line.quantity,
              unit: item.unit,
            });
          }
          const bank = draft.accounts[0];
          if (bank) bank.balance -= 92;
          draft.supplies.unshift({
            id: uid("supply-ai"),
            number: draft.supplies.reduce((max, supply) => Math.max(max, supply.number), 0) + 1,
            date: formatTimestamp(),
            supplier: "Supplier",
            storage: "Storage 1",
            account: accountDisplayName(bank, draft.settings.companyName),
            comment: "Imported by Postie AI",
            status: "Paid",
            sum: 92,
            paymentDue: 0,
            lines: aiLines,
          });
          draft.transactions.unshift({
            id: uid("tx-ai"),
            date: formatTimestamp(),
            type: "expense",
            category: "Supplies",
            comment: "Postie AI Import: Invoice #INV-2026-11",
            sum: 92,
            account: accountDisplayName(bank, draft.settings.companyName),
          });
          draft.activeModal = null;
        });
        showToast("Postie AI imported Invoice #INV-2026-11!", "success");
      },
    };

    return actionsObject;
  }, [update, showToast, openModal, closeModal, setReceiptPreview]);

  const value = useMemo<PosStoreValue>(() => ({ state, actions }), [state, actions]);

  return (
    <PosStoreContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col gap-2">
        {state.toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-lg ${
              toast.kind === "success"
                ? "bg-[#1DB954]"
                : toast.kind === "blue"
                  ? "bg-[#1A73E8]"
                  : "bg-slate-900"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </PosStoreContext.Provider>
  );
}

export function usePosStore(): PosStoreValue {
  const context = useContext(PosStoreContext);
  if (!context) {
    throw new Error("usePosStore must be used within <PosStoreProvider>");
  }
  return context;
}
