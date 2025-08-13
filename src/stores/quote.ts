import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { gql } from '@apollo/client/core'
import { apolloClient } from '@/plugins/apollo'

export interface QuoteItem {
  id: string
  lineNumber?: number
  partNumber: string
  description: string
  manufacturer?: string
  quantity: number
  unitPrice: string | number
  totalPrice: string | number
  vendorSku?: string
  extractionConfidence: number
  matches: ProductMatch[]
  bestAlternative?: ProductMatch
  potentialSavings: string | number
  savingsPercentage: number
  hasAffiliateOption: boolean
  competitiveRisk: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface ProductMatch {
  id: string
  confidence: number
  priceDifference: string | number
  isExactMatch: boolean
  matchMethod: 'exact_part_number' | 'fuzzy_match' | 'manufacturer_match' | 'description_similarity' | 'demo_generated'
  isDemoPrice: boolean
  product?: {
    id: string
    name: string
    description: string
    manufacturer: {
      name: string
    }
    categories: Array<{
      name: string
    }>
    offers: Array<{
      id: string
      sellingPrice: string | number
      offerType: 'supplier' | 'affiliate' | 'quote'
      isConfirmed: boolean
      sourceQuote?: {
        id: string
        quoteNumber: string
      }
      vendor: {
        name: string
        code: string
      }
    }>
    affiliateLinks: Array<{
      id: string
      platform: string
      affiliateUrl: string
      commissionRate: string | number
      isActive: boolean
    }>
  }
}

export interface QuoteAnalysis {
  id: string
  status: 'uploading' | 'parsing' | 'matching' | 'completed' | 'error'
  vendorInfo: {
    name?: string
    company?: string
    quoteNumber?: string
    quoteDate?: Date
  }
  financials: {
    subtotal?: string | number
    tax?: string | number
    shipping?: string | number
    total?: string | number
  }
  items: QuoteItem[]
  summary: {
    totalItems: number
    matchedItems: number
    potentialSavings: string | number
    savingsPercentage: number
    affiliateOpportunities: number
  }
  originalFilename?: string
  createdAt: string
  updatedAt: string
  processedAt?: string
  parsingError?: string
  estimatedTimeRemaining?: number
}

export const useQuoteStore = defineStore('quote', () => {
  const quotes = ref<QuoteAnalysis[]>([])
  const currentQuote = ref<QuoteAnalysis | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const UPLOAD_QUOTE = gql`
    mutation UploadQuote($file: Upload!, $demoMode: Boolean = false) {
      uploadQuote(file: $file, demoMode: $demoMode) {
        success
        message
        quote {
          id
          status
          originalFilename
          createdAt
        }
        errors
      }
    }
  `

  const QUOTE_STATUS = gql`
    query QuoteStatus($id: ID!) {
      quote(id: $id) {
        id
        status
        vendorName
        vendorCompany
        quoteNumber
        quoteDate
        subtotal
        tax
        shipping
        total
        itemCount
        matchedItemCount
        estimatedTimeRemaining
        createdAt
        updatedAt
        processedAt
        parsingError
      }
    }
  `

  const QUOTE_ANALYSIS = gql`
    query QuoteAnalysis($id: ID!) {
      quote(id: $id) {
        id
        status
        vendorName
        vendorCompany
        quoteNumber
        quoteDate
        subtotal
        tax
        shipping
        total
        originalFilename
        parsingError
        
        items {
          id
          lineNumber
          partNumber
          description
          manufacturer
          quantity
          unitPrice
          totalPrice
          vendorSku
          extractionConfidence
          
          matches {
            id
            confidence
            priceDifference
            isExactMatch
            matchMethod
            isDemoPrice
            
            product {
              id
              name
              description
              manufacturer {
                name
              }
              categories {
                name
              }
              offers {
                id
                sellingPrice
                offerType
                isConfirmed
                sourceQuote {
                  id
                  quoteNumber
                }
                vendor {
                  name
                  code
                }
              }
              affiliateLinks {
                id
                platform
                affiliateUrl
                commissionRate
                isActive
              }
            }
          }
        }
      }
    }
  `

  const MY_QUOTES = gql`
    query MyQuotes {
      myQuotes {
        id
        vendorCompany
        quoteNumber
        total
        status
        itemCount
        matchedItemCount
        createdAt
      }
    }
  `

  const uploadQuote = async (file: File, demoMode: boolean = false) => {
    if (!file) {
      throw new Error('No file provided')
    }
    
    loading.value = true
    error.value = null
    
    try {
      // Use REST endpoint for file upload instead of GraphQL
      const formData = new FormData()
      formData.append('file', file)
      formData.append('demoMode', demoMode.toString())
      
      const token = localStorage.getItem('auth_token')
      
      const headers = {
        'Authorization': token ? `JWT ${token}` : '',
      }
      
      const response = await fetch('https://tru-prime-f4f949ce5752.herokuapp.com/upload-quote/', {
        method: 'POST',
        body: formData,
        headers,
        mode: 'cors',
      })
      
      if (!response.ok) {
        // Try to get more details about the error
        let errorMessage = `Upload failed: ${response.statusText}`
        try {
          const errorData = await response.json()
          console.log('Error response:', errorData)
          errorMessage = errorData.message || errorData.detail || errorMessage
        } catch (e) {
          console.log('Could not parse error response as JSON')
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()

      if (data.success) {
        const quote = data.quote
        
        // Add to quotes array immediately
        quotes.value = [quote, ...quotes.value]
        
        // Start polling for this quote
        pollQuoteStatus(quote.id)
        
        return quote
      } else {
        error.value = data.message
        throw new Error(data.message)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to upload quote'
      console.error('Error uploading quote:', err)
      throw err
    } finally {
      loading.value = false
    }
  }



  // Track which quotes are being polled to avoid duplicate polling
  const pollingQuotes = new Set<string>()

  const pollQuoteStatus = async (quoteId: string): Promise<QuoteAnalysis> => {
    const POLL_INTERVAL = 2000 // 2 seconds
    const MAX_POLLS = 150 // 5 minutes max
    let pollCount = 0

    const poll = async () => {
      try {
        console.log(`🔄 Polling quote ${quoteId} (attempt ${pollCount + 1})`)
        
        const { data } = await apolloClient.query({
          query: QUOTE_STATUS,
          variables: { id: quoteId },
          fetchPolicy: 'no-cache' // Always fetch fresh data
        })

        const quote = data.quote
        console.log(`📊 Quote ${quoteId} status: ${quote.status}`)
        
        // Update the quote in the quotes array - use reactive array update
        const quoteIndex = quotes.value.findIndex(q => q.id === quoteId)
        if (quoteIndex !== -1) {
          // Create a new array to ensure reactivity
          const updatedQuotes = [...quotes.value]
          updatedQuotes[quoteIndex] = { ...updatedQuotes[quoteIndex], ...quote }
          quotes.value = updatedQuotes
          console.log(`🔄 Updated quote ${quoteId} in store:`, quote.status)
        } else {
          console.warn(`⚠️ Quote ${quoteId} not found in store`)
        }
        
        // Check if processing is complete
        if (quote.status === 'completed') {
          console.log('✅ Quote processing completed!')
          
          // Load full quote data
          try {
            const fullQuote = await fetchQuoteAnalysis(quoteId)
            if (quoteIndex !== -1) {
              quotes.value[quoteIndex] = fullQuote
            }
          } catch (err) {
            console.error('Error loading full quote data:', err)
          }
          
          return
        }
        
        // Check for errors
        if (quote.status === 'error') {
          console.error('❌ Quote processing failed:', quote.parsingError)
          error.value = quote.parsingError || 'Quote processing failed'
          return
        }
        
        // Continue polling if still processing
        if (['uploading', 'parsing', 'matching'].includes(quote.status)) {
          pollCount++
          if (pollCount < MAX_POLLS) {
            setTimeout(poll, POLL_INTERVAL)
          } else {
            console.warn('⏰ Polling timeout - quote may still be processing')
          }
        }
        
      } catch (pollError) {
        console.error('Polling error:', pollError)
        // Retry with exponential backoff
        setTimeout(poll, POLL_INTERVAL * 2)
      }
    }

    // Start polling immediately if not already polling
    if (!pollingQuotes.has(quoteId)) {
      pollingQuotes.add(quoteId)
      poll()
    }
    
    // Return initial quote for immediate use
    return quotes.value.find(q => q.id === quoteId) || null
  }

  // Function to manually check quote status (for QuoteProcessor)
  const checkQuoteStatus = async (quoteId: string): Promise<QuoteAnalysis | null> => {
    try {
      const { data } = await apolloClient.query({
        query: QUOTE_STATUS,
        variables: { id: quoteId },
        fetchPolicy: 'no-cache'
      })
      
      const quote = data.quote
      
      // Update the quote in the quotes array - use reactive array update
      const quoteIndex = quotes.value.findIndex(q => q.id === quoteId)
      if (quoteIndex !== -1) {
        // Create a new array to ensure reactivity
        const updatedQuotes = [...quotes.value]
        updatedQuotes[quoteIndex] = { ...updatedQuotes[quoteIndex], ...quote }
        quotes.value = updatedQuotes
        console.log(`🔄 Updated quote ${quoteId} in store:`, quote.status)
      } else {
        console.warn(`⚠️ Quote ${quoteId} not found in store`)
      }
      
      return quote
    } catch (err) {
      console.error('Error checking quote status:', err)
      return null
    }
  }

  const fetchQuoteAnalysis = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      const { data } = await apolloClient.query({
        query: QUOTE_ANALYSIS,
        variables: { id }
      })

      console.log('🔍 Raw GraphQL response:', data.quote)
      
      // Transform the data to match the QuoteAnalysis interface
      const transformedQuote: QuoteAnalysis = {
        id: data.quote.id,
        status: data.quote.status.toLowerCase() as any,
        vendorInfo: {
          name: data.quote.vendorName,
          company: data.quote.vendorCompany,
          quoteNumber: data.quote.quoteNumber,
          quoteDate: data.quote.quoteDate ? new Date(data.quote.quoteDate) : undefined
        },
        financials: {
          subtotal: data.quote.subtotal,
          tax: data.quote.tax,
          shipping: data.quote.shipping,
          total: data.quote.total
        },
        items: (data.quote.items || []).map((item: any) => ({
          ...item,
          bestAlternative: item.matches && item.matches.length > 0 ? item.matches[0] : undefined,
          potentialSavings: item.matches && item.matches.length > 0 ? 
            Math.abs(Number(item.matches[0].priceDifference)) : 0,
          savingsPercentage: item.matches && item.matches.length > 0 ? 
            (Math.abs(Number(item.matches[0].priceDifference)) / Number(item.totalPrice)) * 100 : 0,
          hasAffiliateOption: item.matches && item.matches.some((match: any) => 
            match.product?.affiliateLinks && match.product.affiliateLinks.length > 0
          ),
          competitiveRisk: item.matches && item.matches.length > 0 ? 'LOW' : 'HIGH'
        })),
        summary: {
          totalItems: data.quote.itemCount || (data.quote.items || []).length,
          matchedItems: data.quote.matchedItemCount || (data.quote.items || []).filter((item: any) => 
            item.matches && item.matches.length > 0
          ).length,
          potentialSavings: (data.quote.items || []).reduce((total: number, item: any) => {
            if (item.matches && item.matches.length > 0) {
              return total + Math.abs(Number(item.matches[0].priceDifference))
            }
            return total
          }, 0),
          savingsPercentage: data.quote.total ? 
            ((data.quote.items || []).reduce((total: number, item: any) => {
              if (item.matches && item.matches.length > 0) {
                return total + Math.abs(Number(item.matches[0].priceDifference))
              }
              return total
            }, 0) / Number(data.quote.total)) * 100 : 0,
          affiliateOpportunities: (data.quote.items || []).filter((item: any) => 
            item.matches && item.matches.some((match: any) => 
              match.product?.affiliateLinks && match.product.affiliateLinks.length > 0
            )
          ).length
        },
        originalFilename: data.quote.originalFilename,
        createdAt: data.quote.createdAt || new Date().toISOString(),
        updatedAt: data.quote.updatedAt || new Date().toISOString(),
        processedAt: data.quote.processedAt || new Date().toISOString(),
        parsingError: data.quote.parsingError,
        estimatedTimeRemaining: data.quote.estimatedTimeRemaining
      }

      console.log('🔍 Transformed quote:', transformedQuote)
      
      currentQuote.value = transformedQuote
      return transformedQuote
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch quote analysis'
      console.error('Error fetching quote analysis:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchMyQuotes = async () => {
    loading.value = true
    error.value = null
    
    try {
      console.log('Fetching quotes with query:', MY_QUOTES)
      const { data } = await apolloClient.query({
        query: MY_QUOTES,
        fetchPolicy: 'no-cache', // Try no-cache instead
        errorPolicy: 'all'
      })

      console.log('Quotes data received:', data)

      if (data && data.myQuotes) {
        // Show all quotes
        quotes.value = data.myQuotes
      } else {
        quotes.value = []
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch quotes'
      console.error('Error fetching quotes:', err)
      console.error('Error details:', JSON.stringify(err, null, 2))
    } finally {
      loading.value = false
    }
  }

  const getQuoteStats = computed(() => {
    if (!currentQuote.value) return null
    
    const totalItems = currentQuote.value.items?.length || 0
    const matchedItems = currentQuote.value.items?.filter(item => 
      item.matches && item.matches.length > 0
    ).length || 0
    
    const potentialSavings = currentQuote.value.items?.reduce((total, item) => {
      return total + (item.potentialSavings || 0)
    }, 0) || 0

    const affiliateOpportunities = currentQuote.value.items?.filter(item => 
      item.hasAffiliateOption
    ).length || 0

    return {
      totalItems,
      matchedItems,
      matchRate: totalItems > 0 ? (matchedItems / totalItems) * 100 : 0,
      potentialSavings,
      affiliateOpportunities
    }
  })

  return {
    quotes,
    currentQuote,
    loading,
    error,
    uploadQuote,
    pollQuoteStatus,
    checkQuoteStatus,
    fetchQuoteAnalysis,
    fetchMyQuotes,
    getQuoteStats
  }
})
