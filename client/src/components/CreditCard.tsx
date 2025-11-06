import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Credit } from "@shared/schema";
import { format } from "date-fns";
import { Calendar, Plus, History, Receipt, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculateCreditStatus } from "@/lib/creditUtils";

interface CreditCardProps {
  credit: Credit;
  onRecordPayment: (credit: Credit) => void;
  onViewHistory: (credit: Credit) => void;
  onIncreaseCredit?: (credit: Credit) => void;
}

export function CreditCard({ credit, onRecordPayment, onViewHistory, onIncreaseCredit }: CreditCardProps) {
  const { t } = useLanguage();
  
  // Calculate status based on remainingAmount and dueDate (ignore stored status)
  const effectiveStatus = calculateCreditStatus(credit);
  const isPaid = effectiveStatus === "paid";
  
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "overdue":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="hover-elevate" data-testid={`credit-card-${credit.id}`}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <CardTitle className="text-lg font-medium">
            {credit.customerName}
          </CardTitle>
          <Badge variant={getStatusVariant(effectiveStatus)} data-testid={`badge-status-${credit.id}`}>
            {getStatusLabel(effectiveStatus)}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">{t("credits.amount")}</div>
            <div className="text-3xl font-bold font-mono text-destructive">
              {credit.remainingAmount.toLocaleString()} DT
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-muted-foreground">{t("credits.dueDateLabel")}</div>
              <div className="font-medium">{format(credit.dueDate, "MMM dd, yyyy")}</div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-4 border-t">
          <div className="flex flex-wrap gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewHistory(credit)}
              data-testid={`button-view-history-${credit.id}`}
              className="flex-1 min-w-[140px]"
            >
              <History className="h-4 w-4 mr-2" />
              {t("credits.viewHistory")}
            </Button>
            {onIncreaseCredit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onIncreaseCredit(credit)}
                data-testid={`button-increase-credit-${credit.id}`}
                className="flex-1 min-w-[140px]"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {t("credits.addCredit")}
              </Button>
            )}
            {!isPaid && (
              <Button
                size="sm"
                onClick={() => onRecordPayment(credit)}
                data-testid={`button-record-payment-${credit.id}`}
                className="flex-1 min-w-[140px]"
              >
                <Receipt className="h-4 w-4 mr-2" />
                {t("credits.recordPayment")}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
