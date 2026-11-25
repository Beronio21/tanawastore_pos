"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronUp, Columns3, Download, Inbox, MoreVertical, Pencil, Plus, Printer, RefreshCw, Sparkles, Trash2, Upload, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePosStore } from "@/lib/pos-store";
import { formatMoney, formatMoneyPrefix, formatQty } from "@/lib/format";
import { accountDisplayName, type AccessLevel, type ConsoleAccessArea, type Customer, type CustomerGroup, type Employee, type LoyaltySettings, type LoyaltyTransitionCondition, type PositionRole, type Promotion, type PromotionRewardType, type PromotionScope, type Register, type UserSession } from "@/lib/console-data";
import { Card, EmptyState, FilterToolbar, PageHeader, ROW, TD, TH, Toggle } from "../ui";

const TITLES: Record<string, string> = {
  stock: "Stock",
  supplies: "Supplies",
  butcheries: "Butcheries",
  transfers: "Transfers",
  deductions: "Stock deductions",
  movements: "Ingredients movements",
  checks: "Inventory checks",
  suppliers: "Suppliers",
  storages: "Storage locations",
  units: "Ordering units",
  clients: "Customers",
  groups: "Customer groups",
  loyalty: "Loyalty",
  exclusions: "Exclusions",
  promotions: "Promotions",
  employees: "Employees",
  sessions: "User sessions",
  positions: "Positions",
  tablets: "Tablets",
  locations: "Locations",
  integrations: "Integrations",
  general: "General",
  billing: "Billing",
  orders: "Orders",
  delivery: "Delivery",
  security: "Security",
  receipt: "Receipt",
  products: "Products",
  dishes: "Dishes",
  prepack: "Preparations",
  ingredients: "Ingredients",
  foodcost_control: "Foodcost control",
  categories_products: "Categories of products and dishes",
  categories_ingredients: "Categories of ingredients",
  workshops: "Stations",
  stations: "Stations",
};

export function ManagementModuleView({ section, slug, supplierId, storageLocationId, positionId, registerId, registerBasePath }: { section: string; slug: string; supplierId?: string; storageLocationId?: string; positionId?: string; registerId?: string; registerBasePath?: string }) {
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const title = TITLES[slug] ?? slug.replaceAll("_", " ");
  const query = search.trim().toLowerCase();
  const money = (value: number) => formatMoney(value, state.settings.currencySymbol);

  if (section === "menu") {
    if (slug === "workshops" || slug === "stations") {
      return <StationsView />;
    }
    if (slug === "categories_products") {
      return <ProductCategoriesView />;
    }
    if (slug === "categories_ingredients") {
      return <IngredientCategoriesView />;
    }
    const items = state.menuItems.filter((item) => item.title.toLowerCase().includes(query));
    if (slug === "products" || slug === "dishes") {
      const filtered = items.filter((item) => (slug === "products" ? item.type === "Product" : item.type === "Dish"));
      return (
        <div>
          <PageHeader title={slug === "products" ? "Products" : "Dishes"} count={filtered.length} actions={{ addLabel: "Add", addOnClick: () => actions.openModal("add-item") }} />
          <FilterToolbar search={search} onSearchChange={setSearch} pills={[{ label: "Category ▾" }, { label: "Station ▾" }]} />
          <Card className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead><tr><th className={TH}>Name</th><th className={TH}>Category</th><th className={TH}>Station</th><th className={`${TH} text-right`}>Cost</th><th className={`${TH} text-right`}>Price</th><th className={TH}>Actions</th></tr></thead>
              <tbody>{filtered.map((item) => <tr key={item.id} className={ROW}>
                <td className={`${TD} font-semibold`}>{item.emoji} {item.title}</td><td className={TD}>{item.category}</td><td className={TD}>{item.station}</td>
                <td className={`${TD} text-right font-mono`}>{money(item.cost)}</td><td className={`${TD} text-right font-mono font-bold`}>{money(item.price)}</td>
                <td className={TD}><button type="button" className="text-rose-500 hover:underline" onClick={() => actions.deleteMenuItem(item.id)}>Delete</button></td>
              </tr>)}</tbody>
            </table>
          </Card>
        </div>
      );
    }
    if (slug === "prepack") {
      return <SimpleTable title={title} headers={["Preparation", "Weight", "Cost", "Recipe lines"]} rows={state.preparations.map((item) => [item.title, item.totalWeight, money(item.cost), String(item.recipeLines)])} />;
    }
    if (slug === "ingredients") {
      return <IngredientsView />;
    }
    if (slug === "foodcost_control") {
      return <FoodCostControlView />;
    }
  }

  if (section === "calculations" && slug === "stock") {
    return <StockView />;
  }

  if (section === "calculations" && (slug === "supplies" || slug === "supply")) {
    return <SuppliesView />;
  }

  if (section === "calculations" && slug === "butcheries") {
    return <ButcheriesView />;
  }

  if (section === "calculations" && (slug === "transfers" || slug === "moving")) {
    return <TransfersView />;
  }

  if (section === "calculations" && (slug === "deductions" || slug === "waste")) {
    return <StockDeductionsView />;
  }

  if (section === "calculations" && (slug === "movements" || slug === "reports")) {
    return <IngredientsMovementsView />;
  }

  if (section === "calculations" && (slug === "checks" || slug === "inventory")) {
    return <InventoryChecksView />;
  }

  if (section === "calculations" && slug === "suppliers") {
    return supplierId ? <SupplierFormView supplierId={supplierId} /> : <SuppliersView />;
  }

  if (section === "calculations" && (slug === "storages" || slug === "storage-locations")) {
    return storageLocationId ? <StorageLocationFormView storageLocationId={storageLocationId} /> : <StorageLocationsView />;
  }

  if (section === "calculations" && (slug === "units" || slug === "packing" || slug === "ordering-units")) {
    return <OrderingUnitsView />;
  }

  if (section === "calculations" && slug === "movements") {
    return <SimpleTable title={title} headers={["Time", "Item", "Reason", "Change"]} rows={state.stockMovements.map((item) => [item.time, item.title, item.reason, `${item.delta > 0 ? "+" : ""}${formatQty(item.delta, item.unit)}`])} />;
  }

  if (section === "marketing" && slug === "clients") {
    return <CustomersView />;
  }
  if (section === "marketing" && slug === "groups") {
    return <CustomerGroupsView />;
  }
  if (section === "marketing" && slug === "loyalty") {
    return <LoyaltyProgramsView />;
  }
  if (section === "marketing" && (slug === "exclusions" || slug === "nodiscount")) {
    return <ExclusionsView />;
  }
  if (section === "marketing" && slug === "promotions") {
    return <PromotionsView />;
  }

  if (section === "access" && slug === "employees") {
    return <EmployeesView />;
  }
  if (section === "access" && slug === "sessions") {
    return <UserSessionsView />;
  }
  if (section === "access" && (slug === "positions" || slug === "role_listing")) {
    return positionId ? <PositionFormView positionId={positionId} /> : <PositionsView />;
  }
  if (section === "access" && (slug === "tablets" || slug === "pos")) {
    const register = state.registers.find((entry) => entry.id === registerId);
    return registerId
      ? <RegisterFormView key={register ? `${register.id}:${register.title}:${register.location}:${register.password}` : registerId} registerId={registerId} initialRegister={register} basePath={registerBasePath ?? "/manage/access/tablets"} />
      : <RegistersView basePath={registerBasePath ?? "/manage/access/tablets"} />;
  }

  if (section === "finance" && slug === "accounts") {
    return <SimpleTable title={title} headers={["Account", "Type", "Balance"]} rows={state.accounts.map((item) => [item.isCashDrawer ? `Cash drawer for ${state.settings.companyName}` : item.name, item.type, money(item.balance)])} />;
  }

  if (section === "finance" && slug === "categories") {
    return <div><PageHeader title={title} count={state.financeCategories.length} actions={{ addLabel: "Add", addOnClick: () => actions.openModal("add-finance-category") }} /><Card className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr><th className={TH}>Category</th><th className={TH}>Allowed</th><th className={TH}>Display on POS</th><th className={TH}>Include in P&L</th></tr></thead><tbody>{state.financeCategories.map((item) => <tr className={ROW} key={item.id}><td className={`${TD} font-medium`}>{item.name}</td><td className={TD}>{item.allowed}</td><td className={TD}><Toggle checked={item.displayOnPos} label={`Display ${item.name} on POS`} onChange={() => actions.toggleFinanceCategoryFlag(item.id, "displayOnPos")} /></td><td className={TD}><Toggle checked={item.includeInPnl} label={`Include ${item.name} in P&L`} onChange={() => actions.toggleFinanceCategoryFlag(item.id, "includeInPnl")} /></td></tr>)}</tbody></table></Card></div>;
  }

  if (section === "settings") {
    return <SettingsView slug={slug} />;
  }

  const rows = section === "calculations" ? state.stockMovements.map((item) => [item.title, item.reason, formatQty(item.delta, item.unit)]) : [];
  return rows.length ? <SimpleTable title={title} headers={["Item", "Details", "Quantity"]} rows={rows} /> : <EmptyState emoji="🧩" title={`${title} is ready`} description="This Poster workspace is connected to the shared tanawa demo state." />;
}

function CustomersView() {
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [customerForm, setCustomerForm] = useState<Customer | "new" | null>(null);
  const query = search.trim().toLowerCase();
  const customers = state.customers.filter((customer) =>
    (!query || [customer.name, customer.profileNum, customer.phone, customer.group].some((value) => value.toLowerCase().includes(query))) &&
    (!groupFilter || customer.group === groupFilter),
  );
  const money = (value: number) => formatMoney(value, state.settings.currencySymbol);
  const total = customers.reduce((sum, customer) => sum + customer.overallSum, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E8EC] pb-3.5 dark:border-[#33373E]">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-xl font-bold tracking-tight">Customers</h1>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{state.customers.length}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button type="button" className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]" onClick={() => actions.showToast("Trash is empty")}>
            <Trash2 className="h-3.5 w-3.5" /> Trash
          </button>
          <button type="button" className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]" onClick={() => actions.showToast("All table columns displayed")}>
            <Columns3 className="h-3.5 w-3.5" /> Columns ▾
          </button>
          <button type="button" disabled={!state.customers.length} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#1A73E8] enabled:hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-40 dark:text-[#7EB3F5]" onClick={() => actions.showToast(`Exported ${state.customers.length} customers to CSV`, "success")}>
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button type="button" className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]" onClick={() => actions.showToast("Customer import started", "blue")}>
            <Upload className="h-3.5 w-3.5" /> Import
          </button>
          <button type="button" className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button type="button" onClick={() => setCustomerForm("new")} className="ml-1 cursor-pointer rounded-md bg-[#1DB954] px-4 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#18A348]">Add</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 py-3.5 text-xs">
        <div className="relative w-52">
          <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Quick search" className="w-full rounded-md border border-[#D1D5DB] bg-white py-1.5 pl-3 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1A73E8] focus:outline-none dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white dark:placeholder:text-slate-500" />
        </div>
        <select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)} className="cursor-pointer rounded-md border border-[#E5E8EC] bg-white px-2.5 py-1.5 text-xs font-medium text-[#1A73E8] dark:border-[#33373E] dark:bg-[#1D2024] dark:text-[#7EB3F5]">
          <option value="">Group ▾</option>
          {state.customerGroups.filter((group) => !group.deleted).map((group) => <option key={group.id} value={group.title}>{group.title}</option>)}
        </select>
        <button type="button" onClick={() => actions.showToast("Choose a filter to refine customers", "blue")} className="rounded-md px-2.5 py-1.5 font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]">+ Filter</button>
      </div>

      <div className="overflow-x-auto border-t border-[#E5E8EC] dark:border-[#33373E]">
        <table className="w-full border-collapse text-left text-xs">
          <thead><tr>
            <th className={TH}>Full name ▾</th>
            <th className={TH}>Profile number</th>
            <th className={TH}>Phone</th>
            <th className={TH}>Group</th>
            <th className={`${TH} text-right`}>%</th>
            <th className={`${TH} text-right`}>Overall sum</th>
            <th className={`${TH} w-24 text-right`}>Actions</th>
          </tr></thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className={ROW}>
                <td className={`${TD} font-medium`}>{customer.name}</td>
                <td className={`${TD} font-mono text-slate-500 dark:text-slate-400`}>{customer.profileNum}</td>
                <td className={`${TD} text-slate-500 dark:text-slate-400`}>{customer.phone || "—"}</td>
                <td className={TD}>{customer.group || "—"}</td>
                <td className={`${TD} text-right font-mono`}>{state.customerGroups.find((group) => !group.deleted && group.title === customer.group)?.rate ?? customer.discountPct}%</td>
                <td className={`${TD} text-right font-mono`}>{money(customer.overallSum)}</td>
                <td className={`${TD} text-right`}>
                  <button type="button" title={`Edit ${customer.name}`} onClick={() => setCustomerForm(customer)} className="mr-2 inline-flex cursor-pointer items-center text-[#1A73E8] hover:text-[#1557A0] dark:text-[#7EB3F5]"><Pencil className="h-3.5 w-3.5" /><span className="sr-only">Edit</span></button>
                  <button type="button" title={`More actions for ${customer.name}`} onClick={() => actions.showToast(`More actions for ${customer.name}`, "blue")} className="inline-flex cursor-pointer text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"><MoreVertical className="h-4 w-4" /><span className="sr-only">More actions</span></button>
                </td>
              </tr>
            ))}
            {customers.length > 0 && <tr className="border-t border-[#E5E8EC] font-semibold dark:border-[#33373E]"><td className={TD} colSpan={5}>Total</td><td className={`${TD} text-right font-mono`}>{money(total)}</td><td className={TD} /></tr>}
          </tbody>
        </table>
      </div>

      {customers.length === 0 && (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="mb-3 text-3xl" aria-hidden="true">🙋‍♀️　💁‍♂️</div>
          <h2 className="mb-2 text-base font-bold">There are no customers yet</h2>
          <p className="mx-auto max-w-xl text-xs leading-5 text-slate-500 dark:text-slate-400">
            Add customer profiles to your system and reward them with points, discounts, and promotions. You can add them manually by using{" "}
            <button type="button" onClick={() => setCustomerForm("new")} className="cursor-pointer text-[#1A73E8] underline dark:text-[#7EB3F5]">this form</button>, or import them from a CSV, XLS, or XLSX file.
          </p>
        </div>
      )}

      {customerForm !== null && (
        <CustomerFormModal
          customer={customerForm === "new" ? undefined : customerForm}
          groups={state.customerGroups.filter((group) => !group.deleted)}
          onClose={() => setCustomerForm(null)}
          onSave={(input) => {
            if (customerForm === "new") actions.createCustomer(input);
            else actions.updateCustomer(customerForm.id, input);
            setCustomerForm(null);
          }}
        />
      )}
    </div>
  );
}

function CustomerFormModal({
  customer,
  groups,
  onClose,
  onSave,
}: {
  customer?: Customer;
  groups: CustomerGroup[];
  onClose: () => void;
  onSave: (input: { name: string; profileNum: string; phone: string; email: string; group: string; discountPct: number; birthday: string; comment: string }) => void;
}) {
  const [name, setName] = useState(customer?.name ?? "");
  const [profileNum, setProfileNum] = useState(customer?.profileNum ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [group, setGroup] = useState(customer?.group ?? groups[0]?.title ?? "New customers");
  const [discount, setDiscount] = useState(String(customer?.discountPct ?? 0));
  const [birthday, setBirthday] = useState(customer?.birthday ?? "");
  const [comment, setComment] = useState(customer?.comment ?? "");
  const fieldClass = "w-full rounded-md border border-[#3E434C] bg-[#1D2024] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-[#4EA1FF] focus:outline-none";
  const labelClass = "mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="customer-modal-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#33373E] bg-[#24272C] text-[#E6E8EC] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#33373E] px-5 py-4">
          <h2 id="customer-modal-title" className="text-sm font-bold">{customer ? "Edit Customer" : "Add Customer"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer text-lg text-slate-400 hover:text-white">×</button>
        </div>
        <form className="space-y-3.5 p-5 text-xs" onSubmit={(event) => {
          event.preventDefault();
          onSave({ name: name.trim(), profileNum: profileNum.trim(), phone: phone.trim(), email: email.trim(), group, discountPct: Number(discount) || 0, birthday, comment: comment.trim() });
        }}>
          <div><label className={labelClass}>Full name</label><input required value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Profile number</label><input value={profileNum} onChange={(event) => setProfileNum(event.target.value)} placeholder="Auto-generated" className={fieldClass} /></div>
            <div><label className={labelClass}>Phone</label><input value={phone} onChange={(event) => setPhone(event.target.value)} className={fieldClass} /></div>
          </div>
          <div><label className={labelClass}>Email</label><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Group</label><select value={group} onChange={(event) => setGroup(event.target.value)} className={fieldClass}>{groups.map((entry) => <option key={entry.id} value={entry.title}>{entry.title}</option>)}</select></div>
            <div><label className={labelClass}>Discount / Bonus %</label><input type="number" min="0" max="100" value={discount} onChange={(event) => setDiscount(event.target.value)} className={`${fieldClass} font-mono`} /></div>
          </div>
          <div><label className={labelClass}>Birthday</label><input type="date" value={birthday} onChange={(event) => setBirthday(event.target.value)} className={fieldClass} /></div>
          <div><label className={labelClass}>Comment</label><textarea rows={3} value={comment} onChange={(event) => setComment(event.target.value)} className={fieldClass} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="cursor-pointer rounded-md border border-[#3E434C] px-3 py-2 text-xs font-medium text-slate-300 hover:bg-[#33373E]">Cancel</button>
            <button type="submit" className="cursor-pointer rounded-md bg-[#0077FF] px-4 py-2 text-xs font-bold text-white hover:bg-[#0067DF]">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CustomerGroupsView() {
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const [showTrash, setShowTrash] = useState(false);
  const [groupForm, setGroupForm] = useState<CustomerGroup | "new" | null>(null);
  const query = search.trim().toLowerCase();
  const groups = state.customerGroups.filter((group) =>
    Boolean(group.deleted) === showTrash && (!query || group.title.toLowerCase().includes(query) || group.loyaltyProgram.toLowerCase().includes(query)),
  );
  const activeCount = state.customerGroups.filter((group) => !group.deleted).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E8EC] pb-3.5 dark:border-[#33373E]">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-xl font-bold tracking-tight">Customer groups</h1>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{activeCount}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button type="button" onClick={() => setShowTrash((value) => !value)} className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5] ${showTrash ? "bg-[#E8EFF7] dark:bg-[#33373E]" : ""}`}>
            <Trash2 className="h-3.5 w-3.5" /> {showTrash ? "Groups" : "Trash"}
          </button>
          <button type="button" onClick={() => actions.showToast("All table columns displayed")} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]"><Columns3 className="h-3.5 w-3.5" /> Columns ▾</button>
          <button type="button" disabled={!activeCount} onClick={() => actions.showToast(`Exported ${activeCount} customer groups to CSV`, "success")} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#1A73E8] enabled:hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-40 dark:text-[#7EB3F5]"><Download className="h-3.5 w-3.5" /> Export</button>
          <button type="button" onClick={() => window.print()} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]"><Printer className="h-3.5 w-3.5" /> Print</button>
          <button type="button" onClick={() => setGroupForm("new")} className="ml-1 cursor-pointer rounded-md bg-[#1DB954] px-4 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#18A348]">Add</button>
        </div>
      </div>

      <FilterToolbar search={search} onSearchChange={setSearch} placeholder="Quick search" pills={[{ label: "+ Filter" }]} />

      <div className="overflow-x-auto border-t border-[#E5E8EC] dark:border-[#33373E]">
        <table className="w-full border-collapse text-left text-xs">
          <thead><tr>
            <th className={TH}>Title ▲</th>
            <th className={TH}>Loyalty program</th>
            <th className={`${TH} text-right`}>%</th>
            <th className={`${TH} w-36 text-right`}>Actions</th>
          </tr></thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.id} className={ROW}>
                <td className={`${TD} font-medium`}>{group.title}</td>
                <td className={TD}>{group.loyaltyProgram}</td>
                <td className={`${TD} text-right font-mono`}>{group.rate}%</td>
                <td className={`${TD} text-right`}>
                  {showTrash ? (
                    <button type="button" onClick={() => actions.restoreCustomerGroup(group.id)} className="mr-3 cursor-pointer text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">Restore</button>
                  ) : (
                    <button type="button" onClick={() => setGroupForm(group)} className="mr-3 cursor-pointer text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">Edit</button>
                  )}
                  <button type="button" title={showTrash ? `Delete ${group.title} permanently` : `Move ${group.title} to Trash`} onClick={() => actions.deleteCustomerGroup(group.id)} className="inline-flex cursor-pointer text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"><MoreVertical className="h-4 w-4" /><span className="sr-only">More actions</span></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {groups.length === 0 && <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">{showTrash ? "Trash is empty." : "No results found. Try adjusting your search or filters."}</div>}

      {groupForm !== null && (
        <CustomerGroupModal
          group={groupForm === "new" ? undefined : groupForm}
          onClose={() => setGroupForm(null)}
          onSave={(input) => {
            if (groupForm === "new") actions.createCustomerGroup(input);
            else actions.updateCustomerGroup(groupForm.id, input);
            setGroupForm(null);
          }}
        />
      )}
    </div>
  );
}

