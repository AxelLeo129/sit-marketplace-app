import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/types/user'

declare module 'vue-router' {
  interface RouteMeta {
    /** Solo para usuarios sin sesión (login, recuperar contraseña). */
    guest?: boolean
    /** Roles que pueden entrar. Sin `roles`, cualquier usuario con sesión. */
    roles?: Role[]
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        { path: '', name: 'home', component: () => import('@/views/HomeView.vue') },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/profile/ProfileView.vue'),
        },

        // Catálogo (administrador).
        {
          path: 'products',
          name: 'products',
          component: () => import('@/views/catalog/ProductsView.vue'),
          meta: { roles: ['admin'] },
        },
        {
          path: 'categories',
          name: 'categories',
          component: () => import('@/views/catalog/NamedCatalogView.vue'),
          props: {
            endpoint: '/categories',
            title: 'Categorías',
            singular: 'categoría',
            newTitle: 'Nueva categoría',
          },
          meta: { roles: ['admin'] },
        },
        {
          path: 'labs',
          name: 'labs',
          component: () => import('@/views/catalog/NamedCatalogView.vue'),
          props: {
            endpoint: '/labs',
            title: 'Laboratorios',
            singular: 'laboratorio',
            newTitle: 'Nuevo laboratorio',
          },
          meta: { roles: ['admin'] },
        },
        {
          path: 'presentations',
          name: 'presentations',
          component: () => import('@/views/catalog/PresentationsView.vue'),
          meta: { roles: ['admin'] },
        },

        // Recetas: el médico las emite; el call-center las atiende.
        {
          path: 'prescriptions',
          name: 'prescriptions',
          component: () => import('@/views/prescriptions/PrescriptionsView.vue'),
          meta: { roles: ['admin', 'doctor', 'call_center'] },
        },
        {
          // Fuera de /prescriptions para que en el menú no se marquen "Recetas" y "Nueva receta" a la vez.
          path: 'new-prescription',
          name: 'prescription-create',
          component: () => import('@/views/prescriptions/PrescriptionFormView.vue'),
          meta: { roles: ['doctor'] },
        },
        {
          path: 'prescriptions/:id(\\d+)',
          name: 'prescription',
          component: () => import('@/views/prescriptions/PrescriptionDetailView.vue'),
          props: true,
          meta: { roles: ['admin', 'doctor', 'call_center'] },
        },
        {
          path: 'prescriptions/:id(\\d+)/edit',
          name: 'prescription-edit',
          component: () => import('@/views/prescriptions/PrescriptionFormView.vue'),
          props: true,
          meta: { roles: ['doctor'] },
        },

        // Pedidos: el call-center los crea desde una receta; cada rol ve los que le tocan.
        {
          path: 'prescriptions/:id(\\d+)/order',
          name: 'order-create',
          component: () => import('@/views/orders/OrderCreateView.vue'),
          props: true,
          meta: { roles: ['admin', 'call_center'] },
        },
        {
          path: 'orders',
          name: 'orders',
          component: () => import('@/views/orders/OrdersView.vue'),
          meta: { roles: ['admin', 'call_center', 'billing', 'dispatcher', 'courier'] },
        },
        {
          path: 'orders/:id(\\d+)',
          name: 'order',
          component: () => import('@/views/orders/OrderDetailView.vue'),
          props: true,
          meta: { roles: ['admin', 'call_center', 'billing', 'dispatcher', 'courier'] },
        },

        // Usuarios: el administrador ve a todos; el visitador, a sus médicos.
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/users/UsersView.vue'),
          meta: { roles: ['admin', 'sales_rep'] },
        },
      ],
    },
    {
      path: '/',
      component: () => import('@/layouts/AuthLayout.vue'),
      meta: { guest: true },
      children: [
        { path: 'login', name: 'login', component: () => import('@/views/auth/LoginView.vue') },
        {
          path: 'forgot-password',
          name: 'forgot-password',
          component: () => import('@/views/auth/ForgotPasswordView.vue'),
        },
        // Enlace que envía la API por correo: /reset-password?token=...&email=...
        {
          path: 'reset-password',
          name: 'reset-password',
          component: () => import('@/views/auth/ResetPasswordView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

/**
 * Protege las rutas: pide sesión, manda al inicio a quien ya la tiene si abre
 * el login y revisa el rol. La API vuelve a validar todo; esto solo ordena la navegación.
 */
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Con token guardado pero sin datos (app recién abierta): se cargan del servidor.
  if (auth.isAuthenticated && !auth.user) {
    try {
      await auth.fetchUser()
    } catch {
      auth.clear()
    }
  }

  if (to.name === 'not-found') {
    return true
  }

  if (to.meta.guest) {
    return auth.isAuthenticated ? { name: 'home' } : true
  }

  if (!auth.isAuthenticated) {
    return { name: 'login', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } }
  }

  if (to.meta.roles && !auth.hasRole(...to.meta.roles)) {
    return { name: 'home' }
  }

  return true
})

export default router
