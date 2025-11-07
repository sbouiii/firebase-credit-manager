import type { Credit, Payment, CreditIncrease } from "@shared/schema";

export interface PaymentPrediction {
  creditId: string;
  customerId: string;
  customerName: string;
  creditAmount: number;
  remainingAmount: number;
  dueDate: number;
  probability: number; // 0-100
  riskLevel: "low" | "medium" | "high" | "critical";
  daysUntilDue: number;
  predictedPaymentDate?: number;
  confidence: number; // 0-100
}

export interface CustomerRiskProfile {
  customerId: string;
  customerName: string;
  riskScore: number; // 0-100 (higher = more risk)
  riskLevel: "low" | "medium" | "high" | "critical";
  totalCredits: number;
  totalPaid: number;
  averagePaymentDelay: number; // days
  onTimePaymentRate: number; // percentage
  recommendations: string[];
}

/**
 * Calculate payment probability based on historical data
 */
export function calculatePaymentProbability(
  credit: Credit,
  payments: Payment[],
  creditIncreases: CreditIncrease[],
  allCredits: Credit[],
  allPayments: Payment[]
): PaymentPrediction {
  const now = Date.now();
  const daysUntilDue = Math.floor((credit.dueDate - now) / (1000 * 60 * 60 * 24));
  
  // Get customer's historical data
  const customerCredits = allCredits.filter(c => c.customerId === credit.customerId);
  const customerPayments = allPayments.filter(p => p.customerId === credit.customerId);
  
  // Base probability factors
  let probability = 70; // Base probability
  let confidence = 50; // Base confidence
  
  // Factor 1: Payment history (40% weight)
  if (customerPayments.length > 0) {
    const totalPaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalCredits = customerCredits.reduce((sum, c) => sum + c.amount, 0);
    const paymentRate = totalCredits > 0 ? (totalPaid / totalCredits) * 100 : 0;
    
    if (paymentRate >= 90) {
      probability += 20;
      confidence += 20;
    } else if (paymentRate >= 70) {
      probability += 10;
      confidence += 10;
    } else if (paymentRate < 50) {
      probability -= 20;
      confidence += 5;
    }
  } else {
    // New customer - lower confidence
    confidence -= 20;
    probability -= 10;
  }
  
  // Factor 2: Payment timeliness (30% weight)
  const paymentDelays: number[] = [];
  customerCredits.forEach(c => {
    const creditPayments = customerPayments.filter(p => {
      // Find payments related to this credit (approximate)
      return Math.abs(p.createdAt - c.createdAt) < 90 * 24 * 60 * 60 * 1000;
    });
    
    if (creditPayments.length > 0 && c.dueDate) {
      const firstPayment = creditPayments[0];
      const delay = Math.floor((firstPayment.createdAt - c.dueDate) / (1000 * 60 * 60 * 24));
      if (delay > 0) paymentDelays.push(delay);
    }
  });
  
  if (paymentDelays.length > 0) {
    const avgDelay = paymentDelays.reduce((sum, d) => sum + d, 0) / paymentDelays.length;
    if (avgDelay <= 0) {
      probability += 15;
      confidence += 10;
    } else if (avgDelay <= 7) {
      probability += 5;
    } else if (avgDelay > 30) {
      probability -= 25;
    }
  }
  
  // Factor 3: Time until due date (20% weight)
  if (daysUntilDue > 30) {
    probability += 10;
  } else if (daysUntilDue > 14) {
    probability += 5;
  } else if (daysUntilDue > 0) {
    probability -= 5;
  } else if (daysUntilDue <= 0) {
    // Overdue
    const daysOverdue = Math.abs(daysUntilDue);
    probability -= Math.min(daysOverdue * 2, 30);
    if (daysOverdue > 30) {
      probability -= 20;
    }
  }
  
  // Factor 4: Credit amount (10% weight)
  const avgCreditAmount = customerCredits.length > 0
    ? customerCredits.reduce((sum, c) => sum + c.amount, 0) / customerCredits.length
    : credit.amount;
  
  if (credit.amount > avgCreditAmount * 1.5) {
    // Larger than usual - might be riskier
    probability -= 10;
  } else if (credit.amount < avgCreditAmount * 0.5) {
    // Smaller than usual - might be safer
    probability += 5;
  }
  
  // Normalize probability
  probability = Math.max(0, Math.min(100, probability));
  confidence = Math.max(0, Math.min(100, confidence));
  
  // Determine risk level
  let riskLevel: "low" | "medium" | "high" | "critical";
  if (probability >= 80) {
    riskLevel = "low";
  } else if (probability >= 60) {
    riskLevel = "medium";
  } else if (probability >= 40) {
    riskLevel = "high";
  } else {
    riskLevel = "critical";
  }
  
  // Predict payment date (if probability is reasonable)
  let predictedPaymentDate: number | undefined;
  if (probability >= 50) {
    const avgDelay = paymentDelays.length > 0
      ? paymentDelays.reduce((sum, d) => sum + d, 0) / paymentDelays.length
      : 0;
    predictedPaymentDate = credit.dueDate + (avgDelay * 24 * 60 * 60 * 1000);
  }
  
  return {
    creditId: credit.id,
    customerId: credit.customerId,
    customerName: credit.customerName,
    creditAmount: credit.amount,
    remainingAmount: credit.remainingAmount,
    dueDate: credit.dueDate,
    probability,
    riskLevel,
    daysUntilDue,
    predictedPaymentDate,
    confidence,
  };
}

