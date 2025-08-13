<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Filters Sidebar -->
      <aside class="w-full lg:w-64">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          
          <!-- Search -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search products..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              @input="handleSearch"
            />
          </div>

          <!-- Price Range -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
            <div class="space-y-2">
              <input
                v-model.number="priceRange[0]"
                type="number"
                placeholder="Min"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                @input="handlePriceChange"
              />
              <input
                v-model.number="priceRange[1]"
                type="number"
                placeholder="Max"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                @input="handlePriceChange"
              />
            </div>
          </div>

          <!-- In Stock Only -->
          <div class="mb-6">
            <label class="flex items-center">
              <input
                v-model="inStockOnly"
                type="checkbox"
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                @change="handleFilterChange"
              />
              <span class="ml-2 text-sm text-gray-700">In stock only</span>
            </label>
          </div>

          <!-- Clear Filters -->
          <button
            @click="clearFilters"
            class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
          >
            Clear Filters
          </button>
        </div>
      </aside>

      <!-- Product Grid -->
      <main class="flex-1">
        <!-- Sort and Results -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-4">
            <label class="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              v-model="sortBy"
              @change="handleSortChange"
              class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="popularity">Popularity</option>
              <option value="price">Price</option>
              <option value="newest">Newest</option>
              <option value="name">Name</option>
            </select>
            <button
              @click="toggleSortOrder"
              class="p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowUpIcon v-if="sortOrder === 'asc'" class="h-4 w-4" />
              <ArrowDownIcon v-else class="h-4 w-4" />
            </button>
          </div>
          
          <div class="text-sm text-gray-500">
            {{ productStore.totalCount }} products
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="productStore.loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div v-for="i in 8" :key="i" class="animate-pulse">
            <div class="bg-gray-200 aspect-square rounded-lg mb-4"></div>
            <div class="h-4 bg-gray-200 rounded mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>

        <!-- Products Grid -->
        <div v-else-if="productStore.products.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <ProductCard
            v-for="product in productStore.products"
            :key="product.id"
            :product="product"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <div class="text-gray-400 mb-4">
            <MagnifyingGlassIcon class="h-12 w-12 mx-auto" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p class="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>

        <!-- Error State -->
        <div v-if="productStore.error" class="text-center py-12">
          <div class="text-error-400 mb-4">
            <ExclamationTriangleIcon class="h-12 w-12 mx-auto" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
          <p class="text-gray-500 mb-4">{{ productStore.error }}</p>
          <button
            @click="loadProducts"
            class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
          >
            Try Again
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { MagnifyingGlassIcon, ExclamationTriangleIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/vue/24/outline'
import { useProductStore } from '@/stores/product'
import ProductCard from '@/components/ProductCard.vue'

const route = useRoute()
const productStore = useProductStore()

const searchQuery = ref('')
const priceRange = ref([0, 1000])
const inStockOnly = ref(false)
const sortBy = ref('popularity')
const sortOrder = ref('desc')

const loadProducts = async () => {
  await productStore.fetchProducts({
    search: searchQuery.value,
    priceRange: priceRange.value as [number, number],
    inStock: inStockOnly.value,
    sortBy: sortBy.value as any,
    sortOrder: sortOrder.value as any
  })
}

const handleSearch = () => {
  productStore.updateFilters({ search: searchQuery.value })
  loadProducts()
}

const handlePriceChange = () => {
  productStore.updateFilters({ priceRange: priceRange.value as [number, number] })
  loadProducts()
}

const handleFilterChange = () => {
  productStore.updateFilters({ inStock: inStockOnly.value })
  loadProducts()
}

const handleSortChange = () => {
  productStore.updateFilters({ sortBy: sortBy.value as any })
  loadProducts()
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  productStore.updateFilters({ sortOrder: sortOrder.value as any })
  loadProducts()
}

const clearFilters = () => {
  searchQuery.value = ''
  priceRange.value = [0, 1000]
  inStockOnly.value = false
  sortBy.value = 'popularity'
  sortOrder.value = 'desc'
  productStore.clearFilters()
  loadProducts()
}

// Watch for route changes (e.g., category parameter)
watch(() => route.query, (newQuery) => {
  if (newQuery.category) {
    productStore.updateFilters({ category: newQuery.category as string })
  }
  loadProducts()
}, { immediate: true })

onMounted(() => {
  loadProducts()
})
</script> 