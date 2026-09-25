'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBuilding,
  faMap,
  faFileLines,
  faTicketAlt,
  faUsers,
  faXmark,
  faArrowRightFromBracket,
} from '@fortawesome/free-solid-svg-icons'
export type AdminProfileUser = {
  id?: string
  email?: string
  full_name?: string | null
  role?: string | null
  [key: string]: any
}

type AdminSidebarProps = {
  solicitudesPendientes?: number
  ticketsAbiertos?: number
  profile?: AdminProfileUser | null
  isOpenMobile?: boolean
  onCloseMobile?: () => void
}

export default function AdminSidebar({
  solicitudesPendientes: propSolicitudes,
  ticketsAbiertos: propTickets,
  profile: propProfile,
  isOpenMobile = false,
  onCloseMobile,
}: AdminSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [localProfile, setLocalProfile] = useState<AdminProfileUser | null>(propProfile || null)
  const [solicitudesCount, setSolicitudesCount] = useState<number>(propSolicitudes ?? 0)
  const [ticketsCount, setTicketsCount] = useState<number>(propTickets ?? 0)

  // Sincronizar props cuando cambien
  useEffect(() => {
    if (propProfile) setLocalProfile(propProfile)
  }, [propProfile])

  useEffect(() => {
    if (propSolicitudes !== undefined) setSolicitudesCount(propSolicitudes)
  }, [propSolicitudes])

  useEffect(() => {
    if (propTickets !== undefined) setTicketsCount(propTickets)
  }, [propTickets])

  // Cargar datos si no vienen por props
  useEffect(() => {
    let cancel = false

    async function cargarDatosSidebar() {
      try {
        if (!propProfile) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()
            if (!cancel && data) setLocalProfile(data as AdminProfileUser)
          }
        }

        if (propSolicitudes === undefined) {
          const { count } = await supabase
            .from('solicitudes')
            .select('*', { count: 'exact', head: true })
            .eq('estado', 'pendiente')
          if (!cancel && count !== null) setSolicitudesCount(count)
        }

        if (propTickets === undefined) {
          const { count } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('estado', 'abierto')
          if (!cancel && count !== null) setTicketsCount(count)
        }
      } catch (err) {
        console.error('Error cargando datos del sidebar:', err)
      }
    }

    cargarDatosSidebar()
    return () => {
      cancel = true
    }
  }, [propProfile, propSolicitudes, propTickets])

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const iniciales = (localProfile?.full_name || localProfile?.email || 'AD')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const navItems = [
    {
      seccion: 'General',
      items: [
        {
          nombre: 'Panel principal',
          href: '/admin',
          exact: true,
          icon: (
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          ),
          badge: null,
        },
      ],
    },
    {
      seccion: 'Administración',
      items: [
        {
          nombre: 'Instituciones',
          href: '/admin/instituciones',
          exact: false,
          icon: <FontAwesomeIcon icon={faBuilding} className="w-4 h-4 flex-shrink-0" />,
          badge: null,
        },
        {
          nombre: 'Mapa',
          href: '/admin/mapa',
          exact: false,
          icon: <FontAwesomeIcon icon={faMap} className="w-4 h-4 flex-shrink-0" />,
          badge: null,
        },
        {
          nombre: 'Solicitudes',
          href: '/admin/solicitudes',
          exact: false,
          icon: <FontAwesomeIcon icon={faFileLines} className="w-4 h-4 flex-shrink-0" />,
          badge: solicitudesCount > 0 ? solicitudesCount : null,
        },
      ],
    },
    {
      seccion: 'Soporte',
      items: [
        {
          nombre: 'Tickets',
          href: '/admin/tickets',
          exact: false,
          icon: <FontAwesomeIcon icon={faTicketAlt} className="w-4 h-4 flex-shrink-0" />,
          badge: ticketsCount > 0 ? ticketsCount : null,
        },
      ],
    },
    {
      seccion: 'Sistema',
      items: [
        {
          nombre: 'Usuarios',
          href: '/admin/usuarios',
          exact: false,
          icon: <FontAwesomeIcon icon={faUsers} className="w-4 h-4 flex-shrink-0" />,
          badge: null,
        },
      ],
    },
  ]

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full bg-white dark:bg-slate-900 select-none text-slate-600 dark:text-slate-400">
      <div className="flex flex-col overflow-y-auto">
        {/* LOGO */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100 dark:border-slate-800">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-1 flex items-center justify-center shadow-sm flex-shrink-0">
              <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xs">
                G
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                GPON Telecom
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                S.A. DE C.V.
              </span>
            </div>
          </Link>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* NAVEGACIÓN */}
        <nav className="flex flex-col gap-5 px-3.5 py-4 text-xs">
          {navItems.map((seccion) => (
            <div key={seccion.seccion} className="flex flex-col gap-1">
              <span className="px-2.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                {seccion.seccion}
              </span>
              {seccion.items.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/')

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onCloseMobile?.()}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                      isActive
                        ? 'bg-sky-50 dark:bg-sky-950/40 text-blue-600 dark:text-blue-400 font-semibold border border-sky-100 dark:border-sky-900 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}>
                        {item.icon}
                      </span>
                      <span>{item.nombre}</span>
                    </span>
                    {item.badge !== null && item.badge > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* FOOTER PROFILE */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
            {iniciales}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate leading-tight">
              {localProfile?.full_name || 'Administrador'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal capitalize">
              {localProfile?.role || 'admin'}
            </span>
          </div>
        </div>
        <button
          onClick={cerrarSesion}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
        >
          <FontAwesomeIcon icon={faArrowRightFromBracket} className="w-3.5 h-3.5 text-slate-400" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* SIDEBAR ESCRITORIO */}
      <aside className="hidden lg:flex flex-col justify-between h-screen w-64 fixed left-0 top-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">
        {sidebarContent}
      </aside>

      {/* DRAWER MÓVIL */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-slate-900 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
