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
  type ConsoleModal,
  type ConsoleState,
  type Customer,
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
  type Receipt,
  type StockMovement,
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
  phone?: string;
  group?: string;
  discountPct?: number;
};

type NewEmployee = {
  name: string;
  phone?: string;
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

type Actions = {
  toggleTheme: () => void;
  toggleSidebar: () => void;
  toggleAccordion: (sectionId: string) => void;
  setActiveEmployee: (id: string) => void;
  lockPosTerminal: () => void;
  unlockPosWithPin: (pin: string) => boolean;
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
  setOrderDiscount: (tabId: string, pct: number) => void;
  addItemToOrder: (menuItemId: string) => void;
  updateOrderItemQty: (lineUid: string, delta: number) => void;
  sendOrderToKitchen: (tabId: string) => void;
  bumpKdsTicket: (ticketId: string) => void;
  setPosPayMethod: (method: PaymentMethod) => void;
  completePosSale: (tabId: string, method: PaymentMethod, amountTendered: number) => Receipt | null;

  createMenuItem: (input: NewMenuItem) => void;
  deleteMenuItem: (id: string) => void;
  createSupply: (stockId: string, qty: number, unitCost: number) => void;
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
  createCustomer: (input: NewCustomer) => void;
  createEmployee: (input: NewEmployee) => void;
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
        const merged: ConsoleState = {
          ...structuredClone(INITIAL_CONSOLE_STATE),
          ...parsed,
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

    /** Deduct a recipe line, expanding nested preparations. */
    const deductRecipe = (
      draft: ConsoleState,
      recipe: MenuItem["recipe"],
      qty: number,
      reason: string,
      time: string,
    ) => {
      recipe.forEach((line) => {
        if (line.prepId) {
          const prep = draft.preparations.find((entry) => entry.id === line.prepId);
          if (prep) deductRecipe(draft, prep.recipe, line.qty * qty, reason, time);
          return;
        }
        if (!line.stockId) return;
        const stock = draft.stockItems.find((item) => item.id === line.stockId);
        if (!stock) return;
        const used = line.qty * qty;
        stock.stock = Math.max(0, stock.stock - used);
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
          if (customer) order.discountPct = customer.discountPct;
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

      completePosSale: (tabId, method, amountTendered) => {
        const snapshot = stateRef.current;
        const order = snapshot.posOrders.find((entry) => entry.id === tabId);
        if (!order || order.items.length === 0) return null;

        const totals = calcOrderTotals(order, snapshot.menuItems, snapshot.settings.vatRate);
        const employee = snapshot.employees.find((entry) => entry.id === snapshot.currentStaffId) ?? snapshot.employees[0];
        const tableName = floorTableName(order.tableId);
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
          items: order.items.map((line) => ({
            menuId: line.menuId,
            name: line.name,
            qty: line.qty,
            unitPrice: line.unitPrice,
          })),
          tendered: amountTendered,
          change: Math.max(0, amountTendered - totals.total),
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
            );
          });

          if (draftOrder.customerId) {
            const customer = draft.customers.find((entry) => entry.id === draftOrder.customerId);
            if (customer) {
              customer.overallSum += totals.total;
              if (method === "Cash") customer.cashSum += totals.total;
              else customer.cardSum += totals.total;
              customer.receiptCount += 1;
            }
          }

          draft.receipts.unshift(receipt);

          const account =
            method === "Cash"
              ? draft.accounts.find((entry) => entry.isCashDrawer)
              : draft.accounts.find((entry) => entry.id === "acc-bank");
          if (account) account.balance += totals.total;

          const transaction: FinanceTransaction = {
            id: uid("tx-sale"),
            date: formatTimestamp(now),
            type: "income",
            category: "POS Sales",
            comment: `Receipt #${draftOrder.receiptNum} (${tableName})`,
            sum: totals.total,
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

      createSupply: (stockId, qty, unitCost) => {
        const stock = stateRef.current.stockItems.find((item) => item.id === stockId);
        if (!stock || qty <= 0) return;
        update((draft) => {
          const draftStock = draft.stockItems.find((item) => item.id === stockId);
          if (!draftStock) return;
          draftStock.stock += qty;
          draftStock.cost = unitCost;
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
        });
        showToast(`Restocked ${stock.title} (+${qty} ${stock.unit})`, "success");
      },

      createStockDeduction: (stockId, qty, reason) => {
        const stock = stateRef.current.stockItems.find((item) => item.id === stockId);
        if (!stock || qty <= 0) return;
        update((draft) => {
          const draftStock = draft.stockItems.find((item) => item.id === stockId);
          if (!draftStock) return;
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

      createCustomer: ({ name, phone = "", group = "Standard", discountPct = 0 }) => {
        update((draft) => {
          const customer: Customer = {
            id: uid("cust"),
            name,
            profileNum: `C-${1000 + draft.customers.length + 1}`,
            phone,
            group,
            discountPct,
            overallSum: 0,
            cashSum: 0,
            cardSum: 0,
            receiptCount: 0,
          };
          draft.customers.push(customer);
        });
        showToast(`Customer "${name}" added!`, "success");
      },

      createEmployee: ({ name, phone = "", position, pin }) => {
        update((draft) => {
          const initials = name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          const employee: Employee = {
            id: uid("emp"),
            name,
            initials,
            phone: phone || "00639000000000",
            login: `${name.toLowerCase().replace(/\s+/g, ".")}@tanawa.ph`,
            pin,
            position,
            dotColor: "bg-[#1A73E8]",
            lastLogin: "Just now",
          };
          draft.employees.push(employee);
        });
        showToast(`Employee "${name}" (PIN ${pin}) added!`, "success");
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
          const coffee = draft.stockItems.find((item) => item.id === "stk-2");
          const milk = draft.stockItems.find((item) => item.id === "stk-8");
          const cups = draft.stockItems.find((item) => item.id === "stk-10");
          if (coffee) coffee.stock += 2;
          if (milk) milk.stock += 6;
          if (cups) cups.stock += 100;
          const bank = draft.accounts[0];
          if (bank) bank.balance -= 92;
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
