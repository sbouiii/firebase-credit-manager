import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Credit } from "@shared/schema";
import { format } from "date-fns";
import { Calendar, DollarSign, Percent } from "lucide-react";
import { motion } from "framer-motion";

interface CreditCardProps {
  credit: Credit;
  onRecordPayment: (credit: Credit) => void;
  onViewHistory: (credit: Credit) => void;
}

export function CreditCard({ credit, onRecordPayment, onViewHistory }: CreditCardProps) {
  const paymentProgress = (credit.paidAmount / credit.amount) * 100;
  
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
          <Badge variant={getStatusVariant(credit.status)} data-testid={`badge-status-${credit.id}`}>
            {getStatusLabel(credit.status)}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Amount</div>
              <div className="text-2xl font-bold font-mono flex items-center gap-1">
                <DollarSign className="h-5 w-5" />
                {credit.amount.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Remaining</div>
              <div className="text-2xl font-bold font-mono text-destructive flex items-center gap-1">
                <DollarSign className="h-5 w-5" />
                {credit.remainingAmount.toLocaleString()}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Progress</span>
              <span className="font-medium">{paymentProgress.toFixed(0)}%</span>
            </div>
            <Progress value={paymentProgress} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-muted-foreground">Due Date</div>
                <div className="font-medium">{format(credit.dueDate, "MMM dd, yyyy")}</div>
              </div>
            </div>
            {credit.interestRate !== undefined && credit.interestRate > 0 && (
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-muted-foreground">Interest</div>
                  <div className="font-medium">{credit.interestRate}%</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewHistory(credit)}
            data-testid={`button-view-history-${credit.id}`}
          >
            View History
          </Button>
          {credit.status !== "paid" && (
            <Button
              size="sm"
              onClick={() => onRecordPayment(credit)}
              data-testid={`button-record-payment-${credit.id}`}
            >
              Record Payment
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
