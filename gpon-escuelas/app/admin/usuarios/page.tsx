'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsers,
  faPlus,
  faEdit,
  faTrash,
  faShieldHalved,
  faWrench,
  faSchool,
  faCheckCircle,
  faXmarkCircle,
  faTimes,
  faPhone,
  faKey,
  faRotate,
  faEye,
  faEyeSlash,
  faUserCheck,
  faUserSlash,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons'
import type { Profile, Rol } from '@/types'

export default function AdminUsuariosPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [usuarios, setUsuarios] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState<'todos' | Rol>('todos')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'inactivos'>('todos')

  // Modales
  const [mostrarCrear, setMostrarCrear] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<Profile | null>(null)
  const [usuarioEliminando, setUsuarioEliminando] = useState<Profile | null>(null)

  // Formulario Crear
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [nuevoPassword, setNuevoPassword] = useState('')
  const [nuevoRol, setNuevoRol] = useState<Rol>('escuela')
  const [nuevoTelefono, setNuevoTelefono] = useState('')
  const [nuevoActivo, setNuevoActivo] = useState(true)
  const [verPasswordCrear, setVerPasswordCrear] = useState(false)
  const [errorCrear, setErrorCrear] = useState<string | null>(null)

  // Formulario Editar
  const [editNombre, setEditNombre] = useState('')
  const [editRol, setEditRol] = useState<Rol>('escuela')
  const [editTelefono, setEditTelefono] = useState('')
  const [editActivo, setEditActivo] = useState(true)
  const [editPassword, setEditPassword] = useState('')
  const [verPasswordEdit, setVerPasswordEdit] = useState(false)
  const [errorEdit, setErrorEdit] = useState<string | null>(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!prof || prof.role !== 'admin') {
        alert('Acceso restringido a administradores.')
        router.push('/admin')
        return
      }

      setProfile(prof as Profile)

      // Cargar lista de usuarios desde API
      const res = await fetch('/api/usuarios')
      const json = await res.json()
      if (json.ok) {
        setUsuarios(json.data || [])
      } else {
        console.error('Error al cargar usuarios:', json.error)
      }
    } catch (err) {
      console.error('Error cargando usuarios:', err)
    } finally {
      setLoading(false)
    }
  }

  function generarPasswordSegura(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*'
    let pwd = ''
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return pwd
  }

  async function handleCrearUsuario(e: React.FormEvent) {
    e.preventDefault()
    setErrorCrear(null)
    setGuardando(true)

    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: nuevoNombre,
          email: nuevoEmail,
          password: nuevoPassword,
          role: nuevoRol,
          telefono: nuevoTelefono || null,
          activo: nuevoActivo,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'No se pudo crear el usuario.')
      }

      setUsuarios((prev) => [json.data, ...prev])
      setMostrarCrear(false)
      // Limpiar formulario
      setNuevoNombre('')
      setNuevoEmail('')
      setNuevoPassword('')
      setNuevoRol('escuela')
      setNuevoTelefono('')
      setNuevoActivo(true)
    } catch (err: unknown) {
      setErrorCrear(err instanceof Error ? err.message : 'Error al crear usuario')
    } finally {
      setGuardando(false)
    }
  }

  function abrirEditar(u: Profile) {
    setUsuarioEditando(u)
    setEditNombre(u.full_name || '')
    setEditRol(u.role)
    setEditTelefono(u.telefono || '')
    setEditActivo(u.activo !== false)
    setEditPassword('')
    setErrorEdit(null)
  }

  async function handleEditarUsuario(e: React.FormEvent) {
    e.preventDefault()
    if (!usuarioEditando) return
    setErrorEdit(null)
    setGuardando(true)

    try {
      const payload: Record<string, unknown> = {
        full_name: editNombre,
        role: editRol,
        telefono: editTelefono || null,
        activo: editActivo,
      }
      if (editPassword.trim()) {
        payload.password = editPassword.trim()
      }

      const res = await fetch(`/api/usuarios/${usuarioEditando.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'No se pudo actualizar el usuario.')
      }

      setUsuarios((prev) =>
        prev.map((item) => (item.id === usuarioEditando.id ? json.data : item))
      )
      setUsuarioEditando(null)
    } catch (err: unknown) {
      setErrorEdit(err instanceof Error ? err.message : 'Error al actualizar usuario')
    } finally {
      setGuardando(false)
    }
  }

  async function toggleActivoRapido(u: Profile) {
    try {
      const nuevoEstado = !u.activo
      const res = await fetch(`/api/usuarios/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: nuevoEstado }),
      })
      const json = await res.json()
      if (json.ok) {
        setUsuarios((prev) =>
          prev.map((item) => (item.id === u.id ? { ...item, activo: nuevoEstado } : item))
        )
      } else {
        alert(json.error || 'Error al cambiar estado')
      }
    } catch (err) {
      console.error(err)
      alert('Error de conexión')
    }
  }

  async function confirmarEliminar() {
    if (!usuarioEliminando) return
    setGuardando(true)
    try {
      const res = await fetch(`/api/usuarios/${usuarioEliminando.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'No se pudo eliminar el usuario.')
      }

      setUsuarios((prev) => prev.filter((item) => item.id !== usuarioEliminando.id))
      setUsuarioEliminando(null)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar usuario')
    } finally {
      setGuardando(false)
    }
  }

  // KPIs
  const conteos = useMemo(() => {
    return {
      total: usuarios.length,
      admin: usuarios.filter((u) => u.role === 'admin').length,
      tecnico: usuarios.filter((u) => u.role === 'tecnico').length,
      escuela: usuarios.filter((u) => u.role === 'escuela').length,
      activos: usuarios.filter((u) => u.activo !== false).length,
      inactivos: usuarios.filter((u) => u.activo === false).length,
    }
  }, [usuarios])

  // Filtrado
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const q = busqueda.trim().toLowerCase()
      const matchBusqueda =
        !q ||
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.telefono && u.telefono.toLowerCase().includes(q))

      const matchRol = filtroRol === 'todos' || u.role === filtroRol

      const matchEstado =
        filtroEstado === 'todos' ||
        (filtroEstado === 'activos' && u.activo !== false) ||
        (filtroEstado === 'inactivos' && u.activo === false)

      return matchBusqueda && matchRol && matchEstado
    })
  }, [usuarios, busqueda, filtroRol, filtroEstado])

  function getRolConfig(role: Rol) {
    switch (role) {
      case 'admin':
        return {
          label: 'Administrador',
          icon: faShieldHalved,
          bg: 'bg-purple-50 dark:bg-purple-950/40',
          text: 'text-purple-700 dark:text-purple-300',
          border: 'border-purple-200 dark:border-purple-800',
          avatarBg: 'bg-purple-600',
        }
      case 'tecnico':
        return {
          label: 'Técnico NOC',
          icon: faWrench,
          bg: 'bg-sky-50 dark:bg-sky-950/40',
          text: 'text-sky-700 dark:text-sky-300',
          border: 'border-sky-200 dark:border-sky-800',
          avatarBg: 'bg-sky-600',
        }
      case 'escuela':
      default:
        return {
          label: 'Institución',
          icon: faSchool,
          bg: 'bg-emerald-50 dark:bg-emerald-950/40',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-200 dark:border-emerald-800',
          avatarBg: 'bg-emerald-600',
        }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] dark:bg-slate-900">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex font-sans text-slate-800 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 antialiased selection:bg-sky-100 selection:text-sky-900">
      {/* SIDEBAR UNIFICADO */}
      <AdminSidebar
        profile={profile}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen w-full">
        {/* HEADER UNIFICADO */}
        <AdminHeader
          profile={profile}
          searchValue={busqueda}
          onSearchChange={setBusqueda}
          searchPlaceholder="Buscar por nombre, correo o teléfono..."
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          actionButton={
            <button
              onClick={() => {
                setNuevoPassword(generarPasswordSegura())
                setMostrarCrear(true)
              }}
              className="px-3.5 md:px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white active:scale-[0.99] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <FontAwesomeIcon icon={faPlus} className="text-xs" />
              <span className="hidden sm:inline">Nuevo Usuario</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          }
        />

        <main className="p-4 md:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
          {/* BANNER / TITULO */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FontAwesomeIcon icon={faUsers} className="text-sm" />
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Gestión de Usuarios
                </h1>
              </div>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                Administración de cuentas con acceso al sistema: administradores generales, técnicos y enlaces escolares.
              </p>
            </div>

            <button
              onClick={() => {
                setNuevoPassword(generarPasswordSegura())
                setMostrarCrear(true)
              }}
              className="self-start md:self-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <FontAwesomeIcon icon={faPlus} />
              Crear nueva cuenta
            </button>
          </div>

          {/* KPIS DE USUARIOS */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 p-4 shadow-sm flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Usuarios</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  Global
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                  {conteos.total}
                </div>
                <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  {conteos.activos} activos · {conteos.inactivos} inactivos
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 p-4 shadow-sm flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Administradores</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900">
                  NOC Central
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300 tracking-tight leading-none mb-1">
                  {conteos.admin}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Acceso total
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 p-4 shadow-sm flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Técnicos</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900">
                  Campo
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-sky-700 dark:text-sky-300 tracking-tight leading-none mb-1">
                  {conteos.tecnico}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Soporte y tickets
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 p-4 shadow-sm flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Instituciones</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900">
                  Escuelas
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 tracking-tight leading-none mb-1">
                  {conteos.escuela}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Enlaces escolares
                </div>
              </div>
            </div>
          </section>

          {/* FILTROS Y CONTROLES */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* TABS DE ROL */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setFiltroRol('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filtroRol === 'todos'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                Todos ({conteos.total})
              </button>
              <button
                onClick={() => setFiltroRol('admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filtroRol === 'admin'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <FontAwesomeIcon icon={faShieldHalved} className="text-[10px]" />
                Admins ({conteos.admin})
              </button>
              <button
                onClick={() => setFiltroRol('tecnico')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filtroRol === 'tecnico'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <FontAwesomeIcon icon={faWrench} className="text-[10px]" />
                Técnicos ({conteos.tecnico})
              </button>
              <button
                onClick={() => setFiltroRol('escuela')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filtroRol === 'escuela'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <FontAwesomeIcon icon={faSchool} className="text-[10px]" />
                Escuelas ({conteos.escuela})
              </button>
            </div>

            {/* FILTRO DE ESTADO */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Estado:</span>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as 'todos' | 'activos' | 'inactivos')}
                className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="todos">Todos los estados</option>
                <option value="activos">Solo activos</option>
                <option value="inactivos">Solo inactivos</option>
              </select>
            </div>
          </div>

          {/* TABLA DE USUARIOS */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 md:px-6">Usuario</th>
                    <th className="py-3 px-4">Rol en Sistema</th>
                    <th className="py-3 px-4 hidden sm:table-cell">Contacto</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 hidden md:table-cell">Registrado</th>
                    <th className="py-3 px-4 md:px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                        <FontAwesomeIcon icon={faUsers} className="text-3xl mb-2 opacity-50 block mx-auto" />
                        No se encontraron usuarios que coincidan con los filtros.
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((u) => {
                      const rolCfg = getRolConfig(u.role)
                      const userInit = (u.full_name || u.email || 'U')
                        .split(' ')
                        .map((s) => s[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()

                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          {/* USUARIO */}
                          <td className="py-3 px-4 md:px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full ${rolCfg.avatarBg} text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs`}
                              >
                                {userInit}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-slate-900 dark:text-white truncate">
                                  {u.full_name || 'Sin nombre asignado'}
                                </span>
                                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {u.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* ROL */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${rolCfg.bg} ${rolCfg.text} ${rolCfg.border}`}
                            >
                              <FontAwesomeIcon icon={rolCfg.icon} className="text-[10px]" />
                              {rolCfg.label}
                            </span>
                          </td>

                          {/* CONTACTO */}
                          <td className="py-3 px-4 hidden sm:table-cell text-slate-500 dark:text-slate-400">
                            {u.telefono ? (
                              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                                <FontAwesomeIcon icon={faPhone} className="text-[10px] text-slate-400" />
                                {u.telefono}
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600">—</span>
                            )}
                          </td>

                          {/* ESTADO */}
                          <td className="py-3 px-4">
                            <button
                              onClick={() => toggleActivoRapido(u)}
                              title="Clic para cambiar estado"
                              className="group inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  u.activo !== false ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              />
                              <span
                                className={`text-[11px] font-semibold ${
                                  u.activo !== false
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                } group-hover:underline`}
                              >
                                {u.activo !== false ? 'Activo' : 'Inactivo'}
                              </span>
                            </button>
                          </td>

                          {/* FECHA */}
                          <td className="py-3 px-4 hidden md:table-cell text-slate-500 dark:text-slate-400 text-[11px]">
                            {u.created_at
                              ? new Date(u.created_at).toLocaleDateString('es-MX', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '—'}
                          </td>

                          {/* ACCIONES */}
                          <td className="py-3 px-4 md:px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => abrirEditar(u)}
                                className="w-8 h-8 rounded-lg text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center justify-center transition-colors cursor-pointer"
                                title="Editar usuario"
                              >
                                <FontAwesomeIcon icon={faEdit} className="text-xs" />
                              </button>
                              {profile?.id !== u.id && (
                                <button
                                  onClick={() => setUsuarioEliminando(u)}
                                  className="w-8 h-8 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-colors cursor-pointer"
                                  title="Eliminar usuario"
                                >
                                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* ============================================================ */}
      {/* MODAL CREAR USUARIO */}
      {/* ============================================================ */}
      {mostrarCrear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FontAwesomeIcon icon={faPlus} className="text-xs" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Crear Nuevo Usuario
                </h3>
              </div>
              <button
                onClick={() => setMostrarCrear(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleCrearUsuario} className="p-5 flex flex-col gap-4 text-xs">
              {errorCrear && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
                  {errorCrear}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  required
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Lic. Carlos Mendoza Flores"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correo electrónico institucional / acceso *
                </label>
                <input
                  type="email"
                  required
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  placeholder="usuario@gpon.mx o escuela@edomex.gob.mx"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Contraseña *
                  </label>
                  <button
                    type="button"
                    onClick={() => setNuevoPassword(generarPasswordSegura())}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faRotate} className="text-[10px]" />
                    Generar segura
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={verPasswordCrear ? 'text' : 'password'}
                    required
                    value={nuevoPassword}
                    onChange={(e) => setNuevoPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setVerPasswordCrear(!verPasswordCrear)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={verPasswordCrear ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rol en la plataforma *
                  </label>
                  <select
                    value={nuevoRol}
                    onChange={(e) => setNuevoRol(e.target.value as Rol)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  >
                    <option value="escuela">Institución Educativa (Escuela)</option>
                    <option value="tecnico">Técnico NOC / Soporte</option>
                    <option value="admin">Administrador General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono (opcional)
                  </label>
                  <input
                    type="text"
                    value={nuevoTelefono}
                    onChange={(e) => setNuevoTelefono(e.target.value)}
                    placeholder="712-123-4567"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nuevoActivo}
                    onChange={(e) => setNuevoActivo(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Usuario activo (permite iniciar sesión de inmediato)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setMostrarCrear(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm disabled:opacity-60 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL EDITAR USUARIO */}
      {/* ============================================================ */}
      {usuarioEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FontAwesomeIcon icon={faEdit} className="text-xs" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Editar Usuario
                </h3>
              </div>
              <button
                onClick={() => setUsuarioEditando(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleEditarUsuario} className="p-5 flex flex-col gap-4 text-xs">
              {errorEdit && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
                  {errorEdit}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Correo electrónico (cuenta)
                </label>
                <input
                  type="email"
                  disabled
                  value={usuarioEditando.email}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rol asignado *
                  </label>
                  <select
                    value={editRol}
                    onChange={(e) => setEditRol(e.target.value as Rol)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  >
                    <option value="escuela">Institución Educativa (Escuela)</option>
                    <option value="tecnico">Técnico NOC / Soporte</option>
                    <option value="admin">Administrador General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={editTelefono}
                    onChange={(e) => setEditTelefono(e.target.value)}
                    placeholder="712-123-4567"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Restablecer contraseña (opcional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditPassword(generarPasswordSegura())}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faRotate} className="text-[10px]" />
                    Generar nueva clave
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={verPasswordEdit ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Dejar en blanco para mantener la actual"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setVerPasswordEdit(!verPasswordEdit)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={verPasswordEdit ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editActivo}
                    onChange={(e) => setEditActivo(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Usuario activo (cuenta habilitada)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setUsuarioEditando(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm disabled:opacity-60 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {/* ============================================================ */}
      {usuarioEliminando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <FontAwesomeIcon icon={faTrash} className="text-lg" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                ¿Eliminar cuenta de usuario?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Esta acción dará de baja la cuenta de{' '}
                <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                  {usuarioEliminando.full_name || usuarioEliminando.email}
                </strong>{' '}
                ({usuarioEliminando.email}). El usuario perderá el acceso a la plataforma de forma inmediata.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUsuarioEliminando(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardando}
                onClick={confirmarEliminar}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm disabled:opacity-60 transition-colors cursor-pointer"
              >
                {guardando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
