<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="text-center">
        <h1 class="text-6xl font-bold text-primary-600">404</h1>
        <h2 class="mt-6 text-3xl font-bold text-gray-900">Page not found</h2>
        <p class="mt-2 text-lg text-gray-600">
          Sorry, we couldn't find the page you're looking for.
        </p>
      </div>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
        <div class="mb-6">
          <ExclamationTriangleIcon class="h-16 w-16 text-gray-400 mx-auto" />
        </div>
        
        <p class="text-gray-500 mb-8">
          The page you're looking for might have been moved, deleted, or you entered the wrong URL.
        </p>

        <div class="space-y-4">
          <router-link
            to="/"
            class="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-lg font-semibold text-center block transition-colors duration-200"
          >
            Go back home
          </router-link>
          
          <router-link
            to="/products"
            class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold text-center block transition-colors duration-200"
          >
            Browse products
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
</script> 