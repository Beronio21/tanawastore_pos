import {
  BarChart3,
  DollarSign,
  FileText,
  Home,
  Layers,
  LayoutGrid,
  PieChart,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavChild = { id: string; label: string; href: string; badge?: string };

export type NavSection = {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  badgeType?: "onboarding";
  children: NavChild[];
};

const child = (base: string, id: string, label: string, badge?: string): NavChild => ({
  id,
  label,
  href: `${base}/${id}`,
  badge,
});

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "get-started",
    label: "Get started",
    icon: Home,
    href: "/manage/welcome",
    badgeType: "onboarding",
    children: [],
  },
  {
    id: "reports",
    label: "Reports",
    icon: BarChart3,
    children: [
      child("/manage/dash", "sales", "Sales"),
      child("/manage/dash", "customers", "Customers"),
      child("/manage/dash", "waiters", "Waiters"),
      child("/manage/dash", "workshops", "Workshops"),
      child("/manage/dash", "category", "Category"),
      child("/manage/dash", "products", "Products"),
      child("/manage/dash", "abc", "ABC-analysis"),
      child("/manage/dash", "receipts", "Receipts"),
      child("/manage/dash", "feedbacks", "Feedbacks"),
      child("/manage/dash", "payments", "Payments count"),
      child("/manage/dash", "taxes", "Taxes"),
    ],
  },
  {
    id: "finances",
    label: "Finances",
    icon: DollarSign,
    children: [
      child("/manage/finance", "transactions", "Transactions"),
      child("/manage/finance", "cashflow", "Cash flow"),
      child("/manage/finance", "cash_shift", "Cash shifts"),
      child("/manage/finance", "salary", "Salary"),
      child("/manage/finance", "accounts", "Accounts"),
      child("/manage/finance", "categories", "Categories"),
      child("/manage/finance", "pnl", "P&L"),
    ],
  },
  {
    id: "menu",
    label: "Menu",
    icon: FileText,
    children: [
      child("/manage/menu", "products", "Products"),
      child("/manage/menu", "dishes", "Dishes"),
      child("/manage/menu", "prepack", "Preparations"),
      child("/manage/menu", "ingredients", "Ingredients"),
      child("/manage/menu", "foodcost_control", "Foodcost Control", "New"),
      child("/manage/menu", "categories_products", "Categories of products and dishes"),
      child("/manage/menu", "categories_ingredients", "Categories of ingredients"),
      child("/manage/menu", "workshops", "Workshops"),
    ],
  },
  {
    id: "calculations",
    label: "Inventory",
    icon: Layers,
    children: [
      child("/manage/calculations", "stock", "Stock"),
      child("/manage/calculations", "supplies", "Supplies"),
      child("/manage/calculations", "butcheries", "Butcheries"),
      child("/manage/calculations", "transfers", "Transfers"),
      child("/manage/calculations", "deductions", "Stock deductions"),
      child("/manage/calculations", "movements", "Ingredients movements"),
      child("/manage/calculations", "checks", "Inventory checks"),
      child("/manage/calculations", "suppliers", "Suppliers"),
      child("/manage/calculations", "storages", "Storage locations"),
      child("/manage/calculations", "units", "Ordering units"),
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: PieChart,
    children: [
      child("/manage/marketing", "clients", "Clients"),
      child("/manage/marketing", "groups", "Customer groups"),
      child("/manage/marketing", "loyalty", "Loyalty"),
      child("/manage/marketing", "exclusions", "Exclusions"),
      child("/manage/marketing", "promotions", "Promotions"),
    ],
  },
  {
    id: "access",
    label: "Access",
    icon: Users,
    children: [
      child("/manage/access", "employees", "Employees"),
      child("/manage/access", "sessions", "User sessions"),
      child("/manage/access", "positions", "Positions"),
      child("/manage/access", "tablets", "Tablets"),
      child("/manage/access", "locations", "Locations"),
      child("/manage/access", "integrations", "Integrations"),
    ],
  },
  {
    id: "applications",
    label: "Applications",
    icon: LayoutGrid,
    children: [
      child("/manage/applications", "marketplace", "App Marketplace"),
      child("/manage/applications", "postie-ai", "Postie AI Assistant"),
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    children: [
      child("/manage/settings", "general", "General"),
      child("/manage/settings", "billing", "Billing"),
      child("/manage/settings", "orders", "Orders"),
      child("/manage/settings", "delivery", "Delivery"),
      child("/manage/settings", "security", "Security"),
      child("/manage/settings", "receipt", "Receipt"),
    ],
  },
];

/** Resolve the current page label for the mobile header and breadcrumbs. */
export function pageTitleForPath(pathname: string): string {
  for (const section of NAV_SECTIONS) {
    if (section.href && pathname === section.href) return section.label;
    if (pathname.startsWith(`/manage/${section.id}`)) {
      const sub = section.children.find((entry) => pathname === entry.href);
      return sub ? sub.label : section.label;
    }
    if (section.children.some((entry) => pathname === entry.href)) {
      return section.children.find((entry) => pathname === entry.href)?.label ?? section.label;
    }
  }
  return "Get started";
}
