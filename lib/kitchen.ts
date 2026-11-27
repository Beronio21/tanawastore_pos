/** Shared Kitchen Kit helpers used by the POS, the dedicated screen and tests. */
import type { KdsTicket, KdsTicketStatus, PosOrderTab } from "./console-data";

export const KITCHEN_CHANNEL = "tanawa_kitchen_sync";
export const KITCHEN_ACTIVE_STATUSES: KdsTicketStatus[] = ["queued", "preparing", "ready"];

export function ticketStatus(ticket: KdsTicket): KdsTicketStatus {
  return ticket.status ?? "queued";
}

export function isActiveTicket(ticket: KdsTicket): boolean {
  return KITCHEN_ACTIVE_STATUSES.includes(ticketStatus(ticket));
}

export function activeTickets(tickets: KdsTicket[]): KdsTicket[] {
  return tickets.filter(isActiveTicket);
}

/** queued → preparing → ready → served */
export function nextTicketStatus(status: KdsTicketStatus): KdsTicketStatus {
  if (status === "queued") return "preparing";
  if (status === "preparing") return "ready";
  return "served";
}

export function ticketActionLabel(status: KdsTicketStatus): string {
  if (status === "queued") return "Start Prep";
  if (status === "preparing") return "Mark Ready";
  return "Bump / Served";
}

/** Elapsed minutes since the ticket opened (0 when unknown). */
export function elapsedMinutes(ticket: KdsTicket, now: number = Date.now()): number {
  const openedAt = ticket.openedAtMs ?? Number.NaN;
  if (!Number.isFinite(openedAt)) return 0;
  return Math.max(0, (now - openedAt) / 60_000);
}

/** Amber after 8 minutes, red after 15. */
export function elapsedTone(ticket: KdsTicket, now: number = Date.now()): "normal" | "amber" | "red" {
  const minutes = elapsedMinutes(ticket, now);
  if (minutes > 15) return "red";
  if (minutes > 8) return "amber";
  return "normal";
}

export function elapsedLabel(ticket: KdsTicket, now: number = Date.now()): string {
  const minutes = Math.floor(elapsedMinutes(ticket, now));
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/** Dine-in / Takeout / Delivery badge from the order source. */
export function ticketSource(order: Pick<PosOrderTab, "source" | "tableId" | "deliveryArea">): string {
  if (order.source) return order.source;
  if (order.deliveryArea) return "Delivery";
  return order.tableId === "TAKEAWAY" ? "Takeout" : "Dine-in";
}

export type KitchenTicketInput = Omit<KdsTicket, "time"> & { time?: string };

/** Normalize a ticket payload so legacy/local shapes stay consistent. */
export function normalizeTicket(ticket: KitchenTicketInput): KdsTicket {
  return {
    ...ticket,
    status: ticket.status ?? "queued",
    openedAtMs: ticket.openedAtMs ?? Date.now(),
    time: ticket.time ?? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}
