import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { gql } from '@apollo/client/core'
import { apolloClient } from '@/plugins/apollo'

export interface CartItem {
  id: string
  offerId: string
  productId: string
  productName: string
  productImage: string
  vendorName: string
  price: number
  quantity: number
  maxQuantity: number
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const sessionId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const ADD_TO_CART = gql`
    mutation AddToCart($cartId: ID!, $item: CartItemInput!, $sessionId: String!) {
      addToCart(cartId: $cartId, item: $item, sessionId: $sessionId) {
        cart {
          id
          sessionId
          totalItems
          totalPrice
          items {
            id
            quantity
            totalPrice
            offer {
              id
              sellingPrice
              vendor {
                name
              }
              product {
                id
                name
                mainImage
              }
            }
          }
        }
      }
    }
  `

  const UPDATE_CART_ITEM = gql`
    mutation UpdateCartItem($id: ID!, $quantity: Int!) {
      updateCartItem(id: $id, quantity: $quantity) {
        cartItem {
          id
          quantity
          totalPrice
          offer {
            id
            sellingPrice
            vendor {
              name
            }
            product {
              id
              name
              mainImage
            }
          }
        }
      }
    }
  `

  const REMOVE_FROM_CART = gql`
    mutation RemoveFromCart($id: ID!) {
      removeFromCart(id: $id) {
        success
      }
    }
  `

  const GET_CART = gql`
    query GetCart($id: ID!, $sessionId: String!) {
      cart(id: $id, sessionId: $sessionId) {
        id
        sessionId
        totalItems
        totalPrice
        items {
          id
          quantity
          totalPrice
          offer {
            id
            sellingPrice
            vendor {
              name
            }
            product {
              id
              name
              mainImage
            }
          }
        }
      }
    }
  `

  const addToCart = async (offerId: string, quantity: number = 1) => {
    loading.value = true
    error.value = null
    
    try {
      const cartId = sessionId.value || 'default'
      const sessionIdValue = sessionId.value || 'default'
      
      const { data } = await apolloClient.mutate({
        mutation: ADD_TO_CART,
        variables: { 
          cartId,
          item: { offerId, quantity },
          sessionId: sessionIdValue
        }
      })

      if (data.addToCart.cart) {
        sessionId.value = data.addToCart.cart.sessionId
        items.value = data.addToCart.cart.items.map((item: any) => ({
          id: item.id,
          offerId: item.offer.id,
          productId: item.offer.product.id,
          productName: item.offer.product.name,
          productImage: item.offer.product.mainImage,
          vendorName: item.offer.vendor.name,
          price: item.offer.sellingPrice,
          quantity: item.quantity,
          maxQuantity: 99 // Default max quantity
        }))
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add item to cart'
      console.error('Error adding to cart:', err)
    } finally {
      loading.value = false
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    loading.value = true
    error.value = null
    
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_CART_ITEM,
        variables: { id: itemId, quantity }
      })

      if (data.updateCartItem.cartItem) {
        const itemIndex = items.value.findIndex(item => item.id === itemId)
        if (itemIndex >= 0) {
          const updatedItem = data.updateCartItem.cartItem
          items.value[itemIndex] = {
            id: updatedItem.id,
            offerId: updatedItem.offer.id,
            productId: updatedItem.offer.product.id,
            productName: updatedItem.offer.product.name,
            productImage: updatedItem.offer.product.mainImage,
            vendorName: updatedItem.offer.vendor.name,
            price: updatedItem.offer.sellingPrice,
            quantity: updatedItem.quantity,
            maxQuantity: 99
          }
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update cart item'
      console.error('Error updating cart item:', err)
    } finally {
      loading.value = false
    }
  }

  const removeFromCart = async (itemId: string) => {
    loading.value = true
    error.value = null
    
    try {
      const { data } = await apolloClient.mutate({
        mutation: REMOVE_FROM_CART,
        variables: { id: itemId }
      })

      if (data.removeFromCart.success) {
        items.value = items.value.filter(item => item.id !== itemId)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove item from cart'
      console.error('Error removing from cart:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchCart = async () => {
    loading.value = true
    error.value = null
    
    try {
      const cartId = sessionId.value || 'default'
      const sessionIdValue = sessionId.value || 'default'
      
      const { data } = await apolloClient.query({
        query: GET_CART,
        variables: { id: cartId, sessionId: sessionIdValue }
      })

      if (data.cart) {
        sessionId.value = data.cart.sessionId
        items.value = data.cart.items.map((item: any) => ({
          id: item.id,
          offerId: item.offer.id,
          productId: item.offer.product.id,
          productName: item.offer.product.name,
          productImage: item.offer.product.mainImage,
          vendorName: item.offer.vendor.name,
          price: item.offer.sellingPrice,
          quantity: item.quantity,
          maxQuantity: 99
        }))
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch cart'
      console.error('Error fetching cart:', err)
    } finally {
      loading.value = false
    }
  }

  const clearCart = () => {
    items.value = []
    sessionId.value = null
  }

  const itemCount = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0)
  })

  const subtotal = computed(() => {
    return items.value.reduce((total, item) => total + (item.price * item.quantity), 0)
  })

  const shipping = computed(() => {
    // Free shipping over $50
    return subtotal.value >= 50 ? 0 : 5.99
  })

  const total = computed(() => {
    return subtotal.value + shipping.value
  })

  const isEmpty = computed(() => {
    return items.value.length === 0
  })

  return {
    items,
    sessionId,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    fetchCart,
    clearCart,
    itemCount,
    subtotal,
    shipping,
    total,
    isEmpty
  }
}) 