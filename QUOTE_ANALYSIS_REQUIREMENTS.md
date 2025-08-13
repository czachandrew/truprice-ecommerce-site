# Quote Analysis Feature Requirements

## Overview

Implement a PDF quote parsing and analysis system using OpenAI GPT-4 Vision API to extract pricing data from vendor quotes, match products against the existing database, and provide superior pricing recommendations.

## Core Requirements

### 1. PDF Quote Parsing
- **Technology**: OpenAI GPT-4 Vision API
- **Input**: PDF file upload (max 10MB)
- **Output**: Structured JSON with quote data
- **Required Fields**:
  - Vendor name and company
  - Quote number and date
  - Line items (part number, description, quantity, unit price, total price, manufacturer)
  - Totals (subtotal, tax, shipping, total)

### 2. Product Matching System
- **Database Integration**: Search existing product database
- **Matching Methods**:
  - Exact part number match
  - Fuzzy part number matching
  - Manufacturer + description matching
  - Description similarity matching
- **Output**: Matched products with confidence scores and price comparisons

### 3. Demo Mode Functionality
- **Purpose**: Generate superior pricing for unmatched products during demos
- **Behavior**: Create demo products with 20% better pricing than quote
- **Flagging**: Clearly identify demo-generated products and pricing
- **Toggle**: Enable/disable per request

### 4. Pricing Intelligence Storage
- **Data Collection**: Store all quote pricing data with vendor attribution
- **Confirmation Status**: Flag quote prices as unconfirmed
- **Future Use**: Build database for price negotiation intelligence

## GraphQL Schema Requirements

### New Types
```graphql
type Quote {
  id: ID!
  vendorName: String
  vendorCompany: String
  quoteNumber: String
  date: DateTime!
  items: [QuoteItem!]!
  subtotal: Float!
  tax: Float
  shipping: Float
  total: Float!
  status: QuoteStatus!
  matchedProducts: [ProductMatch!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type QuoteItem {
  id: ID!
  partNumber: String!
  description: String!
  quantity: Int!
  unitPrice: Float!
  totalPrice: Float!
  manufacturer: String
  vendor: String
  isQuotePrice: Boolean!
  priceConfidence: Float!
}

type ProductMatch {
  id: ID!
  quoteItem: QuoteItem!
  product: Product
  confidence: Float!
  priceDifference: Float!
  isExactMatch: Boolean!
  suggestedProduct: Product
  matchMethod: MatchMethod!
  isDemoPrice: Boolean!
}

enum QuoteStatus {
  PARSING
  MATCHED
  UNMATCHED
  ERROR
}

enum MatchMethod {
  EXACT_PART_NUMBER
  FUZZY_MATCH
  MANUFACTURER_MATCH
  DESCRIPTION_SIMILARITY
  DEMO_GENERATED
}
```

### Required Mutations
```graphql
type Mutation {
  uploadQuote(file: Upload!, vendorName: String, demoMode: Boolean): UploadQuoteResponse!
  matchQuoteProducts(quoteId: ID!, demoMode: Boolean): MatchQuoteResponse!
}

type UploadQuoteResponse {
  success: Boolean!
  message: String
  quote: Quote
}

type MatchQuoteResponse {
  success: Boolean!
  message: String
  quote: Quote
}
```

### Required Queries
```graphql
type Query {
  quotes(limit: Int, offset: Int): QuoteConnection!
  quote(id: ID!): Quote
}
```

## Database Requirements

### New Models Needed
1. **Quote** - Store quote metadata and totals
2. **QuoteItem** - Store individual line items from quotes
3. **ProductMatch** - Store matching results between quote items and products
4. **VendorPricing** - Store pricing intelligence from quotes

### Key Fields
- **Quote**: user, vendor info, totals, status, PDF file reference
- **QuoteItem**: part number, description, quantities, prices, manufacturer
- **ProductMatch**: confidence scores, price differences, match methods, demo flags
- **VendorPricing**: vendor company, part numbers, prices, confirmation status

## API Requirements

