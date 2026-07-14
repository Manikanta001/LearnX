import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { setAdminPassword } from '@/lib/adminAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/admin/login', { username, password });
      setAdminPassword(password);
      navigate('/admin/add-question');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mb-2 flex justify-center">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Enter your admin username and password</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error ? <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p> : null}
            <div className="space-y-2">
              <Label htmlFor="admin-username">Username</Label>
              <Input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Login as Admin
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
