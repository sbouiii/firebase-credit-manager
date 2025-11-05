import { z } from "zod";

// Customer Schema
export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  createdAt: z.number(),
  userId: z.string(),
});

export const insertCustomerSchema = customerSchema.omit({ id: true, createdAt: true });

export type Customer = z.infer<typeof customerSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

// Credit Schema
export const creditSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  amount: z.number(),
  paidAmount: z.number(),
  remainingAmount: z.number(),
  interestRate: z.number().optional(),
  dueDate: z.number(),
  status: z.enum(["active", "paid", "overdue"]),
  createdAt: z.number(),
  userId: z.string(),
});

export const insertCreditSchema = creditSchema.omit({ 
  id: true, 
  createdAt: true, 
  remainingAmount: true,
  paidAmount: true,
  status: true 
});

export type Credit = z.infer<typeof creditSchema>;
export type InsertCredit = z.infer<typeof insertCreditSchema>;

// Payment Schema
export const paymentSchema = z.object({
  id: z.string(),
  creditId: z.string(),
  customerId: z.string(),
  amount: z.number(),
  note: z.string().optional(),
  createdAt: z.number(),
  userId: z.string(),
});

export const insertPaymentSchema = paymentSchema.omit({ id: true, createdAt: true });

export type Payment = z.infer<typeof paymentSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// User Profile Schema (for Firebase auth users)
export const userProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  role: z.enum(["admin", "seller"]).default("seller"),
  createdAt: z.number(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