### File Upload Endpoint
- **Method**: POST
- **Input**: PDF file + optional vendor name + demo mode flag
- **Validation**: File type, size limits (10MB max)
- **Processing**: Async PDF parsing with OpenAI
- **Response**: Quote object with parsed data and product matches

### Product Matching Endpoint
- **Method**: POST
- **Input**: Quote ID + demo mode flag
- **Processing**: Re-run product matching with current database state
- **Response**: Updated quote with new matches

## OpenAI Integration Requirements

### Prompt Engineering
- Extract structured quote data from PDF
- Handle various vendor formats automatically
- Return consistent JSON structure
- Handle missing or unclear data gracefully

### Error Handling
- Graceful fallback for parsing failures
- Clear error messages for debugging
- Retry logic for API failures
- Logging for monitoring and debugging

## Demo Mode Requirements

### Superior Pricing Generation
- Create demo products for unmatched items
- Generate pricing 20% better than quote prices
- Maintain realistic pricing structure
- Clear identification of demo-generated content

### Demo Product Creation
- Generate realistic product data
- Create necessary related records (manufacturers, vendors)
- Assign appropriate affiliate commission rates
- Provide placeholder images

## Performance Requirements

### Processing Time
- PDF parsing: < 30 seconds for typical quotes
- Product matching: < 10 seconds
- Total response time: < 45 seconds

### Scalability
- Handle concurrent quote uploads
- Efficient database queries for product matching
- Proper indexing for performance

## Security Requirements

### File Validation
- PDF file type verification
- File size limits
- Malware scanning (optional)
- Secure file storage

### Data Privacy
- User authentication required
- Quote data isolation by user
- Secure API endpoints
- Data retention policies

## Monitoring Requirements

### Metrics to Track
- Quote processing success rate
- Average processing time
- Product match accuracy
- OpenAI API usage and costs
- Error rates and types

### Logging
- Detailed logs for debugging
- Performance monitoring
- Error tracking and alerting
- Cost monitoring for OpenAI usage

## Integration Points

### Existing Systems
- **User Authentication**: Integrate with existing auth system
- **Product Database**: Query existing product catalog
- **Cart System**: Allow adding matched products to cart
- **File Storage**: Use existing file upload infrastructure

### External Services
- **OpenAI API**: GPT-4 Vision for PDF parsing
- **File Storage**: Store uploaded PDFs securely
- **Monitoring**: Integrate with existing monitoring systems

## Testing Requirements

### Unit Tests
- OpenAI parsing logic
- Product matching algorithms
- Demo mode functionality
- Data validation

### Integration Tests
- End-to-end quote processing
- Database operations
- API endpoint functionality
- Error handling scenarios

### Demo Data
- Sample PDF quotes from different vendors
- Various quote formats and structures
- Edge cases and error conditions

## Deployment Requirements

### Environment Variables
```
OPENAI_API_KEY=your-openai-api-key
FILE_UPLOAD_MAX_SIZE=10485760  # 10MB
DEMO_MODE_ENABLED=true
```

### Dependencies
- OpenAI Python client
- PDF processing libraries
- File upload handling
- Async processing support

## Success Criteria

### MVP Demo Ready
- Successfully parse PDF quotes from multiple vendors
- Match products against existing database
- Generate superior pricing for unmatched items
- Display results in user-friendly interface
- Handle demo mode for showcasing capabilities

### Future Enhancements
- Build pricing intelligence database
- Implement vendor price tracking
- Add negotiation recommendations
- Expand to handle more document types

## Implementation Notes

### Development Approach
- Start with OpenAI integration for PDF parsing
- Implement basic product matching
- Add demo mode functionality
- Build pricing intelligence storage
- Integrate with existing GraphQL schema

### Priority Order
1. **High Priority**: PDF parsing, basic product matching, demo mode
2. **Medium Priority**: Pricing intelligence storage, advanced matching
3. **Low Priority**: Analytics, optimization, advanced features

### Risk Mitigation
- OpenAI API rate limits and costs
- PDF parsing accuracy and edge cases
- Database performance with large datasets
- Demo mode data integrity

This requirements document provides the specifications needed to implement the quote analysis feature while allowing the backend team to work within their existing architecture and patterns.
