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
  faBuilding,
  faLocationDot,
  faSearch,
  faInfoCircle,
  faGraduationCap,
  faAddressCard,
} from '@fortawesome/free-solid-svg-icons'
import type { Profile, Rol } from '@/types'

type InstitucionMin = {
  id: number
  nombre: string
  cct: string | null
  domicilio: string | null
  director?: string | null
  telefono?: string | null
  estado_vinculacion?: string
  profile_id?: string | null
}

type UsuarioConInst = Profile & {
  institucion?: InstitucionMin | null
}

export default function AdminUsuariosPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [usuarios, setUsuarios] = useState<UsuarioConInst[]>([])
  const [institucionesDisponibles, setInstitucionesDisponibles] = useState<InstitucionMin[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState<'todos' | Rol>('todos')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'inactivos'>('todos')

  // Modales
  const [mostrarCrear, setMostrarCrear] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioConInst | null>(null)
  const [usuarioEliminando, setUsuarioEliminando] = useState<UsuarioConInst | null>(null)

  // Formulario Crear
  const [nuevoRol, setNuevoRol] = useState<Rol>('escuela')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [nuevoPassword, setNuevoPassword] = useState('')
  const [nuevoTelefono, setNuevoTelefono] = useState('')
  const [nuevoActivo, setNuevoActivo] = useState(true)
  const [verPasswordCrear, setVerPasswordCrear] = useState(false)
  const [errorCrear, setErrorCrear] = useState<string | null>(null)

  // Campos específicos para Escuela
  const [tipoEscuela, setTipoEscuela] = useState<'existente' | 'nueva'>('existente')
  const [escuelaSeleccionadaId, setEscuelaSeleccionadaId] = useState<number | null>(null)
  const [busquedaEscuelaModal, setBusquedaEscuelaModal] = useState('')
  const [nuevaEscuelaNombre, setNuevaEscuelaNombre] = useState('')
  const [nuevaEscuelaCCT, setNuevaEscuelaCCT] = useState('')
  const [nuevaEscuelaDomicilio, setNuevaEscuelaDomicilio] = useState('')
  const [nuevaEscuelaDirector, setNuevaEscuelaDirector] = useState('')
  const [nuevaEscuelaTurno, setNuevaEscuelaTurno] = useState('Matutino')
  const [nuevaEscuelaMatricula, setNuevaEscuelaMatricula] = useState('')
  const [nuevaEscuelaCiclo, setNuevaEscuelaCiclo] = useState('2025-2026')
  const [nuevaEscuelaTelefono, setNuevaEscuelaTelefono] = useState('')

  // Campos específicos para Técnico
  const [nuevoCuadrilla, setNuevoCuadrilla] = useState('')
  const [nuevoEspecialidad, setNuevoEspecialidad] = useState('')

  // Formulario Editar
  const [editNombre, setEditNombre] = useState('')
  const [editRol, setEditRol] = useState<Rol>('escuela')
  const [editTelefono, setEditTelefono] = useState('')
  const [editActivo, setEditActivo] = useState(true)
  const [editPassword, setEditPassword] = useState('')
  const [editInstitucionId, setEditInstitucionId] = useState<number | null>(null)
  const [verPasswordEdit, setVerPasswordEdit] = useState(false)
  const [errorEdit, setErrorEdit] = useState<string | null>(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
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

      // Cargar lista de usuarios e instituciones desde API
      const res = await fetch('/api/usuarios')
      const json = await res.json()
      if (json.ok) {
        setUsuarios(json.data || [])
        setInstitucionesDisponibles(json.institucionesDisponibles || [])
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

  function limpiarFormularioCrear() {
    setNuevoNombre('')
    setNuevoEmail('')
    setNuevoPassword(generarPasswordSegura())
    setNuevoRol('escuela')
    setNuevoTelefono('')
    setNuevoActivo(true)
    setTipoEscuela('existente')
    setEscuelaSeleccionadaId(null)
    setBusquedaEscuelaModal('')
    setNuevaEscuelaNombre('')
    setNuevaEscuelaCCT('')
    setNuevaEscuelaDomicilio('')
    setNuevaEscuelaDirector('')
    setNuevaEscuelaTurno('Matutino')
    setNuevaEscuelaMatricula('')
    setNuevaEscuelaCiclo('2025-2026')
    setNuevaEscuelaTelefono('')
    setNuevoCuadrilla('')
    setNuevoEspecialidad('')
    setErrorCrear(null)
  }

  // Filtrar instituciones en el buscador del modal
  const institucionesFiltradasModal = useMemo(() => {
    if (!busquedaEscuelaModal.trim()) return institucionesDisponibles
    const q = busquedaEscuelaModal.toLowerCase()
    return institucionesDisponibles.filter(
      (inst) =>
        inst.nombre.toLowerCase().includes(q) ||
        (inst.cct || '').toLowerCase().includes(q) ||
        (inst.domicilio || '').toLowerCase().includes(q)
    )
  }, [institucionesDisponibles, busquedaEscuelaModal])

  // Detalle de la escuela actualmente seleccionada en el modal
  const escuelaSeleccionadaDetalle = useMemo(() => {
    if (!escuelaSeleccionadaId) return null
    return institucionesDisponibles.find((i) => i.id === escuelaSeleccionadaId) || null
  }, [institucionesDisponibles, escuelaSeleccionadaId])

  async function handleCrearUsuario(e: React.FormEvent) {
    e.preventDefault()
    setErrorCrear(null)
    setGuardando(true)

    try {
      const payload: Record<string, unknown> = {
        full_name: nuevoNombre,
        email: nuevoEmail,
        password: nuevoPassword,
        role: nuevoRol,
        telefono: nuevoTelefono || null,
        activo: nuevoActivo,
      }

      if (nuevoRol === 'escuela') {
        payload.tipoEscuela = tipoEscuela
        if (tipoEscuela === 'existente') {
          if (!escuelaSeleccionadaId) {
            throw new Error('Por favor selecciona una institución del padrón para vincularla.')
          }
          payload.institucionId = escuelaSeleccionadaId
        } else {
          if (!nuevaEscuelaNombre.trim() || !nuevaEscuelaCCT.trim()) {
            throw new Error('El nombre de la institución y la Clave CCT son obligatorios.')
          }
          payload.nuevaEscuelaNombre = nuevaEscuelaNombre
          payload.nuevaEscuelaCCT = nuevaEscuelaCCT
          payload.nuevaEscuelaDomicilio = nuevaEscuelaDomicilio
          payload.nuevaEscuelaDirector = nuevaEscuelaDirector || nuevoNombre
          payload.nuevaEscuelaTurno = nuevaEscuelaTurno
          payload.nuevaEscuelaMatricula = nuevaEscuelaMatricula
          payload.nuevaEscuelaCiclo = nuevaEscuelaCiclo
          payload.nuevaEscuelaTelefono = nuevaEscuelaTelefono || nuevoTelefono
        }
      } else if (nuevoRol === 'tecnico') {
        payload.cuadrilla = nuevoCuadrilla || null
        payload.especialidad = nuevoEspecialidad || null
      }

      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'No se pudo crear el usuario.')
      }

      setUsuarios((prev) => [json.data, ...prev])
      setMostrarCrear(false)
      limpiarFormularioCrear()
      // Refrescar lista de instituciones si se creó o vinculó una
      cargarDatos()
    } catch (err: unknown) {
      setErrorCrear(err instanceof Error ? err.message : 'Error al crear usuario')
    } finally {
      setGuardando(false)
    }
  }

  function abrirEditar(u: UsuarioConInst) {
    setUsuarioEditando(u)
    setEditNombre(u.full_name || '')
    setEditRol(u.role)
    setEditTelefono(u.telefono || '')
    setEditActivo(u.activo !== false)
    setEditInstitucionId(u.institucion?.id || null)
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
      if (editRol === 'escuela') {
        payload.institucionId = editInstitucionId
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

      const instActualizada = institucionesDisponibles.find((i) => i.id === editInstitucionId) || null

      setUsuarios((prev) =>
        prev.map((item) =>
          item.id === usuarioEditando.id
            ? { ...json.data, institucion: editRol === 'escuela' ? instActualizada : null }
            : item
        )
      )
      setUsuarioEditando(null)
    } catch (err: unknown) {
      setErrorEdit(err instanceof Error ? err.message : 'Error al actualizar usuario')
    } finally {
      setGuardando(false)
    }
  }

  async function toggleActivoRapido(u: UsuarioConInst) {
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
      cargarDatos()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar usuario')
    } finally {
      setGuardando(false)
    }
  }

  // Filtrado reactivo de usuarios
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      if (filtroRol !== 'todos' && u.role !== filtroRol) return false
      if (filtroEstado === 'activos' && !u.activo) return false
      if (filtroEstado === 'inactivos' && u.activo) return false

      if (busqueda.trim()) {
        const q = busqueda.toLowerCase()
        const matchNombre = (u.full_name || '').toLowerCase().includes(q)
        const matchEmail = u.email.toLowerCase().includes(q)
        const matchTel = (u.telefono || '').toLowerCase().includes(q)
        const matchEscuela = (u.institucion?.nombre || '').toLowerCase().includes(q)
        const matchCCT = (u.institucion?.cct || '').toLowerCase().includes(q)
        return matchNombre || matchEmail || matchTel || matchEscuela || matchCCT
      }

      return true
    })
  }, [usuarios, filtroRol, filtroEstado, busqueda])

  // Conteos
  const conteos = useMemo(() => {
    const total = usuarios.length
    const admin = usuarios.filter((u) => u.role === 'admin').length
    const tecnico = usuarios.filter((u) => u.role === 'tecnico').length
    const escuela = usuarios.filter((u) => u.role === 'escuela').length
    const activos = usuarios.filter((u) => u.activo).length
    const inactivos = usuarios.filter((u) => !u.activo).length
    return { total, admin, tecnico, escuela, activos, inactivos }
  }, [usuarios])

  function getRolConfig(r: Rol) {
    switch (r) {
      case 'admin':
        return {
          label: 'Administrador',
          bg: 'bg-blue-50 dark:bg-blue-950/40',
          text: 'text-blue-700 dark:text-blue-300',
          border: 'border-blue-200 dark:border-blue-800',
          icon: faShieldHalved,
          avatarBg: 'bg-[#0066cc]',
        }
      case 'tecnico':
        return {
          label: 'Técnico NOC',
          bg: 'bg-sky-50 dark:bg-sky-950/40',
          text: 'text-sky-700 dark:text-sky-300',
          border: 'border-sky-200 dark:border-sky-800',
          icon: faWrench,
          avatarBg: 'bg-sky-600',
        }
      case 'escuela':
      default:
        return {
          label: 'Escuela',
          bg: 'bg-emerald-50 dark:bg-emerald-950/40',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-200 dark:border-emerald-800',
          icon: faSchool,
          avatarBg: 'bg-emerald-600',
        }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] dark:bg-slate-900">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#0066cc] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cargando directorio de usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex font-sans text-slate-800 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 antialiased selection:bg-sky-100 selection:text-sky-900">
      <AdminSidebar
        profile={profile}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          profile={profile}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          searchValue={busqueda}
          onSearchChange={setBusqueda}
          searchPlaceholder="Buscar por nombre, correo, teléfono o CCT..."
        />

        <main className="p-4 md:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
          {/* HEADER DEL PANEL */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Gestión de Cuentas y Usuarios
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-[#0066cc] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {usuarios.length} cuentas
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Administración de perfiles y credenciales para personal administrativo, cuadrillas de soporte y enlaces educativos.
              </p>
            </div>

            <button
              onClick={() => {
                limpiarFormularioCrear()
                setMostrarCrear(true)
              }}
              className="self-start md:self-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0066cc] hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
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
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                  NOC Central
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#0066cc] dark:text-blue-400 tracking-tight leading-none mb-1">
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
                    ? 'bg-[#0066cc] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                Todos ({conteos.total})
              </button>
              <button
                onClick={() => setFiltroRol('admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filtroRol === 'admin'
                    ? 'bg-blue-600 text-white shadow-xs'
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
                    <th className="py-3 px-4">Asignación / Entidad</th>
                    <th className="py-3 px-4 hidden sm:table-cell">Contacto</th>
                    <th className="py-3 px-4">Estado</th>
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

                          {/* ASIGNACIÓN / ENTIDAD ESCOLAR */}
                          <td className="py-3 px-4">
                            {u.role === 'escuela' ? (
                              u.institucion ? (
                                <div className="flex flex-col max-w-xs">
                                  <span className="font-semibold text-slate-900 dark:text-white truncate text-xs">
                                    {u.institucion.nombre}
                                  </span>
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                    <span className="font-mono font-medium text-[#0066cc] dark:text-blue-400">
                                      {u.institucion.cct || 'Sin CCT'}
                                    </span>
                                    <span>•</span>
                                    <span className="truncate">{u.institucion.domicilio || 'EDOMEX'}</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  <FontAwesomeIcon icon={faInfoCircle} className="text-[9px]" />
                                  Sin escuela asignada
                                </span>
                              )
                            ) : u.role === 'tecnico' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-[11px] font-medium border border-sky-100 dark:border-sky-800">
                                <FontAwesomeIcon icon={faWrench} className="text-[9px]" />
                                Cuadrilla Operativa NOC
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                                Administración General
                              </span>
                            )}
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
                              title="Haga clic para alternar estado"
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                                u.activo
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                              }`}
                            >
                              <FontAwesomeIcon
                                icon={u.activo ? faCheckCircle : faXmarkCircle}
                                className="text-[10px]"
                              />
                              {u.activo ? 'Activo' : 'Inactivo'}
                            </button>
                          </td>

                          {/* ACCIONES */}
                          <td className="py-3 px-4 md:px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => abrirEditar(u)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                title="Editar cuenta y vinculación"
                              >
                                <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" />
                              </button>

                              {profile?.id !== u.id && (
                                <button
                                  onClick={() => setUsuarioEliminando(u)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                                  title="Eliminar usuario"
                                >
                                  <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
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
      {/* MODAL CREAR USUARIO INTELIGENTE POR ROL */}
      {/* ============================================================ */}
      {mostrarCrear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#0066cc] dark:text-blue-400 flex items-center justify-center">
                  <FontAwesomeIcon icon={faPlus} className="text-xs" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Crear Nuevo Usuario
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Formulario adaptable según el perfil requerido (Escuela, Técnico o Administrador).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMostrarCrear(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Contenido Modal Scrollable */}
            <form onSubmit={handleCrearUsuario} className="p-5 overflow-y-auto flex flex-col gap-4 text-xs">
              {errorCrear && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-medium">
                  {errorCrear}
                </div>
              )}

              {/* SELECCIÓN PRINCIPAL DE ROL */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Selecciona el tipo de usuario a registrar *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNuevoRol('escuela')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      nuevoRol === 'escuela'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-xs">
                        <FontAwesomeIcon icon={faSchool} className="text-emerald-600 text-xs" />
                        Escuela
                      </span>
                      {nuevoRol === 'escuela' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Requiere padrón escolar, CCT y datos del plantel educativo.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNuevoRol('tecnico')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      nuevoRol === 'tecnico'
                        ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-xs">
                        <FontAwesomeIcon icon={faWrench} className="text-sky-600 text-xs" />
                        Técnico NOC
                      </span>
                      {nuevoRol === 'tecnico' && (
                        <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Datos ligeros: Cuadrilla, celular WhatsApp y soporte en campo.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNuevoRol('admin')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      nuevoRol === 'admin'
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-xs">
                        <FontAwesomeIcon icon={faShieldHalved} className="text-[#0066cc] text-xs" />
                        Administrador
                      </span>
                      {nuevoRol === 'admin' && (
                        <span className="w-2 h-2 rounded-full bg-[#0066cc]"></span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Gestión completa, aprobación de solicitudes y tickets.
                    </span>
                  </button>
                </div>
              </div>

              {/* ============================================================ */}
              {/* SECCIÓN 1: DATOS ESPECÍFICOS DE ESCUELA (SI ROL === ESCUELA) */}
              {/* ============================================================ */}
              {nuevoRol === 'escuela' && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 flex flex-col gap-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700">
                    <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 text-xs">
                      <FontAwesomeIcon icon={faSchool} className="text-emerald-600" />
                      Vinculación de la Institución Educativa
                    </span>
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setTipoEscuela('existente')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                          tipoEscuela === 'existente'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Padrón existente ({institucionesDisponibles.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipoEscuela('nueva')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                          tipoEscuela === 'nueva'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        + Registrar nueva
                      </button>
                    </div>
                  </div>

                  {/* MODO A: VINCULAR A EXISTENTE */}
                  {tipoEscuela === 'existente' ? (
                    <div className="flex flex-col gap-2.5">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Buscar y seleccionar escuela del padrón *
                        </label>
                        <div className="relative mb-2">
                          <input
                            type="text"
                            value={busquedaEscuelaModal}
                            onChange={(e) => setBusquedaEscuelaModal(e.target.value)}
                            placeholder="Filtrar por nombre, CCT o localidad..."
                            className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-emerald-500"
                          />
                          <FontAwesomeIcon
                            icon={faSearch}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
                          />
                        </div>

                        <select
                          size={4}
                          value={escuelaSeleccionadaId || ''}
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value) : null
                            setEscuelaSeleccionadaId(val)
                            const inst = institucionesDisponibles.find((i) => i.id === val)
                            if (inst) {
                              if (inst.director && !nuevoNombre) setNuevoNombre(inst.director)
                              if (inst.telefono && !nuevoTelefono) setNuevoTelefono(inst.telefono)
                            }
                          }}
                          className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 font-mono"
                        >
                          <option value="" disabled className="text-slate-400 p-1">
                            -- Selecciona una institución ({institucionesFiltradasModal.length} encontradas) --
                          </option>
                          {institucionesFiltradasModal.map((inst) => (
                            <option
                              key={inst.id}
                              value={inst.id}
                              className="p-1.5 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded"
                            >
                              [{inst.cct || 'S/CCT'}] {inst.nombre} — {inst.domicilio || 'EDOMEX'}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Tarjeta de preview de la escuela seleccionada */}
                      {escuelaSeleccionadaDetalle && (
                        <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-900 dark:text-emerald-200">
                              {escuelaSeleccionadaDetalle.nombre}
                            </span>
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                              CCT: {escuelaSeleccionadaDetalle.cct || 'S/CCT'}
                            </span>
                          </div>
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            <FontAwesomeIcon icon={faLocationDot} className="text-[10px]" />
                            {escuelaSeleccionadaDetalle.domicilio || 'Ubicación registrada'}
                          </div>
                          {escuelaSeleccionadaDetalle.director && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-400">
                              Director(a): {escuelaSeleccionadaDetalle.director}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* MODO B: REGISTRAR NUEVA ESCUELA */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Nombre oficial del plantel *
                        </label>
                        <input
                          type="text"
                          required={tipoEscuela === 'nueva'}
                          value={nuevaEscuelaNombre}
                          onChange={(e) => setNuevaEscuelaNombre(e.target.value)}
                          placeholder="Ej: Escuela Secundaria Técnica 172"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Clave CCT *
                        </label>
                        <input
                          type="text"
                          required={tipoEscuela === 'nueva'}
                          value={nuevaEscuelaCCT}
                          onChange={(e) => setNuevaEscuelaCCT(e.target.value.toUpperCase())}
                          placeholder="Ej: 15DST0182J"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Municipio / Domicilio *
                        </label>
                        <input
                          type="text"
                          required={tipoEscuela === 'nueva'}
                          value={nuevaEscuelaDomicilio}
                          onChange={(e) => setNuevaEscuelaDomicilio(e.target.value)}
                          placeholder="Ej: San Francisco de la Loma, San Felipe"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Director(a) / Responsable
                        </label>
                        <input
                          type="text"
                          value={nuevaEscuelaDirector}
                          onChange={(e) => setNuevaEscuelaDirector(e.target.value)}
                          placeholder="Ej: Prof. Roberto Flores Gómez"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Turno
                        </label>
                        <select
                          value={nuevaEscuelaTurno}
                          onChange={(e) => setNuevaEscuelaTurno(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="Matutino">Matutino</option>
                          <option value="Vespertino">Vespertino</option>
                          <option value="Continuo">Continuo</option>
                          <option value="Tiempo Completo">Tiempo Completo</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Matrícula (alumnos)
                        </label>
                        <input
                          type="number"
                          value={nuevaEscuelaMatricula}
                          onChange={(e) => setNuevaEscuelaMatricula(e.target.value)}
                          placeholder="Ej: 350"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Ciclo Escolar
                        </label>
                        <input
                          type="text"
                          value={nuevaEscuelaCiclo}
                          onChange={(e) => setNuevaEscuelaCiclo(e.target.value)}
                          placeholder="2025-2026"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* SECCIÓN 2: DATOS ESPECÍFICOS DE TÉCNICO (SI ROL === TECNICO) */}
              {/* ============================================================ */}
              {nuevoRol === 'tecnico' && (
                <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800 flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 font-bold text-sky-900 dark:text-sky-200 text-xs pb-1 border-b border-sky-200/50 dark:border-sky-800">
                    <FontAwesomeIcon icon={faWrench} className="text-sky-600" />
                    Asignación Operativa del Técnico
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Cuadrilla o Zona asignada *
                      </label>
                      <input
                        type="text"
                        value={nuevoCuadrilla}
                        onChange={(e) => setNuevoCuadrilla(e.target.value)}
                        placeholder="Ej: Cuadrilla 1 · Zona Mazahua"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Especialidad técnica
                      </label>
                      <input
                        type="text"
                        value={nuevoEspecialidad}
                        onChange={(e) => setNuevoEspecialidad(e.target.value)}
                        placeholder="Ej: Empalmes Fibra Óptica, NOC, FTTX"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SECCIÓN 3: CREDENCIALES DE ACCESO GENERALES                */}
              {/* ============================================================ */}
              <div className="flex flex-col gap-3 pt-1">
                <span className="font-bold text-slate-800 dark:text-white text-xs border-b border-slate-100 dark:border-slate-700 pb-1.5">
                  Credenciales de Acceso al Sistema
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {nuevoRol === 'escuela'
                        ? 'Nombre del Director / Enlace escolar *'
                        : nuevoRol === 'tecnico'
                        ? 'Nombre completo del técnico *'
                        : 'Nombre completo del administrador *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(e.target.value)}
                      placeholder={
                        nuevoRol === 'escuela'
                          ? 'Ej: Director Roberto Flores Gómez'
                          : nuevoRol === 'tecnico'
                          ? 'Ej: Ing. Jorge Ramírez Castro'
                          : 'Ej: Lic. Carlos Mendoza'
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Correo electrónico (login) *
                    </label>
                    <input
                      type="email"
                      required
                      value={nuevoEmail}
                      onChange={(e) => setNuevoEmail(e.target.value)}
                      placeholder={
                        nuevoRol === 'escuela'
                          ? 'escuela.15dst0182j@edomex.gob.mx'
                          : nuevoRol === 'tecnico'
                          ? 'tecnico.campo@gpon.mx'
                          : 'admin@gpon.mx'
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {nuevoRol === 'tecnico' ? 'Teléfono / WhatsApp de campo *' : 'Teléfono de contacto'}
                    </label>
                    <input
                      type="text"
                      required={nuevoRol === 'tecnico'}
                      value={nuevoTelefono}
                      onChange={(e) => setNuevoTelefono(e.target.value)}
                      placeholder="712-123-4567"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Contraseña inicial *
                    </label>
                    <button
                      type="button"
                      onClick={() => setNuevoPassword(generarPasswordSegura())}
                      className="text-[11px] text-[#0066cc] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <FontAwesomeIcon icon={faRotate} className="text-[10px]" />
                      Generar contraseña segura
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
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nuevoActivo}
                    onChange={(e) => setNuevoActivo(e.target.checked)}
                    className="rounded text-[#0066cc] focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Habilitar usuario de inmediato (permite iniciar sesión)
                  </span>
                </label>
              </div>

              {/* Botones footer */}
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
                  className="px-5 py-2.5 rounded-xl bg-[#0066cc] hover:bg-blue-700 text-white font-semibold shadow-sm disabled:opacity-60 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL EDITAR USUARIO                                         */}
      {/* ============================================================ */}
      {usuarioEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#0066cc] dark:text-blue-400 flex items-center justify-center">
                  <FontAwesomeIcon icon={faEdit} className="text-xs" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Editar Usuario: {usuarioEditando.full_name || usuarioEditando.email}
                </h3>
              </div>
              <button
                onClick={() => setUsuarioEditando(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleEditarUsuario} className="p-5 flex flex-col gap-4 text-xs overflow-y-auto">
              {errorEdit && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
                  {errorEdit}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Correo electrónico (cuenta no editable)
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
                  Nombre completo / Responsable *
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

              {/* Si es escuela, permitir asociar o cambiar institución */}
              {editRol === 'escuela' && (
                <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <label className="block font-semibold text-emerald-900 dark:text-emerald-200 mb-1">
                    Institución educativa vinculada
                  </label>
                  <select
                    value={editInstitucionId || ''}
                    onChange={(e) =>
                      setEditInstitucionId(e.target.value ? parseInt(e.target.value) : null)
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 font-mono"
                  >
                    <option value="">-- Sin escuela asignada --</option>
                    {institucionesDisponibles.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        [{inst.cct || 'S/CCT'}] {inst.nombre} ({inst.domicilio || 'EDOMEX'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Restablecer contraseña (opcional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditPassword(generarPasswordSegura())}
                    className="text-[11px] text-[#0066cc] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
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

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editActivo}
                    onChange={(e) => setEditActivo(e.target.checked)}
                    className="rounded text-[#0066cc] focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Usuario activo (cuenta habilitada para ingresar)
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
                  className="px-5 py-2.5 rounded-xl bg-[#0066cc] hover:bg-blue-700 text-white font-semibold shadow-sm disabled:opacity-60 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL CONFIRMAR ELIMINACIÓN                                  */}
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
                ({usuarioEliminando.email}). Si estaba vinculada a una escuela, la escuela quedará desvinculada para poder asignarse nuevamente.
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
