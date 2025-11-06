import { useMemo } from "react";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, AlertCircle, Users } from "lucide-react";
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { motion } from "framer-motion";
import { useCredits, useCustomers, useStore } from "@/hooks/useFirestore";
import { useLanguage } from "@/contexts/LanguageContext";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const { data: credits, isLoading: creditsLoading } = useCredits();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: store, isLoading: storeLoading } = useStore();
  const { t } = useLanguage();

  const loading = creditsLoading || customersLoading || storeLoading;

  const stats = useMemo(() => {
    const totalCredits = credits.reduce((sum, c) => sum + c.amount, 0);
    const totalPaid = credits.reduce((sum, c) => sum + c.paidAmount, 0);
    const totalRemaining = credits.reduce((sum, c) => sum + c.remainingAmount, 0);

    return {
      totalCredits,
      totalPaid,
      totalRemaining,
      activeCustomers: customers.length,
    };
  }, [credits, customers]);

  const chartData = useMemo(() => ({
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: t("dashboard.creditsIssued"),
        data: [12000, 19000, 15000, 25000, 22000, 30000],
        backgroundColor: "hsl(var(--chart-1))",
        borderRadius: 4,
      },
      {
        label: t("dashboard.paymentsReceived"),
        data: [8000, 15000, 12000, 20000, 18000, 25000],
        backgroundColor: "hsl(var(--chart-2))",
        borderRadius: 4,
      },
    ],
  }), [t]);

  const lineChartData = useMemo(() => ({
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: t("dashboard.outstandingBalance"),
        data: [45000, 42000, 38000, 35000],
        borderColor: "hsl(var(--chart-3))",
        backgroundColor: "hsl(var(--chart-3) / 0.1)",
        tension: 0.4,
      },
    ],
  }), [t]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          padding: 15,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "hsl(var(--border))",
        },
      },
      x: {
        grid: {
          display: false,
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t("dashboard.totalCredits")}
          value={`${stats.totalCredits.toLocaleString()} DT`}
          icon={DollarSign}
          description={`${credits.length} ${t("dashboard.activeCredits")}`}
        />
        <StatsCard
          title={t("dashboard.paidAmount")}
          value={`${stats.totalPaid.toLocaleString()} DT`}
          icon={TrendingUp}
          description={`${((stats.totalPaid / stats.totalCredits) * 100 || 0).toFixed(1)}% ${t("dashboard.collected")}`}
        />
        <StatsCard
          title={t("dashboard.totalRemaining")}
          value={`${stats.totalRemaining.toLocaleString()} DT`}
          icon={AlertCircle}
          description={t("dashboard.totalRemainingDesc")}
        />
        <StatsCard
          title={t("dashboard.activeCustomers")}
          value={stats.activeCustomers.toString()}
          icon={Users}
          description={t("dashboard.totalCustomers")}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.analytics")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="monthly" className="space-y-4">
              <TabsList data-testid="tabs-analytics">
                <TabsTrigger value="monthly" data-testid="tab-monthly">{t("dashboard.monthlyOverview")}</TabsTrigger>
                <TabsTrigger value="trend" data-testid="tab-trend">{t("dashboard.balanceTrend")}</TabsTrigger>
              </TabsList>
              <TabsContent value="monthly" className="h-[300px]" data-testid="chart-monthly">
                <Bar data={chartData} options={chartOptions} />
              </TabsContent>
              <TabsContent value="trend" className="h-[300px]" data-testid="chart-trend">
                <Line data={lineChartData} options={chartOptions} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
