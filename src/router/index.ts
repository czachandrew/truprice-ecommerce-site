import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomePage.vue'),
    meta: { title: 'TruePrice - Transparent Shopping' }
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('@/views/ProductCatalog.vue'),
    meta: { title: 'Products - TruePrice' }
  },
  {
    path: '/products/:id',
    name: 'ProductDetail',
    component: () => import('@/views/ProductDetail.vue'),
    meta: { title: 'Product Details - TruePrice' }
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('@/views/ShoppingCart.vue'),
    meta: { title: 'Shopping Cart - TruePrice' }
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: () => import('@/views/Checkout.vue'),
    meta: { 
      title: 'Checkout - TruePrice',
      requiresAuth: true 
    }
  },
  {
    path: '/account',
    name: 'Account',
    component: () => import('@/views/UserDashboard.vue'),
    meta: { 
      title: 'My Account - TruePrice',
      requiresAuth: true 
    }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/views/OrderHistory.vue'),
    meta: { 
      title: 'Order History - TruePrice',
      requiresAuth: true 
    }
  },
  {
    path: '/wallet',
    name: 'Wallet',
    component: () => import('@/views/Wallet.vue'),
    meta: { 
      title: 'My Wallet - TruePrice',
      requiresAuth: true 
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: 'Login - TruePrice' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: 'Register - TruePrice' }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About.vue'),
    meta: { title: 'About Us - TruePrice' }
  },
  {
    path: '/transparency',
    name: 'Transparency',
    component: () => import('@/views/Transparency.vue'),
    meta: { title: 'How We Work - TruePrice' }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/SearchResults.vue'),
    meta: { title: 'Search Results - TruePrice' }
  },
  {
    path: '/quote-analysis',
    name: 'QuoteAnalysis',
    component: () => import('@/views/QuoteAnalysis.vue'),
    meta: { 
      title: 'Quote Analysis - TruePrice',
      requiresAuth: true 
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: 'Page Not Found - TruePrice' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  // Update page title
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  // Check authentication for protected routes
  if (to.meta.requiresAuth) {
    const userStore = useUserStore()
    
    // Check if user is authenticated
    if (!userStore.isAuthenticated) {
      // Try to restore session from token
      await userStore.checkAuth()
      
      if (!userStore.isAuthenticated) {
        // Redirect to login with return URL
        next({ 
          name: 'Login', 
          query: { redirect: to.fullPath } 
        })
        return
      }
    }
  }

  next()
})

export default router 