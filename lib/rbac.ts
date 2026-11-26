/** Position-based role access control for the console and POS terminal. */
import type { AccessLevel, PositionRole } from "./console-data";

export type PermissionFlag =
  | "canViewReports"
  | "canViewFinances"
  | "canEditMenu"
  | "canManageInventory"
  | "canManageMarketing"
  | "canManageAccess"
  | "canEditSettings"
  | "canRefundOrders"
  | "canApplyDiscounts";

export type PermissionSet = Record<PermissionFlag, boolean>;

const ALL_FLAGS: PermissionFlag[] = [
  "canViewReports",
  "canViewFinances",
  "canEditMenu",
  "canManageInventory",
  "canManageMarketing",
  "canManageAccess",
  "canEditSettings",
  "canRefundOrders",
  "canApplyDiscounts",
];

function granted(level: AccessLevel | undefined): boolean {
  return level === "Full access" || level === "View only";
}

export function permissionsForPosition(position: PositionRole | null | undefined): PermissionSet {
  const full: PermissionSet = Object.fromEntries(ALL_FLAGS.map((flag) => [flag, true])) as PermissionSet;
  if (!position) return full;
  if (position.systemRole || position.title === "Owner") return full;

  const access = position.consoleAccess;
  return {
    canViewReports: granted(access.reports),
    canViewFinances: granted(access.finances),
    canEditMenu: access.menu === "Full access",
    canManageInventory: access.inventory === "Full access",
    canManageMarketing: access.marketing === "Full access",
    canManageAccess: access.accessSettings === "Full access",
    canEditSettings: access.accountSettings === "Full access" || access.securitySettings === "Full access",
    canRefundOrders: position.orderAdministration || access.finances === "Full access",
    canApplyDiscounts: position.orderAdministration || position.editAllOrders || access.marketing === "Full access",
  };
}

export function hasPermission(position: PositionRole | null | undefined, flag: PermissionFlag): boolean {
  return permissionsForPosition(position)[flag];
}

/** Owners always keep every section, including Settings. */
export function canSeeSection(position: PositionRole | null | undefined, sectionId: string): boolean {
  if (!position) return true;
  if (position.systemRole || position.title === "Owner") return true;
  const permissions = permissionsForPosition(position);
  switch (sectionId) {
    case "reports":
      return permissions.canViewReports;
    case "finances":
      return permissions.canViewFinances;
    case "menu":
      return permissions.canEditMenu;
    case "calculations":
      return permissions.canManageInventory;
    case "marketing":
      return permissions.canManageMarketing;
    case "access":
      return permissions.canManageAccess;
    case "settings":
      return permissions.canEditSettings;
    default:
      return true;
  }
}

export function filterNavSections<T extends { id: string }>(
  sections: T[],
  position: PositionRole | null | undefined,
): T[] {
  return sections.filter((section) => canSeeSection(position, section.id));
}
