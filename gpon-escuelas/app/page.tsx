'use client'

import dynamic from 'next/dynamic'

// Cargar el mapa sin SSR
const MapaEscuelas = dynamic(
  () => import('@/components/MapaEscuelas'),
  { ssr: false }
)

export default function Home() {
  return (
    <main className='min-h-screen bg-gray-100 py-8'>
      <MapaEscuelas />
    </main>
  )
}