function CustomerGroupModal({
  group,
  onClose,
  onSave,
}: {
  group?: CustomerGroup;
  onClose: () => void;
  onSave: (input: { title: string; loyaltyProgram: CustomerGroup["loyaltyProgram"]; rate: number }) => void;
}) {
  const [title, setTitle] = useState(group?.title ?? "");
  const [loyaltyProgram, setLoyaltyProgram] = useState<CustomerGroup["loyaltyProgram"]>(group?.loyaltyProgram ?? "Discount system");
  const [rate, setRate] = useState(String(group?.rate ?? 0));
  const fieldClass = "w-full rounded-md border border-[#3E434C] bg-[#1D2024] px-3 py-2 text-xs text-white focus:border-[#4EA1FF] focus:outline-none";
  const labelClass = "mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="customer-group-modal-title" className="w-full max-w-md rounded-xl border border-[#33373E] bg-[#24272C] text-[#E6E8EC] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#33373E] px-5 py-4">
          <h2 id="customer-group-modal-title" className="text-sm font-bold">{group ? "Edit Customer Group" : "Customer Group"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer text-lg text-slate-400 hover:text-white">×</button>
        </div>
        <form className="space-y-4 p-5 text-xs" onSubmit={(event) => {
          event.preventDefault();
          onSave({ title: title.trim(), loyaltyProgram, rate: Math.max(0, Math.min(100, Number(rate) || 0)) });
        }}>
          <div><label className={labelClass}>Group title</label><input required value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} /></div>
          <div><label className={labelClass}>Loyalty program</label><select value={loyaltyProgram} onChange={(event) => setLoyaltyProgram(event.target.value as CustomerGroup["loyaltyProgram"])} className={fieldClass}><option value="Discount system">Discount system</option><option value="Bonus system">Bonus system</option></select></div>
          <div><label className={labelClass}>%</label><input type="number" min="0" max="100" step="0.01" value={rate} onChange={(event) => setRate(event.target.value)} className={`${fieldClass} font-mono`} /></div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="cursor-pointer rounded-md border border-[#3E434C] px-3 py-2 text-xs font-medium text-slate-300 hover:bg-[#33373E]">Cancel</button>
            <button type="submit" className="cursor-pointer rounded-md bg-[#0077FF] px-4 py-2 text-xs font-bold text-white hover:bg-[#0067DF]">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoyaltyProgramsView() {
  const { state } = usePosStore();
  const activeGroups = state.customerGroups.filter((group) => !group.deleted);
  return (
    <LoyaltyProgramsEditor
      key={JSON.stringify(state.loyaltySettings)}
      initial={state.loyaltySettings}
      groups={activeGroups}
      currencySymbol={state.settings.currencySymbol}
    />
  );
}

function LoyaltyProgramsEditor({
  initial,
  groups,
  currencySymbol,
}: {
  initial: LoyaltySettings;
  groups: CustomerGroup[];
  currencySymbol: string;
}) {
  const { actions } = usePosStore();
  const [form, setForm] = useState<LoyaltySettings>(() => structuredClone(initial));
  const inputClass = "w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#1A73E8] focus:outline-none dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white";
  const selectClass = `${inputClass} cursor-pointer`;
  const labelClass = "text-xs font-medium text-slate-700 dark:text-slate-300";
  const conditionId = () => `loyalty-condition-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const updateConditions = (
    key: "cashBackConditions" | "discountConditions",
    conditionIdToUpdate: string,
    patch: Partial<LoyaltyTransitionCondition>,
  ) => setForm((current) => ({
    ...current,
    [key]: current[key].map((condition) => condition.id === conditionIdToUpdate ? { ...condition, ...patch } : condition),
  }));
  const addCondition = (key: "cashBackConditions" | "discountConditions") => setForm((current) => ({
    ...current,
    [key]: [...current[key], { id: conditionId(), threshold: 0, groupId: "" }],
  }));
  const removeCondition = (key: "cashBackConditions" | "discountConditions", id: string) => setForm((current) => ({
    ...current,
    [key]: current[key].filter((condition) => condition.id !== id),
  }));

  const renderConditions = (key: "cashBackConditions" | "discountConditions") => (
    <div className="grid gap-3 md:grid-cols-[170px_minmax(0,1fr)] md:items-start">
      <div className={labelClass}>Transition conditions</div>
      <div className="space-y-2">
        {form[key].map((condition, index) => (
          <div key={condition.id} className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-300">from</span>
            <input
              type="number"
              min="0"
              value={condition.threshold || ""}
              onChange={(event) => updateConditions(key, condition.id, { threshold: Math.max(0, Number(event.target.value) || 0) })}
              placeholder={`100 ${currencySymbol}`}
              className={`${inputClass} w-36 font-mono`}
              aria-label={`Spend threshold for transition ${index + 1}`}
            />
            <select
              value={condition.groupId}
              onChange={(event) => updateConditions(key, condition.id, { groupId: event.target.value })}
              className={`${selectClass} min-w-48 flex-1`}
              aria-label={`Destination group for transition ${index + 1}`}
            >
              <option value="">Choose group</option>
              {groups.map((group) => <option key={group.id} value={group.id}>{group.title}</option>)}
            </select>
            {index > 0 && <button type="button" onClick={() => removeCondition(key, condition.id)} aria-label="Remove transition condition" className="cursor-pointer rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-[#33373E]"><X className="h-4 w-4" /></button>}
          </div>
        ))}
        <button type="button" onClick={() => addCondition(key)} className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-[#1A73E8] hover:underline dark:text-[#7EB3F5]"><Plus className="h-3.5 w-3.5" /> Add</button>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title="Loyalty programs" />
      <section className="py-6">
        <h2 className="text-base font-bold">Cash-back rewards program</h2>
        <div className="mt-2 max-w-5xl space-y-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
          <p>Customers can earn cash-back rewards and use them to fully or partly pay for their orders. You can configure different cash-back rewards for your customer groups.</p>
          <p>If you want your customers to be able to transition to a group with better rewards, you can specify how much money they should spend before switching groups, and they will be automatically moved to the new group.</p>
        </div>

        <div className="mt-5 space-y-4">
          <div className="grid gap-2 md:grid-cols-[170px_minmax(250px,280px)_minmax(240px,1fr)] md:items-center md:gap-4">
            <label htmlFor="loyalty-maximum-pct" className={labelClass}>Maximum %</label>
            <input id="loyalty-maximum-pct" type="number" min="0" max="100" value={form.maximumPct} onChange={(event) => setForm((current) => ({ ...current, maximumPct: Math.max(0, Math.min(100, Number(event.target.value) || 0)) }))} className={`${inputClass} font-mono`} />
            <span className="text-xs text-slate-500 dark:text-slate-400">the highest possible percentage of an order that can be paid with cash-back</span>
          </div>
          <div className="grid gap-2 md:grid-cols-[170px_minmax(250px,280px)_minmax(240px,1fr)] md:items-center md:gap-4">
            <label htmlFor="loyalty-registration-bonus" className={labelClass}>Registration bonus, {currencySymbol}</label>
            <input id="loyalty-registration-bonus" type="number" min="0" step="0.01" value={form.registrationBonus} onChange={(event) => setForm((current) => ({ ...current, registrationBonus: Math.max(0, Number(event.target.value) || 0) }))} className={`${inputClass} font-mono`} />
            <span className="text-xs text-slate-500 dark:text-slate-400">cash-back reward when a customer signs up to your loyalty program</span>
          </div>
          <div className="grid gap-2 md:grid-cols-[170px_minmax(250px,280px)_minmax(240px,1fr)] md:items-center md:gap-4">
            <label htmlFor="cashback-transition" className={labelClass}>Group transition</label>
            <select id="cashback-transition" value={form.cashBackTransition} onChange={(event) => setForm((current) => ({ ...current, cashBackTransition: event.target.value as "yes" | "no" }))} className={selectClass}><option value="yes">yes</option><option value="no">no</option></select>
          </div>
          {form.cashBackTransition === "yes" && renderConditions("cashBackConditions")}
        </div>
      </section>

      <section className="border-t border-[#E5E8EC] py-6 dark:border-[#33373E]">
        <h2 className="text-base font-bold">Discount-based program</h2>
        <div className="mt-2 max-w-5xl space-y-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
          <p>This program allows you to give discounts to your customers, and to create different discounts for your customer groups.</p>
          <p>If you want your customers to be able to transition to a group with a higher discount, you can specify how much money they should spend before switching groups. Poster will automatically move them to the new group.</p>
        </div>
        <div className="mt-5 space-y-4">
          <div className="grid gap-2 md:grid-cols-[170px_minmax(250px,280px)_minmax(240px,1fr)] md:items-center md:gap-4">
            <label htmlFor="discount-transition" className={labelClass}>Group transition</label>
            <select id="discount-transition" value={form.discountTransition} onChange={(event) => setForm((current) => ({ ...current, discountTransition: event.target.value as "yes" | "no" }))} className={selectClass}><option value="no">no</option><option value="yes">yes</option></select>
          </div>
          {form.discountTransition === "yes" && renderConditions("discountConditions")}
        </div>
      </section>

      <button type="button" onClick={() => actions.saveLoyaltySettings(form)} className="cursor-pointer rounded-md bg-[#1DB954] px-5 py-2 text-xs font-bold text-white hover:bg-[#18A348]">Save</button>
    </div>
  );
}

function ExclusionsView() {
  const { state, actions } = usePosStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState(state.menuCategories[0]?.id ?? "");
  const [selectedProductId, setSelectedProductId] = useState(state.menuItems[0]?.id ?? "");
  const money = (value: number) => formatMoney(value, state.settings.currencySymbol);
  const availableCategories = state.menuCategories.filter((category) => !state.excludedCategoryIds.includes(category.id));
  const availableProducts = state.menuItems.filter((item) => !state.excludedProductIds.includes(item.id));
  const chosenCategoryId = availableCategories.some((category) => category.id === selectedCategoryId)
    ? selectedCategoryId
    : availableCategories[0]?.id ?? "";
  const chosenProductId = availableProducts.some((item) => item.id === selectedProductId)
    ? selectedProductId
    : availableProducts[0]?.id ?? "";
  const excludedCategories = state.excludedCategoryIds
    .map((id) => state.menuCategories.find((category) => category.id === id))
    .filter((category) => category !== undefined);
  const excludedProducts = state.excludedProductIds
    .map((id) => state.menuItems.find((item) => item.id === id))
    .filter((item) => item !== undefined);

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-1 flex items-baseline gap-2.5">
          <h1 className="text-xl font-bold tracking-tight">Excluded categories</h1>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{excludedCategories.length}</span>
        </div>
        <p className="mb-4 text-xs leading-5 text-slate-500 dark:text-slate-400">Categories of products and dishes that are not covered by discounts and payment with bonuses, but promotions are applied:</p>
        <div className="overflow-x-auto border-y border-[#E5E8EC] dark:border-[#33373E]">
          <table className="w-full border-collapse text-left text-xs">
            <thead><tr><th className={TH}>Category</th><th className={TH}>Subcategories</th><th className={`${TH} w-16 text-right`}> </th></tr></thead>
            <tbody>
              {excludedCategories.map((category) => (
                <tr key={category.id} className={ROW}>
                  <td className={`${TD} font-medium`}>{category.name}</td>
                  <td className={TD}>All subcategories</td>
                  <td className={`${TD} text-right`}><button type="button" onClick={() => actions.removeExcludedCategory(category.id)} aria-label={`Delete ${category.name} exclusion`} className="cursor-pointer text-slate-400 hover:text-rose-600">×</button></td>
                </tr>
              ))}
              <tr className="border-t border-[#E5E8EC] dark:border-[#33373E]">
                <td className={TD}>
                  <select value={chosenCategoryId} onChange={(event) => setSelectedCategoryId(event.target.value)} aria-label="Choose excluded category" className="w-full max-w-sm rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#1A73E8] focus:outline-none dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white">
                    {availableCategories.length === 0 && <option value="">All categories added</option>}
                    {availableCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </td>
                <td className={TD}><button type="button" disabled={!chosenCategoryId} onClick={() => { actions.addExcludedCategory(chosenCategoryId); setSelectedCategoryId(""); }} className="cursor-pointer font-semibold text-[#0077FF] hover:underline disabled:cursor-not-allowed disabled:opacity-40">Add</button></td>
                <td className={TD} />
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-1 flex items-baseline gap-2.5">
          <h2 className="text-xl font-bold tracking-tight">Excluded products</h2>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{excludedProducts.length}</span>
        </div>
        <p className="mb-4 text-xs leading-5 text-slate-500 dark:text-slate-400">Products and dishes that are not covered by discounts and payment with bonuses, but promotions are applied:</p>
        <div className="overflow-x-auto border-y border-[#E5E8EC] dark:border-[#33373E]">
          <table className="w-full border-collapse text-left text-xs">
            <thead><tr><th className={TH}>Product</th><th className={TH}>Category</th><th className={`${TH} text-right`}>Price</th><th className={`${TH} text-right`}>Cost</th><th className={`${TH} w-16 text-right`}> </th></tr></thead>
            <tbody>
              {excludedProducts.map((item) => (
                <tr key={item.id} className={ROW}>
                  <td className={`${TD} font-medium`}>{item.title}</td>
                  <td className={TD}>{item.category || "—"}</td>
                  <td className={`${TD} text-right font-mono`}>{money(item.price)}</td>
                  <td className={`${TD} text-right font-mono`}>{money(item.cost)}</td>
                  <td className={`${TD} text-right`}><button type="button" onClick={() => actions.removeExcludedProduct(item.id)} aria-label={`Delete ${item.title} exclusion`} className="cursor-pointer text-slate-400 hover:text-rose-600">×</button></td>
                </tr>
              ))}
              <tr className="border-t border-[#E5E8EC] dark:border-[#33373E]">
                <td className={TD}>
                  <select value={chosenProductId} onChange={(event) => setSelectedProductId(event.target.value)} aria-label="Choose excluded product" className="w-full max-w-sm rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#1A73E8] focus:outline-none dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white">
                    {availableProducts.length === 0 && <option value="">All products added</option>}
                    {availableProducts.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                  </select>
                </td>
                <td className={TD}><button type="button" disabled={!chosenProductId} onClick={() => { actions.addExcludedProduct(chosenProductId); setSelectedProductId(""); }} className="cursor-pointer font-semibold text-[#0077FF] hover:underline disabled:cursor-not-allowed disabled:opacity-40">Add</button></td>
                <td className={TD} /><td className={TD} /><td className={TD} />
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function PromotionsView() {
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const [expirationFilter, setExpirationFilter] = useState<"All" | "Active" | "Scheduled" | "Expired">("All");
  const [editingPromotion, setEditingPromotion] = useState<Promotion | "new" | null>(null);
  const today = toDateInputValue(new Date());
  const query = search.trim().toLowerCase();
  const promotions = state.promotions.filter((promotion) => {
    const matchesSearch = !query || promotion.title.toLowerCase().includes(query);
    const status = promotion.expirationDate < today
      ? "Expired"
      : promotion.beginningDate > today
        ? "Scheduled"
        : "Active";
    return matchesSearch && (expirationFilter === "All" || status === expirationFilter);
  });
  const money = (value: number) => formatMoney(value, state.settings.currencySymbol);
  const enrollmentBonus = (promotion: Promotion) => {
    if (promotion.rewardType === "Discount %") return `${promotion.rewardValue}% discount`;
    return `${money(promotion.rewardValue)} ${promotion.rewardType === "Fixed discount" ? "discount" : "bonus points"}`;
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E8EC] pb-3.5 dark:border-[#33373E]">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-xl font-bold tracking-tight">Actions</h1>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{state.promotions.length}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button type="button" onClick={() => actions.showToast("All table columns displayed")} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]"><Columns3 className="h-3.5 w-3.5" /> Columns ▾</button>
          <button type="button" disabled={!state.promotions.length} onClick={() => actions.showToast(`Exported ${state.promotions.length} promotions to CSV`, "success")} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#1A73E8] enabled:hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-40 dark:text-[#7EB3F5]"><Download className="h-3.5 w-3.5" /> Export</button>
          <button type="button" onClick={() => window.print()} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]"><Printer className="h-3.5 w-3.5" /> Print</button>
          <button type="button" onClick={() => setEditingPromotion("new")} className="ml-1 cursor-pointer rounded-md bg-[#1DB954] px-4 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#18A348]">Add</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 py-3.5 text-xs">
        <div className="w-52">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Quick search" className="w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1A73E8] focus:outline-none dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white dark:placeholder:text-slate-500" />
        </div>
        <select value={expirationFilter} onChange={(event) => setExpirationFilter(event.target.value as typeof expirationFilter)} aria-label="Expiration date filter" className="cursor-pointer rounded-md border border-[#E5E8EC] bg-white px-2.5 py-1.5 font-medium text-[#1A73E8] dark:border-[#33373E] dark:bg-[#1D2024] dark:text-[#7EB3F5]">
          <option value="All">Expiration date ▾</option>
          <option value="Active">Active</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Expired">Expired</option>
        </select>
        <button type="button" onClick={() => actions.showToast("Choose an expiration date to filter promotions", "blue")} className="rounded-md px-2.5 py-1.5 font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]">+ Filter</button>
      </div>

      <div className="overflow-x-auto border-y border-[#E5E8EC] dark:border-[#33373E]">
        <table className="w-full border-collapse text-left text-xs">
          <thead><tr>
            <th className={TH}>Title ▲</th>
            <th className={TH}>Beginning date</th>
            <th className={TH}>Expiration date</th>
            <th className={TH}>Enrollment bonus</th>
            <th className={`${TH} w-28 text-right`}>Actions</th>
          </tr></thead>
          <tbody>
            {promotions.length === 0 ? (
              <tr><td colSpan={5} className={`${TD} py-14 text-center text-slate-500 dark:text-slate-400`}>No data associated with the selected filters</td></tr>
            ) : promotions.map((promotion) => (
              <tr key={promotion.id} className={ROW}>
                <td className={`${TD} font-medium`}>{promotion.title}</td>
                <td className={TD}>{formatPromotionDate(promotion.beginningDate)}</td>
                <td className={TD}>{formatPromotionDate(promotion.expirationDate)}</td>
                <td className={TD}>{enrollmentBonus(promotion)}</td>
                <td className={`${TD} text-right`}>
                  <button type="button" onClick={() => setEditingPromotion(promotion)} className="mr-3 cursor-pointer text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">Edit</button>
                  <button type="button" title={`Delete ${promotion.title}`} onClick={() => actions.deletePromotion(promotion.id)} className="inline-flex cursor-pointer text-slate-500 hover:text-rose-600"><MoreVertical className="h-4 w-4" /><span className="sr-only">More actions</span></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingPromotion !== null && (
        <PromotionModal
          promotion={editingPromotion === "new" ? undefined : editingPromotion}
          categories={state.menuCategories}
          products={state.menuItems}
          currencySymbol={state.settings.currencySymbol}
          onClose={() => setEditingPromotion(null)}
          onSave={(promotion) => {
            actions.savePromotion(promotion, editingPromotion === "new" ? undefined : editingPromotion.id);
            setEditingPromotion(null);
          }}
        />
      )}
    </div>
  );
}

function PromotionModal({
  promotion,
  categories,
  products,
  currencySymbol,
  onClose,
  onSave,
}: {
  promotion?: Promotion;
  categories: { id: string; name: string }[];
  products: { id: string; title: string }[];
  currencySymbol: string;
  onClose: () => void;
  onSave: (promotion: Omit<Promotion, "id">) => void;
}) {
  const [title, setTitle] = useState(promotion?.title ?? "");
  const [beginningDate, setBeginningDate] = useState(promotion?.beginningDate ?? "");
  const [expirationDate, setExpirationDate] = useState(promotion?.expirationDate ?? "");
  const [rewardType, setRewardType] = useState<PromotionRewardType>(promotion?.rewardType ?? "Discount %");
  const [rewardValue, setRewardValue] = useState(String(promotion?.rewardValue ?? 10));
  const [scope, setScope] = useState<PromotionScope>(promotion?.scope ?? "All menu items");
  const [categoryIds, setCategoryIds] = useState<string[]>(promotion?.categoryIds ?? []);
  const [productIds, setProductIds] = useState<string[]>(promotion?.productIds ?? []);
  const fieldClass = "w-full rounded-md border border-[#3E434C] bg-[#1D2024] px-3 py-2 text-xs text-white focus:border-[#4EA1FF] focus:outline-none";
  const labelClass = "mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300";
  const rewardValueLabel = rewardType === "Discount %" ? "Reward value (%)" : `Reward value (${currencySymbol})`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="promotion-modal-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-[#33373E] bg-[#24272C] text-[#E6E8EC] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#33373E] px-5 py-4">
          <h2 id="promotion-modal-title" className="text-sm font-bold">{promotion ? "Edit Promotion" : "New Promotion"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer text-lg text-slate-400 hover:text-white">×</button>
        </div>
        <form className="space-y-3.5 p-5 text-xs" onSubmit={(event) => {
          event.preventDefault();
          onSave({
            title: title.trim(),
            beginningDate,
            expirationDate,
            rewardType,
            rewardValue: Math.max(0, Number(rewardValue) || 0),
            scope,
            categoryIds: scope === "Categories" ? categoryIds : [],
            productIds: scope === "Products" ? productIds : [],
          });
        }}>
          <div><label className={labelClass}>Title</label><input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Happy Hour 10% Off" className={fieldClass} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Beginning date</label><input type="date" required value={beginningDate} onChange={(event) => setBeginningDate(event.target.value)} className={fieldClass} /></div>
            <div><label className={labelClass}>Expiration date</label><input type="date" required min={beginningDate} value={expirationDate} onChange={(event) => setExpirationDate(event.target.value)} className={fieldClass} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Enrollment bonus</label><select value={rewardType} onChange={(event) => setRewardType(event.target.value as PromotionRewardType)} className={fieldClass}><option value="Discount %">Discount %</option><option value="Fixed discount">Fixed discount {currencySymbol}</option><option value="Bonus points">Bonus points {currencySymbol}</option></select></div>
            <div><label className={labelClass}>{rewardValueLabel}</label><input type="number" min="0" max={rewardType === "Discount %" ? 100 : undefined} step="0.01" value={rewardValue} onChange={(event) => setRewardValue(event.target.value)} className={`${fieldClass} font-mono`} /></div>
          </div>
          <div><label className={labelClass}>Applicable scope</label><select value={scope} onChange={(event) => setScope(event.target.value as PromotionScope)} className={fieldClass}><option>All menu items</option><option>Categories</option><option>Products</option></select></div>
          {scope === "Categories" && <div><label className={labelClass}>Categories</label><select multiple value={categoryIds} onChange={(event) => setCategoryIds(Array.from(event.target.selectedOptions, (option) => option.value))} className={`${fieldClass} min-h-24`}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>}
          {scope === "Products" && <div><label className={labelClass}>Products and dishes</label><select multiple value={productIds} onChange={(event) => setProductIds(Array.from(event.target.selectedOptions, (option) => option.value))} className={`${fieldClass} min-h-24`}>{products.map((product) => <option key={product.id} value={product.id}>{product.title}</option>)}</select></div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="cursor-pointer rounded-md border border-[#3E434C] px-3 py-2 text-xs font-medium text-slate-300 hover:bg-[#33373E]">Cancel</button>
            <button type="submit" disabled={!title.trim() || expirationDate < beginningDate || (scope === "Categories" && categoryIds.length === 0) || (scope === "Products" && productIds.length === 0)} className="cursor-pointer rounded-md bg-[#0077FF] px-4 py-2 text-xs font-bold text-white hover:bg-[#0067DF] disabled:cursor-not-allowed disabled:opacity-50">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatPromotionDate(value: string): string {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

const POSITION_ACCESS_AREAS: { key: ConsoleAccessArea; label: string }[] = [
  { key: "reports", label: "reports" },
  { key: "finances", label: "finances" },
  { key: "menu", label: "menu" },
  { key: "inventory", label: "inventory" },
  { key: "marketing", label: "marketing" },
  { key: "accessSettings", label: "access settings" },
  { key: "accountSettings", label: "account settings" },
  { key: "securitySettings", label: "security settings" },
];

function positionAccessSummary(position: PositionRole): string {
  if (POSITION_ACCESS_AREAS.every(({ key }) => position.consoleAccess[key] === "Full access")) return "Full access";
  const areas = POSITION_ACCESS_AREAS
    .filter(({ key }) => position.consoleAccess[key] !== "Without access")
    .map(({ label }) => label);
  if (position.posAccess) areas.unshift("POS access");
  if (position.orderAdministration) areas.push("Order administration");
  if (position.editAllOrders && !position.orderAdministration) areas.push("Edit all employees' orders");
  return areas.length ? areas.map((area) => area.charAt(0).toUpperCase() + area.slice(1)).join(", ") : "Without access";
}

function PositionsView() {
  const router = useRouter();
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState("");
  const query = search.trim().toLowerCase();
  const positions = state.positions.filter((position) =>
    !query || `${position.title} ${positionAccessSummary(position)}`.toLowerCase().includes(query),
  );
  const navigateToPosition = (id: string) => router.push(`/manage/access/positions/${id}`);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E8EC] pb-3.5 dark:border-[#33373E]">
        <h1 className="text-xl font-bold tracking-tight">Positions</h1>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="More position actions" onClick={() => actions.showToast("Position actions")} className="cursor-pointer rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#33373E]"><MoreVertical className="h-4 w-4" /></button>
          <button type="button" onClick={() => navigateToPosition("new")} className="cursor-pointer rounded-md bg-[#0077FF] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#0067DF]">Add</button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2.5 py-3.5 text-xs">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." className="w-52 rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1A73E8] focus:outline-none dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white" />
        <button type="button" onClick={() => actions.showToast("Choose a filter to refine positions", "blue")} className="rounded-md px-2.5 py-1.5 font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]">+ Filter ▾</button>
      </div>
      <div className="overflow-x-auto border-y border-[#E5E8EC] dark:border-[#33373E]">
        <table className="w-full border-collapse text-left text-xs">
          <thead><tr><th className={TH}>Position title ↑</th><th className={TH}>Access rights</th><th className={`${TH} w-24 text-right`}> </th></tr></thead>
          <tbody>
            {positions.map((position) => (
              <tr key={position.id} className={`${ROW} cursor-pointer`} onClick={() => !position.systemRole && navigateToPosition(position.id)}>
                <td className={`${TD} font-medium`}><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ backgroundColor: position.color }} />{position.title}</td>
                <td className={TD}>{positionAccessSummary(position)}</td>
                <td className={`${TD} text-right`} onClick={(event) => event.stopPropagation()}>
                  {!position.systemRole && <button type="button" aria-label={`Edit ${position.title}`} onClick={() => navigateToPosition(position.id)} className="mr-3 cursor-pointer text-[#1A73E8] dark:text-[#7EB3F5]">→</button>}
                  {!position.systemRole && <div className="relative inline-block">
                    <button type="button" aria-label={`Actions for ${position.title}`} onClick={() => setOpenMenuId((current) => current === position.id ? "" : position.id)} className="cursor-pointer text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"><MoreVertical className="inline h-4 w-4" /></button>
                    {openMenuId === position.id && <div className="absolute right-0 top-6 z-10 min-w-36 rounded-md border border-[#E5E8EC] bg-white p-1 text-left shadow-lg dark:border-[#33373E] dark:bg-[#24272C]">
                      <button type="button" onClick={() => { actions.duplicatePosition(position.id); setOpenMenuId(""); }} className="w-full cursor-pointer rounded px-2 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-[#33373E]">Duplicate</button>
                      <button type="button" onClick={() => { actions.deletePosition(position.id); setOpenMenuId(""); }} className="w-full cursor-pointer rounded px-2 py-1.5 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">Delete</button>
                    </div>}
                  </div>}
                </td>
              </tr>
            ))}
            {positions.length === 0 && <tr><td colSpan={3} className={`${TD} py-10 text-center text-slate-500 dark:text-slate-400`}>No results found</td></tr>}
          </tbody>
        </table>
      </div>
      <PaginationFooter total={positions.length} />
    </div>
  );
}

function PositionFormView({ positionId }: { positionId: string }) {
  const router = useRouter();
  const { state, actions } = usePosStore();
  const existing = state.positions.find((position) => position.id === positionId);
  const isNew = positionId === "new";
  const initial: PositionRole = existing ? structuredClone(existing) : {
    id: "new",
    title: "",
    color: "#0077FF",
    systemRole: false,
    posAccess: false,
    editAllOrders: false,
    orderAdministration: false,
    consoleAccess: {
      reports: "Without access",
      finances: "Without access",
      menu: "Without access",
      inventory: "Without access",
      marketing: "Without access",
      accessSettings: "Without access",
      accountSettings: "Without access",
      securitySettings: "Without access",
    },
    appInstallation: false,
    courier: false,
    payroll: { perHour: 0, perShift: 0, perMonth: 0, commissionRates: [{ id: "commission-new", categoryId: "", percentage: 0 }] },
  };
  const [position, setPosition] = useState<PositionRole>(initial);
  const back = () => router.push("/manage/access/positions");
  const isLocked = Boolean(existing?.systemRole);
  const updatePosition = (patch: Partial<PositionRole>) => setPosition((current) => ({ ...current, ...patch }));
  const updatePayroll = (patch: Partial<PositionRole["payroll"]>) => setPosition((current) => ({ ...current, payroll: { ...current.payroll, ...patch } }));
  const updateCommission = (id: string, patch: { categoryId?: string; percentage?: number }) => updatePayroll({
    commissionRates: position.payroll.commissionRates.map((rate) => rate.id === id ? { ...rate, ...patch } : rate),
  });
  const addCommission = () => updatePayroll({
    commissionRates: [...position.payroll.commissionRates, {
      id: `commission-${Date.now()}-${position.payroll.commissionRates.length}`,
      categoryId: state.menuCategories.find((category) => !position.payroll.commissionRates.some((rate) => rate.categoryId === category.id))?.id ?? "",
      percentage: 0,
    }],
  });
  const inputClass = "rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white";
  const checkClass = "flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300";
  const save = () => {
    actions.savePosition(isNew ? null : positionId, position);
    back();
  };

  if (isLocked) {
    return <div><button type="button" onClick={back} className="mb-4 flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300"><ChevronLeft className="h-4 w-4" /> Positions</button><EmptyState emoji="🔒" title="Owner is a locked system role" description="This role's access rights cannot be changed." /></div>;
  }

  return (
    <div>
      <button type="button" onClick={back} className="mb-4 flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"><ChevronLeft className="h-4 w-4" /> {isNew ? "Adding a position" : "Editing a position"}</button>
      <div className="max-w-5xl space-y-6">
        <Card className="p-5">
          <label className="grid items-center gap-3 text-xs sm:grid-cols-[200px_minmax(0,1fr)]"><span className="font-medium text-slate-700 dark:text-slate-300">Position title</span><input value={position.title} onChange={(event) => updatePosition({ title: event.target.value })} className={inputClass} /></label>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-bold">Access to the point of sale</h2>
          <label className={checkClass}><input type="checkbox" checked={position.posAccess} onChange={(event) => updatePosition({ posAccess: event.target.checked })} /> POS access</label>
          <label className={checkClass}><input type="checkbox" checked={position.editAllOrders} onChange={(event) => updatePosition({ editAllOrders: event.target.checked })} /> edit and close all employees&apos; orders</label>
          <label className={checkClass}><input type="checkbox" checked={position.orderAdministration} onChange={(event) => updatePosition({ orderAdministration: event.target.checked })} /> order administration <span title="Manage orders created by all employees." className="cursor-help rounded-full border border-slate-400 px-1 text-[10px]">?</span></label>
        </Card>

        <Card className="overflow-x-auto p-5">
          <h2 className="mb-4 text-sm font-bold">Access to the management console</h2>
          <table className="w-full min-w-[650px] border-collapse text-left text-xs">
            <thead><tr><th className={`${TH} pl-0`}>Section</th>{(["Without access", "View only", "Full access"] as AccessLevel[]).map((level) => <th className={`${TH} text-center`} key={level}>{level}</th>)}</tr></thead>
            <tbody>{POSITION_ACCESS_AREAS.map(({ key, label }) => (
              <tr key={key} className={ROW}>
                <td className={`${TD} pl-0 font-medium`}>{label}</td>
                {(["Without access", "View only", "Full access"] as AccessLevel[]).map((level) => <td key={level} className={`${TD} text-center`}><input aria-label={`${label}: ${level}`} type="radio" name={`position-${position.id}-${key}`} checked={position.consoleAccess[key] === level} onChange={() => updatePosition({ consoleAccess: { ...position.consoleAccess, [key]: level } })} /></td>)}
              </tr>
            ))}</tbody>
          </table>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-bold">Access to apps and integrations</h2>
          <label className={checkClass}><input type="checkbox" checked={position.appInstallation} onChange={(event) => updatePosition({ appInstallation: event.target.checked })} /> app installation <span title="Install and manage applications and integrations." className="cursor-help rounded-full border border-slate-400 px-1 text-[10px]">?</span></label>
          <label className={checkClass}><input type="checkbox" checked={position.courier} onChange={(event) => updatePosition({ courier: event.target.checked })} /> courier</label>
        </Card>

        <Card className="space-y-5 p-5">
          <div>
            <h2 className="text-sm font-bold">Payroll calculation</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Configure payroll rates for this position. View them in <Link href="/manage/finances/salary" className="text-[#1A73E8] underline dark:text-[#7EB3F5]">Finance → Payroll</Link>.</p>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold">Fixed rate</div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs">Per hour, {state.settings.currencySymbol}</label><input aria-label={`Per hour, ${state.settings.currencySymbol}`} type="number" min="0" step="0.01" value={position.payroll.perHour} onChange={(event) => updatePayroll({ perHour: Number(event.target.value) || 0 })} className={`${inputClass} w-28 font-mono`} />
              <span>+</span>
              <label className="text-xs">Per shift, {state.settings.currencySymbol}</label><input aria-label={`Per shift, ${state.settings.currencySymbol}`} type="number" min="0" step="0.01" value={position.payroll.perShift} onChange={(event) => updatePayroll({ perShift: Number(event.target.value) || 0 })} className={`${inputClass} w-28 font-mono`} />
              <span>+</span>
              <label className="text-xs">Per month, {state.settings.currencySymbol}</label><input aria-label={`Per month, ${state.settings.currencySymbol}`} type="number" min="0" step="0.01" value={position.payroll.perMonth} onChange={(event) => updatePayroll({ perMonth: Number(event.target.value) || 0 })} className={`${inputClass} w-28 font-mono`} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold">Percentage of personal sales</div>
            {position.payroll.commissionRates.map((rate) => (
              <div key={rate.id} className="flex flex-wrap items-center gap-2">
                <select aria-label="Commission category" value={rate.categoryId} onChange={(event) => updateCommission(rate.id, { categoryId: event.target.value })} className={`${inputClass} min-w-48`}>
                  <option value="">All categories</option>
                  {state.menuCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
                <input aria-label="Commission percentage" type="number" min="0" max="100" step="0.01" value={rate.percentage} onChange={(event) => updateCommission(rate.id, { percentage: Number(event.target.value) || 0 })} className={`${inputClass} w-24 font-mono`} />
                <span>%</span>
                {position.payroll.commissionRates.length > 1 && <button type="button" onClick={() => updatePayroll({ commissionRates: position.payroll.commissionRates.filter((entry) => entry.id !== rate.id) })} aria-label="Remove commission category" className="cursor-pointer text-slate-400 hover:text-rose-600">×</button>}
              </div>
            ))}
            <button type="button" onClick={addCommission} className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-[#0077FF] hover:underline"><Plus className="h-3.5 w-3.5" /> Add category</button>
          </div>
        </Card>

        <button type="button" disabled={!position.title.trim()} onClick={save} className="cursor-pointer rounded-md bg-[#1DB954] px-5 py-2 text-xs font-bold text-white hover:bg-[#18A348] disabled:cursor-not-allowed disabled:opacity-50">Save</button>
      </div>
    </div>
  );
}

function RegistersView({ basePath }: { basePath: string }) {
  const router = useRouter();
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [openMenuId, setOpenMenuId] = useState("");
  const query = search.trim().toLowerCase();
  const registers = state.registers
    .filter((register) =>
      (!query || `${register.number} ${register.title} ${register.type} ${register.location} ${register.login}`.toLowerCase().includes(query)) &&
      (!locationFilter || register.location === locationFilter),
    )
    .sort((a, b) => a.number - b.number);
  const openRegister = (id: string) => router.push(`${basePath}/${id}`);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E8EC] pb-3.5 dark:border-[#33373E]">
        <h1 className="text-xl font-bold tracking-tight">Registers</h1>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="More register actions" onClick={() => actions.showToast("Register list actions", "blue")} className="cursor-pointer rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#33373E]"><MoreVertical className="h-4 w-4" /></button>
          <button type="button" onClick={() => openRegister("new")} className="cursor-pointer rounded-md bg-[#0077FF] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#0067DF]">Add</button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2.5 py-3.5 text-xs">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." aria-label="Search registers" className="w-52 rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1A73E8] focus:outline-none dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white" />
        <label className="relative">
          <span className="sr-only">Location filter</span>
          <select aria-label="Location filter" value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} className="cursor-pointer appearance-none rounded-md border border-[#E5E8EC] bg-white py-1.5 pl-2.5 pr-7 font-medium text-[#1A73E8] dark:border-[#33373E] dark:bg-[#24272C] dark:text-[#7EB3F5]">
            <option value="">Location ▾</option>
            {state.accessLocations.map((location) => <option key={location} value={location}>{location}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => actions.showToast("Choose a filter to refine registers", "blue")} className="rounded-md px-2.5 py-1.5 font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]">+ Filter ▾</button>
      </div>
      <div className="overflow-x-auto border-y border-[#E5E8EC] dark:border-[#33373E]">
        <table className="w-full border-collapse text-left text-xs">
          <thead><tr>
            <th className={`${TH} w-16 text-right`}>↑ #</th>
            <th className={TH}>Title</th>
            <th className={TH}>Type</th>
            <th className={TH}>Location</th>
            <th className={TH}>Login</th>
            <th className={TH}>Password</th>
            <th className={`${TH} w-24 text-right`}></th>
          </tr></thead>
          <tbody>
            {registers.map((register) => (
              <tr key={register.id} className={`${ROW} cursor-pointer`} onClick={() => openRegister(register.id)}>
                <td className={`${TD} text-right font-mono`}>{register.number}</td>
                <td className={`${TD} font-medium`}><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#1DB954] align-middle" />{register.title}</td>
                <td className={TD}><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#0077FF] align-middle" />{register.type}</td>
                <td className={TD}>{register.location}</td>
                <td className={TD}>{register.login}</td>
                <td className={`${TD} font-mono`}>{register.password}</td>
                <td className={`${TD} text-right`} onClick={(event) => event.stopPropagation()}>
                  <button type="button" aria-label={`Edit ${register.title}`} onClick={() => openRegister(register.id)} className="mr-3 cursor-pointer text-[#1A73E8] dark:text-[#7EB3F5]">→</button>
                  <div className="relative inline-block">
                    <button type="button" aria-label={`Actions for ${register.title}`} onClick={() => setOpenMenuId((current) => current === register.id ? "" : register.id)} className="cursor-pointer text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"><MoreVertical className="inline h-4 w-4" /></button>
                    {openMenuId === register.id && <div className="absolute right-0 top-6 z-10 min-w-32 rounded-md border border-[#E5E8EC] bg-white p-1 text-left shadow-lg dark:border-[#33373E] dark:bg-[#24272C]">
                      <button type="button" onClick={() => { actions.deleteRegister(register.id); setOpenMenuId(""); }} className="w-full cursor-pointer rounded px-2 py-1.5 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">Delete</button>
                    </div>}
                  </div>
                </td>
              </tr>
            ))}
            {registers.length === 0 && <tr><td colSpan={7} className={`${TD} py-10 text-center text-slate-500 dark:text-slate-400`}>No registers found</td></tr>}
          </tbody>
        </table>
      </div>
      <PaginationFooter total={registers.length} />
    </div>
  );
}

function RegisterFormView({ registerId, initialRegister, basePath }: { registerId: string; initialRegister?: Register; basePath: string }) {
  const router = useRouter();
  const { state, actions } = usePosStore();
  const existing = initialRegister;
  const isNew = registerId === "new";
  const locations = state.accessLocations;
  const defaultLocation = locations[0] ?? state.settings.companyName;
  const [location, setLocation] = useState(existing?.location ?? defaultLocation);
  const [password, setPassword] = useState(existing?.password ?? "m8hezbkf");
  const [title, setTitle] = useState(existing?.title ?? `Register in “${defaultLocation}”`);
  const loginBase = location.toLowerCase().replace(/[^a-z0-9]+/g, "") || "register";
  let newLogin = loginBase;
  let loginSuffix = 2;
  while (state.registers.some((register) => register.login.toLowerCase() === newLogin.toLowerCase())) {
    newLogin = `${loginBase}${loginSuffix++}`;
  }
  const back = () => router.push(basePath);
  const inputClass = "w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white";

  if (!isNew && !existing) {
    return <div><button type="button" onClick={back} className="mb-4 flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300"><ChevronLeft className="h-4 w-4" /> Registers</button><EmptyState emoji="📟" title="Register not found" description="This register may have been deleted." /></div>;
  }

  const save = () => {
    actions.saveRegister(isNew ? null : registerId, { location, password, title });
    back();
  };

  return (
    <div>
      <button type="button" onClick={back} className="mb-4 flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"><ChevronLeft className="h-4 w-4" /> {isNew ? "Adding a register" : "Editing a register"}</button>
      <Card className="max-w-3xl space-y-5 p-5">
        <label className="grid items-center gap-3 text-xs sm:grid-cols-[180px_minmax(0,1fr)]">
          <span className="font-medium text-slate-700 dark:text-slate-300">Location</span>
          {isNew
            ? <select value={location} onChange={(event) => { const next = event.target.value; setLocation(next); if (title === `Register in “${location}”`) setTitle(`Register in “${next}”`); }} className={inputClass}>{locations.map((item) => <option key={item} value={item}>{item}</option>)}</select>
            : <span className="text-sm">{existing?.location}</span>}
        </label>
        <label className="grid items-center gap-3 text-xs sm:grid-cols-[180px_minmax(0,1fr)]">
          <span className="font-medium text-slate-700 dark:text-slate-300">Login</span>
          <input value={existing?.login ?? newLogin} readOnly disabled className="w-full rounded-md border border-[#D1D5DB] bg-slate-100 px-3 py-2 text-sm text-slate-500 disabled:cursor-not-allowed dark:border-[#3E434C] dark:bg-[#2C3036] dark:text-slate-400" />
        </label>
        <label className="grid items-center gap-3 text-xs sm:grid-cols-[180px_minmax(0,1fr)]">
          <span className="font-medium text-slate-700 dark:text-slate-300">Password</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} autoComplete="new-password" />
        </label>
        <label className="grid items-center gap-3 text-xs sm:grid-cols-[180px_minmax(0,1fr)]">
          <span className="font-medium text-slate-700 dark:text-slate-300">Register name</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
        </label>
      </Card>
      <div className="mt-5 max-w-3xl sm:pl-[192px]">
        <button type="button" disabled={!title.trim() || !password.trim() || (!existing && locations.length === 0)} onClick={save} className="cursor-pointer rounded-md bg-[#1DB954] px-5 py-2 text-xs font-bold text-white hover:bg-[#18A348] disabled:cursor-not-allowed disabled:opacity-50">Save</button>
      </div>
    </div>
  );
}

function EmployeesView() {
  const { state, actions } = usePosStore();
  const [tab, setTab] = useState<"employees" | "invitations">("employees");
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [editingEmployee, setEditingEmployee] = useState<Employee | "new" | null>(null);
  const query = search.trim().toLowerCase();
  const employees = state.employees.filter((employee) =>
    (!query || [employee.name, employee.phone, employee.login, employee.position].some((value) => value.toLowerCase().includes(query))) &&
    (!positionFilter || employee.position === positionFilter),
  );
  const invitations = state.employeeInvitations.filter((invitation) =>
    !query || [invitation.email, invitation.position, invitation.status].some((value) => value.toLowerCase().includes(query)),
  );
  const total = tab === "employees" ? employees.length : invitations.length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E8EC] pb-3.5 dark:border-[#33373E]">
        <div className="flex flex-wrap items-baseline gap-4">
          <h1 className="text-xl font-bold tracking-tight">Employees</h1>
          <div className="flex items-center gap-4 text-xs font-medium">
            <button type="button" onClick={() => setTab("employees")} className={`cursor-pointer border-b-2 pb-1 ${tab === "employees" ? "border-[#1A73E8] text-[#1F2328] dark:text-white" : "border-transparent text-[#4EA1FF]"}`}>Employees</button>
            <button type="button" onClick={() => setTab("invitations")} className={`cursor-pointer border-b-2 pb-1 ${tab === "invitations" ? "border-[#1A73E8] text-[#1F2328] dark:text-white" : "border-transparent text-[#4EA1FF]"}`}>Invitations</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="More employee actions" onClick={() => actions.showToast("Employee actions")} className="cursor-pointer rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#33373E]"><MoreVertical className="h-4 w-4" /></button>
          <button type="button" onClick={() => setEditingEmployee("new")} className="cursor-pointer rounded-md bg-[#0077FF] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#0067DF]">Add</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 py-3.5 text-xs">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." className="w-52 rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1A73E8] focus:outline-none dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white" />
        {tab === "employees" && (
          <select value={positionFilter} onChange={(event) => setPositionFilter(event.target.value)} className="cursor-pointer rounded-md border border-[#E5E8EC] bg-white px-2.5 py-1.5 font-medium text-[#1A73E8] dark:border-[#33373E] dark:bg-[#1D2024] dark:text-[#7EB3F5]">
            <option value="">Position ▾</option>
            {state.positions.map((position) => <option key={position.id} value={position.title}>{position.title}</option>)}
          </select>
        )}
        <button type="button" onClick={() => actions.showToast("Choose a filter to refine this list", "blue")} className="rounded-md px-2.5 py-1.5 font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]">+ Filter ▾</button>
      </div>

      {tab === "employees" ? (
        <div className="overflow-x-auto border-y border-[#E5E8EC] dark:border-[#33373E]">
          <table className="w-full border-collapse text-left text-xs">
            <thead><tr>
              <th className={TH}>Name ↑</th><th className={TH}>Phone number</th><th className={TH}>Login</th><th className={TH}>PIN</th><th className={TH}>Position</th><th className={TH}>Last login date</th><th className={`${TH} w-12 text-right`}> </th>
            </tr></thead>
            <tbody>{employees.map((employee) => (
              <tr key={employee.id} className={ROW}>
                <td className={`${TD} font-medium`}>{employee.name}</td>
                <td className={TD}>{employee.phone || "—"}</td>
                <td className={`${TD} max-w-56`}><span title={employee.login} className="block max-w-56 truncate">{employee.login}</span></td>
                <td className={`${TD} font-mono`}>{employee.pin}</td>
                <td className={TD}><span className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: employee.dotColor.startsWith("#") ? employee.dotColor : "#1A73E8" }} />{employee.position}</td>
                <td className={TD}>{employee.lastLogin}</td>
                <td className={`${TD} text-right`}><button type="button" aria-label={`Edit ${employee.name}`} onClick={() => setEditingEmployee(employee)} className="cursor-pointer text-[#1A73E8] hover:text-[#1557A0] dark:text-[#7EB3F5]">→</button></td>
              </tr>
            ))}{employees.length === 0 && <tr><td colSpan={7} className={`${TD} py-10 text-center text-slate-500 dark:text-slate-400`}>No results found</td></tr>}</tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto border-y border-[#E5E8EC] dark:border-[#33373E]">
          <table className="w-full border-collapse text-left text-xs">
            <thead><tr><th className={TH}>Email</th><th className={TH}>Position</th><th className={TH}>Sent date</th><th className={TH}>Status</th><th className={`${TH} text-right`}>Actions</th></tr></thead>
            <tbody>{invitations.map((invitation) => (
              <tr key={invitation.id} className={ROW}>
                <td className={TD}>{invitation.email}</td><td className={TD}>{invitation.position}</td><td className={TD}>{invitation.sentDate}</td><td className={TD}>{invitation.status}</td>
                <td className={`${TD} text-right`}><button type="button" onClick={() => actions.resendEmployeeInvitation(invitation.id)} className="mr-3 cursor-pointer text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">Resend</button><button type="button" onClick={() => actions.revokeEmployeeInvitation(invitation.id)} className="cursor-pointer text-rose-600 hover:underline">Revoke</button></td>
              </tr>
            ))}{invitations.length === 0 && <tr><td colSpan={5} className={`${TD} py-10 text-center text-slate-500 dark:text-slate-400`}>No pending invitations</td></tr>}</tbody>
          </table>
        </div>
      )}
      <PaginationFooter total={total} />

      {editingEmployee !== null && (
        <EmployeeFormModal
          employee={editingEmployee === "new" ? undefined : editingEmployee}
          positions={state.positions}
          onClose={() => setEditingEmployee(null)}
          onSave={(input) => {
            if (editingEmployee === "new") actions.createEmployee(input);
            else actions.updateEmployee(editingEmployee.id, input);
            setEditingEmployee(null);
          }}
        />
      )}
    </div>
  );
}

function EmployeeFormModal({
  employee,
  positions,
  onClose,
  onSave,
}: {
  employee?: Employee;
  positions: PositionRole[];
  onClose: () => void;
  onSave: (input: { name: string; phone: string; login: string; position: string; pin: string }) => void;
}) {
  const [name, setName] = useState(employee?.name ?? "");
  const [phone, setPhone] = useState(employee?.phone ?? "");
  const [login, setLogin] = useState(employee?.login ?? "");
  const [position, setPosition] = useState(employee?.position ?? positions[0]?.title ?? "Cashier");
  const [pin, setPin] = useState(employee?.pin ?? "");
  const fieldClass = "w-full rounded-md border border-[#3E434C] bg-[#1D2024] px-3 py-2 text-xs text-white focus:border-[#4EA1FF] focus:outline-none";
  const labelClass = "mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="employee-form-title" className="w-full max-w-lg rounded-xl border border-[#33373E] bg-[#24272C] text-[#E6E8EC] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#33373E] px-5 py-4">
          <h2 id="employee-form-title" className="text-sm font-bold">{employee ? "Edit Employee" : "Add Employee"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer text-lg text-slate-400 hover:text-white">×</button>
        </div>
        <form className="space-y-3.5 p-5 text-xs" onSubmit={(event) => {
          event.preventDefault();
          onSave({ name: name.trim(), phone: phone.trim(), login: login.trim(), position, pin });
        }}>
          <div><label className={labelClass}>Name</label><input required value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Phone number</label><input value={phone} onChange={(event) => setPhone(event.target.value)} className={fieldClass} /></div>
            <div><label className={labelClass}>Login</label><input required value={login} onChange={(event) => setLogin(event.target.value)} className={fieldClass} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>4-digit PIN</label><input required inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))} className={`${fieldClass} font-mono`} /></div>
            <div><label className={labelClass}>Position</label><select required value={position} onChange={(event) => setPosition(event.target.value)} className={fieldClass}>{positions.map((entry) => <option key={entry.id} value={entry.title}>{entry.title}</option>)}</select></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="cursor-pointer rounded-md border border-[#3E434C] px-3 py-2 text-xs font-medium text-slate-300 hover:bg-[#33373E]">Cancel</button>
            <button type="submit" disabled={!name.trim() || !login.trim() || !/^\d{4}$/.test(pin)} className="cursor-pointer rounded-md bg-[#0077FF] px-4 py-2 text-xs font-bold text-white hover:bg-[#0067DF] disabled:cursor-not-allowed disabled:opacity-50">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserSessionsView() {
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("All time");
  const [openActionId, setOpenActionId] = useState("");
  const query = search.trim().toLowerCase();
  const sessions: UserSession[] = state.userSessions.filter((session) =>
    (!query || [session.user, session.device, session.browser, session.ip, session.loginTime].some((value) => value.toLowerCase().includes(query))) &&
    (!userFilter || session.employeeId === userFilter),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E8EC] pb-3.5 dark:border-[#33373E]">
        <div className="flex items-baseline gap-2.5"><h1 className="text-xl font-bold tracking-tight">User sessions</h1></div>
        <button type="button" aria-label="More session actions" onClick={() => actions.showToast("Session actions")} className="cursor-pointer rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#33373E]"><MoreVertical className="h-4 w-4" /></button>
      </div>
      <div className="flex flex-wrap items-center gap-2.5 py-3.5 text-xs">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." className="w-52 rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1A73E8] focus:outline-none dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white" />
        <select value={timeFilter} onChange={(event) => setTimeFilter(event.target.value)} className="cursor-pointer rounded-md border border-[#E5E8EC] bg-white px-2.5 py-1.5 font-medium text-[#1A73E8] dark:border-[#33373E] dark:bg-[#1D2024] dark:text-[#7EB3F5]"><option>All time</option><option>Last 7 days</option><option>Last 30 days</option></select>
        <select value={userFilter} onChange={(event) => setUserFilter(event.target.value)} className="cursor-pointer rounded-md border border-[#E5E8EC] bg-white px-2.5 py-1.5 font-medium text-[#1A73E8] dark:border-[#33373E] dark:bg-[#1D2024] dark:text-[#7EB3F5]"><option value="">User ▾</option>{state.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select>
        <button type="button" onClick={() => actions.showToast("Choose a filter to refine sessions", "blue")} className="rounded-md px-2.5 py-1.5 font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]">+ Filter ▾</button>
      </div>
      <div className="overflow-x-auto border-y border-[#E5E8EC] dark:border-[#33373E]">
        <table className="w-full border-collapse text-left text-xs">
          <thead><tr><th className={TH}>User</th><th className={TH}>Device</th><th className={TH}>Browser</th><th className={TH}>IP</th><th className={TH}>Login time ↓</th><th className={`${TH} w-12 text-right`}> </th></tr></thead>
          <tbody>{sessions.map((session) => (
            <tr key={session.id} className={ROW}>
              <td className={`${TD} font-medium`}><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#1DB954] align-middle" />{session.user}</td><td className={TD}>{session.device}</td><td className={TD}>{session.browser}</td><td className={`${TD} font-mono`}>{session.ip}</td><td className={TD}>{session.loginTime}</td>
              <td className={`${TD} relative text-right`}>
                <button type="button" aria-label={`Actions for ${session.user}`} onClick={() => setOpenActionId((current) => current === session.id ? "" : session.id)} className="cursor-pointer text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"><MoreVertical className="h-4 w-4" /></button>
                {openActionId === session.id && <div className="absolute right-2 top-9 z-10 min-w-36 rounded-md border border-[#E5E8EC] bg-white p-1 text-left shadow-lg dark:border-[#33373E] dark:bg-[#24272C]"><button type="button" onClick={() => { actions.terminateUserSession(session.id); setOpenActionId(""); }} className="w-full cursor-pointer rounded px-2 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">Terminate session</button></div>}
              </td>
            </tr>
          ))}{sessions.length === 0 && <tr><td colSpan={6} className={`${TD} py-10 text-center text-slate-500 dark:text-slate-400`}>No sessions found</td></tr>}</tbody>
        </table>
      </div>
      <PaginationFooter total={sessions.length} />
    </div>
  );
}

function PaginationFooter({ total }: { total: number }) {
  const page = total > 0 ? 1 : 0;
  const start = total > 0 ? 1 : 0;
  return <div className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs text-slate-500 dark:text-slate-400"><div className="flex items-center gap-2"><button type="button" disabled className="cursor-not-allowed">|&lt;</button><button type="button" disabled className="cursor-not-allowed">&lt;</button><span>Page {page} of {total > 0 ? 1 : 0}</span><button type="button" disabled className="cursor-not-allowed">&gt;</button><button type="button" disabled className="cursor-not-allowed">&gt;|</button></div><span>{start} to {total} of {total}</span></div>;
}

function IngredientsView() {
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const query = search.trim().toLowerCase();
  const ingredients = state.stockItems.filter(
    (item) => item.type === "Ingredient" && item.title.toLowerCase().includes(query) && (!category || item.category === category),
  );
  const ingredientMenuCost = (item: { id: string; cost: number }) =>
    item.id === "stk-4" || item.id === "stk-13" ? 0 : item.cost;
  const totalValue = ingredients.reduce((sum, item) => sum + item.stock * ingredientMenuCost(item), 0);
  const money = (value: number) => formatMoney(value, state.settings.currencySymbol);

  return (
    <div>
      <PageHeader
        title="Ingredients"
        count={13}
        actions={{
          columns: true,
          export: true,
          importLabel: "Import",
          print: true,
          addLabel: "Add",
          addOnClick: () => actions.openModal("add-supply"),
        }}
      />
      <FilterToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Quick search"
        pills={[{ label: "Unit ▾" }, { label: "+ Filter" }]}
      />
      <select value={category} onChange={(event) => setCategory(event.target.value)} className="mb-3 rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white">
        <option value="">Category ▾</option>
        {state.ingredientCategories.map((entry) => <option key={entry.id} value={entry.name}>{entry.name}</option>)}
      </select>
      <Card className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr>
              <th className={TH}>Title ▲</th>
              <th className={TH}>Category</th>
              <th className={TH}>Unit</th>
              <th className={TH}>Losses</th>
              <th className={`${TH} text-right`}>Inventory count</th>
              <th className={`${TH} text-right`}>Cost</th>
              <th className={`${TH} text-right`}>Value</th>
              <th className={TH}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((item) => (
              <tr key={item.id} className={ROW}>
                <td className={`${TD} font-medium text-[#1A73E8] dark:text-[#7EB3F5]`}>{item.title}</td>
                <td className={`${TD} text-slate-500 dark:text-slate-400`}>{item.category || "—"}</td>
                <td className={TD}>{item.unit}</td>
                <td className={`${TD} font-mono text-slate-500 dark:text-slate-400`}>
                  {item.unit === "kg" ? "0% 0% 0% 0%" : "—"}
                </td>
                <td className={`${TD} text-right font-mono`}>{formatQty(item.stock, item.unit)}</td>
                <td className={`${TD} text-right font-mono`}>{money(ingredientMenuCost(item))}</td>
                <td className={`${TD} text-right font-mono font-semibold`}>{money(item.stock * ingredientMenuCost(item))}</td>
                <td className={`${TD} whitespace-nowrap`}>
                  <button type="button" className="mr-3 text-[#1A73E8] hover:underline dark:text-[#7EB3F5]" onClick={() => actions.showToast(`Details for ${item.title}`)}>
                    Details
                  </button>
                  <button type="button" className="mr-3 text-[#1A73E8] hover:underline dark:text-[#7EB3F5]" onClick={() => actions.showToast(`Edit ${item.title}`)}>
                    Edit
                  </button>
                  <button type="button" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" onClick={() => actions.showToast(`More actions for ${item.title}`)}>
                    •••
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#E5E8EC] font-bold dark:border-[#33373E]">
              <td className={TD} colSpan={6}>Total</td>
              <td className={`${TD} text-right font-mono`}>{money(totalValue)}</td>
              <td className={TD} />
            </tr>
          </tfoot>
        </table>
      </Card>
    </div>
  );
}

function ProductCategoriesView() {
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editingId, setEditingId] = useState("");
  const [name, setName] = useState("");
  const query = search.trim().toLowerCase();
  const categories = state.menuCategories.filter((category) => category.name.toLowerCase().includes(query));

  const openAdd = () => {
    setName("");
    setEditingId("");
    setModal("add");
  };
  const openEdit = (id: string) => {
    const category = state.menuCategories.find((entry) => entry.id === id);
    if (!category) return;
    setName(category.name);
    setEditingId(id);
    setModal("edit");
  };
  const save = () => {
    if (modal === "add") actions.createMenuCategory(name);
    if (modal === "edit") actions.updateMenuCategory(editingId, name);
    setModal(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Categories of products and dishes"
        count={state.menuCategories.length}
        actions={{
          trash: true,
          addLabel: "Add",
          addOnClick: openAdd,
        }}
      />

      <div className="flex flex-col gap-4 rounded-xl border border-[#D8E9DB] bg-[#F0FAF2] p-5 text-[#1F2328] sm:flex-row sm:items-center dark:border-emerald-900/60 dark:bg-[#20362A] dark:text-emerald-50">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white text-4xl shadow-sm dark:bg-[#2C4835]">🧺</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-bold"><span className="text-emerald-600 dark:text-emerald-300">✓</span> Add a category</div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600 dark:text-emerald-100/80">
            Add categories of products and dishes for waiters to quickly find them on the Point of Sale. For example, Soups, Pastries, and Drinks. See the sales reports and food cost for these categories in the{" "}
            <Link href="/manage/dash/category" className="font-semibold text-[#1A73E8] hover:underline dark:text-emerald-300">Reports → Categories</Link>.
          </p>
        </div>
        <button type="button" onClick={openAdd} className="shrink-0 rounded-lg bg-[#1DB954] px-4 py-2 text-xs font-bold text-white hover:bg-[#18A348]">Continue</button>
      </div>

      <FilterToolbar search={search} onSearchChange={setSearch} placeholder="Quick search" showSearch />
      <Card className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead><tr><th className={TH}>Name</th><th className={`${TH} text-right`}>Actions</th></tr></thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className={ROW}>
                <td className={`${TD} flex items-center gap-3 font-medium`}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8EFF7] text-xl dark:bg-[#33373E]">{category.emoji}</span>
                  <span>{category.name}</span>
                </td>
                <td className={`${TD} text-right`}>
                  <button type="button" onClick={() => openEdit(category.id)} className="mr-4 text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">Edit</button>
                  <button type="button" onClick={() => actions.deleteMenuCategory(category.id)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">•••</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && <EmptyState emoji="🗂️" title="No categories found" description="Create a category to organize products and dishes on the POS." />}
      </Card>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-[#33373E] dark:bg-[#2C3036]">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">{modal === "add" ? "Add category" : "Edit category"}</h2>
              <button type="button" onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">×</button>
            </div>
            <label className="mt-5 block text-xs font-semibold">Category name
              <input autoFocus value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") save(); }} className="mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#1A73E8] dark:border-slate-600" placeholder="e.g. Soups" />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold dark:border-slate-600">Cancel</button>
              <button type="button" onClick={save} disabled={!name.trim()} className="rounded-lg bg-[#1DB954] px-4 py-2 text-xs font-bold text-white disabled:opacity-40">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StationsView() {
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editingId, setEditingId] = useState("");
  const [title, setTitle] = useState("");
  const [printTickets, setPrintTickets] = useState(true);
  const query = search.trim().toLowerCase();
  const stations = state.stations.filter((station) => station.title.toLowerCase().includes(query));

  const openAdd = () => {
    setEditingId("");
    setTitle("");
    setPrintTickets(true);
    setModal("add");
  };
  const openEdit = (id: string) => {
    const station = state.stations.find((entry) => entry.id === id);
    if (!station) return;
    setEditingId(id);
    setTitle(station.title);
    setPrintTickets(station.printTickets);
    setModal("edit");
  };
  const save = () => {
    if (modal === "add") actions.createStation(title, printTickets);
    if (modal === "edit") actions.updateStation(editingId, title, printTickets);
    setModal(null);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Stations"
        count={state.stations.length}
        actions={{
          columns: true,
          export: true,
          print: true,
          addLabel: "Add",
          addOnClick: openAdd,
        }}
      />
      <FilterToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Quick search"
        pills={[{ label: "+ Filter" }]}
      />
      <Card className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr>
              <th className={TH}>Title ▲</th>
              <th className={`${TH} text-right`}>Print tickets</th>
              <th className={`${TH} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stations.map((station) => (
              <tr key={station.id} className={ROW}>
                <td className={`${TD} font-medium`}>{station.title}</td>
                <td className={`${TD} text-right font-medium`}>{station.printTickets ? "Yes" : "No"}</td>
                <td className={`${TD} text-right whitespace-nowrap`}>
                  <button type="button" onClick={() => openEdit(station.id)} className="mr-4 text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">Edit</button>
                  <button type="button" onClick={() => actions.deleteStation(station.id)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">•••</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {stations.length === 0 && <EmptyState emoji="🍳" title="No stations found" description="Create a station to route POS orders to your Bar or Kitchen." />}
      </Card>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-[#33373E] dark:bg-[#2C3036]">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">{modal === "add" ? "Add station" : "Edit station"}</h2>
              <button type="button" onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">×</button>
            </div>
            <label className="mt-5 block text-xs font-semibold">
              Station Title
              <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") save(); }} className="mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#1A73E8] dark:border-slate-600" placeholder="e.g. Grill" />
            </label>
            <div className="mt-5 flex items-center justify-between rounded-lg border border-[#E5E8EC] px-3 py-3 text-xs dark:border-[#33373E]">
              <span className="font-semibold">Print tickets</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400">{printTickets ? "Yes" : "No"}</span>
                <Toggle checked={printTickets} onChange={() => setPrintTickets((value) => !value)} label="Print tickets" />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold dark:border-slate-600">Cancel</button>
              <button type="button" onClick={save} disabled={!title.trim()} className="rounded-lg bg-[#1DB954] px-4 py-2 text-xs font-bold text-white disabled:opacity-40">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StockView() {
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const [storage, setStorage] = useState("");
  const [type, setType] = useState("All");
  const [category, setCategory] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [shown, setShown] = useState(100);
  const query = search.trim().toLowerCase();
  const locations = state.storageLocations?.length ? state.storageLocations : ["Storage 1"];
  const stockAtStorage = (item: (typeof state.stockItems)[number], title: string) =>
    item.storageQuantities?.[title] ?? (title === locations[0] ? item.stock : 0);
  const items = state.stockItems.filter((item) =>
    item.title.toLowerCase().includes(query) &&
    (type === "All" || item.type === type) &&
    (!category || item.category === category) &&
    (!storage || stockAtStorage(item, storage) > 0),
  );
  const visibleItems = items.slice(0, shown);
  const valuation = state.stockItems.reduce((sum, item) => sum + item.stock * item.cost, 0);
  const prefix = (value: number) => formatMoneyPrefix(value, state.settings.currencySymbol);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-[#E5E8EC] pb-3.5 dark:border-[#33373E]">
        <h1 className="text-xl font-bold tracking-tight">Stock</h1>
        <div className="relative">
          <button
            type="button"
            aria-label="Stock actions"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-md px-2 py-1.5 text-xl leading-none text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
          >
            ⋮
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-40 rounded-lg border border-[#E5E8EC] bg-white p-1 text-xs shadow-xl dark:border-[#33373E] dark:bg-[#2C3036]">
              <button type="button" onClick={() => { actions.showToast("Stock exported to CSV", "success"); setMenuOpen(false); }} className="block w-full rounded px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/5">Export CSV</button>
              <button type="button" onClick={() => { window.print(); setMenuOpen(false); }} className="block w-full rounded px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/5">Print</button>
              <button type="button" onClick={() => { actions.openModal("add-supply"); setMenuOpen(false); }} className="block w-full rounded px-3 py-2 text-left text-[#1DB954] hover:bg-slate-100 dark:hover:bg-white/5">Add Supply</button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 py-3.5 text-xs">
        <div className="relative w-44">
          <input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setShown(100); }}
            placeholder="Search..."
            className="w-full rounded-md border border-[#D1D5DB] bg-white py-1.5 px-3 text-xs outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024]"
          />
        </div>
        <select value={storage} onChange={(event) => { setStorage(event.target.value); setShown(100); }} className="rounded-md border border-transparent bg-transparent px-2 py-1.5 font-medium text-[#1A73E8] outline-none dark:text-[#7EB3F5]">
          <option value="">Storage ▾</option>
          {locations.map((location) => <option key={location} value={location}>{location}</option>)}
        </select>
        <select value={type} onChange={(event) => { setType(event.target.value); setShown(100); }} className="rounded-md border border-transparent bg-transparent px-2 py-1.5 font-medium text-[#1A73E8] outline-none dark:text-[#7EB3F5]">
          <option value="All">Type ▾ (All)</option>
          <option value="Product">Product</option>
          <option value="Ingredient">Ingredient</option>
        </select>
        <select value={category} onChange={(event) => { setCategory(event.target.value); setShown(100); }} className="rounded-md border border-transparent bg-transparent px-2 py-1.5 font-medium text-[#1A73E8] outline-none dark:text-[#7EB3F5]">
          <option value="">Category ▾</option>
          {state.menuCategories.map((entry) => <option key={entry.id} value={entry.name}>{entry.name}</option>)}
        </select>
        <button type="button" onClick={() => actions.showToast("Additional stock filters are ready", "blue")} className="px-2 py-1.5 font-medium text-[#1A73E8] dark:text-[#7EB3F5]">+ Filter</button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr>
              <th className={TH}>Title ↑</th>
              <th className={TH}>Type</th>
              <th className={TH}>Category</th>
              <th className={`${TH} text-right`}>Stock</th>
              <th className={`${TH} text-right`}>Cost</th>
              <th className={`${TH} text-right`}>Sum</th>
              <th className={`${TH} text-right`}>Limit</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => (
              <Fragment key={item.id}>
                <tr key={item.id} className={ROW}>
                  <td className={TD}>
                    <button type="button" aria-label={`${expanded[item.id] ? "Collapse" : "Expand"} ${item.title}`} onClick={() => setExpanded((current) => ({ ...current, [item.id]: !current[item.id] }))} className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5">
                      {expanded[item.id] ? "⌄" : "›"}
                    </button>
                    <span className="font-medium">{item.title}</span>
                  </td>
                  <td className={TD}>{item.type}</td>
                  <td className={`${TD} text-slate-500 dark:text-slate-400`}>{item.category || "—"}</td>
                  <td className={`${TD} text-right font-mono`}>{formatQty(storage ? stockAtStorage(item, storage) : item.stock, item.unit)}</td>
                  <td className={`${TD} text-right font-mono`}>{prefix(item.cost)}</td>
                  <td className={`${TD} text-right font-mono font-semibold`}>{prefix((storage ? stockAtStorage(item, storage) : item.stock) * item.cost)}</td>
                  <td className={`${TD} text-right font-mono text-slate-400`}>{formatQty(item.limit, item.unit)}</td>
                </tr>
                {expanded[item.id] && (
                  <tr key={`${item.id}-storage`} className="bg-slate-50/80 dark:bg-white/[0.02]">
                    <td className={`${TD} pl-10 text-slate-500 dark:text-slate-400`} colSpan={3}>{storage || locations[0]}</td>
                    <td className={`${TD} text-right font-mono`}>{formatQty(storage ? stockAtStorage(item, storage) : item.stock, item.unit)}</td>
                    <td className={`${TD} text-right font-mono`}>{prefix(item.cost)}</td>
                    <td className={`${TD} text-right font-mono`}>{prefix((storage ? stockAtStorage(item, storage) : item.stock) * item.cost)}</td>
                    <td className={TD} />
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#E5E8EC] font-bold dark:border-[#33373E]">
              <td className={TD}>Total</td>
              <td className={TD} /><td className={TD} /><td className={TD} /><td className={TD} />
              <td className={`${TD} text-right font-mono`}>{prefix(valuation)}</td>
              <td className={TD} />
            </tr>
          </tfoot>
        </table>
        {items.length > shown && (
          <button
            type="button"
            onClick={() => setShown((count) => count + 100)}
            className="block w-full cursor-pointer border-t border-[#E5E8EC] px-3 py-2.5 text-center text-xs font-bold text-[#1A73E8] hover:bg-slate-50 dark:border-[#33373E] dark:text-[#7EB3F5] dark:hover:bg-white/[0.03]"
          >
            Show more ({items.length - shown} remaining)
          </button>
        )}
      </Card>
      <div className="flex items-center justify-between py-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1"><button type="button" className="px-1">‹</button><span>Page 1 of 1</span><button type="button" className="px-1">›</button><button type="button" className="px-1">›|</button></div>
        <span>{Math.min(shown, items.length)} to {items.length} of {state.stockItems.length}</span>
      </div>
    </div>
  );
}

function SuppliesView() {
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const [supplier, setSupplier] = useState("");
  const [account, setAccount] = useState("");
  const [category, setCategory] = useState("");
  const [bannerVisible, setBannerVisible] = useState(true);
  const [selectedSupplyId, setSelectedSupplyId] = useState<string | null>(null);
  const query = search.trim().toLowerCase();
  const supplies = state.supplies.filter((supply) => {
    const productText = supply.lines.map((line) => line.title).join(" ").toLowerCase();
    return (
      (!query || `${supply.number} ${supply.supplier} ${productText} ${supply.comment}`.toLowerCase().includes(query)) &&
      (!supplier || supply.supplier === supplier) &&
      (!account || supply.account === account) &&
      (!category || supply.lines.some((line) => state.stockItems.find((item) => item.id === line.stockId)?.category === category))
    );
  });
  const selectedSupply = state.supplies.find((supply) => supply.id === selectedSupplyId);
  const suffix = (value: number) => formatMoney(value, state.settings.currencySymbol);
  const total = supplies.reduce((sum, supply) => sum + supply.sum, 0);
  const due = supplies.reduce((sum, supply) => sum + supply.paymentDue, 0);

  return (
    <div>
      <PageHeader
        title="Supplies"
        count={supplies.length}
        actions={{
          columns: true,
          export: true,
          print: true,
          dateRange: "Full calendar ▾",
          aiImport: true,
          addLabel: "Add",
          addOnClick: () => actions.openModal("add-supply"),
        }}
      />

      {bannerVisible && (
        <div className="mt-4 flex items-center gap-3 rounded-md border border-[#C5DDF5] bg-[#E6F4FA] px-3 py-2.5 text-slate-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-100">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-sm">P</div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold">Add supplies 5 times faster!</div>
            <div className="text-[11px] text-slate-600 dark:text-sky-200">AI assistant Postie automatically recognizes invoices from photos or PDF documents.</div>
          </div>
          <button type="button" onClick={() => actions.openModal("postie-ai")} className="shrink-0 rounded-md border border-slate-400 bg-white/70 px-3 py-1.5 text-xs font-semibold hover:bg-white dark:border-sky-700 dark:bg-sky-950/30 dark:hover:bg-sky-900/40">Recognize</button>
          <button type="button" aria-label="Dismiss Postie banner" onClick={() => setBannerVisible(false)} className="ml-1 shrink-0 text-lg leading-none text-slate-500 hover:text-slate-900 dark:text-sky-300 dark:hover:text-white">×</button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 py-3.5 text-xs">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Quick search" className="w-44 rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024]" />
        <select value={supplier} onChange={(event) => setSupplier(event.target.value)} className="rounded-md border border-transparent bg-transparent px-2 py-1.5 font-medium text-[#1A73E8] outline-none dark:text-[#7EB3F5]">
          <option value="">Supplier ▾</option>
          {state.suppliers.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
        </select>
        <select value={account} onChange={(event) => setAccount(event.target.value)} className="rounded-md border border-transparent bg-transparent px-2 py-1.5 font-medium text-[#1A73E8] outline-none dark:text-[#7EB3F5]">
          <option value="">Account ▾</option>
          {state.accounts.map((item) => <option key={item.id} value={accountDisplayName(item, state.settings.companyName)}>{accountDisplayName(item, state.settings.companyName)}</option>)}
        </select>
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-md border border-transparent bg-transparent px-2 py-1.5 font-medium text-[#1A73E8] outline-none dark:text-[#7EB3F5]">
          <option value="">Categories ▾</option>
          {state.menuCategories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
        </select>
        <button type="button" onClick={() => actions.showToast("Additional supply filters are ready", "blue")} className="px-2 py-1.5 font-medium text-[#1A73E8] dark:text-[#7EB3F5]">+ Filter</button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr>
              <th className={`${TH} w-12`}>№</th>
              <th className={TH}>Date ▾</th>
              <th className={TH}>Supplier</th>
              <th className={TH}>Storage</th>
              <th className={TH}>Account</th>
              <th className={TH}>Products</th>
              <th className={TH}>Comment</th>
              <th className={TH}>Status</th>
              <th className={`${TH} text-right`}>Sum</th>
              <th className={`${TH} text-right`}>Payment due</th>
              <th className={TH}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {supplies.map((supply) => (
              <tr key={supply.id} className={ROW}>
                <td className={TD}>{supply.number}</td>
                <td className={`${TD} whitespace-nowrap`}>{supply.date}</td>
                <td className={TD}>{supply.supplier}</td>
                <td className={`${TD} whitespace-nowrap`}>{supply.storage}</td>
                <td className={`${TD} whitespace-nowrap`}>{supply.account || "—"}</td>
                <td className={`${TD} max-w-[260px] truncate`} title={supply.lines.map((line) => line.title).join(", ")}>{supply.lines.map((line) => line.title).join(", ")}</td>
                <td className={TD}>{supply.comment || "—"}</td>
                <td className={TD}><span className="rounded-full bg-[#DDF4E8] px-2 py-1 font-semibold text-[#16883F] dark:bg-emerald-900/40 dark:text-emerald-300">{supply.status}</span></td>
                <td className={`${TD} whitespace-nowrap text-right font-mono font-semibold`}>{suffix(supply.sum)}</td>
                <td className={`${TD} whitespace-nowrap text-right font-mono`}>{suffix(supply.paymentDue)}</td>
                <td className={`${TD} whitespace-nowrap`}>
                  <button type="button" onClick={() => setSelectedSupplyId(supply.id)} className="mr-3 text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">Details</button>
                  <button type="button" onClick={() => actions.showToast("Supply editing is ready", "blue")} className="mr-3 text-slate-600 hover:underline dark:text-slate-300">Edit</button>
                  <button type="button" onClick={() => actions.showToast("Supply actions menu", "info")} className="text-slate-500 dark:text-slate-400">•••</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#E5E8EC] font-bold dark:border-[#33373E]">
              <td className={TD} colSpan={8}>Total</td>
              <td className={`${TD} whitespace-nowrap text-right font-mono`}>{suffix(total)}</td>
              <td className={`${TD} whitespace-nowrap text-right font-mono text-slate-400`}>{suffix(due)}</td>
              <td className={TD} />
            </tr>
          </tfoot>
        </table>
      </Card>

      {selectedSupply && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedSupplyId(null); }}>
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-[#33373E] dark:bg-[#2C3036]">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-[#33373E]">
              <div><h2 className="font-bold">Supply № {selectedSupply.number}</h2><p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{selectedSupply.date}</p></div>
              <button type="button" aria-label="Close supply details" onClick={() => setSelectedSupplyId(null)} className="text-xl text-slate-400 hover:text-slate-700 dark:hover:text-white">×</button>
            </div>
            <div className="p-5">
              <div className="mb-4 grid grid-cols-2 gap-3 text-xs"><div><span className="text-slate-500 dark:text-slate-400">Supplier</span><div className="mt-1 font-semibold">{selectedSupply.supplier}</div></div><div><span className="text-slate-500 dark:text-slate-400">Storage</span><div className="mt-1 font-semibold">{selectedSupply.storage}</div></div></div>
              <table className="w-full text-xs">
                <thead><tr><th className={`${TH} pl-0`}>Product / ingredient</th><th className={`${TH} text-right`}>Quantity</th><th className={`${TH} text-right`}>Cost</th><th className={`${TH} pr-0 text-right`}>Sum</th></tr></thead>
                <tbody>{selectedSupply.lines.map((line) => <tr key={`${selectedSupply.id}-${line.stockId}`} className="border-b border-slate-100 dark:border-[#33373E]"><td className="py-2.5">{line.title}</td><td className="py-2.5 text-right font-mono">{formatQty(line.quantity, line.unit)}</td><td className="py-2.5 text-right font-mono">{suffix(line.cost)}</td><td className="py-2.5 text-right font-mono font-semibold">{suffix(line.quantity * line.cost)}</td></tr>)}</tbody>
              </table>
              <div className="mt-4 flex justify-end gap-8 text-xs"><span className="font-semibold">Total</span><span className="font-mono font-bold">{suffix(selectedSupply.sum)}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ButcheriesView() {
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("Last 30 days");
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const query = search.trim().toLowerCase();
  const records = state.butcheries.filter((record) =>
    !query ||
    record.primary.title.toLowerCase().includes(query) ||
    record.finals.some((line) => line.title.toLowerCase().includes(query)),
  );
  const suffix = (value: number) => formatMoney(value, state.settings.currencySymbol);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-[#E5E8EC] pb-3.5 dark:border-[#33373E]">
        <h1 className="text-xl font-bold tracking-tight">Butcheries</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button type="button" aria-label="Butchery actions" onClick={() => setMenuOpen((open) => !open)} className="rounded-md px-2 py-1.5 text-xl leading-none text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5">⋮</button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-20 w-40 rounded-lg border border-[#E5E8EC] bg-white p-1 text-xs shadow-xl dark:border-[#33373E] dark:bg-[#2C3036]">
                <button type="button" onClick={() => { actions.showToast("Butcheries exported to CSV", "success"); setMenuOpen(false); }} className="block w-full rounded px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/5">Export CSV</button>
                <button type="button" onClick={() => { window.print(); setMenuOpen(false); }} className="block w-full rounded px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/5">Print</button>
              </div>
            )}
          </div>
          <button type="button" onClick={() => actions.openModal("add-butchery")} className="rounded-md bg-[#0077FF] px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#0066DD]">Add</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 py-3.5 text-xs">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." className="w-44 rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024]" />
        <select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-md border border-transparent bg-transparent px-2 py-1.5 font-medium text-[#1A73E8] outline-none dark:text-[#7EB3F5]">
          <option>Last 30 days</option>
          <option>Last 7 days</option>
          <option>This month</option>
        </select>
        <button type="button" onClick={() => actions.showToast("Additional butchery filters are ready", "blue")} className="px-2 py-1.5 font-medium text-[#1A73E8] dark:text-[#7EB3F5]">+ Filter ▾</button>
      </div>

      {records.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-[#E5E8EC] bg-white text-center dark:border-[#33373E] dark:bg-[#24272C]">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
            <Inbox className="h-6 w-6" />
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">No results found</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Try adjusting your search or filters.</div>
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr>
                <th className={TH}>Date ↓</th>
                <th className={TH}>Primary items</th>
                <th className={TH}>Final items</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <Fragment key={record.id}>
                  <tr className={ROW}>
                    <td className={`${TD} whitespace-nowrap`}>
                      <button type="button" aria-label={`${expanded[record.id] ? "Collapse" : "Expand"} butchery`} onClick={() => setExpanded((current) => ({ ...current, [record.id]: !current[record.id] }))} className="mr-2 text-slate-400">
                        {expanded[record.id] ? "⌄" : "›"}
                      </button>
                      {record.date}
                    </td>
                    <td className={TD}>{record.primary.title} × {formatQty(record.primary.quantity, record.primary.unit)}</td>
                    <td className={TD}>{record.finals.map((line) => `${line.title} × ${formatQty(line.quantity, line.unit)}`).join(", ")}</td>
                  </tr>
                  {expanded[record.id] && (
                    <tr className="bg-slate-50/80 dark:bg-white/[0.02]">
                      <td className={`${TD} pl-10 text-slate-500 dark:text-slate-400`}>{record.storage}</td>
                      <td className={`${TD} text-slate-500 dark:text-slate-400`}>{record.comment || "No comment"}</td>
                      <td className={`${TD} text-right font-mono font-semibold`}>{suffix(record.sum)}</td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <div className="flex items-center justify-between py-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <button type="button" className="px-1">|&lt;</button><button type="button" className="px-1">&lt;</button>
          <span>Page {records.length ? 1 : 0} of {records.length ? 1 : 0}</span>
          <button type="button" className="px-1">&gt;</button><button type="button" className="px-1">&gt;|</button>
        </div>
        <span>{records.length ? `1 to ${records.length} of ${records.length}` : "0 to 0 of 0"}</span>
      </div>
    </div>
  );
}

function TransfersView() {
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("Last 30 days");
  const [storage, setStorage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const query = search.trim().toLowerCase();
  const locations = state.storageLocations?.length ? state.storageLocations : ["Storage 1"];
  const records = state.transfers.filter((record) =>
    (!query || `${record.name} ${record.employee} ${record.fromStorage} ${record.toStorage}`.toLowerCase().includes(query)) &&
    (!storage || record.fromStorage === storage || record.toStorage === storage),
  );
  const suffix = (value: number) => formatMoney(value, state.settings.currencySymbol);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-[#E5E8EC] pb-3.5 dark:border-[#33373E]">
        <h1 className="text-xl font-bold tracking-tight">Transfers</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button type="button" aria-label="Transfer actions" onClick={() => setMenuOpen((open) => !open)} className="rounded-md px-2 py-1.5 text-xl leading-none text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5">⋮</button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-20 w-40 rounded-lg border border-[#E5E8EC] bg-white p-1 text-xs shadow-xl dark:border-[#33373E] dark:bg-[#2C3036]">
                <button type="button" onClick={() => { actions.showToast("Transfers exported to CSV", "success"); setMenuOpen(false); }} className="block w-full rounded px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/5">Export CSV</button>
                <button type="button" onClick={() => { window.print(); setMenuOpen(false); }} className="block w-full rounded px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/5">Print</button>
              </div>
            )}
          </div>
          <button type="button" onClick={() => actions.openModal("add-transfer")} className="rounded-md bg-[#0077FF] px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#0066DD]">Add</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 py-3.5 text-xs">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." className="w-44 rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024]" />
        <select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-md border border-transparent bg-transparent px-2 py-1.5 font-medium text-[#1A73E8] outline-none dark:text-[#7EB3F5]">
          <option>Last 30 days</option><option>Last 7 days</option><option>This month</option>
        </select>
        <select value={storage} onChange={(event) => setStorage(event.target.value)} className="rounded-md border border-transparent bg-transparent px-2 py-1.5 font-medium text-[#1A73E8] outline-none dark:text-[#7EB3F5]">
          <option value="">Storage locations ▾</option>
          {locations.map((location) => <option key={location} value={location}>{location}</option>)}
        </select>
        <button type="button" onClick={() => actions.showToast("Additional transfer filters are ready", "blue")} className="px-2 py-1.5 font-medium text-[#1A73E8] dark:text-[#7EB3F5]">+ Filter ▾</button>
      </div>

      {records.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-[#E5E8EC] bg-white text-center dark:border-[#33373E] dark:bg-[#24272C]">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500"><Inbox className="h-6 w-6" /></div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">No results found</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Try adjusting your search or filters.</div>
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead><tr><th className={TH}>Date ↓</th><th className={TH}>Name</th><th className={`${TH} text-right`}>Sum</th><th className={TH}>Employee</th><th className={TH}>Storage locations</th></tr></thead>
            <tbody>{records.map((record) => (
              <tr key={record.id} className={ROW}>
                <td className={`${TD} whitespace-nowrap`}>{record.date}</td>
                <td className={TD}>{record.name}</td>
                <td className={`${TD} whitespace-nowrap text-right font-mono font-semibold`}>{suffix(record.sum)}</td>
                <td className={TD}>{record.employee}</td>
                <td className={`${TD} whitespace-nowrap`}>{record.fromStorage} → {record.toStorage}</td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      )}

      <div className="flex items-center justify-between py-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1"><button type="button" className="px-1">|&lt;</button><button type="button" className="px-1">&lt;</button><span>Page {records.length ? 1 : 0} of {records.length ? 1 : 0}</span><button type="button" className="px-1">&gt;</button><button type="button" className="px-1">&gt;|</button></div>
        <span>{records.length ? `1 to ${records.length} of ${records.length}` : "0 to 0 of 0"}</span>
      </div>
    </div>
  );
}

function StockDeductionsView() {
  const { state, actions } = usePosStore();
  const [tab, setTab] = useState<"list" | "reasons">("list");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("All time");
  const [storage, setStorage] = useState("");
  const [category, setCategory] = useState("");
  const [reason, setReason] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const query = search.trim().toLowerCase();
  const locations = state.storageLocations?.length ? state.storageLocations : ["Storage 1"];
  const records = state.stockDeductions.filter((record) => {
    const products = record.products.map((line) => line.title).join(" ").toLowerCase();
    return (
      (!query || `${record.employee} ${record.reason} ${products}`.toLowerCase().includes(query)) &&
      (!storage || record.storage === storage) &&
      (!reason || record.reason === reason) &&
      (!category || record.products.some((line) => state.stockItems.find((item) => item.id === line.stockId)?.category === category))
    );
  });
  const suffix = (value: number) => formatMoney(value, state.settings.currencySymbol);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-[#E5E8EC] pb-0 dark:border-[#33373E]">
        <div className="flex items-end gap-5">
          <h1 className="pb-3.5 text-xl font-bold tracking-tight">Stock deductions</h1>
          <div className="flex items-end gap-4 text-xs">
            <button type="button" onClick={() => setTab("list")} className={`border-b-2 pb-3.5 font-bold ${tab === "list" ? "border-[#1F2328] text-[#1F2328] dark:border-white dark:text-white" : "border-transparent text-slate-500 dark:text-slate-400"}`}>List</button>
            <button type="button" onClick={() => setTab("reasons")} className={`border-b-2 pb-3.5 font-semibold ${tab === "reasons" ? "border-[#4EA1FF] text-[#4EA1FF]" : "border-transparent text-[#4EA1FF]"}`}>Waste reasons</button>
          </div>
        </div>
        <div className="flex items-center gap-2 pb-2.5">
          <div className="relative">
            <button type="button" aria-label="Stock deduction actions" onClick={() => setMenuOpen((open) => !open)} className="rounded-md px-2 py-1.5 text-xl leading-none text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5">⋮</button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-20 w-40 rounded-lg border border-[#E5E8EC] bg-white p-1 text-xs shadow-xl dark:border-[#33373E] dark:bg-[#2C3036]">
                <button type="button" onClick={() => { actions.showToast("Stock deductions exported to CSV", "success"); setMenuOpen(false); }} className="block w-full rounded px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/5">Export CSV</button>
                <button type="button" onClick={() => { window.print(); setMenuOpen(false); }} className="block w-full rounded px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/5">Print</button>
              </div>
            )}
          </div>
          <button type="button" onClick={() => actions.openModal(tab === "list" ? "add-stock-deduction" : "add-waste-reason")} className="rounded-md bg-[#0077FF] px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#0066DD]">Add</button>
        </div>
      </div>

      {tab === "list" ? (
        <>
          <div className="flex flex-wrap items-center gap-2 py-3.5 text-xs">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." className="w-44 rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024]" />
            <select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-md border border-transparent bg-transparent px-2 py-1.5 font-medium text-[#1A73E8] outline-none dark:text-[#7EB3F5]"><option>All time</option><option>Last 30 days</option><option>Last 7 days</option></select>
            <select value={storage} onChange={(event) => setStorage(event.target.value)} className="rounded-md border border-transparent bg-transparent px-2 py-1.5 font-medium text-[#1A73E8] outline-none dark:text-[#7EB3F5]"><option value="">Storage ▾</option>{locations.map((location) => <option key={location} value={location}>{location}</option>)}</select>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-md border border-transparent bg-transparent px-2 py-1.5 font-medium text-[#1A73E8] outline-none dark:text-[#7EB3F5]"><option value="">Categories ▾</option>{state.menuCategories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select>
            <select value={reason} onChange={(event) => setReason(event.target.value)} className="rounded-md border border-transparent bg-transparent px-2 py-1.5 font-medium text-[#1A73E8] outline-none dark:text-[#7EB3F5]"><option value="">Reason ▾</option>{state.wasteReasons.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select>
            <button type="button" onClick={() => actions.showToast("Additional deduction filters are ready", "blue")} className="px-2 py-1.5 font-medium text-[#1A73E8] dark:text-[#7EB3F5]">+ Filter ▾</button>
          </div>

          {records.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-[#E5E8EC] bg-white text-center dark:border-[#33373E] dark:bg-[#24272C]">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500"><Inbox className="h-6 w-6" /></div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">No results found</div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Try adjusting your search or filters.</div>
            </div>
          ) : (
            <Card className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead><tr><th className={TH}>Date ↓</th><th className={TH}>Storage</th><th className={TH}>Products</th><th className={`${TH} text-right`}>Sum</th><th className={TH}>Employee</th><th className={TH}>Reason</th></tr></thead>
                <tbody>{records.map((record) => (
                  <tr key={record.id} className={ROW}>
                    <td className={`${TD} whitespace-nowrap`}>{record.date}</td>
                    <td className={`${TD} whitespace-nowrap`}>{record.storage}</td>
                    <td className={`${TD} max-w-[260px] truncate`} title={record.products.map((line) => line.title).join(", ")}>{record.products.map((line) => `${line.title} × ${formatQty(line.quantity, line.unit)}`).join(", ")}</td>
                    <td className={`${TD} whitespace-nowrap text-right font-mono font-semibold`}>{suffix(record.sum)}</td>
                    <td className={TD}>{record.employee}</td>
                    <td className={TD}>{record.reason}</td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
          )}
          <div className="flex items-center justify-between py-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1"><button type="button" className="px-1">|&lt;</button><button type="button" className="px-1">&lt;</button><span>Page {records.length ? 1 : 0} of {records.length ? 1 : 0}</span><button type="button" className="px-1">&gt;</button><button type="button" className="px-1">&gt;|</button></div>
            <span>{records.length ? `1 to ${records.length} of ${records.length}` : "0 to 0 of 0"}</span>
          </div>
        </>
      ) : (
        <>
          <div className="py-3.5" />
          <Card className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead><tr><th className={TH}>Name ▲</th><th className={`${TH} text-right`}>Actions</th></tr></thead>
              <tbody>{state.wasteReasons.map((item) => (
                <tr key={item.id} className={ROW}><td className={`${TD} font-medium`}>{item.name}</td><td className={`${TD} text-right whitespace-nowrap`}><button type="button" onClick={() => actions.showToast(`Editing "${item.name}"`, "blue")} className="mr-4 text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">Edit</button><button type="button" onClick={() => actions.showToast(`Actions for "${item.name}"`, "info")} className="text-slate-500 dark:text-slate-400">•••</button></td></tr>
              ))}</tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}

function IngredientsMovementsView() {
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("Last 7 days");
  const [storage, setStorage] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("All");
  const [category, setCategory] = useState("");
  const [showIngredients, setShowIngredients] = useState("All");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [suppliesExpanded, setSuppliesExpanded] = useState<Record<string, boolean>>({});
  const [expenseExpanded, setExpenseExpanded] = useState<Record<string, boolean>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const query = search.trim().toLowerCase();

  const items = state.stockItems.filter((item) =>
    (!query || item.title.toLowerCase().includes(query)) &&
    (type === "All" || item.type === type) &&
    (!category || item.category === category) &&
    (showIngredients === "All" || (showIngredients === "Ingredients" ? item.type === "Ingredient" : item.type === "Product")),
  );
  const prefix = (value: number) => formatMoneyPrefix(value, state.settings.currencySymbol);
  const qtyText = (value: number, unit: string) => formatQty(value, unit);

  const supplyQty = (itemId: string) =>
    state.supplies.reduce((sum, supply) =>
      sum + supply.lines.filter((line) => line.stockId === itemId).reduce((lineSum, line) => lineSum + line.quantity, 0), 0);

  const butcheryFinalQty = (itemId: string) =>
    state.butcheries.reduce((sum, butchery) =>
      sum + butchery.finals.filter((line) => line.stockId === itemId).reduce((lineSum, line) => lineSum + line.quantity, 0), 0);

  const butcheryPrimaryQty = (itemId: string) =>
    state.butcheries.reduce((sum, butchery) =>
      sum + (butchery.primary.stockId === itemId ? butchery.primary.quantity : 0), 0);

  const salesQty = (itemId: string) =>
    state.stockMovements
      .filter((movement) => movement.title === state.stockItems.find((item) => item.id === itemId)?.title && movement.reason.startsWith("Receipt #"))
      .reduce((sum, movement) => sum + Math.abs(movement.delta), 0);

  const wasteQty = (itemId: string) =>
    state.stockMovements
      .filter((movement) => movement.title === state.stockItems.find((item) => item.id === itemId)?.title &&
        (movement.reason.startsWith("Stock deduction:") || movement.reason === "Manual deduction"))
      .reduce((sum, movement) => sum + Math.abs(movement.delta), 0);

  const manufactureQty = (itemId: string) =>
    state.stockMovements
      .filter((movement) => movement.title === state.stockItems.find((item) => item.id === itemId)?.title &&
        (movement.reason.startsWith("Preparation") || movement.reason.startsWith("Manufacture")))
      .reduce((sum, movement) => sum + Math.abs(movement.delta), 0);

  const inventorySurplusQty = (itemId: string) =>
    state.stockMovements
      .filter((movement) => movement.title === state.stockItems.find((item) => item.id === itemId)?.title &&
        movement.reason === "Inventory check surplus")
      .reduce((sum, movement) => sum + Math.max(0, movement.delta), 0);

  const inventoryShortageQty = (itemId: string) =>
    state.stockMovements
      .filter((movement) => movement.title === state.stockItems.find((item) => item.id === itemId)?.title &&
        movement.reason === "Inventory check shortage")
      .reduce((sum, movement) => sum + Math.abs(movement.delta), 0);

  const supplyCost = (itemId: string, quantity: number) => {
    const item = state.stockItems.find((entry) => entry.id === itemId);
    if (!item || quantity === 0) return 0;
    return quantity * item.cost;
  };

  const totalSupplies = (itemId: string) => supplyQty(itemId) + butcheryFinalQty(itemId) + inventorySurplusQty(itemId);

  const expenseQty = (itemId: string) =>
    salesQty(itemId) + wasteQty(itemId) + manufactureQty(itemId) + inventoryShortageQty(itemId) + butcheryPrimaryQty(itemId);

  const totalFinalCost = items.reduce((sum, item) => {
    const finalBalance = 0 + totalSupplies(item.id) - expenseQty(item.id);
    return sum + finalBalance * item.cost;
  }, 0);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-[#E5E8EC] pb-3.5 dark:border-[#33373E]">
        <h1 className="text-xl font-bold tracking-tight">Ingredients movements</h1>
        <div className="relative">
          <button type="button" aria-label="Movement actions" onClick={() => setMenuOpen((open) => !open)} className="rounded-md px-2 py-1.5 text-xl leading-none text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5">⋮</button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-44 rounded-lg border border-[#E5E8EC] bg-white p-1 text-xs shadow-xl dark:border-[#33373E] dark:bg-[#2C3036]">
              <button type="button" onClick={() => { actions.showToast("Ingredients movements exported to CSV", "success"); setMenuOpen(false); }} className="block w-full rounded px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/5">CSV Export</button>
              <button type="button" onClick={() => { window.print(); setMenuOpen(false); }} className="block w-full rounded px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/5">Print</button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 py-3.5 text-xs">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." className="w-44 rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024]" />
        <select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-md border border-transparent bg-transparent px-2 py-1.5 font-medium text-[#1A73E8] outline-none dark:text-[#7EB3F5]"><option>Last 7 days</option><option>Last 30 days</option><option>All time</option></select>
        <select value={storage} onChange={(event) => setStorage(event.target.value)} className="rounded-md border border-transparent bg-transparent px-2 py-1.5 font-medium text-[#1A73E8] outline-none dark:text-[#7EB3F5]"><option value="">Storage ▾</option>{state.storageLocations.map((location) => <option key={location} value={location}>{location}</option>)}</select>
        <select value={location} onChange={(event) => setLocation(event.target.value)} className="rounded-md border border-transparent bg-transparent px-2 py-1.5 font-medium text-[#1A73E8] outline-none dark:text-[#7EB3F5]"><option value="">Location ▾</option><option>tanawa</option></select>
        <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-md border border-transparent bg-transparent px-2 py-1.5 font-medium text-[#1A73E8] outline-none dark:text-[#7EB3F5]"><option value="All">Type ▾</option><option>Product</option><option>Ingredient</option></select>
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-md border border-transparent bg-transparent px-2 py-1.5 font-medium text-[#1A73E8] outline-none dark:text-[#7EB3F5]"><option value="">Category ▾</option>{state.menuCategories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select>
        <select value={showIngredients} onChange={(event) => setShowIngredients(event.target.value)} className="rounded-md border border-transparent bg-transparent px-2 py-1.5 font-medium text-[#1A73E8] outline-none dark:text-[#7EB3F5]"><option value="All">Show ingredients ▾</option><option value="Ingredients">Ingredients</option><option value="Products">Products</option></select>
        <button type="button" onClick={() => actions.showToast("Additional movement filters are ready", "blue")} className="px-2 py-1.5 font-medium text-[#1A73E8] dark:text-[#7EB3F5]">+ Filter ▾</button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr>
              <th className={TH}>Title ↑</th><th className={TH}>Type</th>
              <th className={`${TH} text-right`}>Initial balance</th><th className={`${TH} text-right`}>Initial avg. cost</th><th className={`${TH} text-right`}>Initial cost</th>
              <th className={`${TH} text-right`}>Supplies</th><th className={`${TH} text-right`}>Expense</th><th className={`${TH} text-right`}>Final balance</th>
              <th className={`${TH} text-right`}>Final avg. cost</th><th className={`${TH} text-right`}>Tot. cost</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const supplies = totalSupplies(item.id);
              const expense = expenseQty(item.id);
              const finalBalance = supplies - expense;
              const supply = supplyQty(item.id);
              const butcheryFinal = butcheryFinalQty(item.id);
              const sales = salesQty(item.id);
              const waste = wasteQty(item.id);
              const manufacture = manufactureQty(item.id);
              const butcheryPrimary = butcheryPrimaryQty(item.id);
              const inventorySurplus = inventorySurplusQty(item.id);
              const inventoryShortage = inventoryShortageQty(item.id);
              const isOpen = expanded[item.id];
              return (
                <Fragment key={item.id}>
                  <tr className={`${ROW} cursor-pointer`} onClick={() => setExpanded((current) => ({ ...current, [item.id]: !current[item.id] }))}>
                    <td className={TD}><button type="button" aria-label={`${isOpen ? "Collapse" : "Expand"} ${item.title}`} className="mr-2 text-slate-400">{isOpen ? "v" : ">"}</button><span className="font-medium">{item.title}</span></td>
                    <td className={TD}>{item.type}</td>
                    <td className={`${TD} text-right font-mono`}>{qtyText(0, item.unit)}</td>
                    <td className={`${TD} text-right font-mono`}>{prefix(0)}</td>
                    <td className={`${TD} text-right font-mono`}>{prefix(0)}</td>
                    <td className={`${TD} text-right font-mono`}>{qtyText(supplies, item.unit)}</td>
                    <td className={`${TD} text-right font-mono`}>{qtyText(expense, item.unit)}</td>
                    <td className={`${TD} text-right font-mono font-semibold`}>{qtyText(finalBalance, item.unit)}</td>
                    <td className={`${TD} text-right font-mono`}>{prefix(item.cost)}</td>
                    <td className={`${TD} text-right font-mono font-semibold`}>{prefix(finalBalance * item.cost)}</td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={10} className="p-0">
                        <div className="border-t border-[#E5E8EC] bg-slate-50/70 dark:border-[#33373E] dark:bg-white/[0.02]">
                          <table className="ml-12 w-[calc(100%-3rem)] text-xs">
                            <tbody>
                              <tr className="border-b border-slate-200 dark:border-[#33373E]">
                                <td colSpan={3}>
                                  <button type="button" onClick={() => setSuppliesExpanded((current) => ({ ...current, [item.id]: !current[item.id] }))} className="px-3 py-2 font-bold text-slate-700 dark:text-slate-200">{suppliesExpanded[item.id] === false ? "> Supplies" : "v Supplies"}</button>
                                </td>
                              </tr>
                              {suppliesExpanded[item.id] !== false && [
                                ["Supply", supply, supplyCost(item.id, supply)],
                                ["Inventory", inventorySurplus, supplyCost(item.id, inventorySurplus)],
                                ["Butchery", butcheryFinal, supplyCost(item.id, butcheryFinal)],
                              ].map(([label, amount, cost]) => (
                                <tr key={String(label)} className="border-b border-slate-100 last:border-0 dark:border-[#33373E]/60">
                                  <td className="py-2 pl-8">{String(label)}</td>
                                  <td className="py-2 text-right font-mono">{Number(amount) > 0 ? qtyText(Number(amount), item.unit) : "—"}</td>
                                  <td className="py-2 pr-4 text-right font-mono">{Number(cost) > 0 ? prefix(Number(cost)) : "—"}</td>
                                </tr>
                              ))}
                              <tr className="border-b border-slate-200 dark:border-[#33373E]">
                                <td colSpan={3}>
                                  <button type="button" onClick={() => setExpenseExpanded((current) => ({ ...current, [item.id]: !current[item.id] }))} className="px-3 py-2 font-bold text-slate-700 dark:text-slate-200">{expenseExpanded[item.id] === false ? "> Expense" : "v Expense"}</button>
                                </td>
                              </tr>
                              {expenseExpanded[item.id] !== false && [
                                ["Sales", sales],
                                ["Manual waste", waste],
                                ["Manufacture", manufacture],
                                ["Inventory", inventoryShortage],
                                ["Butchery", butcheryPrimary],
                              ].map(([label, amount]) => (
                                <tr key={String(label)} className="border-b border-slate-100 last:border-0 dark:border-[#33373E]/60">
                                  <td className="py-2 pl-8">{String(label)}</td>
                                  <td className="py-2 text-right font-mono">{Number(amount) > 0 ? qtyText(Number(amount), item.unit) : "—"}</td>
                                  <td className="py-2 pr-4 text-right font-mono">{Number(amount) > 0 ? prefix(Number(amount) * item.cost) : "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#E5E8EC] font-bold dark:border-[#33373E]">
              <td className={TD} colSpan={4}>Total</td>
              <td className={`${TD} text-right font-mono`}>{prefix(0)}</td>
              <td className={TD} /><td className={TD} /><td className={TD} /><td className={TD} />
              <td className={`${TD} text-right font-mono`}>{prefix(totalFinalCost)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>

      <div className="flex items-center justify-between py-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1"><button type="button" className="px-1">|&lt;</button><button type="button" className="px-1">&lt;</button><span>Page 1 of 1</span><button type="button" className="px-1">&gt;</button><button type="button" className="px-1">&gt;|</button></div>
        <span>1 to {items.length} of {items.length}</span>
      </div>
    </div>
  );
}

function InventoryChecksView() {
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const [storage, setStorage] = useState("");
  const locations = state.storageLocations?.length ? state.storageLocations : ["Storage 1"];
  const records = state.inventoryChecks.filter((record) =>
    (!search.trim() || `${record.storage} ${record.type} ${record.status}`.toLowerCase().includes(search.trim().toLowerCase())) &&
    (!storage || record.storage === storage),
  );
  const suffix = (value: number) => formatMoney(value, state.settings.currencySymbol);

  return (
    <div>
      <PageHeader
        title="Inventory checks"
        count={records.length}
        actions={{
          columns: true,
          export: records.length > 0,
          print: true,
          dateRange: "Full calendar ▾",
          addLabel: "Add",
          addOnClick: () => actions.openModal("add-inventory-check"),
        }}
      />

      {records.length === 0 && (
        <div className="relative mt-4">
          <svg aria-hidden="true" viewBox="0 0 260 100" className="pointer-events-none absolute -top-10 right-10 h-20 w-64 text-[#4EA1FF]">
            <path d="M250 92 C235 25, 155 5, 100 30" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 5" />
          </svg>
          <div className="flex items-start gap-3 rounded-lg bg-[#EEF6FF] px-4 py-3.5 text-xs dark:bg-[#1D2836]">
            <span className="text-xl" aria-hidden="true">🥕</span>
            <div className="flex-1">
              <div className="font-bold text-slate-900 dark:text-slate-100">Add an inventory check</div>
              <p className="mt-1 max-w-3xl leading-relaxed text-slate-600 dark:text-slate-300">
                To compare expected and actual inventory balance, run an inventory check. This will allow you to see difference of balance in stock and money.
              </p>
            </div>
            <button type="button" onClick={() => actions.showToast("Inventory check video opened", "blue")} className="shrink-0 font-semibold text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">▶ Watch the video</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 py-3.5 text-xs">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Quick search" className="w-44 rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024]" />
        <select value={storage} onChange={(event) => setStorage(event.target.value)} className="rounded-md border border-transparent bg-transparent px-2 py-1.5 font-medium text-[#1A73E8] outline-none dark:text-[#7EB3F5]"><option value="">Storage ▾</option>{locations.map((location) => <option key={location} value={location}>{location}</option>)}</select>
        <button type="button" onClick={() => actions.showToast("Additional inventory check filters are ready", "blue")} className="px-2 py-1.5 font-medium text-[#1A73E8] dark:text-[#7EB3F5]">+ Filter</button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead><tr><th className={TH}>Storage</th><th className={TH}>Starting date</th><th className={TH}>Time and date of the check</th><th className={TH}>Type</th><th className={`${TH} text-right`}>Total value</th><th className={TH}>Status ▲</th></tr></thead>
          <tbody>{records.map((record) => (
            <tr key={record.id} className={ROW}>
              <td className={TD}>{record.storage}</td>
              <td className={`${TD} whitespace-nowrap`}>{record.startingDate}</td>
              <td className={`${TD} whitespace-nowrap`}>{record.completedDate}</td>
              <td className={TD}>{record.type}</td>
              <td className={`${TD} text-right font-mono font-semibold ${record.totalValue < 0 ? "text-rose-500" : record.totalValue > 0 ? "text-emerald-600" : ""}`}>{suffix(record.totalValue)}</td>
              <td className={TD}><span className="rounded-full bg-[#DDF4E8] px-2 py-1 font-semibold text-[#16883F] dark:bg-emerald-900/40 dark:text-emerald-300">Completed</span></td>
            </tr>
          ))}</tbody>
        </table>
        {records.length === 0 && (
          <div className="px-5 py-14 text-center">
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">Your inventory checks will be here</div>
            <p className="mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Run an <Link href="/manage/inventory/storage-locations" className="font-semibold text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">storage locations</Link> to see your stock levels at any given storage location. Poster will show you if there are surpluses or shortages in your inventory, along with detailed information to clarify every discrepancy.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

function SuppliersView() {
  const router = useRouter();
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const query = search.trim().toLowerCase();
  const suppliers = state.suppliers.filter((supplier) =>
    !query || `${supplier.name} ${supplier.phone} ${supplier.address} ${supplier.comment}`.toLowerCase().includes(query),
  );
  const suffix = (value: number) => formatMoney(value, state.settings.currencySymbol);
  const countSupplies = (supplier: { name: string }) =>
    state.supplies.filter((supply) => supply.supplier === supplier.name).length;
  const amountSupplies = (supplier: { name: string }) =>
    state.supplies.filter((supply) => supply.supplier === supplier.name).reduce((sum, supply) => sum + supply.sum, 0);
  const outstanding = (supplier: { name: string }) =>
    state.supplies.filter((supply) => supply.supplier === supplier.name).reduce((sum, supply) => sum + supply.paymentDue, 0);
  const totals = suppliers.reduce((summary, supplier) => ({
    count: summary.count + countSupplies(supplier),
    amount: summary.amount + amountSupplies(supplier),
    outstanding: summary.outstanding + outstanding(supplier),
  }), { count: 0, amount: 0, outstanding: 0 });

  return (
    <div>
      <div className="flex items-center justify-between border-b border-[#E5E8EC] pb-3.5 dark:border-[#33373E]">
        <h1 className="text-xl font-bold tracking-tight">Suppliers</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button type="button" aria-label="Supplier actions" onClick={() => setMenuOpen((open) => !open)} className="rounded-md px-2 py-1.5 text-xl leading-none text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5">⋮</button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-20 w-40 rounded-lg border border-[#E5E8EC] bg-white p-1 text-xs shadow-xl dark:border-[#33373E] dark:bg-[#2C3036]">
                <button type="button" onClick={() => { actions.showToast("Suppliers exported to CSV", "success"); setMenuOpen(false); }} className="block w-full rounded px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/5">Export CSV</button>
                <button type="button" onClick={() => { window.print(); setMenuOpen(false); }} className="block w-full rounded px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/5">Print</button>
              </div>
            )}
          </div>
          <button type="button" onClick={() => router.push("/manage/inventory/suppliers/new")} className="rounded-md bg-[#0077FF] px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#0066DD]">Add</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 py-3.5 text-xs">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." className="w-44 rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024]" />
        <button type="button" onClick={() => actions.showToast("Additional supplier filters are ready", "blue")} className="px-2 py-1.5 font-medium text-[#1A73E8] dark:text-[#7EB3F5]">+ Filter ▾</button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr>
              <th className={TH}>Name ↑</th><th className={TH}>Phone</th><th className={TH}>Address</th><th className={TH}>Comment</th>
              <th className={`${TH} text-right`}>Number of supplies</th><th className={`${TH} text-right`}>Amount of supplies</th><th className={`${TH} text-right`}>Outstanding paym...</th><th className={TH}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className={`${ROW} cursor-pointer`} onClick={() => router.push(`/manage/inventory/suppliers/${supplier.id}`)}>
                <td className={`${TD} font-medium`}>{supplier.name}</td>
                <td className={TD}>{supplier.phone || "-"}</td>
                <td className={TD}>{supplier.address || "-"}</td>
                <td className={TD}>{supplier.comment || "-"}</td>
                <td className={`${TD} text-right font-mono`}>{countSupplies(supplier)}</td>
                <td className={`${TD} text-right font-mono font-semibold`}>{suffix(amountSupplies(supplier))}</td>
                <td className={`${TD} text-right font-mono`}>{suffix(outstanding(supplier))}</td>
                <td className={`${TD} whitespace-nowrap`}>
                  <button type="button" aria-label={`Edit ${supplier.name}`} onClick={(event) => { event.stopPropagation(); router.push(`/manage/inventory/suppliers/${supplier.id}`); }} className="mr-3 text-[#1A73E8] dark:text-[#7EB3F5]">→</button>
                  <button type="button" aria-label={`Delete ${supplier.name}`} onClick={(event) => { event.stopPropagation(); actions.deleteSupplier(supplier.id); }} className="text-slate-500 dark:text-slate-400">⋮</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#E5E8EC] font-bold dark:border-[#33373E]">
              <td className={TD} colSpan={4}>Total</td>
              <td className={`${TD} text-right font-mono`}>{totals.count}</td>
              <td className={`${TD} text-right font-mono`}>{suffix(totals.amount)}</td>
              <td className={`${TD} text-right font-mono text-slate-500 dark:text-slate-400`}>{suffix(totals.outstanding)}</td>
              <td className={TD} />
            </tr>
          </tfoot>
        </table>
      </Card>
      <div className="flex items-center justify-between py-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1"><button type="button" className="px-1">|&lt;</button><button type="button" className="px-1">&lt;</button><span>Page 1 of 1</span><button type="button" className="px-1">&gt;</button><button type="button" className="px-1">&gt;|</button></div>
        <span>1 to {suppliers.length} of {suppliers.length}</span>
      </div>
    </div>
  );
}

function SupplierFormView({ supplierId }: { supplierId: string }) {
  const router = useRouter();
  const { state, actions } = usePosStore();
  const existing = state.suppliers.find((supplier) => supplier.id === supplierId);
  const [name, setName] = useState(existing?.name ?? "");
  const [vatNumber, setVatNumber] = useState(existing?.vatNumber ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [comment, setComment] = useState(existing?.comment ?? "");
  const isNew = supplierId === "new";
  const back = () => router.push("/manage/inventory/suppliers");

  return (
    <div>
      <button type="button" onClick={back} className="mb-4 flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"><ChevronLeft className="h-4 w-4" /> {isNew ? "Add supplier" : "Edit supplier"}</button>
      <Card className="max-w-3xl p-5">
        <div className="space-y-4 text-xs">
          {[
            ["Name", name, setName, "text"],
            ["VAT number", vatNumber, setVatNumber, "text"],
            ["Phone", phone, setPhone, "text"],
          ].map(([label, value, setter]) => (
            <label key={String(label)} className="grid items-center gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
              <span className="text-slate-700 dark:text-slate-300">{String(label)}</span>
              <input value={String(value)} onChange={(event) => (setter as (value: string) => void)(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white" />
            </label>
          ))}
          <label className="grid items-start gap-3 sm:grid-cols-[160px_minmax(0,1fr)]"><span className="pt-2 text-slate-700 dark:text-slate-300">Address</span><textarea value={address} onChange={(event) => setAddress(event.target.value)} className="min-h-24 resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white" /></label>
          <label className="grid items-start gap-3 sm:grid-cols-[160px_minmax(0,1fr)]"><span className="pt-2 text-slate-700 dark:text-slate-300">Comment</span><textarea value={comment} onChange={(event) => setComment(event.target.value)} className="min-h-24 resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white" /></label>
          <button type="button" disabled={!name.trim()} onClick={() => { actions.saveSupplier(isNew ? null : supplierId, { name: name.trim(), vatNumber, phone, address, comment }); back(); }} className="rounded-md bg-[#0077FF] px-5 py-2 text-xs font-bold text-white disabled:opacity-40">Save</button>
        </div>
      </Card>
    </div>
  );
}

function StorageLocationsView() {
  const router = useRouter();
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const query = search.trim().toLowerCase();
  const locations = state.storageLocationRecords.filter((location) =>
    !query || `${location.title} ${location.address} ${location.comment}`.toLowerCase().includes(query),
  );
  const quantityAt = (stockId: string, title: string) => {
    const stock = state.stockItems.find((item) => item.id === stockId);
    if (!stock) return 0;
    if (stock.storageQuantities?.[title] !== undefined) return stock.storageQuantities[title];
    return title === (state.storageLocations[0] ?? "Storage 1") ? stock.stock : 0;
  };
  const locationValue = (title: string) => state.stockItems.reduce(
    (sum, item) => sum + quantityAt(item.id, title) * item.cost,
    0,
  );
  const suffix = (value: number) => formatMoney(value, state.settings.currencySymbol);
  const total = state.storageLocationRecords.reduce((sum, location) => sum + locationValue(location.title), 0);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-[#E5E8EC] pb-3.5 dark:border-[#33373E]">
        <h1 className="text-xl font-bold tracking-tight">Storage locations</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button type="button" aria-label="Storage location actions" onClick={() => setMenuOpen((current) => current ? null : "page")} className="rounded-md px-2 py-1.5 text-xl leading-none text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5">⋮</button>
            {menuOpen === "page" && (
              <div className="absolute right-0 top-9 z-20 w-40 rounded-lg border border-[#E5E8EC] bg-white p-1 text-xs shadow-xl dark:border-[#33373E] dark:bg-[#2C3036]">
                <button type="button" onClick={() => { actions.showToast("Storage locations exported to CSV", "success"); setMenuOpen(null); }} className="block w-full rounded px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/5">Export CSV</button>
                <button type="button" onClick={() => { window.print(); setMenuOpen(null); }} className="block w-full rounded px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/5">Print</button>
              </div>
            )}
          </div>
          <button type="button" onClick={() => router.push("/manage/inventory/storage-locations/new")} className="rounded-md bg-[#0077FF] px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#0066DD]">Add</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 py-3.5 text-xs">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." className="w-44 rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024]" />
        <button type="button" onClick={() => actions.showToast("Additional storage filters are ready", "blue")} className="px-2 py-1.5 font-medium text-[#1A73E8] dark:text-[#7EB3F5]">+ Filter ▾</button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead><tr><th className={`${TH} w-9`} /><th className={`${TH} w-12`}>↑ #</th><th className={TH}>Title</th><th className={TH}>Address</th><th className={`${TH} text-right`}>Sum</th><th className={TH}>Actions</th></tr></thead>
          <tbody>
            {locations.map((location, index) => (
              <Fragment key={location.id}>
                <tr className={`${ROW} cursor-pointer`} onClick={() => setExpanded((current) => ({ ...current, [location.id]: !current[location.id] }))}>
                  <td className={TD}><button type="button" aria-label={`${expanded[location.id] ? "Collapse" : "Expand"} ${location.title}`} className="text-slate-400">{expanded[location.id] ? "v" : ">"}</button></td>
                  <td className={`${TD} font-mono`}>{index + 1}</td>
                  <td className={`${TD} font-medium`}>{location.title}</td>
                  <td className={TD}>{location.address || "—"}</td>
                  <td className={`${TD} text-right font-mono font-semibold`}>{suffix(locationValue(location.title))}</td>
                  <td className={`${TD} whitespace-nowrap`} onClick={(event) => event.stopPropagation()}>
                    <button type="button" aria-label={`Edit ${location.title}`} onClick={() => router.push(`/manage/inventory/storage-locations/${location.id}`)} className="mr-3 text-[#1A73E8] dark:text-[#7EB3F5]">→</button>
                    <div className="relative inline-block">
                      <button type="button" aria-label={`Actions for ${location.title}`} onClick={() => setMenuOpen((current) => current === location.id ? null : location.id)} className="text-slate-500 dark:text-slate-400">⋮</button>
                      {menuOpen === location.id && (
                        <div className="absolute right-0 top-6 z-20 w-32 rounded-lg border border-[#E5E8EC] bg-white p-1 shadow-xl dark:border-[#33373E] dark:bg-[#2C3036]">
                          <button type="button" onClick={() => { router.push(`/manage/inventory/storage-locations/${location.id}`); setMenuOpen(null); }} className="block w-full rounded px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/5">Edit</button>
                          <button type="button" disabled={state.storageLocationRecords.length <= 1} onClick={() => { actions.deleteStorageLocation(location.id); setMenuOpen(null); }} className="block w-full rounded px-3 py-2 text-left text-rose-600 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-white/5">Delete</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
                {expanded[location.id] && (
                  <tr className="bg-slate-50/70 dark:bg-white/[0.02]">
                    <td colSpan={6} className="px-6 py-3">
                      <table className="w-full text-xs">
                        <thead><tr><th className={TH}>Title</th><th className={`${TH} text-right`}>Stock</th><th className={`${TH} text-right`}>Cost</th><th className={`${TH} text-right`}>Sum</th></tr></thead>
                        <tbody>{state.stockItems.map((item) => {
                          const quantity = quantityAt(item.id, location.title);
                          return <tr key={item.id} className="border-b border-slate-100 last:border-0 dark:border-[#33373E]"><td className="py-2">{item.title}</td><td className="py-2 text-right font-mono">{formatQty(quantity, item.unit)}</td><td className="py-2 text-right font-mono">{formatMoney(item.cost, state.settings.currencySymbol)}</td><td className="py-2 text-right font-mono">{suffix(quantity * item.cost)}</td></tr>;
                        })}</tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
          <tfoot><tr className="border-t border-[#E5E8EC] font-bold dark:border-[#33373E]"><td className={TD} colSpan={4}>Total</td><td className={`${TD} text-right font-mono`}>{suffix(total)}</td><td className={TD} /></tr></tfoot>
        </table>
      </Card>
      <div className="flex items-center justify-between py-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1"><button type="button" className="px-1">|&lt;</button><button type="button" className="px-1">&lt;</button><span>Page 1 of 1</span><button type="button" className="px-1">&gt;</button><button type="button" className="px-1">&gt;|</button></div>
        <span>1 to {locations.length} of {locations.length}</span>
      </div>
    </div>
  );
}

function StorageLocationFormView({ storageLocationId }: { storageLocationId: string }) {
  const router = useRouter();
  const { state, actions } = usePosStore();
  const existing = state.storageLocationRecords.find((location) => location.id === storageLocationId);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [comment, setComment] = useState(existing?.comment ?? "");
  const isNew = storageLocationId === "new";
  const back = () => router.push("/manage/inventory/storage-locations");

  return (
    <div>
      <button type="button" onClick={back} className="mb-4 flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"><ChevronLeft className="h-4 w-4" /> {isNew ? "Add storage location" : "Edit storage location"}</button>
      <Card className="max-w-3xl p-5">
        <div className="space-y-4 text-xs">
          <label className="grid items-center gap-3 sm:grid-cols-[160px_minmax(0,1fr)]"><span className="text-slate-700 dark:text-slate-300">Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white" /></label>
          <label className="grid items-start gap-3 sm:grid-cols-[160px_minmax(0,1fr)]"><span className="pt-2 text-slate-700 dark:text-slate-300">Address</span><textarea value={address} onChange={(event) => setAddress(event.target.value)} className="min-h-24 resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white" /></label>
          <label className="grid items-start gap-3 sm:grid-cols-[160px_minmax(0,1fr)]"><span className="pt-2 text-slate-700 dark:text-slate-300">Comment</span><textarea value={comment} onChange={(event) => setComment(event.target.value)} className="min-h-24 resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white" /></label>
          <button type="button" disabled={!title.trim()} onClick={() => { actions.saveStorageLocation(isNew ? null : storageLocationId, { title: title.trim(), address, comment }); back(); }} className="rounded-md bg-[#0077FF] px-5 py-2 text-xs font-bold text-white disabled:opacity-40">Save</button>
        </div>
      </Card>
    </div>
  );
}

function OrderingUnitsView() {
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [unit, setUnit] = useState<"pcs" | "kg" | "l">("pcs");
  const [quantity, setQuantity] = useState("1");
  const query = search.trim().toLowerCase();
  const units = state.orderingUnits.filter((entry) =>
    entry.title.toLowerCase().includes(query) &&
    (unitFilter === "All" || entry.unit === unitFilter),
  );
  const openNew = () => {
    setEditingId(null);
    setTitle("");
    setUnit("pcs");
    setQuantity("1");
    setModalOpen(true);
  };
  const openEdit = (id: string) => {
    const entry = state.orderingUnits.find((item) => item.id === id);
    if (!entry) return;
    setEditingId(id);
    setTitle(entry.title);
    setUnit(entry.unit);
    setQuantity(String(entry.quantity));
    setModalOpen(true);
  };
  const save = () => {
    const parsedQuantity = Number(quantity);
    if (!title.trim() || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0) return;
    actions.saveOrderingUnit(editingId, { title: title.trim(), unit, quantity: parsedQuantity });
    setModalOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between border-b border-[#E5E8EC] pb-3.5 dark:border-[#33373E]">
        <h1 className="text-xl font-bold tracking-tight">Ordering units</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button type="button" aria-label="Ordering unit actions" onClick={() => setMenuOpen((open) => !open)} className="rounded-md px-2 py-1.5 text-xl leading-none text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5">⋮</button>
            {menuOpen && <div className="absolute right-0 top-9 z-20 w-40 rounded-lg border border-[#E5E8EC] bg-white p-1 text-xs shadow-xl dark:border-[#33373E] dark:bg-[#2C3036]"><button type="button" onClick={() => { actions.showToast("Ordering units exported to CSV", "success"); setMenuOpen(false); }} className="block w-full rounded px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/5">Export CSV</button><button type="button" onClick={() => { window.print(); setMenuOpen(false); }} className="block w-full rounded px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/5">Print</button></div>}
          </div>
          <button type="button" onClick={openNew} className="rounded-md bg-[#0077FF] px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#0066DD]">Add</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 py-3.5 text-xs">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." className="w-44 rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024]" />
        <select value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)} className="rounded-md border border-transparent bg-transparent px-2 py-1.5 font-medium text-[#1A73E8] outline-none dark:text-[#7EB3F5]"><option value="All">Unit ▾ (All)</option><option>pcs</option><option>kg</option><option>l</option></select>
        <button type="button" onClick={() => actions.showToast("Additional ordering unit filters are ready", "blue")} className="px-2 py-1.5 font-medium text-[#1A73E8] dark:text-[#7EB3F5]">+ Filter ▾</button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead><tr><th className={TH}>Title ↑</th><th className={TH}>Unit</th><th className={`${TH} text-right`}>Quantity</th><th className={`${TH} text-right`}>Actions</th></tr></thead>
          <tbody>{units.map((entry) => (
            <tr key={entry.id} className={ROW}>
              <td className={`${TD} font-medium`}>{entry.title}</td>
              <td className={TD}>{entry.unit}</td>
              <td className={`${TD} text-right font-mono`}>{formatQty(entry.quantity, entry.unit)}</td>
              <td className={`${TD} text-right whitespace-nowrap`}><button type="button" onClick={() => openEdit(entry.id)} className="mr-4 text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">Edit</button><button type="button" aria-label={`Delete ${entry.title}`} onClick={() => actions.deleteOrderingUnit(entry.id)} className="text-slate-500 dark:text-slate-400">⋮</button></td>
            </tr>
          ))}</tbody>
        </table>
        {units.length === 0 && (
          <div className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500"><Inbox className="h-6 w-6" /></div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">Your ordering units will be here</div>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">Ordering units let you record supplies in convenient packs — for example, a box of 30 — instead of counting each item.</p>
            <a href="https://support.joinposter.com" target="_blank" rel="noreferrer" className="mt-3 text-xs font-semibold text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">Learn how it works in the knowledge base ↗</a>
          </div>
        )}
      </Card>
      <div className="flex items-center justify-between py-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1"><button type="button" className="px-1">|&lt;</button><button type="button" className="px-1">&lt;</button><span>Page {units.length ? 1 : 0} of {units.length ? 1 : 0}</span><button type="button" className="px-1">&gt;</button><button type="button" className="px-1">&gt;|</button></div>
        <span>{units.length ? `1 to ${units.length} of ${units.length}` : "0 to 0 of 0"}</span>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-[#33373E] dark:bg-[#2C3036] dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-[#33373E]"><h2 className="text-sm font-bold">{editingId ? "Edit Ordering Unit" : "New Ordering Unit"}</h2><button type="button" aria-label="Close modal" onClick={() => setModalOpen(false)} className="text-xl text-slate-400 hover:text-slate-700 dark:hover:text-white">×</button></div>
            <form onSubmit={(event) => { event.preventDefault(); save(); }} className="space-y-4 p-5 text-xs">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Title<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Box of 30" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white" required /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Unit<select value={unit} onChange={(event) => setUnit(event.target.value as "pcs" | "kg" | "l")} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white"><option>pcs</option><option>kg</option><option>l</option></select></label>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Quantity<input type="number" step="0.001" min="0.001" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white" required /></label>
              </div>
              <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 dark:border-[#3E434C] dark:text-slate-300">Cancel</button><button type="submit" className="rounded-lg bg-[#0077FF] px-4 py-2 text-xs font-bold text-white hover:bg-[#0066DD]">Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function IngredientCategoriesView() {
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editingId, setEditingId] = useState("");
  const [name, setName] = useState("");
  const query = search.trim().toLowerCase();
  const categories = state.ingredientCategories.filter((category) => category.name.toLowerCase().includes(query));
  const money = (value: number) => formatMoney(value, state.settings.currencySymbol);

  const save = () => {
    if (modal === "add") actions.createIngredientCategory(name);
    if (modal === "edit") actions.updateIngredientCategory(editingId, name);
    setModal(null);
  };
  const edit = (id: string) => {
    const category = state.ingredientCategories.find((entry) => entry.id === id);
    if (!category) return;
    setEditingId(id);
    setName(category.name);
    setModal("edit");
  };

  return <div className="space-y-4">
    <PageHeader title="Categories of ingredients" count={state.ingredientCategories.length} actions={{ columns: true, export: true, print: true, addLabel: "Add", addOnClick: () => { setName(""); setEditingId(""); setModal("add"); } }} />
    <FilterToolbar search={search} onSearchChange={setSearch} placeholder="Quick search" pills={[{ label: "+ Filter" }]} />
    <Card className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead><tr><th className={TH}>Category ▲</th><th className={`${TH} text-right`}>Number of ingredients</th><th className={`${TH} text-right`}>Inventory counts for all storage locations</th><th className={`${TH} text-right`}>Inventory counts with VAT</th><th className={`${TH} text-right`}>Actions</th></tr></thead>
        <tbody>{categories.map((category) => {
          const items = state.stockItems.filter((item) => item.category === category.name);
          const value = items.reduce((sum, item) => sum + item.stock * item.cost, 0);
          return <tr key={category.id} className={ROW}><td className={TD}>{category.name}</td><td className={`${TD} text-right font-mono`}>{items.length}</td><td className={`${TD} text-right font-mono`}>{money(value)}</td><td className={`${TD} text-right font-mono`}>{money(value * 1.12)}</td><td className={`${TD} text-right whitespace-nowrap`}><button type="button" onClick={() => edit(category.id)} className="mr-4 text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">Edit</button><button type="button" onClick={() => actions.deleteIngredientCategory(category.id)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">•••</button></td></tr>;
        })}</tbody>
      </table>
      {categories.length === 0 && <div className="px-5 py-16 text-center text-sm text-slate-500 dark:text-slate-400">No data associated with the selected filters</div>}
    </Card>
    {modal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}><div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-[#33373E] dark:bg-[#2C3036]"><div className="flex items-center justify-between"><h2 className="font-bold">{modal === "add" ? "Add ingredient category" : "Edit ingredient category"}</h2><button type="button" onClick={() => setModal(null)} className="text-xl text-slate-400">×</button></div><label className="mt-5 block text-xs font-semibold">Category name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") save(); }} className="mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-600" placeholder="e.g. Dairy" /></label><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setModal(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold dark:border-slate-600">Cancel</button><button type="button" disabled={!name.trim()} onClick={save} className="rounded-lg bg-[#1DB954] px-4 py-2 text-xs font-bold text-white disabled:opacity-40">Save</button></div></div></div>}
  </div>;
}

function FoodCostControlView() {
  const { state, actions } = usePosStore();
  const [actionsUsed, setActionsUsed] = useState(0);
  const [updatedAt, setUpdatedAt] = useState("Nov 23, 10:56 PM");
  const [diagnosticOpen, setDiagnosticOpen] = useState(true);
  const [tab, setTab] = useState<"items" | "ingredients">("items");
  const [search, setSearch] = useState("");

  const money = (value: number) => {
    const formatted = formatMoneyPrefix(value, state.settings.currencySymbol);
    return value === 0 ? formatted.replace(".00", "") : formatted;
  };
  const receipts = state.receipts;
  const revenue = receipts.reduce((sum, receipt) => sum + receipt.total, 0);
  const cost = receipts.reduce(
    (sum, receipt) =>
      sum +
      receipt.items.reduce((itemSum, item) => {
        const menuItem = state.menuItems.find((entry) => entry.id === item.menuId);
        return itemSum + (menuItem?.cost ?? 0) * item.qty;
      }, 0),
    0,
  );
  const margin = revenue - cost;
  const foodCostPercent = revenue ? (cost / revenue) * 100 : 0;
  const refresh = () => {
    setUpdatedAt(
      new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    );
    setActionsUsed((value) => Math.min(20, value + 1));
  };
  const runAiInsight = () => {
    setActionsUsed((value) => Math.min(20, value + 1));
    actions.showToast("Food Cost AI insight refreshed", "blue");
  };
  const itemRows = state.menuItems
    .map((item) => {
      const soldQty = receipts.reduce(
        (sum, receipt) =>
          sum + receipt.items.filter((receiptItem) => receiptItem.menuId === item.id).reduce((qty, line) => qty + line.qty, 0),
        0,
      );
      const itemRevenue = receipts.reduce(
        (sum, receipt) =>
          sum + receipt.items.filter((receiptItem) => receiptItem.menuId === item.id).reduce((amount, line) => amount + line.qty * line.unitPrice, 0),
        0,
      );
      const itemCost = soldQty * item.cost;
      return {
        item,
        soldQty,
        revenue: itemRevenue,
        cost: itemCost,
        margin: itemRevenue - itemCost,
        foodCost: itemRevenue ? (itemCost / itemRevenue) * 100 : 0,
      };
    })
    .filter((row) => row.soldQty > 0 && row.item.title.toLowerCase().includes(search.trim().toLowerCase()));
  const ingredientRows = state.stockItems
    .filter((item) => item.type === "Ingredient")
    .map((item) => {
      const used = state.stockMovements
        .filter((movement) => movement.title === item.title && movement.reason.toLowerCase().startsWith("receipt #"))
        .reduce((sum, movement) => sum + Math.abs(movement.delta), 0);
      return { item, used, turnover: used * item.cost };
    })
    .filter((row) => row.used > 0 && row.item.title.toLowerCase().includes(search.trim().toLowerCase()));
  const diagnostic = revenue
    ? `Overall foodcost is ${foodCostPercent.toFixed(1)}% with ${money(revenue)} revenue and ${money(margin)} margin for the period. Top-selling items: ${itemRows
        .sort((a, b) => b.soldQty - a.soldQty)
        .slice(0, 3)
        .map((row) => `${row.item.title} (${row.soldQty})`)
        .join(", ") || "No item data"}. ## Drivers of changes Change in supply prices — Live recipe costs are reflected in the current food cost. Change in sales mix — Sales mix is led by the highest-volume items above. Change in recipe — No recipe changes detected. ## Problem zones ${foodCostPercent > 35 ? "Food cost is above the recommended 35% threshold; review the highest-cost recipes." : "No problem zones identified in the current sales data."}`
    : "Overall foodcost, margin, and volume remained at 0 PHP for the period 2026-11-16 to 2026-11-22, indicating no commercial activity or missing data. ## Drivers of changes Change in supply prices — No data available to analyze ingredient price fluctuations. Change in sales mix — No sales recorded; category performance remains at zero. Change in recipe — No recipe changes detected. ## Problem zones No problem zones identified as there are no active sales or cost entries.";

  return (
    <div className="-m-4 min-h-[calc(100vh-32px)] bg-[#1D2024] p-5 text-[#F2F4F7] sm:-m-6 sm:p-7 lg:-m-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex items-center justify-between gap-4">
          <button type="button" className="flex items-center gap-1 text-sm font-semibold text-slate-200 hover:text-white" onClick={() => window.history.back()}>
            <ChevronLeft className="h-4 w-4" /> Food cost control
          </button>
          <button type="button" onClick={runAiInsight} className="rounded-full border border-[#32373D] bg-[#25292E] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-[#32373D]">
            {actionsUsed} of 20 actions used <span className="ml-1">›</span>
          </button>
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Food Cost Report for Nov 16 – Nov 22</h1>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <span>Data as of {updatedAt}</span>
              <button type="button" aria-label="Refresh food cost report" onClick={refresh} className="rounded p-1 hover:bg-[#32373D]"><RefreshCw className="h-3.5 w-3.5" /></button>
            </div>
          </div>
          <button type="button" className="flex items-center gap-2 rounded-lg border border-[#32373D] bg-[#25292E] px-3 py-2 text-xs font-semibold text-slate-300">
            Previous week <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FoodCostKpi title="Revenue" value={money(revenue)} comparison="0.0% vs prev period" color="#F05252" />
          <FoodCostKpi title="Cost" value={money(cost)} comparison="0.0% vs prev period" color="#34D399" />
          <FoodCostKpi title="Margin" value={money(margin)} comparison="0.0% vs prev period" color="#F05252" />
          <FoodCostKpi title="Food Cost %" value={`${foodCostPercent.toFixed(1)}%`} comparison="0.0 vs prev period" color="#34D399" />
        </div>

        <div className="mt-5 rounded-2xl border border-[#32373D] bg-[#25292E] p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-bold"><Sparkles className="h-4 w-4 text-violet-300" /> Food Cost diagnostic</div>
            <button type="button" onClick={() => setDiagnosticOpen((open) => !open)} className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white">
              {diagnosticOpen ? <>Show less <ChevronUp className="h-3.5 w-3.5" /></> : <>Show more <ChevronDown className="h-3.5 w-3.5" /></>}
            </button>
          </div>
          {diagnosticOpen && <p className="mt-4 whitespace-pre-line text-xs leading-6 text-slate-300">{diagnostic}</p>}
        </div>

        <div className="mt-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Recommendations</h2>
              <div className="mt-3 flex gap-5 text-sm font-semibold">
                <button type="button" onClick={() => setTab("items")} className={`border-b-2 pb-2 ${tab === "items" ? "border-violet-400 text-white" : "border-transparent text-slate-400"}`}>Items</button>
                <button type="button" onClick={() => setTab("ingredients")} className={`border-b-2 pb-2 ${tab === "ingredients" ? "border-violet-400 text-white" : "border-transparent text-slate-400"}`}>Ingredients</button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => actions.showToast("Food Cost CSV exported", "success")} className="flex items-center gap-1 rounded-lg border border-[#32373D] px-3 py-2 text-xs font-semibold text-slate-300"><Download className="h-3.5 w-3.5" /> CSV</button>
              <button type="button" onClick={() => actions.showToast("Food Cost Excel export started", "success")} className="rounded-lg border border-[#32373D] px-3 py-2 text-xs font-semibold text-slate-300">Excel export</button>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." className="w-32 rounded-lg border border-[#32373D] bg-[#25292E] px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-violet-400 sm:w-44" />
            </div>
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-[#32373D] bg-[#25292E]">
            {tab === "items" ? (
              <table className="w-full text-left text-xs">
                <thead><tr><th className={FOOD_TH}>Item</th><th className={FOOD_TH}>Sold</th><th className={`${FOOD_TH} text-right`}>Revenue</th><th className={`${FOOD_TH} text-right`}>Margin</th><th className={`${FOOD_TH} text-right`}>Food Cost %</th></tr></thead>
                <tbody>{itemRows.map((row) => <tr key={row.item.id} className={FOOD_ROW}><td className={FOOD_TD}>{row.item.title}</td><td className={`${FOOD_TD} font-mono`}>{row.soldQty}</td><td className={`${FOOD_TD} text-right font-mono`}>{money(row.revenue)}</td><td className={`${FOOD_TD} text-right font-mono text-emerald-300`}>{money(row.margin)}</td><td className={`${FOOD_TD} text-right font-mono`}>{row.foodCost.toFixed(1)}%</td></tr>)}</tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs">
                <thead><tr><th className={FOOD_TH}>Ingredient</th><th className={`${FOOD_TH} text-right`}>Turnover</th><th className={`${FOOD_TH} text-right`}>Turnover Change</th><th className={`${FOOD_TH} text-right`}>Prev Period Price</th><th className={`${FOOD_TH} text-right`}>Current Price</th><th className={`${FOOD_TH} text-right`}>Price Change</th></tr></thead>
                <tbody>{ingredientRows.map((row) => <tr key={row.item.id} className={FOOD_ROW}><td className={FOOD_TD}>{row.item.title}</td><td className={`${FOOD_TD} text-right font-mono`}>{money(row.turnover)}</td><td className={`${FOOD_TD} text-right font-mono`}>0.0%</td><td className={`${FOOD_TD} text-right font-mono`}>{money(row.item.cost)}</td><td className={`${FOOD_TD} text-right font-mono`}>{money(row.item.cost)}</td><td className={`${FOOD_TD} text-right font-mono`}>0.0%</td></tr>)}</tbody>
              </table>
            )}
            {((tab === "items" && itemRows.length === 0) || (tab === "ingredients" && ingredientRows.length === 0)) && <div className="px-5 py-14 text-center text-xs text-slate-500">No data available for this period.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function FoodCostKpi({ title, value, comparison, color }: { title: string; value: string; comparison: string; color: string }) {
  return (
    <div className="relative rounded-xl border border-[#32373D] bg-[#25292E] p-5">
      <div className="text-xs font-semibold text-slate-400">{title}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      <div className="mt-2 text-[11px] text-slate-500">{comparison}</div>
      <svg viewBox="0 0 80 28" className="absolute right-4 top-5 h-7 w-20" aria-hidden="true">
        <path d="M2 20 L18 20 L34 20 L50 20 L64 20 L78 20" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

const FOOD_TH = "whitespace-nowrap border-b border-[#32373D] px-4 py-3 text-[11px] font-semibold text-slate-400";
const FOOD_TD = "whitespace-nowrap px-4 py-3";
const FOOD_ROW = "border-b border-[#32373D] last:border-0 hover:bg-white/[0.03]";

function SimpleTable({ title, count, headers, rows, toolbar }: { title: string; count?: string | number; headers: string[]; rows: string[][]; toolbar?: React.ReactNode }) {
  return <div><PageHeader title={title} count={count} actions={{ export: true, print: true }} />{toolbar}<Card className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr>{headers.map((header) => <th className={TH} key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr className={ROW} key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td className={TD} key={`${cell}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table></Card>{rows.length === 0 && <EmptyState emoji="📭" title="Nothing here yet" description="Records added from the POS and management console will appear here." />}</div>;
}

function SettingsView({ slug }: { slug: string }) {
  const { state, actions } = usePosStore();
  const setting = slug === "general" ? state.settings : undefined;
  if (!setting) return <EmptyState emoji="⚙️" title={`${TITLES[slug] ?? slug} settings`} description="This settings section is available for the tanawa workspace." />;
  return <div className="space-y-4"><PageHeader title="General" /><Card className="max-w-2xl space-y-4 p-5"><label className="block text-xs font-semibold">Company name<input className="mt-1 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-600" value={setting.companyName} onChange={(event) => actions.updateSettings({ companyName: event.target.value })} /></label><label className="block text-xs font-semibold">Subdomain<input className="mt-1 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-600" value={setting.subdomain} onChange={(event) => actions.updateSettings({ subdomain: event.target.value })} /></label><label className="block text-xs font-semibold">Timezone<input className="mt-1 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-600" value={setting.timezone} onChange={(event) => actions.updateSettings({ timezone: event.target.value })} /></label></Card></div>;
}
