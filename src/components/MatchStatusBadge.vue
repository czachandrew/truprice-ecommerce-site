<template>
  <div class="flex items-center space-x-2">
    <span
      :class="[
        'px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1',
        statusClasses
      ]"
    >
      <component :is="statusIcon" class="h-3 w-3" />
      <span>{{ statusText }}</span>
    </span>
    <span v-if="confidence" class="text-xs text-gray-500">
      {{ Math.round(confidence) }}%
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon 
} from '@heroicons/vue/24/solid'
import type { QuoteItem, ParsedQuote } from '@/stores/quote'

interface Props {
  item: QuoteItem
  quote: ParsedQuote
}

const props = defineProps<Props>()

const match = computed(() => {
  return props.quote.matchedProducts.find(m => m.quoteItemId === props.item.id)
})

const status = computed(() => {
  if (!match.value) return 'unmatched'
  if (match.value.isExactMatch) return 'matched'
  if (match.value.confidence > 70) return 'partial'
  return 'unmatched'
})

const confidence = computed(() => {
  return match.value?.confidence || 0
})

const statusClasses = computed(() => {
  switch (status.value) {
    case 'matched':
      return 'bg-green-100 text-green-800'
    case 'partial':
      return 'bg-yellow-100 text-yellow-800'
    case 'unmatched':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
})

const statusText = computed(() => {
  switch (status.value) {
    case 'matched':
      return 'Matched'
    case 'partial':
      return 'Partial'
    case 'unmatched':
      return 'No Match'
    default:
      return 'Unknown'
  }
})

const statusIcon = computed(() => {
  switch (status.value) {
    case 'matched':
      return CheckCircleIcon
    case 'partial':
      return ExclamationTriangleIcon
    case 'unmatched':
      return XCircleIcon
    default:
      return ClockIcon
  }
})
</script>
