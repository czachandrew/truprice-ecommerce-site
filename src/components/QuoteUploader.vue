<template>
  <div class="w-full">
    <div
      class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors"
      :class="{
        'border-primary-500 bg-primary-50': isDragging,
        'border-gray-300': !isDragging
      }"
      @drop.prevent="handleFileDrop"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @click="$refs.fileInput.click()"
    >
      <div v-if="!selectedFile && !isUploading" class="space-y-4">
        <DocumentArrowUpIcon class="mx-auto h-16 w-16 text-gray-400" />
        <div>
          <p class="text-lg font-medium text-gray-900">
            <span class="text-primary-600 hover:text-primary-500 cursor-pointer">
              Click to upload
            </span>
            or drag and drop
          </p>
          <p class="text-sm text-gray-500 mt-1">PDF quote files only, up to 10MB</p>
        </div>
      </div>

      <div v-else-if="selectedFile && !isUploading" class="space-y-4">
        <DocumentIcon class="mx-auto h-12 w-12 text-primary-600" />
        <div>
          <p class="text-lg font-medium text-gray-900">{{ selectedFile.name }}</p>
          <p class="text-sm text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
        </div>
        <button
          @click.stop="removeFile"
          class="text-sm text-red-600 hover:text-red-800"
        >
          Remove file
        </button>
      </div>

      <div v-else-if="isUploading" class="space-y-4">
        <div class="mx-auto h-12 w-12">
          <svg class="animate-spin h-12 w-12 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <div>
          <p class="text-lg font-medium text-gray-900">Uploading quote...</p>
          <p class="text-sm text-gray-500">Please wait while we process your file</p>
        </div>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept=".pdf"
        class="hidden"
        @change="handleFileSelect"
      />
    </div>

    <!-- Demo Mode Toggle -->
    <div class="mt-4 flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <input
          id="demo-mode"
          v-model="demoMode"
          type="checkbox"
          class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label for="demo-mode" class="text-sm text-gray-700">
          Demo mode (generate superior pricing for unmatched products)
        </label>
      </div>
      
      <button
        v-if="selectedFile && !isUploading"
        @click="uploadFile"
        class="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors"
      >
        Analyze Quote
      </button>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex">
        <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Upload Error</h3>
          <p class="text-sm text-red-700 mt-1">{{ error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { DocumentArrowUpIcon, DocumentIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

interface Props {
  onUploadSuccess: (quote: any) => void
  onUploadError: (error: string) => void
}

const props = defineProps<Props>()

const selectedFile = ref<File | null>(null)
const isDragging = ref(false)
const isUploading = ref(false)
const demoMode = ref(false)
const error = ref<string | null>(null)

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    validateAndSetFile(target.files[0])
  }
}

const handleFileDrop = (event: DragEvent) => {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files && files[0]) {
    validateAndSetFile(files[0])
  }
}

const validateAndSetFile = (file: File) => {
  error.value = null
  
  // Check file type
  if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
    error.value = 'Only PDF files are allowed'
    return
  }
  
  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    error.value = 'File size must be less than 10MB'
    return
  }
  
  selectedFile.value = file
}

const removeFile = () => {
  selectedFile.value = null
  error.value = null
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const uploadFile = async () => {
  if (!selectedFile.value) return
  
  isUploading.value = true
  error.value = null
  
  try {
    // Import the quote store
    const { useQuoteStore } = await import('@/stores/quote')
    const quoteStore = useQuoteStore()
    
    // Upload the quote
    const quote = await quoteStore.uploadQuote(selectedFile.value, demoMode.value)
    props.onUploadSuccess(quote)
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to upload quote'
    error.value = errorMessage
    props.onUploadError(errorMessage)
  } finally {
    isUploading.value = false
  }
}
</script>
