import { describe, expect, it } from 'vitest'
import { House } from 'lucide-vue-next'
import { navigationFor, type NavSection } from '@/config/navigation'

const sections: NavSection[] = [
  { items: [{ label: 'Inicio', to: '/', icon: House }] },
  {
    title: 'Catálogo',
    items: [{ label: 'Productos', to: '/products', icon: House, roles: ['admin'] }],
  },
  {
    title: 'Recetas',
    items: [
      { label: 'Mis recetas', to: '/prescriptions', icon: House, roles: ['doctor', 'admin'] },
    ],
  },
]

describe('navigationFor', () => {
  it('muestra solo las opciones del rol y quita las secciones vacías', () => {
    const menu = navigationFor('doctor', sections)

    expect(menu.map((section) => section.title)).toEqual([undefined, 'Recetas'])
    expect(menu.flatMap((section) => section.items.map((item) => item.label))).toEqual([
      'Inicio',
      'Mis recetas',
    ])
  })

  it('las opciones sin roles las ven todos', () => {
    expect(navigationFor('courier', sections)).toHaveLength(1)
  })
})
