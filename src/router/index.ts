import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/DefaultLayout.vue'),
      children: [
        { path: '', name: 'home', component: () => import('@/views/HomeView.vue') },
        { path: 'products/:slug', name: 'product-detail', component: () => import('@/views/ProductDetailView.vue'), props: true },
        { path: 'stores', name: 'stores', component: () => import('@/views/StoresView.vue') },
        { path: 'stores/:slug', name: 'store-detail', component: () => import('@/views/StoreDetailView.vue'), props: true },
        { path: 'cart', name: 'cart', component: () => import('@/views/CartView.vue') },
        {
          path: 'orders',
          name: 'orders',
          component: () => import('@/views/OrdersView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'addresses',
          name: 'addresses',
          component: () => import('@/views/AddressesView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/ProfileView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'my-store',
          name: 'my-store',
          component: () => import('@/views/seller/MyStoreView.vue'),
          meta: { requiresAuth: true, role: 'seller' },
        },
        {
          path: 'my-products',
          name: 'my-products',
          component: () => import('@/views/seller/MyProductsView.vue'),
          meta: { requiresAuth: true, role: 'seller' },
        },
        {
          path: 'my-products/new',
          name: 'new-product',
          component: () => import('@/views/seller/ProductFormView.vue'),
          meta: { requiresAuth: true, role: 'seller' },
        },
        {
          path: 'my-products/:id/edit',
          name: 'edit-product',
          component: () => import('@/views/seller/ProductFormView.vue'),
          meta: { requiresAuth: true, role: 'seller' },
          props: true,
        },
      ],
    },
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { guest: true } },
    { path: '/register', name: 'register', component: () => import('@/views/RegisterView.vue'), meta: { guest: true } },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (auth.isAuthenticated && !auth.user) {
    await auth.fetchUser()
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guest && auth.isAuthenticated) {
    return { name: 'home' }
  }

  if (to.meta.role && auth.userRole !== to.meta.role && auth.userRole !== 'admin') {
    return { name: 'home' }
  }
})

export default router
