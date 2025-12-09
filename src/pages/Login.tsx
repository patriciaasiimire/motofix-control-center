import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import { Bike, Lock, Loader2 } from 'lucide-react';

export default function Login() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error('Please enter a password');
      return;
    }

    setIsLoading(true);
    
    try {
      // For now, accept any password and use it as the token
      // In production, this would call the actual login endpoint
      setAuthToken(password);
      toast.success('Welcome back, Admin!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Invalid password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl animate-fade-in">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 rounded-2xl gradient-primary glow-primary mb-4">
              <Bike className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-gradient">MOTOFIX</h1>
            <p className="text-muted-foreground text-sm mt-1">Admin Control Room</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Login to Dashboard'
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Secure access to your control room
          </p>
        </div>

        {/* Tagline */}
        <p className="text-center text-muted-foreground text-sm mt-6">
          Powering motorcycle repairs across Uganda
        </p>
      </div>
    </div>
  );
}
