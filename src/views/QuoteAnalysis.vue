<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Quote Analysis</h1>
      <p class="mt-2 text-gray-600">
        Upload PDF quotes from resellers to compare prices and find better deals
      </p>
    </div>

    <!-- Upload Section -->
    <div v-if="!currentQuoteId" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Upload Quote</h2>
      
      <QuoteUploader
        :on-upload-success="handleUploadSuccess"
        :on-upload-error="handleUploadError"
      />
    </div>

    <!-- Processing Section -->
    <div v-if="currentQuoteId && !quoteAnalysis" class="mb-8">
      <QuoteProcessor
        :quote-id="currentQuoteId"
        :on-processing-complete="handleProcessingComplete"
        :on-processing-error="handleProcessingError"
      />
    </div>

    <!-- Results Section -->
    <div v-if="quoteAnalysis" class="mb-8">
      <QuoteAnalysisResults
        :quote="quoteAnalysis"
        :show-affiliate-opportunities="true"
        :highlight-savings="true"
      />
    </div>

    <!-- Error Display -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
      <div class="flex">
        <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <p class="text-sm text-red-700 mt-1">{{ error }}</p>
        </div>
      </div>
    </div>







    <!-- Recent Quotes -->
    <div v-if="quoteStore.quotes.length > 0" class="mt-12">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Recent Quotes</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="quote in quoteStore.quotes.slice(0, 6)"
          :key="quote.id"
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
          @click="selectQuote(quote.id)"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ (quote as any).vendorInfo?.company || (quote as any).vendorInfo?.name || (quote as any).vendorCompany || (quote as any).vendorName || 'Unknown Vendor' }}
            </h3>
            <span
              :class="[
                'px-2 py-1 text-xs font-medium rounded-full',
                statusClasses[quote.status as keyof typeof statusClasses] || statusClasses[quote.status.toLowerCase() as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'
              ]"
            >
              {{ quote.status }}
            </span>
          </div>
                      <div class="space-y-2 text-sm text-gray-600">
              <p>Quote #: {{ (quote as any).vendorInfo?.quoteNumber || (quote as any).quoteNumber || 'N/A' }}</p>
              <p>Date: {{ formatDate(quote.createdAt) }}</p>
              <p>Total: ${{ formatPrice((quote as any).financials?.total || (quote as any).total) }}</p>
              <p>Items: {{ (quote as any).summary?.totalItems || (quote as any).itemCount || 0 }}</p>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuoteStore } from '@/stores/quote'
import { useCartStore } from '@/stores/cart'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import QuoteUploader from '@/components/QuoteUploader.vue'
import QuoteProcessor from '@/components/QuoteProcessor.vue'
import QuoteAnalysisResults from '@/components/QuoteAnalysisResults.vue'
import type { QuoteAnalysis } from '@/stores/quote'

// Type for recent quotes that can be either flat or nested structure
type RecentQuote = QuoteAnalysis | {
  id: string
  vendorCompany?: string
  vendorName?: string
  quoteNumber?: string
  total?: string | number
  itemCount?: number
  status: string
  createdAt: string
}

const quoteStore = useQuoteStore()
const cartStore = useCartStore()

const currentQuoteId = ref<string | null>(null)
const quoteAnalysis = ref<QuoteAnalysis | null>(null)
const error = ref<string | null>(null)



const statusClasses = {
  uploading: 'bg-blue-100 text-blue-800',
  parsing: 'bg-yellow-100 text-yellow-800',
  matching: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  // Handle uppercase statuses from backend
  UPLOADING: 'bg-blue-100 text-blue-800',
  PARSING: 'bg-yellow-100 text-yellow-800',
  MATCHING: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  ERROR: 'bg-red-100 text-red-800'
}

const handleUploadSuccess = (quote: any) => {
  currentQuoteId.value = quote.id
  error.value = null
}

const handleUploadError = (errorMessage: string) => {
  error.value = errorMessage
}

const handleProcessingComplete = async (quote: any) => {
  try {
    console.log('🎉 Quote processing completed! Loading full analysis...', quote)
    // Fetch the complete analysis
    const analysis = await quoteStore.fetchQuoteAnalysis(quote.id)
    console.log('📊 Full analysis loaded:', analysis)
    quoteAnalysis.value = analysis
    currentQuoteId.value = null
    console.log('✅ Results should now be visible')
  } catch (err) {
    console.error('❌ Error loading quote analysis:', err)
    error.value = 'Failed to load quote analysis'
  }
}

const handleProcessingError = (errorMessage: string) => {
  error.value = errorMessage
  currentQuoteId.value = null
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const formatPrice = (price: string | number | null | undefined) => {
  if (!price) return 'N/A'
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return isNaN(numPrice) ? 'N/A' : numPrice.toFixed(2)
}

const getStatusMessage = (status: string) => {
  switch (status) {
    case 'uploading': return 'Uploading file...'
    case 'parsing': return 'AI is reading your PDF...'
    case 'matching': return 'Finding competitive prices...'
    case 'completed': return 'Analysis complete!'
    case 'error': return 'Processing failed'
    default: return 'Processing...'
  }
}

const selectQuote = async (quoteId: string) => {
  try {
    // Get the quote from the store
    const quote = quoteStore.quotes.find(q => q.id === quoteId)
    
    if (!quote) {
      error.value = 'Quote not found'
      return
    }
    
    // If quote is still processing, show processing state
    if (quote.status.toLowerCase() !== 'completed') {
      currentQuoteId.value = quoteId
      quoteAnalysis.value = null
      return
    }
    
    // If quote is completed, load full analysis
    const analysis = await quoteStore.fetchQuoteAnalysis(quoteId)
    quoteAnalysis.value = analysis
    currentQuoteId.value = null
  } catch (err) {
    error.value = 'Failed to load quote'
    console.error('Error loading quote:', err)
  }
}

onMounted(() => {
  quoteStore.fetchMyQuotes()
})
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
