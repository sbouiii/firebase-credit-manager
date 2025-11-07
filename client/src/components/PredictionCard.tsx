import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PaymentPrediction } from "@/lib/predictionUtils";

interface PredictionCardProps {
  prediction: PaymentPrediction;
  delay?: number;
}

export function PredictionCard({ prediction, delay = 0 }: PredictionCardProps) {
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "high":
        return "bg-orange-500";
      case "critical":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "medium":
        return <TrendingUp className="h-5 w-5 text-yellow-500" />;
      case "high":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "critical":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (prediction.daysUntilDue < 0) {
      return `${Math.abs(prediction.daysUntilDue)} jours en retard`;
    } else if (prediction.daysUntilDue === 0) {
      return "Échéance aujourd'hui";
    } else {
      return `${prediction.daysUntilDue} jours restants`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
    >
      <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
        {/* Risk level indicator bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${getRiskColor(prediction.riskLevel)}`} />
        
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">{prediction.customerName}</CardTitle>
            {getRiskIcon(prediction.riskLevel)}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Probability */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Probabilité de paiement
              </span>
              <Badge
                variant={prediction.probability >= 70 ? "default" : prediction.probability >= 50 ? "secondary" : "destructive"}
                className="text-xs font-bold"
              >
                {prediction.probability.toFixed(0)}%
              </Badge>
            </div>
            <Progress value={prediction.probability} className="h-2" />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                Confiance: {prediction.confidence.toFixed(0)}%
              </span>
              <span className="text-xs text-muted-foreground">
                {getStatusText()}
              </span>
            </div>
          </div>

          {/* Credit details */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Montant restant</p>
              <p className="text-sm font-semibold">{prediction.remainingAmount.toLocaleString()} DT</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Montant total</p>
              <p className="text-sm font-semibold">{prediction.creditAmount.toLocaleString()} DT</p>
            </div>
          </div>

          {/* Predicted payment date */}
          {prediction.predictedPaymentDate && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Date de paiement prédite</p>
              <p className="text-sm font-medium">
                {new Date(prediction.predictedPaymentDate).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          )}

          {/* Risk level badge */}
          <div className="flex items-center gap-2 pt-2">
            <Badge
              variant="outline"
              className={`${getRiskColor(prediction.riskLevel)} text-white border-0`}
            >
              Risque {prediction.riskLevel}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

