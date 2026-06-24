import { type FormEvent, useCallback, useEffect, useState } from 'react';
import {
  createUser,
  deleteUser,
  getFirmRoles,
  getUsers,
  updateUser,
} from '@/api/users';
import { getApiErrorMessage } from '@/api/client';
import { getFirmRoleLabel } from '@/config/firmRoles';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { useTenant } from '@/contexts/TenantContext';
import type { AppUser, CreateUserPayload, FirmRoleOption, FirmRoleValue } from '@/types';

type UserFormState = Omit<CreateUserPayload, 'tenantId'>;

const emptyForm: UserFormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  firmRole: 3,
  secondaryFirmRole: null,
};

function formatUserName(user: AppUser): string {
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return fullName || user.email;
}

export function UsersPage() {
  const { isAdmin } = useAuth();
  const { confirm } = useDialog();
  const { tenantId } = useTenant();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [firmRoles, setFirmRoles] = useState<FirmRoleOption[]>([]);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        getUsers(0, 100, isAdmin ? tenantId ?? undefined : undefined),
        getFirmRoles(),
      ]);
      setUsers(usersResponse.items ?? []);
      setFirmRoles(rolesResponse);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, tenantId]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  function openCreateForm() {
    setFormMode('create');
    setEditingUserId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditForm(user: AppUser) {
    setFormMode('edit');
    setEditingUserId(user.id);
    setForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email,
      password: '',
      firmRole: user.firmRole ?? 3,
      secondaryFirmRole: user.secondaryFirmRole ?? null,
    });
    setShowForm(true);
    setError(null);
  }

  function closeForm() {
    setShowForm(false);
    setFormMode('create');
    setEditingUserId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (formMode === 'create') {
        const payload: CreateUserPayload = {
          ...form,
          tenantId: isAdmin ? tenantId ?? undefined : undefined,
          secondaryFirmRole: form.secondaryFirmRole || null,
        };
        await createUser(payload);
      } else if (editingUserId) {
        await updateUser({
          id: editingUserId,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          firmRole: form.firmRole,
          secondaryFirmRole: form.secondaryFirmRole || null,
          ...(form.password.trim() ? { password: form.password } : {}),
        });
      }

      closeForm();
      await loadUsers();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: AppUser) {
    const confirmed = await confirm({
      title: 'Kullanıcıyı sil',
      message: `${formatUserName(user)} kullanıcısını silmek istediğinize emin misiniz?`,
      variant: 'danger',
      confirmLabel: 'Sil',
    });
    if (!confirmed) {
      return;
    }

    setError(null);
    try {
      await deleteUser(user.id);
      await loadUsers();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Kullanıcılar</h2>
          <p className="text-sm text-slate-600">
            Firma personeline hazır rol şablonları ile yetki verin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (showForm && formMode === 'create' ? closeForm() : openCreateForm())}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {showForm && formMode === 'create' ? 'Formu Kapat' : 'Yeni Kullanıcı'}
        </button>
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900">
              {formMode === 'create' ? 'Yeni Kullanıcı' : 'Kullanıcıyı Düzenle'}
            </h3>
          </div>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Ad</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.firstName}
              onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
              required
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Soyad</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.lastName}
              onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
              required
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">E-posta</span>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">
              {formMode === 'create' ? 'Şifre' : 'Yeni şifre (isteğe bağlı)'}
            </span>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required={formMode === 'create'}
              minLength={formMode === 'create' || form.password.trim() ? 4 : undefined}
              placeholder={formMode === 'edit' ? 'Değiştirmek istemiyorsanız boş bırakın' : undefined}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Ana rol</span>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.firmRole}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  firmRole: Number(event.target.value) as FirmRoleValue,
                }))
              }
            >
              {firmRoles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Ek rol (isteğe bağlı)</span>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.secondaryFirmRole ?? ''}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  secondaryFirmRole: event.target.value
                    ? (Number(event.target.value) as FirmRoleValue)
                    : null,
                }))
              }
            >
              <option value="">Yok</option>
              {firmRoles
                .filter((role) => role.value !== form.firmRole)
                .map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving
                ? 'Kaydediliyor...'
                : formMode === 'create'
                  ? 'Kullanıcı Oluştur'
                  : 'Değişiklikleri Kaydet'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              İptal
            </button>
          </div>
        </form>
      ) : null}

      {loading ? <p className="text-slate-600">Yükleniyor...</p> : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Ad Soyad</th>
              <th className="px-4 py-3 font-medium">E-posta</th>
              <th className="px-4 py-3 font-medium">Ana Rol</th>
              <th className="px-4 py-3 font-medium">Ek Rol</th>
              <th className="px-4 py-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-900">{formatUserName(user)}</td>
                <td className="px-4 py-3 text-slate-600">{user.email}</td>
                <td className="px-4 py-3 text-slate-700">{getFirmRoleLabel(user.firmRole)}</td>
                <td className="px-4 py-3 text-slate-700">
                  {user.secondaryFirmRole ? getFirmRoleLabel(user.secondaryFirmRole) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => openEditForm(user)}
                      className="text-sm font-medium text-brand-600 hover:text-brand-700"
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(user)}
                      className="text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Sil
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
