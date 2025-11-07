import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Search, ArrowRight, Calendar, DollarSign, FileText, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { useCustomerByAccessCode, usePublicCredits, usePublicPayments, usePublicCreditIncreases } from "@/hooks/useFirestore";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { calculateCreditStatus } from "@/lib/creditUtils";
import { Badge } from "@/components/ui/badge";

export default function CustomerTrack() {
  const [location] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [accessCode, setAccessCode] = useState("");
  const [enteredCode, setEnteredCode] = useState<string | null>(null);

  // Get access code from URL if exists
  // Extract from location path: /customer-track/CUST-XXXX-XXXX-XXXX
  useEffect(() => {
    console.log("[CustomerTrack] Location changed:", location);
    const urlParts = location.split("/").filter(Boolean); // Remove empty strings
    console.log("[CustomerTrack] URL parts:", urlParts);
    const trackIndex = urlParts.indexOf("customer-track");
    console.log("[CustomerTrack] Track index:", trackIndex);
    
    if (trackIndex !== -1 && trackIndex < urlParts.length - 1) {
      const codeFromUrl = urlParts[trackIndex + 1];
      console.log("[CustomerTrack] Code from URL:", codeFromUrl);
      // Validate that it looks like an access code
      if (codeFromUrl && codeFromUrl.startsWith("CUST-")) {
        console.log("[CustomerTrack] Valid access code found, setting enteredCode");
        setEnteredCode(codeFromUrl);
      } else {
        console.log("[CustomerTrack] Code doesn't start with CUST-, ignoring");
      }
    } else {
      console.log("[CustomerTrack] No access code found in URL");
    }
  }, [location]);

  // Extract access code from URL for immediate use
  const urlParts = location.split("/").filter(Boolean);
  const trackIndex = urlParts.indexOf("customer-track");
  const accessCodeFromUrl = trackIndex !== -1 && trackIndex < urlParts.length - 1 
    ? urlParts[trackIndex + 1] 
    : null;
  
  const hasAccessCodeInUrl = accessCodeFromUrl && 
    accessCodeFromUrl.startsWith("CUST-");

  // Use access code from URL or entered code
  const activeAccessCode = hasAccessCodeInUrl ? accessCodeFromUrl : (enteredCode || null);
  
  console.log("[CustomerTrack] Active access code:", activeAccessCode);
  console.log("[CustomerTrack] Has access code in URL:", hasAccessCodeInUrl);
  console.log("[CustomerTrack] Entered code:", enteredCode);
  
  const { data: customer, isLoading: customerLoading, error: customerError } = useCustomerByAccessCode(activeAccessCode);
  
  // Debug: Log customer ID before fetching credits
  useEffect(() => {
    if (customer?.id) {
      console.log("[CustomerTrack] About to fetch credits for customer ID:", customer.id);
    } else {
      console.log("[CustomerTrack] No customer ID available yet, cannot fetch credits");
    }
  }, [customer?.id]);
  
  // Get credit for this customer (public access, no authentication required)
  const { data: credits, isLoading: creditsLoading, error: creditsError } = usePublicCredits(customer?.id || null);
  
  // Debug: Log when credits query is enabled/disabled
  useEffect(() => {
    console.log("[CustomerTrack] Credits query enabled:", !!customer?.id);
    console.log("[CustomerTrack] Customer ID for credits query:", customer?.id || "null");
  }, [customer?.id]);
  
  // Debug logging (remove in production)
  useEffect(() => {
    console.log("[CustomerTrack] ========== DEBUG INFO ==========");
    console.log("[CustomerTrack] Active Access Code:", activeAccessCode);
    console.log("[CustomerTrack] Customer Loading:", customerLoading);
    console.log("[CustomerTrack] Customer Error:", customerError);
    
    if (customer) {
      console.log("[CustomerTrack] ✅ Customer found:", customer);
      console.log("[CustomerTrack] Customer ID:", customer.id);
      console.log("[CustomerTrack] Customer Name:", customer.name);
      console.log("[CustomerTrack] Customer Access Code:", customer.accessCode);
    } else {
      console.log("[CustomerTrack] ❌ No customer found");
    }
    
    console.log("[CustomerTrack] Credits Loading:", creditsLoading);
    console.log("[CustomerTrack] Credits Error:", creditsError);
    
    if (credits) {
      console.log("[CustomerTrack] ✅ Credits found:", credits);
      console.log("[CustomerTrack] Credits count:", credits.length);
      credits.forEach((credit, index) => {
        console.log(`[CustomerTrack] Credit ${index + 1}:`, {
          id: credit.id,
          customerId: credit.customerId,
          amount: credit.amount,
          remainingAmount: credit.remainingAmount,
          status: credit.status,
          dueDate: credit.dueDate,
        });
      });
    } else {
      console.log("[CustomerTrack] ❌ No credits found or credits is null/undefined");
    }
    
    console.log("[CustomerTrack] ================================");
  }, [customer, credits, creditsError, customerError, customerLoading, creditsLoading, activeAccessCode]);
  
  // Get the most recent credit for this customer
  const customerCredit = customer && credits && credits.length > 0 
    ? credits.sort((a, b) => b.createdAt - a.createdAt)[0] 
    : null;
  
  // Additional debug logging for customerCredit
  useEffect(() => {
    console.log("[CustomerTrack] ========== CUSTOMER CREDIT DEBUG ==========");
    if (customerCredit) {
      console.log("[CustomerTrack] ✅ Customer Credit found:", customerCredit);
      console.log("[CustomerTrack] Credit ID:", customerCredit.id);
      console.log("[CustomerTrack] Credit Customer ID:", customerCredit.customerId);
      console.log("[CustomerTrack] Credit Amount:", customerCredit.amount);
      console.log("[CustomerTrack] Credit Remaining Amount:", customerCredit.remainingAmount);
      console.log("[CustomerTrack] Credit Status:", customerCredit.status);
      console.log("[CustomerTrack] Credit Due Date:", customerCredit.dueDate);
      console.log("[CustomerTrack] Credit Created At:", customerCredit.createdAt);
    } else {
      console.log("[CustomerTrack] ❌ No customer credit found");
      if (customer) {
        console.log("[CustomerTrack] Customer exists but no credit found");
        console.log("[CustomerTrack] Customer ID:", customer.id);
        console.log("[CustomerTrack] Credits array:", credits);
        console.log("[CustomerTrack] Credits length:", credits?.length || 0);
        console.log("[CustomerTrack] Credits is null:", credits === null);
        console.log("[CustomerTrack] Credits is undefined:", credits === undefined);
        if (credits && credits.length === 0) {
          console.log("[CustomerTrack] ⚠️ Credits array is empty");
        }
      } else {
        console.log("[CustomerTrack] No customer found, cannot get credit");
      }
    }
    console.log("[CustomerTrack] ==========================================");
  }, [customerCredit, customer, credits]);
  
  // Get transactions (public access, no authentication required)
  const { data: payments } = usePublicPayments(customer?.id || null);
  const { data: creditIncreases } = usePublicCreditIncreases(customer?.id || null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      toast({
        title: t("customerTrack.invalidCode"),
        description: t("customerTrack.pleaseEnterCode"),
        variant: "destructive",
      });
      return;
    }
    setEnteredCode(accessCode.trim().toUpperCase());
  };

  // Get transactions for customer credit
  const transactions = customerCredit ? [
    ...(payments.filter(p => p.creditId === customerCredit.id).map(p => ({
      id: p.id,
      type: "payment" as const,
      amount: p.amount,
      note: p.note,
      createdAt: p.createdAt,
    }))),
    ...(creditIncreases.filter(ci => ci.creditId === customerCredit.id).map(ci => ({
      id: ci.id,
      type: "creditIncrease" as const,
      amount: ci.amount,
      note: ci.note,
      createdAt: ci.createdAt,
    }))),
  ].sort((a, b) => b.createdAt - a.createdAt) : [];

  if (!activeAccessCode && !customer) {
    // Access code entry form
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-md w-full"
        >
          <Card className="shadow-lg">
            <CardHeader className="text-center space-y-4 pb-6">
              <CardTitle className="text-2xl">{t("customerTrack.title")}</CardTitle>
              <p className="text-muted-foreground text-sm">
                {t("customerTrack.subtitle")}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("customerTrack.enterCode")}</label>
                  <Input
                    type="text"
                    placeholder="CUST-XXXX-XXXX"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    className="text-center font-mono text-lg tracking-wider"
                    maxLength={15}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("customerTrack.codeHint")}
                  </p>
                </div>
                <Button type="submit" className="w-full" size="lg">
                  <Search className="h-4 w-4 mr-2" />
                  {t("customerTrack.viewCredit")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (customerLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">{t("common.loading")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-destructive">{t("customerTrack.customerNotFound")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">{t("customerTrack.invalidCodeDesc")}</p>
            <Button
              variant="outline"
              onClick={() => {
                setEnteredCode(null);
                setAccessCode("");
              }}
              className="w-full"
            >
              {t("customerTrack.tryAgain")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const creditStatus = customerCredit ? calculateCreditStatus(customerCredit) : null;
  const isPaid = customerCredit?.remainingAmount === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-3xl font-bold">{t("customerTrack.title")}</h1>
          <p className="text-muted-foreground">{t("customerTrack.customerName")}: {customer.name}</p>
        </motion.div>

        {!customerCredit ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t("customerTrack.noCredit")}</h3>
              <p className="text-muted-foreground">{t("customerTrack.noCreditDesc")}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Credit Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t("customerTrack.creditSummary")}</CardTitle>
                    <Badge variant={isPaid ? "default" : creditStatus === "overdue" ? "destructive" : "secondary"}>
                      {creditStatus ? creditStatus.charAt(0).toUpperCase() + creditStatus.slice(1) : "Active"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-4">
                    <div className="text-sm text-muted-foreground mb-2">{t("credits.amount")}</div>
                    <div className={`text-4xl font-bold font-mono ${isPaid ? "text-green-600" : "text-destructive"}`}>
                      {customerCredit.remainingAmount.toLocaleString()} DT
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">{t("credits.dueDateLabel")}</div>
                        <div className="font-medium">{format(customerCredit.dueDate, "MMM dd, yyyy")}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">{t("credits.totalAmount")}</div>
                        <div className="font-medium">{customerCredit.amount.toLocaleString()} DT</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Transaction History */}
            {transactions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>{t("credits.transactionHistory")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-4 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${transaction.type === "payment" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}>
                              {transaction.type === "payment" ? (
                                <TrendingDown className="h-4 w-4" />
                              ) : (
                                <DollarSign className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">
                                {transaction.type === "payment" ? t("credits.payment") : t("credits.creditIncrease")}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(transaction.createdAt, "MMM dd, yyyy 'at' h:mm a")}
                              </div>
                              {transaction.note && (
                                <div className="text-xs text-muted-foreground mt-1">{transaction.note}</div>
                              )}
                            </div>
                          </div>
                          <div className={`font-mono font-bold text-lg ${transaction.type === "payment" ? "text-green-600" : "text-blue-600"}`}>
                            {transaction.type === "payment" ? "-" : "+"}{transaction.amount.toLocaleString()} DT
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

