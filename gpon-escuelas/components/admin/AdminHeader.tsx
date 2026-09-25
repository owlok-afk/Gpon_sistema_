'use client'

import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSearch,
  faSun,
  faMoon,
  faBars,
} from '@fortawesome/free-solid-svg-icons'
import { useDarkMode } from '@/lib/useDarkMode'
import type { AdminProfileUser } from './AdminSidebar'

type AdminHeaderProps = {
  profile?: AdminProfileUser | null
  searchValue?: string
  onSearchChange?: (val: string) => void
  searchPlaceholder?: string
  actionButton?: React.ReactNode
  onToggleMobileMenu?: () => void
  children?: React.ReactNode
}

export default function AdminHeader({
  profile,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  actionButton,
  onToggleMobileMenu,
  children,
}: AdminHeaderProps) {
  const { isDark, toggle } = useDarkMode()

  const iniciales = (profile?.full_name || profile?.email || 'AD')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="h-16 px-4 md:px-8 sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3">
      {/* IZQUIERDA: Botón móvil + Buscador / Breadcrumbs */}
      <div className="flex items-center gap-3 w-full max-w-md">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
            title="Abrir menú"
            type="button"
          >
            <FontAwesomeIcon icon={faBars} className="w-4 h-4" />
          </button>
        )}

        {children ? (
          children
        ) : onSearchChange !== undefined ? (
          <div className="relative w-full">
            <input
              type="search"
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-3.5 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-slate-400 transition-all"
            />
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none"
            />
          </div>
        ) : null}
      </div>

      {/* DERECHA: Botón de acción + Modo oscuro + Perfil */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        {actionButton && (
          <div className="flex items-center gap-2">
            {actionButton}
          </div>
        )}

        {/* TEMA OSCURO/CLARO */}
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
          type="button"
        >
          <FontAwesomeIcon
            icon={isDark ? faSun : faMoon}
            className="text-sm"
          />
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

        {/* CHIP DE USUARIO */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-semibold text-xs text-slate-700 dark:text-slate-200 flex-shrink-0">
            {iniciales}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight truncate max-w-[130px]">
              {profile?.full_name || 'Administrador'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {profile?.role === 'admin' ? 'NOC Central' : profile?.role || 'Admin'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
