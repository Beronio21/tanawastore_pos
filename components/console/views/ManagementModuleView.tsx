"use client";

import { useState } from "react";
import { usePosStore } from "@/lib/pos-store";
import { formatMoney, formatMoneyPrefix, formatQty } from "@/lib/format";
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
  clients: "Clients",
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
  workshops: "Workshops",
};

export function ManagementModuleView({ section, slug }: { section: string; slug: string }) {
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const title = TITLES[slug] ?? slug.replaceAll("_", " ");
  const query = search.trim().toLowerCase();
  const money = (value: number) => formatMoney(value, state.settings.currencySymbol);

  if (section === "menu") {
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
      return <SimpleTable title={title} headers={["Ingredient", "Stock", "Unit cost", "Value"]} rows={state.stockItems.filter((item) => item.type === "Ingredient").map((item) => [item.title, formatQty(item.stock, item.unit), money(item.cost), money(item.stock * item.cost)])} />;
    }
  }

  if (section === "calculations" && slug === "stock") {
    const valuation = state.stockItems.reduce((sum, item) => sum + item.stock * item.cost, 0);
    return <SimpleTable title={title} count={formatMoneyPrefix(valuation, state.settings.currencySymbol)} headers={["Item", "Type", "Stock", "Unit cost", "Value"]} rows={state.stockItems.filter((item) => item.title.toLowerCase().includes(query)).map((item) => [item.title, item.type, formatQty(item.stock, item.unit), money(item.cost), money(item.stock * item.cost)])} toolbar={<FilterToolbar search={search} onSearchChange={setSearch} />} />;
  }

  if (section === "calculations" && slug === "movements") {
    return <SimpleTable title={title} headers={["Time", "Item", "Reason", "Change"]} rows={state.stockMovements.map((item) => [item.time, item.title, item.reason, `${item.delta > 0 ? "+" : ""}${formatQty(item.delta, item.unit)}`])} />;
  }

  if (section === "marketing" && slug === "clients") {
    return <SimpleTable title={title} count={state.customers.length} headers={["Client", "Phone", "Group", "Spent", "Receipts"]} rows={state.customers.map((item) => [item.name, item.phone || "—", item.group, money(item.overallSum), String(item.receiptCount)])} />;
  }

  if (section === "access" && slug === "employees") {
    return <SimpleTable title={title} count={state.employees.length} headers={["Employee", "Position", "Phone", "Last login"]} rows={state.employees.map((item) => [item.name, item.position, item.phone, item.lastLogin])} />;
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

function SimpleTable({ title, count, headers, rows, toolbar }: { title: string; count?: string | number; headers: string[]; rows: string[][]; toolbar?: React.ReactNode }) {
  return <div><PageHeader title={title} count={count} actions={{ export: true, print: true }} />{toolbar}<Card className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr>{headers.map((header) => <th className={TH} key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr className={ROW} key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td className={TD} key={`${cell}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table></Card>{rows.length === 0 && <EmptyState emoji="📭" title="Nothing here yet" description="Records added from the POS and management console will appear here." />}</div>;
}

function SettingsView({ slug }: { slug: string }) {
  const { state, actions } = usePosStore();
  const setting = slug === "general" ? state.settings : undefined;
  if (!setting) return <EmptyState emoji="⚙️" title={`${TITLES[slug] ?? slug} settings`} description="This settings section is available for the tanawa workspace." />;
  return <div className="space-y-4"><PageHeader title="General" /><Card className="max-w-2xl space-y-4 p-5"><label className="block text-xs font-semibold">Company name<input className="mt-1 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-600" value={setting.companyName} onChange={(event) => actions.updateSettings({ companyName: event.target.value })} /></label><label className="block text-xs font-semibold">Subdomain<input className="mt-1 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-600" value={setting.subdomain} onChange={(event) => actions.updateSettings({ subdomain: event.target.value })} /></label><label className="block text-xs font-semibold">Timezone<input className="mt-1 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-600" value={setting.timezone} onChange={(event) => actions.updateSettings({ timezone: event.target.value })} /></label></Card></div>;
}
