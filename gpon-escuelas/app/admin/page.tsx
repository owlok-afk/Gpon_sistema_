'use client'

import dynamic from 'next/dynamic'

const AdminEscuelas = dynamic(
  () => import('@/components/AdminEscuelas'),
  { ssr: false }
)

export default function AdminPage() {
  return <AdminEscuelas />
}