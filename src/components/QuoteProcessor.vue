<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">Processing Quote</h3>
      <div class="flex items-center space-x-2">
        <span
          :class="[
            'px-2 py-1 text-xs font-medium rounded-full',
            statusClasses[processingState.status.toLowerCase()]
          ]"
        >
          {{ processingState.status }}
        </span>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="mb-6">
      <div class="flex justify-between text-sm text-gray-600 mb-2">
        <span>{{ processingState.currentStep }}</span>
        <span>{{ Math.round(smoothProgress) }}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          class="bg-primary-600 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${smoothProgress}%` }"
        ></div>
      </div>
    </div>

    <!-- Processing Steps -->
    <div class="space-y-4">
      <div
        v-for="(step, index) in processingSteps"
        :key="step.key"
        class="flex items-center space-x-3"
      >
        <div
          :class="[
            'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
            step.status === 'completed' ? 'bg-green-100 text-green-800' :
            step.status === 'current' ? 'bg-primary-100 text-primary-800' :
            'bg-gray-100 text-gray-400'
          ]"
        >
          <CheckIcon v-if="step.status === 'completed'" class="w-4 h-4" />
          <span v-else>{{ index + 1 }}</span>
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-900">{{ step.title }}</p>
          <p class="text-xs text-gray-500">{{ step.description }}</p>
        </div>
        <div v-if="step.status === 'current'" class="flex-shrink-0">
          <svg class="animate-spin h-4 w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    </div>

    <!-- Estimated Time -->
    <div v-if="processingState.estimatedTimeRemaining" class="mt-6 p-4 bg-blue-50 rounded-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <ClockIcon class="h-5 w-5 text-blue-600" />
          <p class="text-sm text-blue-800">
            Estimated time remaining: {{ processingState.estimatedTimeRemaining }} seconds
          </p>
        </div>
        <div class="text-sm text-blue-600">
          {{ formatTimeRemaining(processingState.estimatedTimeRemaining) }}
        </div>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="processingState.status === 'error'" class="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex">
        <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Processing Error</h3>
          <p class="text-sm text-red-700 mt-1">{{ processingState.error || 'An error occurred while processing the quote' }}</p>
          <button
            @click="retryProcessing"
            class="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="processingState.status === 'completed'" class="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
      <div class="flex">
        <CheckCircleIcon class="h-5 w-5 text-green-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-green-800">Processing Complete</h3>
          <p class="text-sm text-green-700 mt-1">Your quote has been analyzed successfully!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  CheckIcon, 
  ClockIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon 
} from '@heroicons/vue/24/outline'

interface Props {
  quoteId: string
  onProcessingComplete: (quote: any) => void
  onProcessingError: (error: string) => void
}

const props = defineProps<Props>()

interface ProcessingState {
  status: 'uploading' | 'parsing' | 'matching' | 'completed' | 'error'
  progress: number
  currentStep: string
  estimatedTimeRemaining?: number
  error?: string
}

const processingState = ref<ProcessingState>({
  status: 'uploading',
  progress: 0,
  currentStep: 'Uploading file...'
})

// Add smooth progress tracking
const smoothProgress = ref(0)
const progressInterval = ref<NodeJS.Timeout | null>(null)
const startTime = ref<number | null>(null)
const initialTimeEstimate = ref<number | null>(null)

const statusClasses = {
  uploading: 'bg-blue-100 text-blue-800',
  parsing: 'bg-yellow-100 text-yellow-800',
  matching: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800'
}

const processingSteps = computed(() => [
  {
    key: 'upload',
    title: 'Upload File',
    description: 'Uploading PDF to our servers',
    status: processingState.value.status.toLowerCase() === 'uploading' ? 'current' :
            ['parsing', 'matching', 'completed'].includes(processingState.value.status.toLowerCase()) ? 'completed' : 'pending'
  },
  {
    key: 'parse',
    title: 'Parse PDF',
    description: 'Extracting data using AI',
    status: processingState.value.status.toLowerCase() === 'parsing' ? 'current' :
            ['matching', 'completed'].includes(processingState.value.status.toLowerCase()) ? 'completed' : 'pending'
  },
  {
    key: 'match',
    title: 'Find Matches',
    description: 'Searching for competitive products',
    status: processingState.value.status.toLowerCase() === 'matching' ? 'current' :
            processingState.value.status.toLowerCase() === 'completed' ? 'completed' : 'pending'
  }
])

let pollingInterval: NodeJS.Timeout | null = null

const startPolling = () => {
  pollingInterval = setInterval(async () => {
    try {
      // Import the quote store
      const { useQuoteStore } = await import('@/stores/quote')
      const quoteStore = useQuoteStore()
      
      // Check quote status from backend
      const quote = await quoteStore.checkQuoteStatus(props.quoteId)
      if (quote) {
        updateProcessingState(quote)
      }
    } catch (error) {
      console.error('Error polling quote status:', error)
    }
  }, 2000)
}

