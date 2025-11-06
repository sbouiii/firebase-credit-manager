import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, DollarSign, Calendar as CalendarIcon, FileText, Filter, X as XIcon, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Credit, Payment, CreditIncrease, insertCreditSchema, insertPaymentSchema } from "@shared/schema";
import { CreditCard } from "@/components/CreditCard";
import { Card, CardContent } from "@/components/ui/card";
import Confetti from "react-confetti";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCredits, useCustomers, useCreateCredit, useCreatePayment, usePayments, useUpdateCredit, useCreditIncreases, useCreateCreditIncrease, useStore } from "@/hooks/useFirestore";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { PaymentReceipt } from "@/components/PaymentReceipt";

const creditFormSchema = insertCreditSchema.extend({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
});

const paymentFormSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  note: z.string().optional(),
});

const increaseCreditFormSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  note: z.string().optional(),
});

type CreditFormValues = z.infer<typeof creditFormSchema>;
type PaymentFormValues = z.infer<typeof paymentFormSchema>;
type IncreaseCreditFormValues = z.infer<typeof increaseCreditFormSchema>;

export default function Credits() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { data: credits, isLoading: creditsLoading } = useCredits();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: payments, isLoading: paymentsLoading } = usePayments();
  const { data: creditIncreases, isLoading: creditIncreasesLoading } = useCreditIncreases();
  const { data: store } = useStore();
  const createCredit = useCreateCredit();
  const createPayment = useCreatePayment();
  const createCreditIncrease = useCreateCreditIncrease();
  const updateCredit = useUpdateCredit();

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [increaseCreditDialogOpen, setIncreaseCreditDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [selectedCreditForHistory, setSelectedCreditForHistory] = useState<Credit | null>(null);
  const [selectedCreditForIncrease, setSelectedCreditForIncrease] = useState<Credit | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [lastPayment, setLastPayment] = useState<Payment | null>(null);
  const [dateFilterStart, setDateFilterStart] = useState<string>("");
  const [dateFilterEnd, setDateFilterEnd] = useState<string>("");
  const [showDateFilter, setShowDateFilter] = useState<boolean>(false);

  const creditForm = useForm<CreditFormValues>({
    resolver: zodResolver(creditFormSchema),
    defaultValues: {
      customerId: "",
      customerName: "",
      amount: 0,
      dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      userId: "",
    },
  });

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 0,
      note: "",
    },
  });

  const increaseCreditForm = useForm<IncreaseCreditFormValues>({
    resolver: zodResolver(increaseCreditFormSchema),
    defaultValues: {
      amount: 0,
      note: "",
    },
  });

  const filteredCredits = useMemo(() => {
    return credits.filter(credit =>
      credit.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credit.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [credits, searchTerm]);

  const loading = creditsLoading || customersLoading;

  const handleCreditSubmit = async (values: CreditFormValues) => {
    if (!user) return;

    try {
      const selectedCustomer = customers.find(c => c.id === values.customerId);
      if (!selectedCustomer) {
        toast({
          title: "Error",
          description: "Please select a customer",
          variant: "destructive",
        });
        return;
      }

      await createCredit.mutateAsync({
        customerId: values.customerId,
        customerName: selectedCustomer.name,
        amount: values.amount,
        dueDate: values.dueDate,
        userId: user.uid,
      });
      
      toast({
        title: "Credit created",
        description: "New credit has been created successfully.",
      });

      setDialogOpen(false);
      creditForm.reset();
    } catch (error: any) {
      toast({
        title: t("errors.error"),
        description: error.message || t("errors.failed"),
        variant: "destructive",
      });
    }
  };

  const handlePaymentSubmit = async (values: PaymentFormValues) => {
    if (!selectedCredit || !user) return;

    if (values.amount > selectedCredit.remainingAmount) {
      toast({
        title: t("errors.amountTooHigh"),
        description: t("errors.amountTooHighDesc"),
        variant: "destructive",
      });
      return;
    }

    try {
      const newPaidAmount = selectedCredit.paidAmount + values.amount;
      const newRemainingAmount = selectedCredit.amount - newPaidAmount;
      const newStatus = newRemainingAmount === 0 ? "paid" : selectedCredit.status;

      const paymentId = await createPayment.mutateAsync({
        paymentData: {
          creditId: selectedCredit.id,
          customerId: selectedCredit.customerId,
          amount: values.amount,
          note: values.note,
          userId: user.uid,
        },
        creditUpdate: {
          id: selectedCredit.id,
          data: {
            paidAmount: newPaidAmount,
            remainingAmount: newRemainingAmount,
            status: newStatus,
          },
        },
      });

      if (newStatus === "paid") {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }

      // Create payment object for receipt
      const createdPayment: Payment = {
        id: paymentId,
        creditId: selectedCredit.id,
        customerId: selectedCredit.customerId,
        amount: values.amount,
        note: values.note,
        userId: user.uid,
        createdAt: Date.now(),
      };

      // Store credit with updated values for receipt
      const creditForReceipt: Credit = {
        ...selectedCredit,
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus,
      };

      // Show receipt dialog
      setLastPayment(createdPayment);
      setSelectedCredit(creditForReceipt);
      setPaymentDialogOpen(false);
      setReceiptDialogOpen(true);
      paymentForm.reset();

      toast({
        title: t("credits.paymentRecorded"),
        description: `${t("credits.paymentRecordedDesc")} ${values.amount.toLocaleString()} DT`,
      });
    } catch (error) {
      toast({
        title: t("errors.error"),
        description: t("errors.failed"),
        variant: "destructive",
      });
    }
  };

  const handleViewHistory = (credit: Credit) => {
    setSelectedCreditForHistory(credit);
    setHistoryDialogOpen(true);
  };

  const handleIncreaseCredit = (credit: Credit) => {
    setSelectedCreditForIncrease(credit);
    increaseCreditForm.reset({ amount: 0, note: "" });
    setIncreaseCreditDialogOpen(true);
  };

  const handleIncreaseCreditSubmit = async (values: IncreaseCreditFormValues) => {
    if (!selectedCreditForIncrease || !user) return;

    try {
      const newAmount = selectedCreditForIncrease.amount + values.amount;
      const newRemainingAmount = selectedCreditForIncrease.remainingAmount + values.amount;

      await createCreditIncrease.mutateAsync({
        creditIncreaseData: {
          creditId: selectedCreditForIncrease.id,
          customerId: selectedCreditForIncrease.customerId,
          amount: values.amount,
          note: values.note,
          userId: user.uid,
        },
        creditUpdate: {
          id: selectedCreditForIncrease.id,
          data: {
            amount: newAmount,
            remainingAmount: newRemainingAmount,
            status: newRemainingAmount === 0 ? "paid" : selectedCreditForIncrease.status,
          },
        },
      });

      toast({
        title: "Credit increased",
        description: `Credit amount increased by ${values.amount.toLocaleString()} DT. New total: ${newAmount.toLocaleString()} DT`,
      });

      setIncreaseCreditDialogOpen(false);
      increaseCreditForm.reset();
      setSelectedCreditForIncrease(null);
    } catch (error: any) {
      toast({
        title: t("errors.error"),
        description: error.message || t("errors.failed"),
        variant: "destructive",
      });
    }
  };

  // Combine payments and credit increases into a unified transaction list
  const creditTransactions = useMemo(() => {
    if (!selectedCreditForHistory) return [];
    
    const paymentTransactions = payments
      .filter((payment: Payment) => payment.creditId === selectedCreditForHistory.id)
      .map((payment: Payment) => ({
        id: payment.id,
        type: "payment" as const,
        amount: payment.amount,
        note: payment.note,
        createdAt: payment.createdAt,
      }));

    const increaseTransactions = creditIncreases
      .filter((increase: CreditIncrease) => increase.creditId === selectedCreditForHistory.id)
      .map((increase: CreditIncrease) => ({
        id: increase.id,
        type: "creditIncrease" as const,
        amount: increase.amount,
        note: increase.note,
        createdAt: increase.createdAt,
      }));

    // Combine and sort by date (newest first)
    let allTransactions = [...paymentTransactions, ...increaseTransactions]
      .sort((a, b) => b.createdAt - a.createdAt);

    // Apply date filter if dates are selected
    if (dateFilterStart || dateFilterEnd) {
      const startDate = dateFilterStart ? new Date(dateFilterStart).setHours(0, 0, 0, 0) : null;
      const endDate = dateFilterEnd ? new Date(dateFilterEnd).setHours(23, 59, 59, 999) : null;
      
      allTransactions = allTransactions.filter((transaction) => {
        const transactionDate = transaction.createdAt;
        if (startDate && transactionDate < startDate) return false;
        if (endDate && transactionDate > endDate) return false;
        return true;
      });
    }

    return allTransactions;
  }, [payments, creditIncreases, selectedCreditForHistory, dateFilterStart, dateFilterEnd]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-full max-w-md bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                <div className="h-2 w-full bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
      
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold">{t("credits.title")}</h1>
            <p className="text-muted-foreground">{t("credits.description")}</p>
          </div>
          <Button
            onClick={() => {
              if (customers.length === 0) {
                toast({
                  title: t("customers.noCustomers"),
                  description: t("customers.noCustomersDesc"),
                  variant: "destructive",
                });
                return;
              }
              creditForm.reset();
              setDialogOpen(true);
            }}
            data-testid="button-add-credit"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("credits.createCredit")}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("credits.searchCredits")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-credits"
            />
          </div>
        </motion.div>

        {filteredCredits.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No credits found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Try a different search term" : "Get started by creating your first credit"}
                </p>
                {!searchTerm && customers.length > 0 && (
                  <Button onClick={() => { creditForm.reset(); setDialogOpen(true); }} data-testid="button-add-first-credit">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Credit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCredits.map((credit) => (
              <CreditCard
                key={credit.id}
                credit={credit}
                onRecordPayment={(c) => {
                  setSelectedCredit(c);
                  paymentForm.reset({ amount: 0, note: "" });
                  setPaymentDialogOpen(true);
                }}
                onViewHistory={handleViewHistory}
                onIncreaseCredit={handleIncreaseCredit}
              />
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) creditForm.reset();
        }}>
          <DialogContent data-testid="dialog-credit-form">
            <DialogHeader>
              <DialogTitle>{t("credits.createNewCredit")}</DialogTitle>
              <DialogDescription>
                {t("credits.addCreditDesc")}
              </DialogDescription>
            </DialogHeader>
            <Form {...creditForm}>
              <form onSubmit={creditForm.handleSubmit(handleCreditSubmit)} className="space-y-4">
                <FormField
                  control={creditForm.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("credits.customer")} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-customer">
                            <SelectValue placeholder={t("credits.customer")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={creditForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("credits.amount")} *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-credit-amount"
                        />
                      </FormControl>
                      <FormDescription>
                        {t("credits.amountDescription")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={creditForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("credits.dueDate")} *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={new Date(field.value).toISOString().split('T')[0]}
                          onChange={e => field.onChange(new Date(e.target.value).getTime())}
                          data-testid="input-due-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      creditForm.reset();
                    }}
                    data-testid="button-cancel-credit"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createCredit.isPending}
                    data-testid="button-save-credit"
                  >
                    {createCredit.isPending ? t("common.loading") : t("credits.createCredit")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={paymentDialogOpen} onOpenChange={(open) => {
          setPaymentDialogOpen(open);
          if (!open) {
            paymentForm.reset();
            setSelectedCredit(null);
          }
        }}>
          <DialogContent data-testid="dialog-payment-form">
            <DialogHeader>
              <DialogTitle>{t("credits.recordPayment")}</DialogTitle>
              <DialogDescription>
                {t("credits.recordPaymentDesc")} {selectedCredit?.customerName}
              </DialogDescription>
            </DialogHeader>
            {selectedCredit && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("credits.amount")}:</span>
                  <span className="font-mono font-bold" data-testid="text-remaining-balance">
                    {selectedCredit.remainingAmount.toLocaleString()} DT
                  </span>
                </div>
              </div>
            )}
            <Form {...paymentForm}>
              <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-4">
                <FormField
                  control={paymentForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("credits.paymentAmount")} *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={selectedCredit?.remainingAmount}
                          {...field}
                          value={field.value || ""}
                          data-testid="input-payment-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={paymentForm.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("credits.note")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("credits.addNote")}
                          data-testid="input-payment-note"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPaymentDialogOpen(false);
                      paymentForm.reset();
                      setSelectedCredit(null);
                    }}
                    data-testid="button-cancel-payment"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createPayment.isPending}
                    data-testid="button-submit-payment"
                  >
                    {createPayment.isPending ? t("common.loading") : t("credits.recordPayment")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={increaseCreditDialogOpen} onOpenChange={(open) => {
          setIncreaseCreditDialogOpen(open);
          if (!open) {
            increaseCreditForm.reset();
            setSelectedCreditForIncrease(null);
          }
        }}>
          <DialogContent data-testid="dialog-increase-credit-form">
            <DialogHeader>
              <DialogTitle>{t("credits.increaseCredit")}</DialogTitle>
              <DialogDescription>
                {t("credits.additionalCreditAmount")} {selectedCreditForIncrease?.customerName}
              </DialogDescription>
            </DialogHeader>
            {selectedCreditForIncrease && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="text-center text-sm">
                  <span className="text-muted-foreground">{t("credits.amount")}:</span>
                  <div className="font-mono font-bold text-2xl text-destructive mt-1">
                    {selectedCreditForIncrease.remainingAmount.toLocaleString()} DT
                  </div>
                </div>
              </div>
            )}
            <Form {...increaseCreditForm}>
              <form onSubmit={increaseCreditForm.handleSubmit(handleIncreaseCreditSubmit)} className="space-y-4">
                <FormField
                  control={increaseCreditForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("credits.additionalCreditAmount")} *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          {...field}
                          value={field.value || ""}
                          placeholder={t("credits.enterAmount")}
                          data-testid="input-increase-credit-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={increaseCreditForm.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("credits.note")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("credits.creditIncreaseNote")}
                          data-testid="input-increase-credit-note"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedCreditForIncrease && increaseCreditForm.watch("amount") && (
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="text-sm text-muted-foreground">{t("credits.newAmount")}:</div>
                    <div className="font-mono font-bold text-lg text-destructive">
                      {(selectedCreditForIncrease.remainingAmount + parseFloat(String(increaseCreditForm.watch("amount") || "0"))).toLocaleString()} DT
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIncreaseCreditDialogOpen(false);
                      increaseCreditForm.reset();
                      setSelectedCreditForIncrease(null);
                    }}
                    data-testid="button-cancel-increase-credit"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateCredit.isPending}
                    data-testid="button-submit-increase-credit"
                  >
                    {updateCredit.isPending ? t("common.loading") : t("credits.increaseCredit")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={historyDialogOpen} onOpenChange={(open) => {
          setHistoryDialogOpen(open);
          if (open) {
            // Open filter when dialog opens
            setShowDateFilter(true);
          } else {
            setSelectedCreditForHistory(null);
            setDateFilterStart("");
            setDateFilterEnd("");
            setShowDateFilter(false);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-payment-history">
            <DialogHeader>
              <DialogTitle>{t("credits.transactionHistory")}</DialogTitle>
              <DialogDescription>
                {t("credits.transactionHistoryDesc")} {selectedCreditForHistory?.customerName}
              </DialogDescription>
            </DialogHeader>
            {selectedCreditForHistory && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="text-center text-sm">
                    <span className="text-muted-foreground">{t("credits.amount")}:</span>
                    <div className="font-mono font-bold text-2xl text-destructive mt-1">{selectedCreditForHistory.remainingAmount.toLocaleString()} DT</div>
                  </div>
                </div>

                {/* Date Filter - Collapsible */}
                <Collapsible open={showDateFilter} onOpenChange={setShowDateFilter}>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-4 hover:bg-gray-100"
                        data-testid="button-toggle-date-filter"
                      >
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">{t("credits.filterByDate")}</span>
                          {(dateFilterStart || dateFilterEnd) && (
                            <Badge variant="secondary" className="ml-2">
                              {dateFilterStart && dateFilterEnd ? "2" : "1"}
                            </Badge>
                          )}
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showDateFilter ? "rotate-180" : ""}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                      <div className="px-4 pb-4 pt-0 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              {t("credits.fromDate")}
                            </label>
                            <Input
                              type="date"
                              value={dateFilterStart}
                              onChange={(e) => setDateFilterStart(e.target.value)}
                              className="w-full"
                              data-testid="input-filter-start-date"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              {t("credits.toDate")}
                            </label>
                            <Input
                              type="date"
                              value={dateFilterEnd}
                              onChange={(e) => setDateFilterEnd(e.target.value)}
                              className="w-full"
                              data-testid="input-filter-end-date"
                            />
                          </div>
                        </div>
                        {(dateFilterStart || dateFilterEnd) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDateFilterStart("");
                              setDateFilterEnd("");
                            }}
                            className="w-full"
                            data-testid="button-clear-date-filter"
                          >
                            <XIcon className="h-4 w-4 mr-2" />
                            {t("credits.clearFilter")}
                          </Button>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>

                {paymentsLoading || creditIncreasesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading transaction history...</div>
                  </div>
                ) : creditTransactions.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">{t("credits.noTransactions")}</h3>
                        <p className="text-muted-foreground">
                          {t("credits.noTransactionsDesc")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      {creditTransactions.length} {creditTransactions.length === 1 ? t("credits.transaction") : t("credits.transactions")}
                    </h3>
                    <div className="space-y-2">
                      {creditTransactions.map((transaction) => (
                        <Card key={transaction.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <span className={`font-mono font-bold text-lg ${transaction.type === "payment" ? "text-destructive" : "text-green-600"}`}>
                                    {transaction.type === "payment" ? "-" : "+"}{transaction.amount.toLocaleString()} DT
                                  </span>
                                  <Badge variant={transaction.type === "payment" ? "default" : "secondary"}>
                                    {transaction.type === "payment" ? t("credits.payment") : t("credits.creditIncrease")}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <CalendarIcon className="h-3 w-3" />
                                  <span>{format(transaction.createdAt, "MMM dd, yyyy 'at' h:mm a")}</span>
                                </div>
                                {transaction.note && (
                                  <div className="text-sm text-muted-foreground mt-2">
                                    <span className="font-medium">{t("credits.note")}: </span>
                                    {transaction.note}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setHistoryDialogOpen(false);
                  setSelectedCreditForHistory(null);
                }}
                data-testid="button-close-history"
              >
                {t("common.close")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Receipt Dialog */}
        <Dialog open={receiptDialogOpen} onOpenChange={(open) => {
          setReceiptDialogOpen(open);
          if (!open) {
            setLastPayment(null);
            setSelectedCredit(null);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {lastPayment && selectedCredit && (
              <PaymentReceipt
                store={store}
                payment={lastPayment}
                credit={selectedCredit}
                customerName={selectedCredit.customerName}
                onClose={() => {
                  setReceiptDialogOpen(false);
                  setLastPayment(null);
                  setSelectedCredit(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
