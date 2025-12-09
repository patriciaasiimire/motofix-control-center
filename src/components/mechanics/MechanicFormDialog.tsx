import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Mechanic } from '@/lib/api';

const mechanicSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  phone: z.string().trim().regex(/^(\+256|0)[0-9]{9}$/, 'Enter valid Uganda phone (e.g., +256701234567 or 0701234567)'),
  location: z.string().trim().min(2, 'Location required').max(100, 'Location too long'),
  vehicleType: z.string().trim().min(2, 'Vehicle type required').max(50, 'Vehicle type too long'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(50, 'Password too long').optional().or(z.literal('')),
});

type MechanicFormData = z.infer<typeof mechanicSchema>;

interface MechanicFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mechanic?: Mechanic | null;
  onSubmit: (data: MechanicFormData) => void;
  isLoading?: boolean;
}

export function MechanicFormDialog({
  open,
  onOpenChange,
  mechanic,
  onSubmit,
  isLoading,
}: MechanicFormDialogProps) {
  const isEditing = !!mechanic;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MechanicFormData>({
    resolver: zodResolver(
      isEditing 
        ? mechanicSchema.extend({ password: z.string().max(50).optional().or(z.literal('')) })
        : mechanicSchema.extend({ password: z.string().min(6, 'Password required for new mechanic').max(50) })
    ),
    defaultValues: {
      name: '',
      phone: '',
      location: '',
      vehicleType: '',
      password: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (mechanic) {
        reset({
          name: mechanic.name,
          phone: mechanic.phone,
          location: mechanic.location,
          vehicleType: 'Motorcycle', // Default since not in current type
          password: '',
        });
      } else {
        reset({
          name: '',
          phone: '',
          location: '',
          vehicleType: '',
          password: '',
        });
      }
    }
  }, [open, mechanic, reset]);

  const handleFormSubmit = (data: MechanicFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? 'Edit Mechanic' : 'Add New Mechanic'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Okello"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+256701234567"
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Kampala Central"
              {...register('location')}
            />
            {errors.location && (
              <p className="text-xs text-destructive">{errors.location.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicleType">Vehicle Type</Label>
            <Input
              id="vehicleType"
              placeholder="Motorcycle, Boda-Boda, etc."
              {...register('vehicleType')}
            />
            {errors.vehicleType && (
              <p className="text-xs text-destructive">{errors.vehicleType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {isEditing ? 'New Password (leave blank to keep current)' : 'Password'}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={isEditing ? '••••••••' : 'Min 6 characters'}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  {isEditing ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                isEditing ? 'Update Mechanic' : 'Add Mechanic'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
