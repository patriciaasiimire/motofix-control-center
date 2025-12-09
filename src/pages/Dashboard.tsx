import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import {
  FileText,
  CheckCircle,
  Clock,
  Users,
  BadgeCheck,
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { fetchDashboardStats, fetchRevenueChart, DashboardStats, RevenueData } from '@/lib/api';

// Mock data for demo
const mockStats: DashboardStats = {
  totalRequests: 1247,
  completedJobs: 986,
  pendingJobs: 142,
  totalMechanics: 89,
  verifiedMechanics: 67,
  revenueCollected: 45600000,
  paidToMechanics: 32400000,
  profit: 13200000,
};

const mockRevenueData: RevenueData[] = [
  { date: 'Mon', amount: 5200000 },
  { date: 'Tue', amount: 6800000 },
  { date: 'Wed', amount: 4500000 },
  { date: 'Thu', amount: 7200000 },
  { date: 'Fri', amount: 8100000 },
  { date: 'Sat', amount: 9400000 },
  { date: 'Sun', amount: 4400000 },
];

const formatUGX = (amount: number) => {
  if (amount >= 1000000) {
    return `UGX ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `UGX ${(amount / 1000).toFixed(0)}K`;
  }
  return `UGX ${amount.toLocaleString()}`;
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    retry: false,
    // Use mock data on error
    placeholderData: mockStats,
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-chart'],
    queryFn: fetchRevenueChart,
    retry: false,
    placeholderData: mockRevenueData,
  });

  const displayStats = stats || mockStats;
  const displayRevenue = revenueData || mockRevenueData;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with MOTOFIX.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Requests"
            value={displayStats.totalRequests.toLocaleString()}
            icon={<FileText size={20} />}
            subtitle="All time"
            isLoading={statsLoading}
          />
          <StatsCard
            title="Completed Jobs"
            value={displayStats.completedJobs.toLocaleString()}
            icon={<CheckCircle size={20} />}
            variant="success"
            subtitle={`${Math.round((displayStats.completedJobs / displayStats.totalRequests) * 100)}% completion`}
            isLoading={statsLoading}
          />
          <StatsCard
            title="Pending Jobs"
            value={displayStats.pendingJobs.toLocaleString()}
            icon={<Clock size={20} />}
            variant="warning"
            subtitle="Awaiting action"
            isLoading={statsLoading}
          />
          <StatsCard
            title="Total Mechanics"
            value={displayStats.totalMechanics.toLocaleString()}
            icon={<Users size={20} />}
            subtitle={`${displayStats.verifiedMechanics} verified`}
            isLoading={statsLoading}
          />
        </div>

        {/* Financial Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard
            title="Revenue Collected"
            value={formatUGX(displayStats.revenueCollected)}
            icon={<TrendingUp size={20} />}
            variant="primary"
            isLoading={statsLoading}
          />
          <StatsCard
            title="Paid to Mechanics"
            value={formatUGX(displayStats.paidToMechanics)}
            icon={<TrendingDown size={20} />}
            subtitle="Platform payouts"
            isLoading={statsLoading}
          />
          <StatsCard
            title="Net Profit"
            value={formatUGX(displayStats.profit)}
            icon={<Wallet size={20} />}
            variant="success"
            trend={{ value: 12, isPositive: true }}
            subtitle="vs last week"
            isLoading={statsLoading}
          />
        </div>

        {/* Revenue Chart */}
        <RevenueChart data={displayRevenue} isLoading={revenueLoading} />

        {/* Verified Mechanics Highlight */}
        <div className="bg-gradient-to-r from-success/10 to-success/5 border border-success/20 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/20">
              <BadgeCheck className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="font-semibold">
                {displayStats.verifiedMechanics} Verified Mechanics
              </p>
              <p className="text-sm text-muted-foreground">
                {Math.round((displayStats.verifiedMechanics / displayStats.totalMechanics) * 100)}% of your fleet is verified and ready to serve
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
