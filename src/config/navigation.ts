import type { Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { House } from 'lucide-vue-next'
import type { Role } from '@/types/user'

/** Opción del menú lateral. Sin `roles`, la ven todos los usuarios. */
export interface NavItem {
  label: string
  to: RouteLocationRaw
  icon: Component
  roles?: Role[]
}

/** Grupo del menú con un título opcional (p. ej. "Catálogo"). */
export interface NavSection {
  title?: string
  items: NavItem[]
}

/**
 * Menú lateral. Cada módulo agrega aquí sus opciones con los roles que lo usan,
 * los mismos que valida la API.
 */
export const navigation: NavSection[] = [
  {
    items: [{ label: 'Inicio', to: { name: 'home' }, icon: House }],
  },
]

/** Menú visible para un rol: quita las opciones ajenas y las secciones que quedan vacías. */
export function navigationFor(role: Role, sections: NavSection[] = navigation): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0)
}
