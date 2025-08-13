<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

    <div v-if="cartStore.loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      <p class="mt-4 text-gray-500">Loading your cart...</p>
    </div>

    <div v-else-if="cartStore.isEmpty" class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <ShoppingBagIcon class="h-24 w-24 mx-auto" />
      </div>
      <h2 class="text-2xl font-semibold text-gray-900 mb-4">Your cart is empty</h2>
      <p class="text-gray-500 mb-8">Start shopping to add items to your cart.</p>
      <router-link
        to="/products"
        class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
      >
        Continue Shopping
      </router-link>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Cart Items -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="p-6 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Cart Items ({{ cartStore.itemCount }})</h2>
          </div>
          
          <div class="divide-y divide-gray-200">
            <div
              v-for="item in cartStore.items"
              :key="item.id"
              class="p-6 flex items-center space-x-4"
            >
              <!-- Product Image -->
              <div class="flex-shrink-0">
                <img
                  :src="item.productImage"
                  :alt="item.productName"
                  class="w-20 h-20 object-cover rounded-lg"
                />
              </div>

              <!-- Product Info -->
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-medium text-gray-900 truncate">
                  {{ item.productName }}
                </h3>
                <p class="text-sm text-gray-500">Sold by {{ item.vendorName }}</p>
                <p class="text-lg font-semibold text-gray-900 mt-1">
                  ${{ item.price.toFixed(2) }}
                </p>
              </div>

              <!-- Quantity Controls -->
              <div class="flex items-center space-x-2">
                <button
                  @click="updateQuantity(item.id, item.quantity - 1)"
                  :disabled="item.quantity <= 1 || cartStore.loading"
                  class="p-1 rounded-md text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <MinusIcon class="h-4 w-4" />
                </button>
                
                <span class="text-sm font-medium text-gray-900 w-8 text-center">
                  {{ item.quantity }}
                </span>
                
                <button
                  @click="updateQuantity(item.id, item.quantity + 1)"
                  :disabled="item.quantity >= item.maxQuantity || cartStore.loading"
                  class="p-1 rounded-md text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <PlusIcon class="h-4 w-4" />
                </button>
              </div>

              <!-- Remove Button -->
              <button
                @click="removeItem(item.id)"
                :disabled="cartStore.loading"
                class="text-error-600 hover:text-error-700 disabled:opacity-50"
              >
                <TrashIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Cart Summary -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
          
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Subtotal</span>
              <span class="font-medium">${{ cartStore.subtotal.toFixed(2) }}</span>
            </div>
            
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Shipping</span>
              <span class="font-medium">
                {{ cartStore.shipping === 0 ? 'Free' : `$${cartStore.shipping.toFixed(2)}` }}
              </span>
            </div>
            
            <div v-if="userStore.wallet" class="flex justify-between text-sm">
              <span class="text-gray-600">Wallet Balance</span>
              <span class="font-medium text-success-600">${{ userStore.wallet.balance.toFixed(2) }}</span>
            </div>
            
            <div class="border-t border-gray-200 pt-3">
              <div class="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${{ cartStore.total.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Checkout Button -->
          <div class="mt-6">
            <router-link
              to="/checkout"
              class="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-lg font-semibold text-center block transition-colors duration-200"
            >
              Proceed to Checkout
            </router-link>
          </div>

          <!-- Continue Shopping -->
          <div class="mt-4">
            <router-link
              to="/products"
              class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold text-center block transition-colors duration-200"
            >
              Continue Shopping
            </router-link>
          </div>

          <!-- Error Message -->
          <div v-if="cartStore.error" class="mt-4 p-3 bg-error-50 border border-error-200 rounded-md">
            <p class="text-sm text-error-600">{{ cartStore.error }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ShoppingBagIcon, MinusIcon, PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'

const cartStore = useCartStore()
const userStore = useUserStore()

const updateQuantity = async (itemId: string, quantity: number) => {
  if (quantity > 0) {
    await cartStore.updateQuantity(itemId, quantity)
  }
}

const removeItem = async (itemId: string) => {
  await cartStore.removeFromCart(itemId)
}
</script> 