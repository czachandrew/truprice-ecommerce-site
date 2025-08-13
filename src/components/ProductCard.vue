<template>
  <div class="product-card group">
    <router-link :to="`/products/${product.id}`" class="block">
      <!-- Product Image -->
      <div class="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-4">
        <img
          v-if="product.mainImage"
          :src="product.mainImage"
          :alt="product.name"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        <div v-else class="w-full h-full flex items-center justify-center bg-gray-100">
          <PhotoIcon class="h-12 w-12 text-gray-400" />
        </div>
      </div>

      <!-- Product Info -->
      <div class="space-y-2">
        <h3 class="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors duration-200 line-clamp-2">
          {{ product.name }}
        </h3>
        
        <p class="text-xs text-gray-500">
          {{ product.manufacturer?.name }}
        </p>

        <!-- Price Range -->
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span v-if="lowestPrice" class="text-lg font-bold text-gray-900">
              ${{ lowestPrice.toFixed(2) }}
            </span>
            <span v-else class="text-sm text-gray-500">Price not available</span>
            
            <span v-if="hasMultiplePrices" class="text-xs text-gray-500">
              - ${{ highestPrice?.toFixed(2) }}
            </span>
          </div>
          
          <div v-if="product.offers && product.offers.length > 0" class="text-xs text-success-600 font-medium">
            {{ product.offers.length }} offer{{ product.offers.length > 1 ? 's' : '' }}
          </div>
        </div>

        <!-- Affiliate Earnings Info -->
        <div v-if="bestAffiliateOffer && bestAffiliateOffer.expectedCommission" class="bg-success-50 border border-success-200 rounded-lg p-3 mt-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-success-500 rounded-full"></div>
              <span class="text-xs font-medium text-success-700">Earn back</span>
            </div>
            <span class="text-sm font-bold text-success-700">
              ${{ Number(bestAffiliateOffer.expectedCommission || 0).toFixed(2) }}
            </span>
          </div>
          <div class="mt-1 text-xs text-success-600">
            {{ Number(bestAffiliateOffer.commissionRate || 0) }}% commission on ${{ Number(bestAffiliateOffer.sellingPrice || 0).toFixed(2) }}
          </div>
        </div>
      </div>
    </router-link>

    <!-- Action Buttons -->
    <div class="mt-4 space-y-2">
      <!-- Add to Cart Button -->
      <BaseButton
        v-if="product.offers && product.offers.length > 0"
        variant="primary"
        size="sm"
        :loading="cartStore.loading"
        full-width
        @click="addToCart"
      >
        Add to Cart
      </BaseButton>
      <BaseButton
        v-else
        variant="outline"
        size="sm"
        disabled
        full-width
      >
        Out of Stock
      </BaseButton>

      <!-- Earn Back Button -->
      <BaseButton
        v-if="bestAffiliateOffer && bestAffiliateOffer.expectedCommission"
        variant="outline"
        size="sm"
        full-width
        @click="useAffiliateLink"
        class="border-success-300 text-success-700 hover:bg-success-50"
      >
        <div class="flex items-center justify-center space-x-2">
          <span>Earn Back ${{ Number(bestAffiliateOffer.expectedCommission || 0).toFixed(2) }}</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
          </svg>
        </div>
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PhotoIcon } from '@heroicons/vue/24/outline'
import { useProductStore } from '@/stores/product'
import { useCartStore } from '@/stores/cart'
import BaseButton from '@/components/ui/BaseButton.vue'
import type { Product } from '@/stores/product'

interface Props {
  product: Product
}

const props = defineProps<Props>()

const productStore = useProductStore()
const cartStore = useCartStore()

const lowestPrice = computed(() => {
  return productStore.getLowestPrice(props.product)
})

const highestPrice = computed(() => {
  return productStore.getHighestPrice(props.product)
})

const hasMultiplePrices = computed(() => {
  return lowestPrice.value && highestPrice.value && lowestPrice.value !== highestPrice.value
})

const bestAffiliateOffer = computed(() => {
  try {
    if (!props.product?.offers || props.product.offers.length === 0) return null
    
    // Debug: Log the offers to see what we're working with
    console.log('Product offers:', props.product.offers)
    
    // Find the offer with the highest expected commission
    const affiliateOffers = props.product.offers.filter(offer => 
      offer?.offerType === 'AFFILIATE' && 
      offer?.expectedCommission && 
      Number(offer.expectedCommission) > 0
    )
    
    console.log('Affiliate offers found:', affiliateOffers)
    
    if (affiliateOffers.length === 0) return null
    
    // Debug: Log the data types
    affiliateOffers.forEach(offer => {
      console.log('Offer expectedCommission:', offer.expectedCommission, 'Type:', typeof offer.expectedCommission)
      console.log('Offer commissionRate:', offer.commissionRate, 'Type:', typeof offer.commissionRate)
      console.log('Offer sellingPrice:', offer.sellingPrice, 'Type:', typeof offer.sellingPrice)
    })
    
    return affiliateOffers.reduce((best, current) => 
      Number(current?.expectedCommission || 0) > Number(best?.expectedCommission || 0) ? current : best
    )
  } catch (error) {
    console.error('Error computing bestAffiliateOffer:', error)
    return null
  }
})

const addToCart = async () => {
  try {
    if (props.product?.offers && props.product.offers.length > 0) {
      // Add the lowest priced offer to cart
      const lowestOffer = props.product.offers.reduce((lowest, current) => 
        (current?.sellingPrice || 0) < (lowest?.sellingPrice || 0) ? current : lowest
      )
      if (lowestOffer?.id) {
        await cartStore.addToCart(lowestOffer.id)
      }
    }
  } catch (error) {
    console.error('Error adding to cart:', error)
  }
}

const useAffiliateLink = async () => {
  if (bestAffiliateOffer.value) {
    // For now, we'll track the click and redirect to the vendor URL
    // In a real implementation, you'd want to use the affiliate link from the API
    console.log('Using affiliate link for:', props.product.name)
    console.log('Expected commission:', bestAffiliateOffer.value.expectedCommission)
    
    // If the offer has a vendor URL, redirect to it
    if (bestAffiliateOffer.value.vendorUrl) {
      window.open(bestAffiliateOffer.value.vendorUrl, '_blank')
    } else {
      // Fallback to the product detail page
      window.open(`/products/${props.product.id}`, '_blank')
    }
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 