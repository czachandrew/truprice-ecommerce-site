import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { gql } from '@apollo/client/core'
import { apolloClient } from '@/plugins/apollo'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  createdAt: string
}

export interface Wallet {
  id: string
  balance: number
  totalEarned: number
  pendingBalance: number
  transactions: Array<{
    id: string
    amount: number
    type: 'earned' | 'spent' | 'refund'
    description: string
    createdAt: string
  }>
}

export interface Order {
  id: string
  orderNumber: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  items: Array<{
    id: string
    productName: string
    quantity: number
    price: number
  }>
  createdAt: string
  estimatedDelivery?: string
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const wallet = ref<Wallet | null>(null)
  const orders = ref<Order[]>([])
  const isAuthenticated = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const LOGIN = gql`
    mutation Login($email: String!, $password: String!) {
      tokenAuth(email: $email, password: $password) {
        token
        refreshToken
        user {
          id
          email
          firstName
          lastName
          avatar
          dateJoined
          wallet
          profile {
            id
          }
        }
      }
    }
  `

  const REGISTER = gql`
    mutation Register($email: String!, $password: String!, $firstName: String!, $lastName: String!) {
      register(email: $email, password: $password, firstName: $firstName, lastName: $lastName) {
        success
        user {
          id
          email
          firstName
          lastName
          avatar
          dateJoined
          wallet
          profile {
            id
          }
        }
        token
        refreshToken
      }
    }
  `

  const GET_PROFILE = gql`
    query GetProfile {
      me {
        id
        email
        firstName
        lastName
        avatar
        dateJoined
        wallet
        profile {
          id
        }
      }
    }
  `

  const GET_WALLET = gql`
    query GetWallet {
      me {
        wallet
        userAffiliateActivity {
          id
          totalEarnings
          recentEarnings
          projectedEarnings
        }
      }
    }
  `

  const GET_ORDERS = gql`
    query GetOrders {
      me {
        id
        # Orders will be implemented when the backend supports it
      }
    }
  `

  const login = async (email: string, password: string) => {
    loading.value = true
    error.value = null
    
    try {
      const { data } = await apolloClient.mutate({
        mutation: LOGIN,
        variables: { email, password }
      })

      if (data.tokenAuth) {
        localStorage.setItem('auth_token', data.tokenAuth.token)
        localStorage.setItem('refresh_token', data.tokenAuth.refreshToken)
        user.value = data.tokenAuth.user
        isAuthenticated.value = true
        await fetchWallet()
        return true
      } else {
        error.value = 'Login failed'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      console.error('Login error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    loading.value = true
    error.value = null
    
    try {
      const { data } = await apolloClient.mutate({
        mutation: REGISTER,
        variables: { email, password, firstName, lastName }
      })

      if (data.register.success) {
        localStorage.setItem('auth_token', data.register.token)
        localStorage.setItem('refresh_token', data.register.refreshToken)
        user.value = data.register.user
        isAuthenticated.value = true
        await fetchWallet()
        return true
      } else {
        error.value = 'Registration failed'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Registration failed'
      console.error('Registration error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    user.value = null
    wallet.value = null
    orders.value = []
    isAuthenticated.value = false
  }

  const fetchProfile = async () => {
    loading.value = true
    error.value = null
    
    try {
      const { data } = await apolloClient.query({
        query: GET_PROFILE
      })

      user.value = data.me
      isAuthenticated.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch profile'
      console.error('Error fetching profile:', err)
      logout()
    } finally {
      loading.value = false
    }
  }

  const fetchWallet = async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_WALLET
      })

      if (data.me) {
        wallet.value = {
          id: 'wallet',
          balance: data.me.wallet || 0,
          totalEarned: data.me.userAffiliateActivity?.totalEarnings || 0,
          pendingBalance: data.me.userAffiliateActivity?.recentEarnings || 0,
          transactions: []
        }
      }
    } catch (err) {
      console.error('Error fetching wallet:', err)
    }
  }

  const fetchOrders = async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_ORDERS
      })

      orders.value = data.orders
    } catch (err) {
      console.error('Error fetching orders:', err)
    }
  }

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token')
    if (token && !isAuthenticated.value) {
      await fetchProfile()
    }
  }

  const fullName = computed(() => {
    if (!user.value) return ''
    return `${user.value.firstName} ${user.value.lastName}`
  })

  const initials = computed(() => {
    if (!user.value) return ''
    return `${user.value.firstName[0]}${user.value.lastName[0]}`
  })

  return {
    user,
    wallet,
    orders,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    fetchProfile,
    fetchWallet,
    fetchOrders,
    checkAuth,
    fullName,
    initials
  }
}) 