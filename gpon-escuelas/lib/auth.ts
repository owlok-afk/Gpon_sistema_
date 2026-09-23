import { supabase } from './supabase'
import type { Rol } from '@/types'

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  return data.session
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user
}

export async function getProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return null
  return data
}

export async function getMyRole(): Promise<Rol | null> {
  const profile = await getProfile()
  return (profile?.role as Rol) ?? null
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

export function rutaPorRol(role: Rol | null): string {
  if (role === 'admin' || role === 'tecnico') return '/admin'
  if (role === 'escuela') return '/escuela'
  return '/login'
}