/**
 * Calculate customer risk profile
 */
export function calculateCustomerRiskProfile(
  customerId: string,
  customerName: string,
  credits: Credit[] = [],
  payments: Payment[] = []
): CustomerRiskProfile {
  const customerCredits = credits.filter(c => c.customerId === customerId);
  const customerPayments = payments.filter(p => p.customerId === customerId);
  
  const totalCredits = customerCredits.reduce((sum, c) => sum + c.amount, 0);
  const totalPaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);
  
  // Calculate payment delays
  const paymentDelays: number[] = [];
  customerCredits.forEach(credit => {
    if (credit.dueDate) {
      const relatedPayments = customerPayments.filter(p => {
        // Approximate matching - payments within 90 days of credit creation
        return Math.abs(p.createdAt - credit.createdAt) < 90 * 24 * 60 * 60 * 1000;
      });
      
      if (relatedPayments.length > 0) {
        const firstPayment = relatedPayments[0];
        const delay = Math.floor((firstPayment.createdAt - credit.dueDate) / (1000 * 60 * 60 * 24));
        if (delay > 0) paymentDelays.push(delay);
      } else if (credit.remainingAmount > 0 && credit.dueDate < Date.now()) {
        // Overdue and no payment
        const daysOverdue = Math.floor((Date.now() - credit.dueDate) / (1000 * 60 * 60 * 24));
        paymentDelays.push(daysOverdue);
      }
    }
  });
  
  const averagePaymentDelay = paymentDelays.length > 0
    ? paymentDelays.reduce((sum, d) => sum + d, 0) / paymentDelays.length
    : 0;
  
  // Calculate on-time payment rate
  const onTimePayments = paymentDelays.filter(d => d <= 0).length;
  const onTimePaymentRate = paymentDelays.length > 0
    ? (onTimePayments / paymentDelays.length) * 100
    : 100;
  
  // Calculate risk score (0-100, higher = more risk)
  let riskScore = 0;
  
  // Factor 1: Payment rate
  const paymentRate = totalCredits > 0 ? (totalPaid / totalCredits) * 100 : 0;
  if (paymentRate < 50) riskScore += 40;
  else if (paymentRate < 70) riskScore += 20;
  else if (paymentRate < 90) riskScore += 10;
  
  // Factor 2: Average delay
  if (averagePaymentDelay > 30) riskScore += 30;
  else if (averagePaymentDelay > 14) riskScore += 20;
  else if (averagePaymentDelay > 7) riskScore += 10;
  
  // Factor 3: On-time rate
  if (onTimePaymentRate < 50) riskScore += 30;
  else if (onTimePaymentRate < 70) riskScore += 15;
  
  // Factor 4: Current overdue credits
  const overdueCredits = customerCredits.filter(c => 
    c.remainingAmount > 0 && c.dueDate < Date.now()
  ).length;
  if (overdueCredits > 2) riskScore += 20;
  else if (overdueCredits > 0) riskScore += 10;
  
  riskScore = Math.min(100, riskScore);
  
  // Determine risk level
  let riskLevel: "low" | "medium" | "high" | "critical";
  if (riskScore < 25) {
    riskLevel = "low";
  } else if (riskScore < 50) {
    riskLevel = "medium";
  } else if (riskScore < 75) {
    riskLevel = "high";
  } else {
    riskLevel = "critical";
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (riskScore >= 75) {
    recommendations.push("Client à haut risque - Limiter les nouveaux crédits");
    recommendations.push("Contacter le client immédiatement pour régulariser");
    recommendations.push("Envisager un plan de paiement échelonné");
  } else if (riskScore >= 50) {
    recommendations.push("Surveiller de près les paiements");
    recommendations.push("Envoyer des rappels avant l'échéance");
    recommendations.push("Limiter les montants de crédit");
  } else if (riskScore >= 25) {
    recommendations.push("Maintenir une communication régulière");
    recommendations.push("Offrir des incitations pour paiement anticipé");
  } else {
    recommendations.push("Client fiable - Peut bénéficier de conditions préférentielles");
    recommendations.push("Envisager d'augmenter les limites de crédit");
  }
  
  if (averagePaymentDelay > 14) {
    recommendations.push("Proposer un plan de paiement plus flexible");
  }
  
  if (onTimePaymentRate < 70) {
    recommendations.push("Mettre en place un système de rappels automatiques");
  }
  
  return {
    customerId,
    customerName,
    riskScore,
    riskLevel,
    totalCredits,
    totalPaid,
    averagePaymentDelay,
    onTimePaymentRate,
    recommendations,
  };
}

