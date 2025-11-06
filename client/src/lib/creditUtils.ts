import { Credit } from "@shared/schema";

export function calculateCreditStatus(credit: Credit): Credit["status"] {
  if (credit.remainingAmount === 0) {
    return "paid";
  }
  
  const now = Date.now();
  if (credit.dueDate < now) {
    return "overdue";
  }
  
  return "active";
}

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString()} DT`;
}

export function calculatePaymentProgress(credit: Credit): number {
  if (credit.amount === 0) return 0;
  return (credit.paidAmount / credit.amount) * 100;
}
