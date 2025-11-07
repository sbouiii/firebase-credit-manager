import { useMemo } from "react";
import { motion } from "framer-motion";
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { DollarSign, TrendingUp, AlertCircle, Users, CreditCard, Wallet, Target, Activity, Brain, Sparkles, AlertTriangle } from "lucide-react";

import { ModernStatsCard } from "@/components/ModernStatsCard";
import { CircularProgress } from "@/components/CircularProgress";
import { PredictionCard } from "@/components/PredictionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useCredits, useCustomers, useStore, usePayments, useCreditIncreases } from "@/hooks/useFirestore";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculatePaymentProbability, calculateCustomerRiskProfile, getRecommendedCreditAmount } from "@/lib/predictionUtils";
import type { PaymentPrediction, CustomerRiskProfile } from "@/lib/predictionUtils";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const { data: credits, isLoading: creditsLoading } = useCredits();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: store, isLoading: storeLoading } = useStore();
  const { data: payments, isLoading: paymentsLoading } = usePayments();
  const { data: creditIncreases, isLoading: creditIncreasesLoading } = useCreditIncreases();
  const { t } = useLanguage();

  const loading = creditsLoading || customersLoading || storeLoading || paymentsLoading || creditIncreasesLoading;

  const stats = useMemo(() => {
    const totalCredits = credits.reduce((sum, c) => sum + c.amount, 0);
    const totalPaid = credits.reduce((sum, c) => sum + c.paidAmount, 0);
    const totalRemaining = credits.reduce((sum, c) => sum + c.remainingAmount, 0);
    const paymentRate = totalCredits > 0 ? (totalPaid / totalCredits) * 100 : 0;
    const overdueCredits = credits.filter(c => c.dueDate && c.dueDate < Date.now() && c.remainingAmount > 0).length;

    return {
      totalCredits,
      totalPaid,
      totalRemaining,
      activeCustomers: customers.length,
      paymentRate,
      overdueCredits,
      activeCredits: credits.length,
    };
  }, [credits, customers]);

  // Calculate real monthly statistics
  const chartData = useMemo(() => {
    const now = new Date();
    const months: { [key: string]: { credits: number; payments: number } } = {};
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      months[monthKey] = { credits: 0, payments: 0 };
    }

    // Calculate credits issued per month (from creditIncreases and new credits)
    credits.forEach(credit => {
      const creditDate = new Date(credit.createdAt);
      const monthKey = creditDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (months[monthKey]) {
        months[monthKey].credits += credit.amount;
      }
    });

    // Add credit increases
    creditIncreases.forEach(increase => {
      const increaseDate = new Date(increase.createdAt);
      const monthKey = increaseDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (months[monthKey]) {
        months[monthKey].credits += increase.amount;
      }
    });

    // Calculate payments per month
    payments.forEach(payment => {
      const paymentDate = new Date(payment.createdAt);
      const monthKey = paymentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (months[monthKey]) {
        months[monthKey].payments += payment.amount;
      }
    });

    const labels = Object.keys(months);
    const creditsData = labels.map(key => months[key].credits);
    const paymentsData = labels.map(key => months[key].payments);

    return {
      labels,
      datasets: [
        {
          label: t("dashboard.creditsIssued"),
          data: creditsData,
          backgroundColor: "rgba(59, 130, 246, 0.8)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
          gradient: {
            backgroundColor: {
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.8)' },
                { offset: 1, color: 'rgba(147, 51, 234, 0.8)' }
              ]
            }
          }
        },
        {
          label: t("dashboard.paymentsReceived"),
          data: paymentsData,
          backgroundColor: "rgba(34, 197, 94, 0.8)",
          borderColor: "rgb(34, 197, 94)",
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  }, [credits, creditIncreases, payments, t]);

  // Calculate real weekly balance trend
  const lineChartData = useMemo(() => {
    const now = new Date();
    const weeks: { [key: string]: number } = {};
    
    // Initialize last 4 weeks
    const weekDates: Date[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekDate = new Date(now);
      weekDate.setDate(now.getDate() - (i * 7));
      weekDates.push(weekDate);
      const weekKey = `Week ${4 - i}`;
      weeks[weekKey] = 0;
    }

    // Calculate remaining balance for each week
    weekDates.forEach((weekDate, index) => {
      const weekKey = `Week ${4 - index}`;
      let balance = 0;

      // Sum all credits created before or during this week
      credits.forEach(credit => {
        const creditDate = new Date(credit.createdAt);
        if (creditDate <= weekDate) {
          // Calculate how much was paid by this week
          let paidByWeek = 0;
          payments.forEach(payment => {
            const paymentDate = new Date(payment.createdAt);
            if (payment.creditId === credit.id && paymentDate <= weekDate) {
              paidByWeek += payment.amount;
            }
          });
          
          // Calculate how much credit was increased by this week
          let increasedByWeek = 0;
          creditIncreases.forEach(increase => {
            const increaseDate = new Date(increase.createdAt);
            if (increase.creditId === credit.id && increaseDate <= weekDate) {
              increasedByWeek += increase.amount;
            }
          });

          // Calculate remaining balance at this week
          const totalAmount = credit.amount + increasedByWeek;
          const remaining = totalAmount - paidByWeek;
          if (remaining > 0) {
            balance += remaining;
          }
        }
      });

      weeks[weekKey] = balance;
    });

    const labels = Object.keys(weeks);
    const balanceData = labels.map(key => weeks[key]);

    return {
      labels,
      datasets: [
        {
          label: t("dashboard.outstandingBalance"),
          data: balanceData,
          borderColor: "rgb(249, 115, 22)",
          backgroundColor: "rgba(249, 115, 22, 0.1)",
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: "rgb(249, 115, 22)",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
        },
      ],
    };
  }, [credits, payments, creditIncreases, t]);

  // Calculate payment predictions
  const predictions = useMemo(() => {
    if (!credits || !payments || !creditIncreases) return [];
    
    return credits
      .filter(c => c.remainingAmount > 0)
      .map(credit => 
        calculatePaymentProbability(credit, payments, creditIncreases, credits, payments)
      )
      .sort((a, b) => {
        // Sort by risk level (critical first) then by probability
        const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
          return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
        }
        return a.probability - b.probability;
      });
  }, [credits, payments, creditIncreases]);

  // Calculate customer risk profiles
  const riskProfiles = useMemo(() => {
    if (!credits || !payments || !customers) return [];
    
    const customerIds = [...new Set(credits.map(c => c.customerId))];
    return customerIds
      .map(customerId => {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return null;
        return calculateCustomerRiskProfile(customerId, customer.name, credits, payments);
      })
      .filter((profile): profile is CustomerRiskProfile => profile !== null)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10); // Top 10 riskiest customers
  }, [credits, payments, customers]);

  // Calculate risk statistics
  const riskStats = useMemo(() => {
    if (!predictions || predictions.length === 0) {
      return {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        avgProbability: 0,
        totalAtRisk: 0,
      };
    }
    
    const critical = predictions.filter(p => p.riskLevel === "critical").length;
    const high = predictions.filter(p => p.riskLevel === "high").length;
    const medium = predictions.filter(p => p.riskLevel === "medium").length;
    const low = predictions.filter(p => p.riskLevel === "low").length;
    const avgProbability = predictions.length > 0
      ? predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length
      : 0;

    return {
      critical,
      high,
      medium,
      low,
      avgProbability,
      totalAtRisk: critical + high,
    };
  }, [predictions]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart' as const,
    },
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '600' as const,
          },
          color: 'hsl(var(--foreground))',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          font: {
            size: 11,
          },
          callback: function(value: any) {
            return value.toLocaleString() + ' DT';
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          font: {
            size: 11,
            weight: '600' as const,
          },
        },
      },
    },
  };

  const lineChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        display: true,
      },
    },
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        ticks: {
          ...chartOptions.scales.y.ticks,
          callback: function(value: any) {
            return value.toLocaleString() + ' DT';
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-40 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            {store?.logo && (
              <img
                src={store.logo}
                alt={store.name}
                className="h-10 w-10 object-contain rounded"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">
                {store?.name || t("dashboard.title")}
              </h1>
              <p className="text-muted-foreground">{t("dashboard.overview")}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modern Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <ModernStatsCard
          title={t("dashboard.totalCredits")}
          value={`${stats.totalCredits.toLocaleString()} DT`}
          icon={CreditCard}
          description={`${stats.activeCredits} ${t("dashboard.activeCredits")}`}
          progress={stats.totalCredits > 0 ? 100 : 0}
          gradient="from-blue-500 to-cyan-500"
          delay={0}
        />
        <ModernStatsCard
          title={t("dashboard.paidAmount")}
          value={`${stats.totalPaid.toLocaleString()} DT`}
          icon={Wallet}
          description={`${stats.paymentRate.toFixed(1)}% ${t("dashboard.collected")}`}
          progress={stats.paymentRate}
          gradient="from-green-500 to-emerald-500"
          delay={0.1}
        />
        <ModernStatsCard
          title={t("dashboard.totalRemaining")}
          value={`${stats.totalRemaining.toLocaleString()} DT`}
          icon={AlertCircle}
          description={t("dashboard.totalRemainingDesc")}
          progress={stats.totalCredits > 0 ? (stats.totalRemaining / stats.totalCredits) * 100 : 0}
          gradient="from-orange-500 to-red-500"
          delay={0.2}
        />
        <ModernStatsCard
          title={t("dashboard.activeCustomers")}
          value={stats.activeCustomers.toString()}
          icon={Users}
          description={t("dashboard.totalCustomers")}
          gradient="from-purple-500 to-pink-500"
          delay={0.3}
        />
      </div>

      {/* Circular Progress Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="grid gap-6 md:grid-cols-3"
      >
        <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <CircularProgress
              value={stats.totalPaid}
              max={stats.totalCredits || 1}
              icon={TrendingUp}
              gradient="from-green-500 to-emerald-500"
              label={t("dashboard.paidAmount")}
              delay={0.5}
            />
            <motion.div
              className="mt-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <p className="text-sm font-semibold">{stats.paymentRate.toFixed(1)}% {t("dashboard.collected")}</p>
            </motion.div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <CircularProgress
              value={stats.totalRemaining}
              max={stats.totalCredits || 1}
              icon={Target}
              gradient="from-orange-500 to-red-500"
              label={t("dashboard.totalRemaining")}
              delay={0.6}
            />
            <motion.div
              className="mt-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <p className="text-sm font-semibold">
                {stats.totalCredits > 0 ? ((stats.totalRemaining / stats.totalCredits) * 100).toFixed(1) : 0}% {t("dashboard.totalRemaining")}
              </p>
            </motion.div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <CircularProgress
              value={stats.activeCustomers}
              max={Math.max(stats.activeCustomers, 100)}
              icon={Activity}
              gradient="from-purple-500 to-pink-500"
              label={t("dashboard.activeCustomers")}
              delay={0.7}
            />
            <motion.div
              className="mt-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <p className="text-sm font-semibold">{stats.activeCustomers} {t("dashboard.totalCustomers")}</p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Predictions Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.8 }}
        className="grid gap-6 md:grid-cols-2"
      >
        {/* Predictions Overview */}
        <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
          <motion.div
            className="absolute inset-0 opacity-5"
            style={{
              background: "linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)",
            }}
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Brain className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Prédictions IA
                </CardTitle>
                <p className="text-sm text-muted-foreground">Analyse intelligente des paiements</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-semibold text-red-700 dark:text-red-300">À Risque</span>
                </div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {riskStats.totalAtRisk}
                </p>
                <p className="text-xs text-muted-foreground">Crédits critiques/hauts</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Probabilité Moy.</span>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {riskStats.avgProbability.toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">Taux de paiement moyen</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-2 border-t">
              <div className="text-center">
                <p className="text-lg font-bold text-red-600">{riskStats.critical}</p>
                <p className="text-xs text-muted-foreground">Critique</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-orange-600">{riskStats.high}</p>
                <p className="text-xs text-muted-foreground">Élevé</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-yellow-600">{riskStats.medium}</p>
                <p className="text-xs text-muted-foreground">Moyen</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">{riskStats.low}</p>
                <p className="text-xs text-muted-foreground">Faible</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Risk Customers */}
        <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
          <motion.div
            className="absolute inset-0 opacity-5"
            style={{
              background: "linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%)",
            }}
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg"
                animate={{
                  rotate: [0, -10, 10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Users className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Clients à Risque
                </CardTitle>
                <p className="text-sm text-muted-foreground">Top 10 clients nécessitant attention</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {riskProfiles.length > 0 ? (
                riskProfiles.map((profile, index) => (
                  <motion.div
                    key={profile.customerId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{profile.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        Score: {profile.riskScore.toFixed(0)}/100 • {profile.riskLevel}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        profile.riskLevel === "critical" ? "bg-red-500" :
                        profile.riskLevel === "high" ? "bg-orange-500" :
                        profile.riskLevel === "medium" ? "bg-yellow-500" : "bg-green-500"
                      }`} />
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun client à risque identifié
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Predictions Grid */}
      {predictions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.0 }}
        >
          <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
            <motion.div
              className="absolute inset-0 opacity-5"
              style={{
                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)",
              }}
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Prédictions de Paiement
                  </CardTitle>
                </div>
                <Badge variant="outline" className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
                  {predictions.length} crédits actifs
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {predictions.slice(0, 9).map((prediction, index) => (
                  <PredictionCard
                    key={prediction.creditId}
                    prediction={prediction}
                    delay={1.1 + index * 0.05}
                  />
                ))}
              </div>
              {predictions.length > 9 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  + {predictions.length - 9} autres prédictions disponibles
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Modern Analytics Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 1.2 }}
      >
        <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0 opacity-5"
            style={{
              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)",
            }}
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t("dashboard.analytics")}
              </CardTitle>
              <motion.div
                className="w-2 h-2 rounded-full bg-green-500"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.7, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <Tabs defaultValue="monthly" className="space-y-4">
              <TabsList data-testid="tabs-analytics" className="bg-muted/50">
                <TabsTrigger value="monthly" data-testid="tab-monthly" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                  {t("dashboard.monthlyOverview")}
                </TabsTrigger>
                <TabsTrigger value="trend" data-testid="tab-trend" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                  {t("dashboard.balanceTrend")}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="monthly" className="h-[300px]" data-testid="chart-monthly">
                <Bar data={chartData} options={chartOptions} />
              </TabsContent>
              <TabsContent value="trend" className="h-[300px]" data-testid="chart-trend">
                <Line data={lineChartData} options={lineChartOptions} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
