import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/table/DataTable';
import { TableFilters } from '@/components/table/TableFilters';
import { FilterSelect } from '@/components/table/FilterSelect';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { fetchPayments, fetchPaymentStats, Payment } from '@/lib/api';
import { format } from 'date-fns';
import { ArrowDownCircle, ArrowUpCircle, Phone, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for demo
const mockPayments: Payment[] = [
  { id: '1', date: '2024-01-15T14:30:00Z', transactionId: 'TXN-001234', phone: '+256701234567', amount: 50000, type: 'collection', status: 'success' },
  { id: '2', date: '2024-01-15T14:00:00Z', transactionId: 'TXN-001235', phone: '+256702345678', amount: 35000, type: 'payout', status: 'success', reason: 'Job payment' },
  { id: '3', date: '2024-01-15T13:30:00Z', transactionId: 'TXN-001236', phone: '+256703456789', amount: 25000, type: 'collection', status: 'pending' },
  { id: '4', date: '2024-01-15T13:00:00Z', transactionId: 'TXN-001237', phone: '+256704567890', amount: 45000, type: 'payout', status: 'failed', reason: 'Insufficient balance' },
  { id: '5', date: '2024-01-15T12:30:00Z', transactionId: 'TXN-001238', phone: '+256705678901', amount: 80000, type: 'collection', status: 'success' },
];

const mockStats = {
  totalCollected: 45600000,
  totalPaid: 32400000,
};

const typeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'collection', label: 'Collections' },
  { value: 'payout', label: 'Payouts' },
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'success', label: 'Success' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
];

const formatUGX = (amount: number) => {
  return `UGX ${amount.toLocaleString()}`;
};

const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {format(new Date(row.original.date), 'MMM d, HH:mm')}
      </span>
    ),
  },
  {
    accessorKey: 'transactionId',
    header: 'Transaction ID',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.transactionId}</span>
    ),
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Phone size={14} className="text-muted-foreground" />
        <span className="font-mono text-sm">{row.original.phone}</span>
      </div>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => (
      <span className={cn(
        "font-semibold font-mono",
        row.original.type === 'collection' ? "text-success" : "text-warning"
      )}>
        {row.original.type === 'collection' ? '+' : '-'} {formatUGX(row.original.amount)}
      </span>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.type === 'collection' ? (
          <ArrowDownCircle size={16} className="text-success" />
        ) : (
          <ArrowUpCircle size={16} className="text-warning" />
        )}
        <span className="capitalize text-sm">{row.original.type}</span>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const variants: Record<string, 'completed' | 'pending' | 'failed'> = {
        success: 'completed',
        pending: 'pending',
        failed: 'failed',
      };
      return (
        <Badge variant={variants[row.original.status]}>
          {row.original.status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'reason',
    header: 'Reason',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.reason || '—'}
      </span>
    ),
  },
];

export default function Payments() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', { search, type, status, page }],
    queryFn: () => fetchPayments({ search, type, status, page, pageSize: 10 }),
    retry: false,
    placeholderData: {
      data: mockPayments,
      total: 150,
      page: 1,
      pageSize: 10,
      totalPages: 15,
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: fetchPaymentStats,
    retry: false,
    placeholderData: mockStats,
  });

  const displayData = paymentsData?.data || mockPayments;
  const displayStats = stats || mockStats;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Payments & Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Track all money movements on the platform
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard
            title="Total Collected"
            value={formatUGX(displayStats.totalCollected)}
            icon={<TrendingUp size={20} />}
            variant="success"
            isLoading={statsLoading}
          />
          <StatsCard
            title="Total Paid Out"
            value={formatUGX(displayStats.totalPaid)}
            icon={<TrendingDown size={20} />}
            variant="warning"
            isLoading={statsLoading}
          />
          <StatsCard
            title="Net Profit"
            value={formatUGX(displayStats.totalCollected - displayStats.totalPaid)}
            icon={<TrendingUp size={20} />}
            variant="primary"
            isLoading={statsLoading}
          />
        </div>

        {/* Filters */}
        <TableFilters
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by phone (07.., +256..)"
        >
          <FilterSelect
            value={type}
            onValueChange={setType}
            options={typeOptions}
            placeholder="Type"
          />
          <FilterSelect
            value={status}
            onValueChange={setStatus}
            options={statusOptions}
            placeholder="Status"
          />
        </TableFilters>

        {/* Table */}
        <DataTable
          columns={columns}
          data={displayData}
          isLoading={paymentsLoading}
          pagination={paymentsData ? {
            page: paymentsData.page,
            pageSize: paymentsData.pageSize,
            total: paymentsData.total,
            totalPages: paymentsData.totalPages,
            onPageChange: setPage,
          } : undefined}
        />
      </div>
    </DashboardLayout>
  );
}
