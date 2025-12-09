import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/table/DataTable';
import { TableFilters } from '@/components/table/TableFilters';
import { FilterSelect } from '@/components/table/FilterSelect';
import { Badge } from '@/components/ui/badge';
import { fetchServiceRequests, ServiceRequest } from '@/lib/api';
import { format } from 'date-fns';
import { MapPin, Phone, Wrench } from 'lucide-react';

// Mock data for demo
const mockRequests: ServiceRequest[] = [
  { id: 'REQ-001', customerPhone: '+256701234567', serviceType: 'Tire Repair', location: 'Kampala Central', status: 'completed', mechanicName: 'John Okello', createdAt: '2024-01-15T10:30:00Z' },
  { id: 'REQ-002', customerPhone: '+256702345678', serviceType: 'Fuel Delivery', location: 'Nakawa', status: 'pending', createdAt: '2024-01-15T11:00:00Z' },
  { id: 'REQ-003', customerPhone: '+256703456789', serviceType: 'Engine Repair', location: 'Makindye', status: 'accepted', mechanicName: 'Peter Ssemwogerere', createdAt: '2024-01-15T11:30:00Z' },
  { id: 'REQ-004', customerPhone: '+256704567890', serviceType: 'Oil Change', location: 'Ntinda', status: 'in_progress', mechanicName: 'James Mugisha', createdAt: '2024-01-15T12:00:00Z' },
  { id: 'REQ-005', customerPhone: '+256705678901', serviceType: 'Brake Fix', location: 'Wandegeya', status: 'completed', mechanicName: 'David Lubega', createdAt: '2024-01-15T12:30:00Z' },
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, 'pending' | 'warning' | 'completed' | 'failed' | 'secondary'> = {
    pending: 'pending',
    accepted: 'warning',
    in_progress: 'warning',
    completed: 'completed',
    cancelled: 'failed',
  };
  return variants[status] || 'secondary';
};

const columns: ColumnDef<ServiceRequest>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{row.original.id}</span>
    ),
  },
  {
    accessorKey: 'customerPhone',
    header: 'Customer',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Phone size={14} className="text-muted-foreground" />
        <span className="font-mono text-sm">{row.original.customerPhone}</span>
      </div>
    ),
  },
  {
    accessorKey: 'serviceType',
    header: 'Service',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Wrench size={14} className="text-primary" />
        <span>{row.original.serviceType}</span>
      </div>
    ),
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <MapPin size={14} className="text-muted-foreground" />
        <span className="text-sm">{row.original.location}</span>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={getStatusBadge(row.original.status)}>
        {row.original.status.replace('_', ' ')}
      </Badge>
    ),
  },
  {
    accessorKey: 'mechanicName',
    header: 'Mechanic',
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.mechanicName || <span className="text-muted-foreground">—</span>}
      </span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {format(new Date(row.original.createdAt), 'MMM d, HH:mm')}
      </span>
    ),
  },
];

export default function Requests() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['requests', { search, status, page }],
    queryFn: () => fetchServiceRequests({ search, status, page, pageSize: 10 }),
    retry: false,
    placeholderData: {
      data: mockRequests,
      total: 50,
      page: 1,
      pageSize: 10,
      totalPages: 5,
    },
  });

  const displayData = data?.data || mockRequests;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Service Requests</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all customer service requests
          </p>
        </div>

        {/* Filters */}
        <TableFilters
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by phone..."
        >
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
          isLoading={isLoading}
          pagination={data ? {
            page: data.page,
            pageSize: data.pageSize,
            total: data.total,
            totalPages: data.totalPages,
            onPageChange: setPage,
          } : undefined}
        />
      </div>
    </DashboardLayout>
  );
}