const simulateProcessing = () => {
  const currentProgress = processingState.value.progress
  
  if (currentProgress < 100) {
    const newProgress = Math.min(currentProgress + Math.random() * 15, 100)
    
    if (newProgress < 30) {
      processingState.value = {
        status: 'uploading',
        progress: newProgress,
        currentStep: 'Uploading file...',
        estimatedTimeRemaining: Math.max(0, Math.round((100 - newProgress) / 2))
      }
    } else if (newProgress < 70) {
      processingState.value = {
        status: 'parsing',
        progress: newProgress,
        currentStep: 'Extracting data from PDF...',
        estimatedTimeRemaining: Math.max(0, Math.round((100 - newProgress) / 2))
      }
    } else if (newProgress < 100) {
      processingState.value = {
        status: 'matching',
        progress: newProgress,
        currentStep: 'Finding competitive products...',
        estimatedTimeRemaining: Math.max(0, Math.round((100 - newProgress) / 2))
      }
    } else {
      processingState.value = {
        status: 'completed',
        progress: 100,
        currentStep: 'Analysis complete!'
      }
      
      // Stop polling and call completion callback
      stopPolling()
      props.onProcessingComplete({
        id: props.quoteId,
        status: 'completed'
      })
    }
  }
}

const updateProcessingState = (quote: any) => {
  console.log(`🔄 QuoteProcessor updating state for quote ${props.quoteId}:`, quote.status)
  
  const previousStatus = processingState.value.status
  const newStatus = quote.status
  
  processingState.value = {
    status: newStatus,
    progress: getProgressForStatus(newStatus),
    currentStep: getStepForStatus(newStatus),
    estimatedTimeRemaining: quote.estimatedTimeRemaining,
    error: quote.parsingError
  }
  
  console.log(`📊 New processing state:`, processingState.value)
  
  // Start smooth progress if status changed or we have time remaining
  if (previousStatus !== newStatus || quote.estimatedTimeRemaining) {
    startSmoothProgress(quote.estimatedTimeRemaining, newStatus)
  }
  
  // Check for completion - handle both uppercase and lowercase
  if (newStatus === 'COMPLETED' || newStatus === 'completed') {
    console.log('✅ Quote completed, calling onProcessingComplete')
    stopSmoothProgress()
    stopPolling()
    props.onProcessingComplete(quote)
  } else if (newStatus === 'ERROR' || newStatus === 'error') {
    console.log('❌ Quote error, stopping polling')
    stopSmoothProgress()
    stopPolling()
    props.onProcessingError(quote.parsingError || 'Processing failed')
  }
}

const getProgressForStatus = (status: string): number => {
  // Normalize status to lowercase for comparison
  const normalizedStatus = status.toLowerCase()
  
  switch (normalizedStatus) {
    case 'uploading': return 25
    case 'parsing': return 60
    case 'matching': return 90
    case 'completed': return 100
    case 'error': return 0
    default: return 0
  }
}

const getStepForStatus = (status: string): string => {
  // Normalize status to lowercase for comparison
  const normalizedStatus = status.toLowerCase()
  
  switch (normalizedStatus) {
    case 'uploading': return 'Uploading file...'
    case 'parsing': return 'Extracting data from PDF...'
    case 'matching': return 'Finding competitive products...'
    case 'completed': return 'Analysis complete!'
    case 'error': return 'Processing failed'
    default: return 'Processing...'
  }
}

const startSmoothProgress = (estimatedTimeRemaining: number, status: string) => {
  // Stop any existing progress
  stopSmoothProgress()
  
  const baseProgress = getProgressForStatus(status)
  
  // If this is the first time or status changed, initialize
  if (!startTime.value || initialTimeEstimate.value === null) {
    startTime.value = Date.now()
    initialTimeEstimate.value = estimatedTimeRemaining || 45 // Default 45 seconds if no estimate
  }
  
  // Calculate progress based on elapsed time vs initial estimate
  const elapsedSeconds = (Date.now() - startTime.value) / 1000
  const totalEstimatedSeconds = initialTimeEstimate.value
  
  // Calculate progress percentage (0-95%, save 5% for completion)
  const timeBasedProgress = Math.min(95, (elapsedSeconds / totalEstimatedSeconds) * 100)
  
  // Use the higher of base progress or time-based progress
  smoothProgress.value = Math.max(baseProgress, timeBasedProgress)
  
  // Update progress every 100ms
  progressInterval.value = setInterval(() => {
    const currentElapsed = (Date.now() - startTime.value!) / 1000
    const currentProgress = Math.min(95, (currentElapsed / totalEstimatedSeconds) * 100)
    
    // Only advance if we're not already at a higher progress level
    if (currentProgress > smoothProgress.value) {
      smoothProgress.value = Math.max(baseProgress, currentProgress)
    }
  }, 100)
}

const stopSmoothProgress = () => {
  if (progressInterval.value) {
    clearInterval(progressInterval.value)
    progressInterval.value = null
  }
  smoothProgress.value = 100 // Complete the progress bar
  startTime.value = null
  initialTimeEstimate.value = null
}

const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}

const formatTimeRemaining = (seconds: number) => {
  if (seconds <= 0) return 'Almost done...'
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

const retryProcessing = () => {
  processingState.value = {
    status: 'uploading',
    progress: 0,
    currentStep: 'Uploading file...'
  }
  smoothProgress.value = 0
  startTime.value = null
  initialTimeEstimate.value = null
  startPolling()
}

onMounted(() => {
  startPolling()
})

onUnmounted(() => {
  stopPolling()
  stopSmoothProgress()
})
</script>
