import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'user' | 'worker' | 'admin'>('user');
  const [staffCode, setStaffCode] = useState('');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation for roles
      let actualRole = role;
      if (role !== 'user') {
        if (role === 'worker' && staffCode !== 'SMC-WORKER-2026') {
           throw new Error("Invalid Staff Code for Worker role");
        }
        if (role === 'admin' && staffCode !== 'SMC-ADMIN-2026') {
           throw new Error("Invalid Staff Code for Admin role");
        }
      }

      const response = await register(email, password, fullName, actualRole);

      if (!response.success) {
        throw new Error(response.message || 'Registration failed');
      }

      toast({
        title: "Registration successful",
        description: "Please check your email to verify your account.",
      });

      navigate('/login');
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <CardTitle className="text-2xl">Create an account</CardTitle>
          </div>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-3 pt-2">
              <Label>I am a...</Label>
              <RadioGroup
                defaultValue="user"
                value={role}
                onValueChange={(val: any) => setRole(val)}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="user" id="r-user" />
                  <Label htmlFor="r-user" className="font-normal">Citizen</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="worker" id="r-worker" />
                  <Label htmlFor="r-worker" className="font-normal">Maintenance Worker</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admin" id="r-admin" />
                  <Label htmlFor="r-admin" className="font-normal">SMC Administrator</Label>
                </div>
              </RadioGroup>
            </div>

            {role !== 'user' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="staffCode" className="text-primary font-medium">
                  Enter Staff Access Code
                </Label>
                <Input
                  id="staffCode"
                  type="password"
                  placeholder="Enter code provided by SMC"
                  value={staffCode}
                  onChange={(e) => setStaffCode(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Ask your supervisor for the code. (Try SMC-WORKER-2026 or SMC-ADMIN-2026)
                </p>
              </div>
            )}

          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="underline hover:text-primary">
                Login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Register;
