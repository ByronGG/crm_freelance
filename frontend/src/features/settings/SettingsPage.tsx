import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Check } from 'lucide-react'

import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { useAuth } from '../auth/AuthContext'
import { getCompanyProfile, upsertCompanyProfile } from './api'
import type { CompanyProfileForm } from './types'

const EMPTY: CompanyProfileForm = {
  businessName: '',
  taxId: '',
  email: '',
  phone: '',
  address: '',
  logoUrl: '',
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  MEMBER: 'Miembro',
}

export function SettingsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CompanyProfileForm>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const profile = useQuery({
    queryKey: ['company-profile'],
    queryFn: getCompanyProfile,
  })

  useEffect(() => {
    if (profile.data) {
      setForm({
        businessName: profile.data.businessName,
        taxId: profile.data.taxId ?? '',
        email: profile.data.email ?? '',
        phone: profile.data.phone ?? '',
        address: profile.data.address ?? '',
        logoUrl: profile.data.logoUrl ?? '',
      })
    }
  }, [profile.data])

  const save = useMutation({
    mutationFn: (f: CompanyProfileForm) => upsertCompanyProfile(f),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-profile'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
    onError: (err) => {
      const code = (err as AxiosError)?.response?.status
      setError(
        code === 400
          ? 'Revisa los datos: hay algún campo con formato inválido.'
          : 'No se pudo guardar el perfil.',
      )
    },
  })

  function setField<K extends keyof CompanyProfileForm>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
    setSaved(false)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    save.mutate(form)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-medium text-fg">Ajustes</h1>
      <p className="mt-1 text-sm text-muted">
        Tu cuenta y los datos de empresa para facturación.
      </p>

      <section className="mt-6 rounded-xl border border-line bg-surface p-5">
        <h2 className="text-base font-medium text-fg">Cuenta</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Nombre</dt>
            <dd className="text-fg">{user?.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Email</dt>
            <dd className="text-fg">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Rol</dt>
            <dd className="text-fg">
              {user ? (ROLE_LABEL[user.role] ?? user.role) : ''}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-4 rounded-xl border border-line bg-surface p-5">
        <h2 className="text-base font-medium text-fg">Datos de empresa</h2>
        <p className="mt-1 text-sm text-muted">
          Aparecerán en tus facturas y propuestas.
        </p>

        {profile.isLoading ? (
          <p className="mt-4 text-sm text-muted">Cargando…</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <TextField
              label="Nombre del negocio"
              required
              placeholder="Mi Estudio S.L."
              value={form.businessName}
              onChange={(e) => setField('businessName', e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Identificación fiscal"
                placeholder="B12345678"
                value={form.taxId}
                onChange={(e) => setField('taxId', e.target.value)}
              />
              <TextField
                label="Email de facturación"
                type="email"
                placeholder="facturacion@empresa.com"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Teléfono"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
              />
              <TextField
                label="URL del logo"
                placeholder="https://…"
                value={form.logoUrl}
                onChange={(e) => setField('logoUrl', e.target.value)}
              />
            </div>

            <TextField
              label="Dirección"
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
            />

            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3">
              {saved && (
                <span className="flex items-center gap-1 text-sm text-brand-fg">
                  <Check size={16} /> Guardado
                </span>
              )}
              <Button type="submit" variant="primary" disabled={save.isPending}>
                {save.isPending ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
