import { supabase } from './supabase'

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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return null
  return data
}

export async function getMyRole() {
  const profile = await getProfile()
  return profile?.role ?? null
}

export async function signOut() {
  await supabase.auth.signOut()
}

export function rutaPorRol(role) {
  if (role === 'admin' || role === 'tecnico') return '/admin'
  if (role === 'escuela') return '/escuela'
  return '/login'
}