import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Credit, insertCreditSchema, insertPaymentSchema } from "@shared/schema";
import { CreditCard } from "@/components/CreditCard";
import { Card, CardContent } from "@/components/ui/card";
import Confetti from "react-confetti";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCredits, useCustomers, useCreateCredit, useCreatePayment } from "@/hooks/useFirestore";
import { useAuth } from "@/contexts/AuthContext";

const creditFormSchema = insertCreditSchema.extend({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  interestRate: z.coerce.number().min(0).optional(),
});

const paymentFormSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  note: z.string().optional(),
});

type CreditFormValues = z.infer<typeof creditFormSchema>;
type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export default function Credits() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: credits, loading: creditsLoading } = useCredits();
  const { data: customers, loading: customersLoading } = useCustomers();
  const createCredit = useCreateCredit();
  const createPayment = useCreatePayment();

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const creditForm = useForm<CreditFormValues>({
    resolver: zodResolver(creditFormSchema),
    defaultValues: {
      customerId: "",
      customerName: "",
      amount: 0,
      interestRate: 0,
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
        interestRate: values.interestRate,
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
        title: "Error",
        description: error.message || "Failed to create credit",
        variant: "destructive",
      });
    }
  };

  const handlePaymentSubmit = async (values: PaymentFormValues) => {
    if (!selectedCredit || !user) return;

    if (values.amount > selectedCredit.remainingAmount) {
      toast({
        title: "Amount too high",
        description: "Payment amount cannot exceed remaining balance",
        variant: "destructive",
      });
      return;
    }

    try {
      const newPaidAmount = selectedCredit.paidAmount + values.amount;
      const newRemainingAmount = selectedCredit.amount - newPaidAmount;
      const newStatus = newRemainingAmount === 0 ? "paid" : selectedCredit.status;

      await createPayment.mutateAsync({
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

      toast({
        title: "Payment recorded",
        description: `Payment of $${values.amount.toLocaleString()} recorded successfully.`,
      });

      setPaymentDialogOpen(false);
      paymentForm.reset();
      setSelectedCredit(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    }
  };

  const handleViewHistory = (credit: Credit) => {
    toast({
      title: "Payment History",
      description: "Payment history feature coming soon!",
    });
  };

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
            <h1 className="text-3xl font-bold">Credits</h1>
            <p className="text-muted-foreground">Manage customer credits and payments</p>
          </div>
          <Button
            onClick={() => {
              if (customers.length === 0) {
                toast({
                  title: "No customers",
                  description: "Please add customers before creating credits",
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
            Create Credit
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
              placeholder="Search credits..."
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
              <DialogTitle>Create New Credit</DialogTitle>
              <DialogDescription>
                Add a new credit for a customer
              </DialogDescription>
            </DialogHeader>
            <Form {...creditForm}>
              <form onSubmit={creditForm.handleSubmit(handleCreditSubmit)} className="space-y-4">
                <FormField
                  control={creditForm.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-customer">
                            <SelectValue placeholder="Select a customer" />
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
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={creditForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount *</FormLabel>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={creditForm.control}
                    name="interestRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-interest-rate"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={creditForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date *</FormLabel>
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
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createCredit.isPending}
                    data-testid="button-save-credit"
                  >
                    {createCredit.isPending ? "Creating..." : "Create Credit"}
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
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a payment for {selectedCredit?.customerName}
              </DialogDescription>
            </DialogHeader>
            {selectedCredit && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining Balance:</span>
                  <span className="font-mono font-bold" data-testid="text-remaining-balance">
                    ${selectedCredit.remainingAmount.toLocaleString()}
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
                      <FormLabel>Payment Amount *</FormLabel>
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
                      <FormLabel>Note (optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Add a note about this payment"
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
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createPayment.isPending}
                    data-testid="button-submit-payment"
                  >
                    {createPayment.isPending ? "Recording..." : "Record Payment"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
