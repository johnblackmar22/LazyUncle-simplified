# Amazon Product Advertising API Setup for Accurate ASINs

## The Problem We're Solving

Previously, the gift recommendation system was asking OpenAI to generate ASINs, but **the AI was making them up**! This means when you try to order products, the ASINs might not exist or might point to completely different products.

## The Solution: Real Amazon Integration

We've implemented Amazon's Product Advertising API (PA-API) to get **real, accurate ASINs** for actual products.

## How It Works Now

1. **AI generates creative search terms** based on the recipient's profile
2. **Amazon PA-API searches for real products** using those terms
3. **Real ASINs are returned** with accurate pricing and availability
4. **Fallback to gift cards** if no products are found

## Setup Instructions

### Step 1: Apply for Amazon Associates Program

1. Go to [Amazon Associates](https://affiliate-program.amazon.com/)
2. Apply for the program (you need a website/app)
3. Wait for approval (can take 1-3 days)

### Step 2: Get PA-API Access

1. Once approved for Associates, go to [PA-API Documentation](https://webservices.amazon.com/paapi5/documentation/)
2. Request access to Product Advertising API
3. You'll receive:
   - `Access Key` (like a username)
   - `Secret Key` (like a password)
   - `Associate Tag` (your affiliate ID)

### Step 3: Configure Environment Variables

Add these to your `.env` file:

```bash
AMAZON_ACCESS_KEY=your_access_key_here
AMAZON_SECRET_KEY=your_secret_key_here  
AMAZON_PARTNER_TAG=your_associate_tag_here
AMAZON_REGION=us-east-1
```

### Step 4: Deploy and Test

1. Deploy your Netlify functions
2. Test gift recommendations
3. Check that ASINs are real by clicking "View on Amazon"

## Alternative Solutions (If Amazon API Not Available)

### Option 2: Manual ASIN Database
Create a curated database of known good ASINs:

```javascript
const CURATED_ASINS = {
  'headphones': ['B08PZHYWJS', 'B0756CYWWD'], // Real Sony, Bose ASINs
  'books': ['B01KWOKM6K', 'B00X47ZVXM'], // Real bestseller ASINs
  'coffee': ['B07C61C8RH', 'B01M0UMI1M'] // Real coffee product ASINs
};
```

### Option 3: Web Scraping (Use Carefully)
- Scrape Amazon search results for ASINs
- **Note**: Check Amazon's Terms of Service
- Use rate limiting to avoid blocking

### Option 4: Third-Party APIs
- RapidAPI Amazon products
- Rainforest API
- eBay Product API as backup

## Testing the Integration

1. Generate gift recommendations
2. Check that ASINs are in format: `B[0-9A-Z]{9}` (10 characters total)
3. Verify Amazon links work: `https://amazon.com/dp/{ASIN}`
4. Test ordering flow with real products

## Monitoring

- Check Netlify function logs for Amazon API errors
- Monitor ASIN accuracy rates
- Set up alerts for fallback usage

## Benefits of Real ASINs

✅ **Accurate pricing** - No surprises when ordering  
✅ **Real availability** - Know if items are in stock  
✅ **Proper shipping** - Accurate delivery estimates  
✅ **Customer trust** - No broken product links  
✅ **Auto-ordering** - Can actually purchase the items  

## Cost Considerations

- Amazon PA-API: Free (up to 8,640 requests/day)
- Amazon Associates: 0-10% commission on sales
- OpenAI API: $0.0010-0.0020 per 1K tokens

The combination gives you the best of both worlds: AI creativity + real product data! 