import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hexagon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    organizationName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mode === 'login') {
        await login(form.username, form.password);
      } else {
        await register({
          username: form.username,
          password: form.password,
          fullName: form.fullName || undefined,
          email: form.email || undefined,
          organizationName: form.organizationName || undefined,
        });
      }
    } catch (error: any) {
      toast({
        title: mode === 'login' ? "Login Failed" : "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-primary p-3 rounded-xl shadow-lg">
                <Hexagon className="h-8 w-8 text-white" fill="currentColor" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-heading">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </CardTitle>
              <CardDescription className="mt-1">
                {mode === 'login'
                  ? 'Sign in to your Okiru Companion workspace'
                  : 'Create your Okiru Companion account'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={form.fullName}
                      onChange={e => setForm({ ...form, fullName: e.target.value })}
                      placeholder="Your full name"
                      data-testid="input-fullname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="you@company.com"
                      data-testid="input-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={form.organizationName}
                      onChange={e => setForm({ ...form, organizationName: e.target.value })}
                      placeholder="Your company name"
                      data-testid="input-org-name"
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  required
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="Choose a username"
                  data-testid="input-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                  data-testid="input-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading} data-testid="btn-submit-auth">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              {mode === 'login' ? (
                <p className="text-muted-foreground">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('register')}
                    className="text-primary font-medium hover:underline"
                    data-testid="link-switch-register"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="text-primary font-medium hover:underline"
                    data-testid="link-switch-login"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/90 to-primary items-center justify-center p-12">
        <div className="max-w-md text-white space-y-6">
          <h2 className="text-4xl font-heading font-bold leading-tight">
            Your Intelligent Consultant Workspace
          </h2>
          <p className="text-lg text-white/80 leading-relaxed">
            Okiru Companion is your all-in-one internal tool for managing client engagements,
            meeting minutes, tasks, and B-BBEE compliance — powered by AI.
          </p>
          <div className="flex flex-col gap-3 text-sm text-white/70">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-white/80" />
              AI-powered meeting minutes (Board &amp; Normal)
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-white/80" />
              Voice-enabled AI assistant with action support
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-white/80" />
              Tasks, calendars &amp; Zoho One integration
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-white/80" />
              Full B-BBEE compliance intelligence suite
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
