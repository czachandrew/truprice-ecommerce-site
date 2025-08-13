# Backend Architecture for PDF Quote Parsing

## Overview

This document outlines the recommended backend architecture for implementing PDF quote parsing functionality in the TruePrice ecommerce platform. The solution leverages modern AI services for efficient and accurate document processing.

## Recommended AI Services

### 1. **Primary Recommendation: Azure Document Intelligence**

**Why Azure Document Intelligence:**
- **Pre-built Models**: Excellent for structured documents like quotes and invoices
- **Custom Models**: Can train on your specific quote formats
- **Table Extraction**: Superior handling of tabular data
- **Cost Effective**: Pay-per-page pricing model
- **Enterprise Ready**: SOC 2, HIPAA compliance

**Implementation:**
```python
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential

class AzureQuoteParser:
    def __init__(self, endpoint, key):
        self.client = DocumentAnalysisClient(
            endpoint=endpoint, 
            credential=AzureKeyCredential(key)
        )
    
    async def parse_quote(self, pdf_bytes: bytes) -> QuoteData:
        poller = await self.client.begin_analyze_document(
            "prebuilt-document", pdf_bytes
        )
        result = await poller.result()
        
        return self._extract_quote_data(result)
```

### 2. **Alternative: OpenAI GPT-4 Vision API**

**Why GPT-4 Vision:**
- **Flexibility**: Handles any document format
- **Context Understanding**: Better semantic understanding
- **Structured Output**: Can return JSON directly
- **No Training Required**: Works out of the box

**Implementation:**
```python
import openai
from typing import List

class OpenAIQuoteParser:
    def __init__(self, api_key: str):
        openai.api_key = api_key
    
    async def parse_quote(self, pdf_bytes: bytes) -> QuoteData:
        # Convert PDF to base64
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """
                            Extract quote information from this PDF. Return a JSON object with:
                            {
                                "vendorName": "string",
                                "quoteNumber": "string", 
                                "date": "YYYY-MM-DD",
                                "items": [
                                    {
                                        "partNumber": "string",
                                        "description": "string",
                                        "quantity": number,
                                        "unitPrice": number,
                                        "totalPrice": number,
                                        "manufacturer": "string"
                                    }
                                ],
                                "subtotal": number,
                                "tax": number,
                                "shipping": number,
                                "total": number
                            }
                            """
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:application/pdf;base64,{pdf_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=4000
        )
        
        return json.loads(response.choices[0].message.content)
```

### 3. **Hybrid Approach (Recommended)**

Combine multiple services for optimal results:

```python
class HybridQuoteParser:
    def __init__(self, azure_client, openai_client):
        self.azure_parser = azure_client
        self.openai_parser = openai_client
    
    async def parse_quote(self, pdf_bytes: bytes) -> QuoteData:
        try:
            # Try Azure first (faster, cheaper)
            result = await self.azure_parser.parse_quote(pdf_bytes)
            if self._validate_result(result):
                return result
        except Exception:
            pass
        
        # Fallback to OpenAI (more flexible)
        return await self.openai_parser.parse_quote(pdf_bytes)
```

## Database Schema

### GraphQL Schema Extensions

```graphql
type Quote {
  id: ID!
  vendorName: String
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
  AI_SUGGESTION
}

input QuoteItemInput {
  partNumber: String!
  description: String!
  quantity: Int!
  unitPrice: Float!
  totalPrice: Float!
  manufacturer: String
  vendor: String
}

type Mutation {
  uploadQuote(file: Upload!, vendorName: String): UploadQuoteResponse!
  matchQuoteProducts(quoteId: ID!): MatchQuoteResponse!
}

type Query {
  quotes(limit: Int, offset: Int): QuoteConnection!
  quote(id: ID!): Quote
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

## Backend Implementation

### 1. **Django/Python Backend Structure**

```python
# models.py
from django.db import models
from django.contrib.auth.models import User

