import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { gql } from '@apollo/client/core'
import { apolloClient } from '@/plugins/apollo'

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  mainImage: string
  manufacturer: {
    name: string
  }
  offers: Array<{
    id: string
    sellingPrice: number
    vendor: {
      name: string
    }
    offerType?: string
    isInStock?: boolean
    commissionRate?: number
    expectedCommission?: number
    vendorUrl?: string
  }>
}

export interface ProductFilters {
  search: string
  category: string | null
  priceRange: [number, number]
  brands: string[]
  inStock: boolean
  sortBy: 'price' | 'popularity' | 'newest' | 'name'
  sortOrder: 'asc' | 'desc'
}

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([])
  const featuredProducts = ref<Product[]>([])
  const trendingProducts = ref<Product[]>([])
  const currentProduct = ref<Product | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalCount = ref(0)
  
  const filters = ref<ProductFilters>({
    search: '',
    category: null,
    priceRange: [0, 1000],
    brands: [],
    inStock: false,
    sortBy: 'popularity',
    sortOrder: 'desc'
  })

  const GET_PRODUCTS = gql`
    query GetProducts(
      $search: String
      $categoryId: ID
      $limit: Int
      $offset: Int
    ) {
      products(
        search: $search
        categoryId: $categoryId
        limit: $limit
        offset: $offset
      ) {
        totalCount
        items {
          id
          name
          slug
          description
          mainImage
          manufacturer {
            name
          }
          offers {
            id
            sellingPrice
            vendor {
              name
            }
            offerType
            isInStock
            commissionRate
            expectedCommission
          }
        }
      }
    }
  `

  const GET_PRODUCT = gql`
    query GetProduct($id: ID!) {
      product(id: $id) {
        id
        name
        slug
        description
        mainImage
        additionalImages
        manufacturer {
          name
        }
        offers {
          id
          sellingPrice
          vendor {
            name
          }
          offerType
          isInStock
          commissionRate
          expectedCommission
          vendorUrl
        }
        specifications
        categories {
          name
        }
        weight
        dimensions
        status
        isFeatured
      }
    }
  `

  const GET_FEATURED_PRODUCTS = gql`
    query GetFeaturedProducts($limit: Int) {
      featuredProducts(limit: $limit) {
        id
        name
        slug
        description
        mainImage
        manufacturer {
          name
        }
        offers {
          id
          sellingPrice
          vendor {
            name
          }
          offerType
          isInStock
          commissionRate
          expectedCommission
        }
      }
    }
  `

  const fetchProducts = async (params?: Partial<ProductFilters>) => {
    loading.value = true
    error.value = null
    
    try {
      const variables = {
        search: filters.value.search,
        categoryId: filters.value.category,
        limit: 20,
        offset: 0,
        ...params
      }

      console.log('Fetching products with variables:', variables)

      const { data } = await apolloClient.query({
        query: GET_PRODUCTS,
        variables
      })

      console.log('Products response:', data)

      if (data.products && data.products.items) {
        products.value = data.products.items
        totalCount.value = data.products.totalCount
      } else {
        console.error('Unexpected response structure:', data)
        error.value = 'Invalid response structure'
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch products'
      console.error('Error fetching products:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchProduct = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      const { data } = await apolloClient.query({
        query: GET_PRODUCT,
        variables: { id }
      })

      currentProduct.value = data.product
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch product'
      console.error('Error fetching product:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchFeaturedProducts = async (limit = 8) => {
    try {
      const { data } = await apolloClient.query({
        query: GET_FEATURED_PRODUCTS,
        variables: { limit }
      })

      featuredProducts.value = data.featuredProducts
    } catch (err) {
      console.error('Error fetching featured products:', err)
    }
  }

  const updateFilters = (newFilters: Partial<ProductFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const clearFilters = () => {
    filters.value = {
      search: '',
      category: null,
      priceRange: [0, 1000],
      brands: [],
      inStock: false,
      sortBy: 'popularity',
      sortOrder: 'desc'
    }
  }

  const getLowestPrice = (product: Product) => {
    try {
      if (!product?.offers || product.offers.length === 0) return null
      return Math.min(...product.offers.map(offer => offer?.sellingPrice || 0))
    } catch (error) {
      console.error('Error getting lowest price:', error)
      return null
    }
  }

  const getHighestPrice = (product: Product) => {
    try {
      if (!product?.offers || product.offers.length === 0) return null
      return Math.max(...product.offers.map(offer => offer?.sellingPrice || 0))
    } catch (error) {
      console.error('Error getting highest price:', error)
      return null
    }
  }

  return {
    products,
    featuredProducts,
    trendingProducts,
    currentProduct,
    loading,
    error,
    totalCount,
    filters,
    fetchProducts,
    fetchProduct,
    fetchFeaturedProducts,
    updateFilters,
    clearFilters,
    getLowestPrice,
    getHighestPrice
  }
}) 