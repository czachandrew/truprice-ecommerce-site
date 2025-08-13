<template>
  <div class="space-y-6">


    <!-- Simple Header -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Quote Analysis Results</h2>
      
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span class="text-gray-500">Vendor:</span>
            <span class="ml-2 font-medium">{{ quote.vendorInfo?.company || quote.vendorInfo?.name || 'Unknown' }}</span>
          </div>
          <div>
            <span class="text-gray-500">Quote #:</span>
            <span class="ml-2 font-medium">{{ quote.vendorInfo?.quoteNumber || 'N/A' }}</span>
          </div>
          <div>
            <span class="text-gray-500">Total:</span>
            <span class="ml-2 font-medium">${{ formatPrice(quote.financials?.total) }}</span>
          </div>
        </div>
    </div>

    <!-- Simple Item Comparison -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">Item Comparison</h3>
      </div>
      
      <div class="divide-y divide-gray-200">
        <div
          v-for="item in quote.items"
          :key="item.id"
          class="p-6"
        >
          <!-- Original Item -->
          <div class="mb-4">
            <h4 class="font-medium text-gray-900 mb-2">{{ item.description }}</h4>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-gray-500">Part #:</span>
                <span class="ml-2">{{ item.partNumber }}</span>
              </div>
              <div>
                <span class="text-gray-500">Quantity:</span>
                <span class="ml-2">{{ item.quantity }}</span>
              </div>
              <div>
                <span class="text-gray-500">Unit Price:</span>
                <span class="ml-2 font-medium">${{ formatPrice(item.unitPrice) }}</span>
              </div>
              <div>
                <span class="text-gray-500">Total:</span>
                <span class="ml-2 font-medium">${{ formatPrice(item.totalPrice) }}</span>
              </div>
            </div>
          </div>

          <!-- Competitive Alternatives -->
          <div v-if="item.matches && item.matches.length > 0" class="space-y-3">
            <h5 class="text-sm font-medium text-gray-700">Competitive Alternatives:</h5>
            
            <!-- Best Offer First -->
            <div
              v-for="match in item.matches"
              :key="match.id"
              class="bg-gray-50 rounded-lg p-4 border-l-4"
              :class="getBestOffer(match)?.vendor?.code === 'TRUPRICE' ? 'border-blue-500 bg-blue-50' : 'border-green-500'"
            >
                              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span class="text-gray-500">Product:</span>
                    <span class="ml-2 font-medium">{{ match.product?.name || 'Demo Product' }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Vendor:</span>
                    <span class="ml-2">{{ getBestOffer(match)?.vendor?.name || getVendorName(match) }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Best Price:</span>
                    <span 
                      class="ml-2 font-medium"
                      :class="getBestOffer(match)?.vendor?.code === 'TRUPRICE' ? 'text-blue-600' : 'text-green-600'"
                    >
                      ${{ formatPrice(getBestPrice(match)) }}
                    </span>
                  </div>
                  <div>
                    <span class="text-gray-500">Savings:</span>
                    <span class="ml-2 font-medium text-green-600">${{ formatPrice(calculateSavings(item, match)) }}</span>
                  </div>
                </div>
              
              <!-- Best Offer Indicator -->
              <div v-if="getBestOffer(match)?.vendor?.code === 'TRUPRICE'" class="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                <div class="flex items-center justify-between text-sm">
                  <div class="flex items-center space-x-2">
                    <span class="text-blue-700 font-medium">🏆 Best Price Available</span>
                    <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      TruPrice
                    </span>
                  </div>
                  <div class="text-blue-600">
                    {{ getBestOffer(match)?.offerType || 'supplier' }}
                  </div>
                </div>
              </div>

              <!-- Quote Offer Information -->
              <div v-else-if="getQuoteOffer(match)" class="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                <div class="flex items-center justify-between text-sm">
                  <div class="flex items-center space-x-2">
                    <span class="text-blue-700 font-medium">Quote Offer</span>
                    <span 
                      :class="[
                        'px-2 py-1 text-xs rounded-full',
                        getQuoteOffer(match)?.isConfirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      ]"
                    >
                      {{ getQuoteOffer(match)?.isConfirmed ? 'Confirmed' : 'Estimate' }}
                    </span>
                  </div>
                  <div class="text-blue-600">
                    {{ getQuoteOffer(match)?.offerType || 'quote' }}
                  </div>
                </div>
              </div>
              
              <!-- Demo indicator -->
              <div v-if="match.isDemoPrice" class="mt-2">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Demo Price
                </span>
              </div>
            </div>
          </div>

          <!-- No matches -->
          <div v-else class="bg-gray-50 rounded-lg p-4">
            <p class="text-gray-600 text-sm">No competitive alternatives found</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QuoteAnalysis } from '@/stores/quote'

interface Props {
  quote: QuoteAnalysis
}

const props = defineProps<Props>()

const formatPrice = (price: string | number | null | undefined) => {
  if (!price) return 'N/A'
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return isNaN(numPrice) ? 'N/A' : numPrice.toFixed(2)
}

const getBestPrice = (match: any) => {
  if (!match.product?.offers || match.product.offers.length === 0) {
    // For demo mode, return 20% less than original
    return null
  }
  
  // Find the lowest selling price
  const bestOffer = match.product.offers.reduce((lowest: any, current: any) => {
    const lowestPrice = typeof lowest.sellingPrice === 'string' ? parseFloat(lowest.sellingPrice) : lowest.sellingPrice
    const currentPrice = typeof current.sellingPrice === 'string' ? parseFloat(current.sellingPrice) : current.sellingPrice
    return currentPrice < lowestPrice ? current : lowest
  })
  
  return bestOffer.sellingPrice
}

const getBestOffer = (match: any) => {
  if (!match.product?.offers || match.product.offers.length === 0) {
    return null
  }
  
  // Find the lowest selling price offer
  return match.product.offers.reduce((lowest: any, current: any) => {
    const lowestPrice = typeof lowest.sellingPrice === 'string' ? parseFloat(lowest.sellingPrice) : lowest.sellingPrice
    const currentPrice = typeof current.sellingPrice === 'string' ? parseFloat(current.sellingPrice) : current.sellingPrice
    return currentPrice < lowestPrice ? current : lowest
  })
}

const getVendorName = (match: any) => {
  if (match.product?.offers && match.product.offers.length > 0) {
    return match.product.offers[0].vendor?.name || 'Unknown'
  }
  // For demo mode, return demo vendors
  return match.isDemoPrice ? 'Amazon' : 'Unknown'
}

const getQuoteOffer = (match: any) => {
  if (!match.product?.offers || match.product.offers.length === 0) {
    return null
  }
  
  // Find the quote offer (offerType === 'quote')
  return match.product.offers.find((offer: any) => offer.offerType === 'quote')
}

const calculateSavings = (item: any, match: any) => {
  const quotePrice = Number(item.unitPrice)
  const bestPrice = getBestPrice(match)
  
  if (!bestPrice || isNaN(quotePrice)) {
    return 0
  }
  
  const bestPriceNum = typeof bestPrice === 'string' ? parseFloat(bestPrice) : bestPrice
  const savings = quotePrice - bestPriceNum
  
  return Math.max(0, savings) // Don't show negative savings
}
</script>
