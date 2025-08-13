<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero Section -->
    <section class="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div class="text-center">
          <h1 class="text-4xl md:text-6xl font-bold mb-6">
            Shop Smarter, 
            <span class="text-primary-200">Earn More</span>
          </h1>
          <p class="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
            Discover the true cost of products and earn money back on every purchase. 
            We're transparent about how we make money so you can make informed decisions.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <router-link
              to="/products"
              class="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold text-lg transition-colors duration-200"
            >
              Start Shopping
            </router-link>
            <router-link
              to="/transparency"
              class="border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3 rounded-lg font-semibold text-lg transition-colors duration-200"
            >
              Learn How We Work
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Categories -->
    <section class="py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-gray-900 text-center mb-12">
          Popular Categories
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div
            v-for="category in categories"
            :key="category.name"
            class="group cursor-pointer"
            @click="router.push(`/products?category=${category.slug}`)"
          >
            <div class="aspect-square bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group-hover:shadow-md transition-shadow duration-200">
              <div class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <component :is="category.icon" class="h-12 w-12 text-gray-600" />
              </div>
            </div>
            <h3 class="mt-3 text-sm font-medium text-gray-900 text-center">
              {{ category.name }}
            </h3>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-gray-900 text-center mb-12">
          Featured Products
        </h2>
        <div v-if="productStore.loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="i in 4" :key="i" class="animate-pulse">
            <div class="bg-gray-200 aspect-square rounded-lg mb-4"></div>
            <div class="h-4 bg-gray-200 rounded mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div v-else-if="productStore.featuredProducts.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ProductCard
            v-for="product in productStore.featuredProducts"
            :key="product.id"
            :product="product"
          />
        </div>
        <div v-else class="text-center text-gray-500">
          No featured products available at the moment.
        </div>
      </div>
    </section>

    <!-- Transparency Section -->
    <section class="py-16 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">
            How We Make Money
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            We believe in complete transparency. Here's exactly how our business model works.
          </p>
        </div>
        
        <div class="grid md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CurrencyDollarIcon class="h-8 w-8 text-primary-600" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">
              Affiliate Commissions
            </h3>
            <p class="text-gray-600">
              We earn a small commission when you purchase through our links. 
              This doesn't affect your price.
            </p>
          </div>
          
          <div class="text-center">
            <div class="bg-success-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <WalletIcon class="h-8 w-8 text-success-600" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">
              Share the Savings
            </h3>
            <p class="text-gray-600">
              We share a portion of our earnings with you through our wallet system. 
              The more you shop, the more you earn.
            </p>
          </div>
          
          <div class="text-center">
            <div class="bg-warning-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <ChartBarIcon class="h-8 w-8 text-warning-600" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">
              Price Transparency
            </h3>
            <p class="text-gray-600">
              We show you the true cost of products and help you find the best deals 
              across multiple retailers.
            </p>
          </div>
        </div>
        
        <div class="text-center mt-12">
          <router-link
            to="/transparency"
            class="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold"
          >
            Learn more about our business model
            <ArrowRightIcon class="ml-2 h-4 w-4" />
          </router-link>
        </div>
      </div>
    </section>

    <!-- Trust Indicators -->
    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-gray-900 mb-12">
            Why Trust TruePrice?
          </h2>
          <div class="grid md:grid-cols-4 gap-8">
            <div class="text-center">
              <ShieldCheckIcon class="h-12 w-12 text-success-600 mx-auto mb-4" />
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Secure Shopping</h3>
              <p class="text-gray-600">Your data is protected with bank-level security</p>
            </div>
            <div class="text-center">
              <ClockIcon class="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Fast Delivery</h3>
              <p class="text-gray-600">Same shipping times as shopping directly</p>
            </div>
            <div class="text-center">
              <ChatBubbleLeftRightIcon class="h-12 w-12 text-warning-600 mx-auto mb-4" />
              <h3 class="text-lg font-semibold text-gray-900 mb-2">24/7 Support</h3>
              <p class="text-gray-600">We're here to help whenever you need us</p>
            </div>
            <div class="text-center">
              <HeartIcon class="h-12 w-12 text-error-600 mx-auto mb-4" />
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Customer First</h3>
              <p class="text-gray-600">Your satisfaction is our top priority</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  CurrencyDollarIcon,
  WalletIcon,
  ChartBarIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  HomeIcon,
  TruckIcon
} from '@heroicons/vue/24/outline'
import { useProductStore } from '@/stores/product'
import ProductCard from '@/components/ProductCard.vue'

const router = useRouter()
const productStore = useProductStore()

const categories = [
  { name: 'Electronics', slug: 'electronics', icon: ComputerDesktopIcon },
  { name: 'Mobile', slug: 'mobile', icon: DevicePhoneMobileIcon },
  { name: 'Home & Garden', slug: 'home-garden', icon: HomeIcon },
  { name: 'Automotive', slug: 'automotive', icon: TruckIcon }
]

onMounted(async () => {
  await productStore.fetchFeaturedProducts()
})
</script> 