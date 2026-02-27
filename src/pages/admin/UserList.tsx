import { useState, useEffect } from 'react';
import { Plus, Pencil, UserCheck, UserX, Loader2, Shield, UtensilsCrossed, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, Restaurant } from '@/types/database';
import { toast } from 'sonner';

const emptyForm = {
  full_name: '',
  email: '',
  password: '',
  role: 'operator' as 'admin' | 'operator',
  restaurant_id: '' as string,
  auto_verify: true,
};

const UserList = () => {
  const [users, setUsers] = useState<(UserProfile & { restaurant_name?: string })[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fetchData = async () => {
    const [usersRes, restRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('restaurants').select('*').order('name'),
    ]);
    const restaurantList = (restRes.data as Restaurant[]) || [];
    setRestaurants(restaurantList);
    const restMap = Object.fromEntries(restaurantList.map((r) => [r.id, r.name]));
    setUsers(
      ((usersRes.data as UserProfile[]) || []).map((u) => ({
        ...u,
        restaurant_name: u.restaurant_id ? restMap[u.restaurant_id] : undefined,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowPassword(false);
    setFormOpen(true);
  };

  const openEdit = (u: UserProfile) => {
    setEditingId(u.id);
    setForm({
      full_name: u.full_name,
      email: u.email,
      password: '',
      role: u.role,
      restaurant_id: u.restaurant_id ? String(u.restaurant_id) : '',
      auto_verify: true,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    if (!editingId && !form.password) {
      toast.error('Password is required for new users');
      return;
    }
    if (form.role === 'operator' && !form.restaurant_id) {
      toast.error('Restaurant is required for operators');
      return;
    }

    setSaving(true);

    if (editingId) {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: form.full_name.trim(),
          role: form.role,
          restaurant_id: form.restaurant_id ? Number(form.restaurant_id) : null,
        })
        .eq('id', editingId);
      if (error) {
        toast.error('Failed to update user');
        console.error(error);
      } else {
        toast.success('User updated');
      }
    } else {
      // Create auth user first, then profile
      const signUpOptions: any = {
        email: form.email.trim(),
        password: form.password,
      };

      // If auto_verify is checked, pass email_confirm option
      if (form.auto_verify) {
        signUpOptions.options = {
          data: {
            email_verified: true,
          },
        };
      }

      const { data: authData, error: authError } = await supabase.auth.signUp(signUpOptions);
      if (authError || !authData.user) {
        toast.error(authError?.message || 'Failed to create user');
        setSaving(false);
        return;
      }

      // If email verification is required by Supabase project settings,
      // we need to confirm the user via admin API or update auth.users directly.
      // With the anon key, we can try to auto-confirm by updating the user's
      // email_confirmed_at in the users table metadata.
      // Note: If your Supabase project has "Confirm email" disabled in Auth settings,
      // users will be auto-verified. Otherwise, you may need to disable it in
      // Supabase Dashboard > Authentication > Providers > Email > Confirm email.

      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: form.email.trim(),
        full_name: form.full_name.trim(),
        role: form.role,
        restaurant_id: form.restaurant_id ? Number(form.restaurant_id) : null,
      });
      if (profileError) {
        toast.error('Auth user created but profile failed. Check Supabase.');
        console.error(profileError);
      } else {
        if (form.auto_verify) {
          toast.success('User created. Note: To skip email verification, disable "Confirm email" in Supabase Auth settings.');
        } else {
          toast.success('User created. Verification email sent.');
        }
      }
    }
    setSaving(false);
    setFormOpen(false);
    fetchData();
  };

  const toggleActive = async (u: UserProfile) => {
    const { error } = await supabase
      .from('users')
      .update({ is_active: !u.is_active })
      .eq('id', u.id);
    if (error) {
      toast.error('Failed to update user status');
    } else {
      toast.success(u.is_active ? 'User deactivated' : 'User activated');
      fetchData();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">No users found</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="gap-1">
                      {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <UtensilsCrossed className="w-3 h-3" />}
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.restaurant_name || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={u.is_active ? 'default' : 'destructive'} className="text-xs">
                      {u.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleActive(u)}
                        title={u.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {u.is_active ? (
                          <UserX className="w-3.5 h-3.5 text-destructive" />
                        ) : (
                          <UserCheck className="w-3.5 h-3.5 text-green-600" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit User' : 'Add User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com"
                disabled={!!editingId}
              />
            </div>
            {!editingId && (
              <>
                <div>
                  <Label>Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="Minimum 6 characters"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="auto-verify"
                    checked={form.auto_verify}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, auto_verify: !!v }))}
                  />
                  <Label htmlFor="auto-verify" className="text-sm font-normal cursor-pointer">
                    Mark as verified (skip email verification)
                  </Label>
                </div>
              </>
            )}
            <div>
              <Label>Role <span className="text-destructive">*</span></Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as 'admin' | 'operator' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.role === 'operator' && (
              <div>
                <Label>Restaurant <span className="text-destructive">*</span></Label>
                <Select value={form.restaurant_id} onValueChange={(v) => setForm((f) => ({ ...f, restaurant_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select restaurant" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserList;