/**
 * Get recommended credit amount for a customer
 */
export function getRecommendedCreditAmount(
  customerId: string,
  credits: Credit[] = [],
  payments: Payment[] = []
): { recommended: number; max: number; reason: string } {
  const customerCredits = credits.filter(c => c.customerId === customerId);
  const customerPayments = payments.filter(p => p.customerId === customerId);
  
  if (customerCredits.length === 0) {
    return {
      recommended: 500,
      max: 1000,
      reason: "Nouveau client - Montant initial recommandé",
    };
  }
  
  const totalPaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalCredits = customerCredits.reduce((sum, c) => sum + c.amount, 0);
  const paymentRate = totalCredits > 0 ? (totalPaid / totalCredits) : 0;
  
  const avgCreditAmount = customerCredits.reduce((sum, c) => sum + c.amount, 0) / customerCredits.length;
  
  if (paymentRate >= 90) {
    return {
      recommended: avgCreditAmount * 1.5,
      max: avgCreditAmount * 2,
      reason: "Excellent historique de paiement - Peut supporter un crédit plus élevé",
    };
  } else if (paymentRate >= 70) {
    return {
      recommended: avgCreditAmount * 1.2,
      max: avgCreditAmount * 1.5,
      reason: "Bon historique de paiement - Augmentation modérée recommandée",
    };
  } else if (paymentRate >= 50) {
    return {
      recommended: avgCreditAmount,
      max: avgCreditAmount * 1.2,
      reason: "Historique moyen - Maintenir le même niveau",
    };
  } else {
    return {
      recommended: avgCreditAmount * 0.8,
      max: avgCreditAmount,
      reason: "Historique de paiement faible - Réduire le montant recommandé",
    };
  }
}

