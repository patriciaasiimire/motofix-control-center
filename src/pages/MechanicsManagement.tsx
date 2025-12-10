import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/table/DataTable';
import { TableFilters } from '@/components/table/TableFilters';
import { FilterSelect } from '@/components/table/FilterSelect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { MechanicFormDialog } from '@/components/mechanics/MechanicFormDialog';
import { DeleteMechanicDialog } from '@/components/mechanics/DeleteMechanicDialog';
import {
  fetchMechanics,
  createMechanic,
  updateMechanic,
  deleteMechanic,
  Mechanic,
} from '@/lib/api';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Phone,
  MapPin,
  Star,
  Plus,
  Pencil,
  Trash2,
  Wrench,
  Settings,
} from 'lucide-react';

// Mock data for offline demo
const mockMechanics: Mechanic[] = [
  { id: '1', name: 'John Okello', phone: '+256701234567', location: 'Kampala Central', rating: 4.8, jobsCompleted: 156, verified: true, joinedAt: '2023-06-15T00:00:00Z' },
  { id: '2', name: 'Peter Ssemwogerere', phone: '+256702345678', location: 'Nakawa', rating: 4.5, jobsCompleted: 98, verified: true, joinedAt: '2023-08-20T00:00:00Z' },
  { id: '3', name: 'James Mugisha', phone: '+256703456789', location: 'Makindye', rating: 4.2, jobsCompleted: 45, verified: false, joinedAt: '2023-10-10T00:00:00Z' },
  { id: '4', name: 'David Lubega', phone: '+256704567890', location: 'Ntinda', rating: 4.9, jobsCompleted: 201, verified: true, joinedAt: '2023-03-05T00:00:00Z' },
  { id: '5', name: 'Moses Kasule', phone: '+256705678901', location: 'Wandegeya', rating: 3.8, jobsCompleted: 23, verified: false, joinedAt: '2024-01-02T00:00:00Z' },
];

const verifiedOptions = [
  { value: 'all', label: 'All Mechanics' },
  { value: 'verified', label: 'Verified Only' },
];

export default function MechanicsManagement() {
  const [search, setSearch] = useState('');
  const [verified, setVerified] = useState('all');
  const [page, setPage] = useState(1);
  
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null);
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['mechanics-management', { search, verified, page }],
    queryFn: () => fetchMechanics({ search, verifiedOnly: verified === 'verified', page, pageSize: 10 }),
    retry: false,
    placeholderData: {
      data: mockMechanics,
      total: 89,
      page: 1,
      pageSize: 10,
      totalPages: 9,
    },
  });

  const createMutation = useMutation({
    mutationFn: createMechanic,
    onSuccess: () => {
      toast.success('Mechanic added successfully');
      queryClient.invalidateQueries({ queryKey: ['mechanics-management'] });
      setFormDialogOpen(false);
      setSelectedMechanic(null);
    },
    onError: () => toast.error('Failed to add mechanic'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateMechanic(id, data),
    onSuccess: () => {
      toast.success('Mechanic updated successfully');
      queryClient.invalidateQueries({ queryKey: ['mechanics-management'] });
      setFormDialogOpen(false);
      setSelectedMechanic(null);
    },
    onError: () => toast.error('Failed to update mechanic'),
  });

  // Toggle verification using updateMechanic
  const toggleVerificationMutation = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      updateMechanic(id, { is_verified: verified }),
    onSuccess: (_, variables) => {
      toast.success(variables.verified ? 'Mechanic verified' : 'Verification removed');
      queryClient.invalidateQueries({ queryKey: ['mechanics-management'] });
    },
    onError: () => toast.error('Failed to update verification status'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMechanic,
    onSuccess: () => {
      toast.success('Mechanic deleted');
      queryClient.invalidateQueries({ queryKey: ['mechanics-management'] });
      setDeleteDialogOpen(false);
      setSelectedMechanic(null);
    },
    onError: () => toast.error('Failed to delete mechanic'),
  });

  const handleAddNew = () => {
    setSelectedMechanic(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (mechanic: Mechanic) => {
    setSelectedMechanic(mechanic);
    setFormDialogOpen(true);
  };

  const handleDelete = (mechanic: Mechanic) => {
    setSelectedMechanic(mechanic);
    setDeleteDialogOpen(true);
  };

  const handleToggleVerified = (mechanic: Mechanic) => {
    toggleVerificationMutation.mutate({
      id: mechanic.id,
      verified: !mechanic.verified,
    });
  };

  // FIXED: No more password/vehicleType → matches live backend
  const handleFormSubmit = (formData: any) => {
    const cleanData = {
      name: formData.name,
      phone: formData.phone,
      location: formData.location,
      is_verified: formData.is_verified || false,
    };

    if (selectedMechanic) {
      // Only send changed fields
      const updates: any = {};
      if (cleanData.name !== selectedMechanic.name) updates.name = cleanData.name;
      if (cleanData.phone !== selectedMechanic.phone) updates.phone = cleanData.phone;
      if (cleanData.location !== selectedMechanic.location) updates.location = cleanData.location;
      if (cleanData.is_verified !== selectedMechanic.verified) updates.is_verified = cleanData.is_verified;

      updateMutation.mutate({ id: selectedMechanic.id, data: updates });
    } else {
      createMutation.mutate(cleanData);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedMechanic) deleteMutation.mutate(selectedMechanic.id);
  };

  const columns: ColumnDef<Mechanic>[] = [
    {
      accessorKey: 'name',
      header: 'Mechanic',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {row.original.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone size={10} />
              {row.original.phone}
            </p>
          </div>
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
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Star size={14} className="text-yellow-400 fill-yellow-400" />
          <span className="font-medium">{row.original.rating.toFixed(1)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'jobsCompleted',
      header: 'Jobs',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Wrench size={14} className="text-muted-foreground" />
          <span className="font-mono">{row.original.jobsCompleted}</span>
        </div>
      ),
    },
    {
      accessorKey: 'verified',
      header: 'Verified',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.original.verified}
            onCheckedChange={() => handleToggleVerified(row.original)}
            disabled={toggleVerificationMutation.isPending}
          />
          {row.original.verified ? (
            <Badge variant="success">Yes</Badge>
          ) : (
            <Badge variant="secondary">No</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'joinedAt',
      header: 'Joined',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.joinedAt), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(row.original)}
            className="h-8 w-8"
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original)}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  const displayData = data?.data || mockMechanics;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
              <Settings className="text-primary" />
              Mechanics Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Add, edit, and manage your mechanics fleet
            </p>
          </div>
          <Button onClick={handleAddNew} className="gap-2">
            <Plus size={18} />
            Add New Mechanic
          </Button>
        </div>

        <TableFilters
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by phone..."
        >
          <FilterSelect
            value={verified}
            onValueChange={setVerified}
            options={verifiedOptions}
            placeholder="Filter"
          />
        </TableFilters>

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

        <MechanicFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          mechanic={selectedMechanic}
          onSubmit={handleFormSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />

        <DeleteMechanicDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          mechanicName={selectedMechanic?.name || ''}
          onConfirm={handleDeleteConfirm}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}