// types/index.ts
// Tipos compartidos del proyecto GPON Telecom

// ============================================
// Roles y estados
// ============================================

export type Rol = 'admin' | 'tecnico' | 'escuela'

export type EstadoVinculacion =
  | 'no_vinculada'
  | 'en_proceso'
  | 'vinculada'
  | 'rechazada'

export type TipoTicket = 'incidencia' | 'mantenimiento'

export type EstadoTicket =
  | 'abierto'
  | 'en_revision'
  | 'programado'
  | 'en_camino'
  | 'en_proceso'
  | 'resuelto'
  | 'cancelado'

export type Prioridad = 'baja' | 'media' | 'alta' | 'critica'

export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada'

// ============================================
// Entidades
// ============================================

export type Profile = {
  id: string
  email: string
  full_name: string | null
  role: Rol
  telefono: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export type Institucion = {
  id: number
  nombre: string
  domicilio: string | null
  matricula: number | null
  cct: string | null
  director: string | null
  telefono: string | null
  correo: string | null
  año_ejecucion: number | null
  presidente_asociacion: string | null
  telefono_asociacion: string | null
  ciclo_escolar: string | null
  zona_escolar: string | null
  turno: string | null
  latitude: number | null
  longitude: number | null
  profile_id: string | null
  estado_vinculacion: EstadoVinculacion
  fecha_solicitud: string | null
  fecha_vinculacion: string | null
  notas: string | null
  created_at: string
  updated_at: string
}

export type Solicitud = {
  id: number
  nombre_institucion: string
  cct: string
  domicilio: string | null
  matricula: number | null
  director: string | null
  telefono: string | null
  correo: string
  año_ejecucion: number | null
  presidente_asociacion: string | null
  telefono_asociacion: string | null
  ciclo_escolar: string | null
  zona_escolar: string | null
  turno: string | null
  estado: EstadoSolicitud
  notas_admin: string | null
  institucion_id: number | null
  profile_id_creado: string | null
  aprobada_por: string | null
  aprobada_en: string | null
  rechazada_en: string | null
  created_at: string
}

export type Ticket = {
  id: number
  folio: string
  tipo: TipoTicket
  institucion_id: number | null
  creado_por: string | null
  ticket_origen_id: number | null
  titulo: string
  descripcion: string | null
  categoria: string | null
  prioridad: Prioridad
  cuadrilla: string | null
  estado: EstadoTicket
  programado_para: string | null
  resuelto_en: string | null
  created_at: string
  updated_at: string
}

export type Comentario = {
  id: number
  ticket_id: number
  autor_id: string | null
  autor_rol: string | null
  contenido: string
  es_interno: boolean
  created_at: string
}

// ============================================
// API responses
// ============================================

export type ApiResponse<T = unknown> = {
  ok: boolean
  data?: T
  error?: string
}

export type ResultadoGeo = {
  lat: number
  lng: number
  displayName: string
  tipo: string
  importancia: number
}