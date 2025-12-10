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

// New schema — matches your LIVE backend 100%
const mechanicSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().trim().regex(/^(\+256|0)[0-9]{9}$/, 'Valid Uganda phone required'),
  location: z.string().trim().min(2, 'Location required').max(100),
  is_verified: z.boolean().optional(),
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<MechanicFormData>({
    resolver: zodResolver(mechanicSchema),
    defaultValues: {
      name: '',
      phone: '',
      location: '',
      is_verified: false,
    },
  });

  // Sync form when dialog opens or mechanic changes
  useEffect(() => {
    if (open && mechanic) {
      reset({
        name: mechanic.name,
        phone: mechanic.phone,
        location: mechanic.location,
        is_verified: mechanic.verified,
      });
    } else if (open) {
      reset({
        name: '',
        phone: '',
        location: '',
        is_verified: false,
      });
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
            <Input id="name" placeholder="John Okello" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" placeholder="+256701234567" {...register('phone')} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" placeholder="Kampala Central" {...register('location')} />
            {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
          </div>

          {/* Verification Toggle — only show when editing */}
          {isEditing && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_verified"
                checked={watch('is_verified') || false}
                onChange={(e) => setValue('is_verified', e.target.checked)}
                className="w-4 h-4 text-primary rounded border-gray-300"
              />
              <Label htmlFor="is_verified" className="cursor-pointer">
                Verified Mechanic
              </Label>
            </div>
          )}

          <DialogFooter className="pt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>{isEditing ? 'Update Mechanic' : 'Add Mechanic'}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}