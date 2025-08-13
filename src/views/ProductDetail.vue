<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div v-if="productStore.loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      <p class="mt-4 text-gray-500">Loading product details...</p>
    </div>

    <div v-else-if="productStore.currentProduct" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Product Images -->
      <div class="space-y-4">
        <div class="aspect-square bg-gray-200 rounded-lg overflow-hidden">
          <img
            :src="productStore.currentProduct.mainImage"
            :alt="productStore.currentProduct.name"
            class="w-full h-full object-cover"
          />
        </div>
      </div>

      <!-- Product Info -->
      <div class="space-y-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            {{ productStore.currentProduct.name }}
          </h1>
          <p class="text-lg text-gray-500 mt-2">
            {{ productStore.currentProduct.manufacturer?.name }}
          </p>
        </div>

        <div class="prose max-w-none">
          <p>{{ productStore.currentProduct.description }}</p>
        </div>

        <!-- Offers -->
        <div v-if="productStore.currentProduct.offers && productStore.currentProduct.offers.length > 0">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Available Offers</h3>
          <div class="space-y-3">
            <div
              v-for="offer in productStore.currentProduct.offers"
              :key="offer.id"
              class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div>
                <p class="font-medium">{{ offer.vendor.name }}</p>
                <p class="text-sm text-gray-500">Free shipping</p>
              </div>
              <div class="text-right">
                <p class="text-xl font-bold text-gray-900">${{ offer.sellingPrice.toFixed(2) }}</p>
                <BaseButton
                  variant="primary"
                  size="sm"
                  @click="addToCart(offer.id)"
                >
                  Add to Cart
                </BaseButton>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8">
          <p class="text-gray-500">No offers available at the moment.</p>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <h2 class="text-2xl font-semibold text-gray-900 mb-4">Product not found</h2>
      <p class="text-gray-500 mb-8">The product you're looking for doesn't exist or has been removed.</p>
      <router-link
        to="/products"
        class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold"
      >
        Browse Products
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProductStore } from '@/stores/product'
import { useCartStore } from '@/stores/cart'
import BaseButton from '@/components/ui/BaseButton.vue'

const route = useRoute()
const productStore = useProductStore()
const cartStore = useCartStore()

const addToCart = async (offerId: string) => {
  await cartStore.addToCart(offerId)
}

onMounted(async () => {
  const productId = route.params.id as string
  if (productId) {
    await productStore.fetchProduct(productId)
  }
})
</script> 