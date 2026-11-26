/** Industry presets applied by the Phase 3 onboarding wizard. */
import type { LowStockAlert, ServiceChargeFee } from "./console-data";

export type BusinessType = "cafe" | "restaurant" | "bakery" | "fast_casual" | "bar" | "retail" | "service";

export type OnboardingPreset = {
  id: BusinessType;
  title: string;
  description: string;
  showFloorPlan: boolean;
  stations: string[];
  categories: string[];
  serviceCharge?: ServiceChargeFee;
  useManufacturing?: boolean;
  deliveryEnabled?: boolean;
  enablePartialServing?: boolean;
  shiftEndTime?: string;
  lowStockAlert?: LowStockAlert;
  barcodeQuickScan?: boolean;
  commissionPayroll?: boolean;
  orderSources?: string[];
  orderingUnits?: { title: string; unit: "pcs" | "kg" | "l"; quantity: number }[];
};

export const BUSINESS_PRESETS: OnboardingPreset[] = [
  {
    id: "cafe",
    title: "Café, Coffee Shop & Milk Tea Bar",
    description: "Counter service with a single bar station, pastries and drink modifiers.",
    showFloorPlan: false,
    stations: ["Bar"],
    categories: ["Coffee", "Milk Tea & Non-Coffee", "Pastries"],
    orderingUnits: [
      { title: "Box (12 pcs)", unit: "pcs", quantity: 12 },
      { title: "Pack (1 kg)", unit: "kg", quantity: 1 },
    ],
  },
  {
    id: "restaurant",
    title: "Full-Service Restaurant & Casual Dining",
    description: "Table service, floor plan, kitchen/bar routing and a 10% service charge.",
    showFloorPlan: true,
    stations: ["Kitchen", "Bar"],
    categories: ["Mains", "Appetizers", "Beverages"],
    serviceCharge: "10%",
  },
  {
    id: "bakery",
    title: "Bakery, Pastry Shop & Commissary",
    description: "Batch production, manufacturing control and daily low-stock digest.",
    showFloorPlan: false,
    useManufacturing: true,
    lowStockAlert: "Daily digest",
    stations: ["Bakery"],
    categories: ["Breads", "Cakes & Pastries", "Raw Ingredients"],
  },
  {
    id: "fast_casual",
    title: "Fast-Casual, Food Park & Cloud Kitchen",
    description: "Kitchen-only routing with delivery order sources enabled.",
    showFloorPlan: false,
    deliveryEnabled: true,
    stations: ["Kitchen"],
    categories: ["Mains", "Sides", "Beverages"],
    orderSources: ["Dine-in", "Takeout", "Delivery"],
  },
  {
    id: "bar",
    title: "Bar, Pub & KTV Lounge",
    description: "Late shifts, partial pours, floor plan and bar-only station routing.",
    showFloorPlan: true,
    enablePartialServing: true,
    shiftEndTime: "04:00 am",
    stations: ["Bar"],
    categories: ["Cocktails", "Beer & Spirits", "Bar Chow"],
  },
  {
    id: "retail",
    title: "Mini-Mart, Vape Shop & Specialty Retail",
    description: "Counter checkout with barcode quick-scan enabled by default.",
    showFloorPlan: false,
    barcodeQuickScan: true,
    stations: ["Counter"],
    categories: ["Beverages", "Snacks", "Essentials"],
  },
  {
    id: "service",
    title: "Barbershop, Salon & Auto Detailing",
    description: "Service bay scheduling and commission-based payroll presets.",
    showFloorPlan: false,
    commissionPayroll: true,
    stations: ["Service Bay"],
    categories: ["Services", "Care Products"],
  },
];

export function presetFor(id: BusinessType): OnboardingPreset {
  return BUSINESS_PRESETS.find((preset) => preset.id === id) ?? BUSINESS_PRESETS[0];
}