class Quote(models.Model):
    STATUS_CHOICES = [
        ('parsing', 'Parsing'),
        ('matched', 'Matched'),
        ('unmatched', 'Unmatched'),
        ('error', 'Error'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    vendor_name = models.CharField(max_length=255, blank=True)
    quote_number = models.CharField(max_length=255, blank=True)
    date = models.DateField()
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    shipping = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='parsing')
    pdf_file = models.FileField(upload_to='quotes/')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class QuoteItem(models.Model):
    quote = models.ForeignKey(Quote, related_name='items', on_delete=models.CASCADE)
    part_number = models.CharField(max_length=255)
    description = models.TextField()
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    manufacturer = models.CharField(max_length=255, blank=True)
    vendor = models.CharField(max_length=255, blank=True)

class ProductMatch(models.Model):
    MATCH_METHOD_CHOICES = [
        ('exact_part_number', 'Exact Part Number'),
        ('fuzzy_match', 'Fuzzy Match'),
        ('manufacturer_match', 'Manufacturer Match'),
        ('description_similarity', 'Description Similarity'),
        ('ai_suggestion', 'AI Suggestion'),
    ]
    
    quote_item = models.ForeignKey(QuoteItem, on_delete=models.CASCADE)
    product = models.ForeignKey('Product', on_delete=models.CASCADE, null=True, blank=True)
    confidence = models.FloatField()
    price_difference = models.DecimalField(max_digits=10, decimal_places=2)
    is_exact_match = models.BooleanField(default=False)
    suggested_product = models.ForeignKey('Product', on_delete=models.CASCADE, null=True, blank=True, related_name='suggestions')
    match_method = models.CharField(max_length=30, choices=MATCH_METHOD_CHOICES)
```

### 2. **Service Layer**

```python
# services/quote_parser.py
from typing import List, Optional
import asyncio
from .ai_parsers import AzureQuoteParser, OpenAIQuoteParser
from .product_matcher import ProductMatcher

class QuoteParsingService:
    def __init__(self):
        self.azure_parser = AzureQuoteParser(
            endpoint=settings.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
            key=settings.AZURE_DOCUMENT_INTELLIGENCE_KEY
        )
        self.openai_parser = OpenAIQuoteParser(
            api_key=settings.OPENAI_API_KEY
        )
        self.product_matcher = ProductMatcher()
    
    async def process_quote(self, pdf_file, vendor_name: Optional[str] = None) -> Quote:
        # 1. Parse PDF
        pdf_bytes = await pdf_file.read()
        quote_data = await self._parse_pdf(pdf_bytes)
        
        # 2. Create quote record
        quote = await self._create_quote_record(quote_data, vendor_name)
        
        # 3. Match products (async)
        asyncio.create_task(self._match_products(quote))
        
        return quote
    
    async def _parse_pdf(self, pdf_bytes: bytes) -> dict:
        try:
            # Try Azure first
            return await self.azure_parser.parse_quote(pdf_bytes)
        except Exception as e:
            logger.warning(f"Azure parsing failed: {e}")
            # Fallback to OpenAI
            return await self.openai_parser.parse_quote(pdf_bytes)
    
    async def _match_products(self, quote: Quote):
        try:
            matches = []
            for item in quote.items.all():
                match = await self.product_matcher.find_best_match(item)
                if match:
                    matches.append(match)
            
            # Update quote status
            quote.status = 'matched' if matches else 'unmatched'
            quote.save()
            
        except Exception as e:
            logger.error(f"Product matching failed: {e}")
            quote.status = 'error'
            quote.save()
```

### 3. **Product Matching Logic**

```python
# services/product_matcher.py
from difflib import SequenceMatcher
from typing import Optional
import re

class ProductMatcher:
    def __init__(self):
        self.fuzzy_threshold = 0.8
        self.description_threshold = 0.6
    
    async def find_best_match(self, quote_item: QuoteItem) -> Optional[ProductMatch]:
        # 1. Exact part number match
        exact_match = await self._find_exact_part_number_match(quote_item)
        if exact_match:
            return self._create_match(quote_item, exact_match, 1.0, 'exact_part_number')
        
        # 2. Fuzzy part number match
        fuzzy_match = await self._find_fuzzy_part_number_match(quote_item)
        if fuzzy_match and fuzzy_match.confidence > self.fuzzy_threshold:
            return self._create_match(quote_item, fuzzy_match, fuzzy_match.confidence, 'fuzzy_match')
        
        # 3. Manufacturer + description match
        manufacturer_match = await self._find_manufacturer_match(quote_item)
        if manufacturer_match:
            return self._create_match(quote_item, manufacturer_match, 0.7, 'manufacturer_match')
        
        # 4. Description similarity
        description_match = await self._find_description_match(quote_item)
        if description_match and description_match.confidence > self.description_threshold:
            return self._create_match(quote_item, description_match, description_match.confidence, 'description_similarity')
        
        return None
    
    async def _find_exact_part_number_match(self, quote_item: QuoteItem) -> Optional[Product]:
        # Clean part number
        clean_part_number = self._clean_part_number(quote_item.part_number)
        
        # Search in database
        return await Product.objects.filter(
            part_number__iexact=clean_part_number
        ).first()
    
    def _clean_part_number(self, part_number: str) -> str:
        """Remove common prefixes/suffixes and normalize"""
        # Remove common prefixes
        prefixes = ['P/N', 'PN', 'Part#', 'Part #', 'SKU', 'Item#']
        for prefix in prefixes:
            if part_number.upper().startswith(prefix):
                part_number = part_number[len(prefix):].strip()
        
        # Remove special characters
        part_number = re.sub(r'[^\w\s-]', '', part_number)
        
        return part_number.strip()
```

## API Endpoints

### 1. **Upload Quote**

```python
# views.py
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

@api_view(['POST'])
@parser_classes([MultiPartParser])
async def upload_quote(request):
    try:
        pdf_file = request.FILES.get('file')
        vendor_name = request.data.get('vendorName')
        
        if not pdf_file:
            return Response({'error': 'No file provided'}, status=400)
        
        # Validate file type
        if not pdf_file.name.lower().endswith('.pdf'):
            return Response({'error': 'Only PDF files are allowed'}, status=400)
        
        # Process quote
        quote_service = QuoteParsingService()
        quote = await quote_service.process_quote(pdf_file, vendor_name)
        
        return Response({
            'success': True,
            'quote': QuoteSerializer(quote).data
        })
        
    except Exception as e:
        logger.error(f"Quote upload failed: {e}")
        return Response({'error': 'Failed to process quote'}, status=500)
```

### 2. **Match Products**

```python
@api_view(['POST'])
async def match_quote_products(request, quote_id):
    try:
        quote = await Quote.objects.aget(id=quote_id)
        
        # Trigger product matching
        quote_service = QuoteParsingService()
        await quote_service._match_products(quote)
        
        # Refresh quote data
        await quote.arefresh_from_db()
        
        return Response({
            'success': True,
            'quote': QuoteSerializer(quote).data
        })
        
    except Quote.DoesNotExist:
        return Response({'error': 'Quote not found'}, status=404)
    except Exception as e:
        logger.error(f"Product matching failed: {e}")
        return Response({'error': 'Failed to match products'}, status=500)
```

## Performance Considerations

### 1. **Async Processing**

- Use Celery for background quote processing
- Implement webhooks for real-time status updates
- Queue management for large file processing

### 2. **Caching Strategy**

```python
# Cache parsed results to avoid re-processing
from django.core.cache import cache

class CachedQuoteParser:
    def __init__(self, parser):
        self.parser = parser
    
    async def parse_quote(self, pdf_bytes: bytes) -> QuoteData:
        # Generate cache key from PDF hash
        pdf_hash = hashlib.md5(pdf_bytes).hexdigest()
        cache_key = f"quote_parse_{pdf_hash}"
        
        # Check cache first
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result
        
        # Parse and cache
        result = await self.parser.parse_quote(pdf_bytes)
        cache.set(cache_key, result, timeout=3600)  # 1 hour
        
        return result
```

### 3. **Rate Limiting**

```python
from django_ratelimit.decorators import ratelimit

@ratelimit(key='user', rate='10/h', method='POST')
async def upload_quote(request):
    # Implementation
    pass
```

## Security Considerations

### 1. **File Validation**

```python
def validate_pdf_file(file):
    # Check file size (max 10MB)
    if file.size > 10 * 1024 * 1024:
        raise ValidationError("File size must be less than 10MB")
    
    # Check file type
    if not file.content_type == 'application/pdf':
        raise ValidationError("Only PDF files are allowed")
    
    # Scan for malware (optional)
    # scan_result = malware_scanner.scan(file)
    # if scan_result.infected:
    #     raise ValidationError("File appears to be infected")
```

### 2. **Data Privacy**

- Encrypt sensitive quote data at rest
- Implement data retention policies
- GDPR compliance for user data
- Secure API endpoints with JWT authentication

## Cost Optimization

### 1. **Service Selection Logic**

```python
class CostOptimizedParser:
    def __init__(self):
        self.azure_cost_per_page = 0.0015  # $0.0015 per page
        self.openai_cost_per_token = 0.00003  # $0.00003 per 1K tokens
    
    async def parse_quote(self, pdf_bytes: bytes) -> QuoteData:
        # Estimate costs
        page_count = self._estimate_pages(pdf_bytes)
        azure_cost = page_count * self.azure_cost_per_page
        
        # Use Azure for simple documents, OpenAI for complex ones
        if page_count <= 2 and self._is_simple_document(pdf_bytes):
            return await self.azure_parser.parse_quote(pdf_bytes)
        else:
            return await self.openai_parser.parse_quote(pdf_bytes)
```

### 2. **Batch Processing**

- Process multiple quotes in batches
- Use bulk database operations
- Implement connection pooling

## Monitoring and Analytics

### 1. **Metrics to Track**

- Quote processing success rate
- Average processing time
- Product match accuracy
- Cost per quote processed
- User engagement with quote analysis

### 2. **Error Handling**

```python
import sentry_sdk
from django.core.exceptions import ValidationError

class QuoteProcessingError(Exception):
    pass

async def process_quote_with_monitoring(pdf_file, vendor_name):
    try:
        start_time = time.time()
        result = await quote_service.process_quote(pdf_file, vendor_name)
        
        # Track success metrics
        processing_time = time.time() - start_time
        track_metric('quote.processing_time', processing_time)
        track_metric('quote.success_rate', 1)
        
        return result
        
    except Exception as e:
        # Track error metrics
        track_metric('quote.error_rate', 1)
        sentry_sdk.capture_exception(e)
        
        if isinstance(e, ValidationError):
            raise QuoteProcessingError(str(e))
        else:
            raise QuoteProcessingError("Failed to process quote")
```

## Deployment Considerations

### 1. **Environment Variables**

```bash
# Azure Document Intelligence
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_KEY=your-key

# OpenAI
OPENAI_API_KEY=your-openai-key

# File Storage
AWS_S3_BUCKET=your-quote-storage-bucket
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### 2. **Docker Configuration**

```dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application
COPY . /app
WORKDIR /app

# Run application
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "wsgi:application"]
```

## Conclusion

This architecture provides a robust, scalable solution for PDF quote parsing that leverages modern AI services while maintaining cost efficiency and performance. The hybrid approach ensures high accuracy while providing fallback options for edge cases.

The implementation integrates seamlessly with your existing Vue.js frontend and GraphQL API, providing a smooth user experience for quote analysis and product matching.
