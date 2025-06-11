"use strict";

// Amazon Product Advertising API integration
// You'll need to get API credentials from: https://webservices.amazon.com/paapi5/documentation/
const crypto = require('crypto');

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { searchTerms, category, maxPrice, minPrice } = JSON.parse(event.body || '{}');

    // Check for required Amazon API credentials
    const accessKey = process.env.AMAZON_ACCESS_KEY;
    const secretKey = process.env.AMAZON_SECRET_KEY;
    const partnerTag = process.env.AMAZON_PARTNER_TAG;
    const region = process.env.AMAZON_REGION || 'us-east-1';

    if (!accessKey || !secretKey || !partnerTag) {
      console.log('❌ Amazon API credentials not configured');
      return fallbackResponse(searchTerms);
    }

    // Amazon PA-API 5.0 request
    const host = 'webservices.amazon.com';
    const endpoint = '/paapi5/searchitems';
    
    const requestPayload = {
      Keywords: searchTerms,
      SearchIndex: category || 'All',
      ItemCount: 5,
      PartnerTag: partnerTag,
      PartnerType: 'Associates',
      Resources: [
        'ItemInfo.Title',
        'ItemInfo.Features',
        'ItemInfo.ContentInfo',
        'Images.Primary.Medium',
        'Offers.Listings.Price',
        'Offers.Listings.Availability.Type',
        'ItemInfo.ProductInfo',
        'BrowseNodeInfo.BrowseNodes'
      ],
      MinPrice: minPrice ? minPrice * 100 : undefined, // PA-API uses cents
      MaxPrice: maxPrice ? maxPrice * 100 : undefined
    };

    // AWS Signature Version 4 signing process
    const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const dateStamp = timestamp.substr(0, 8);
    
    const canonicalHeaders = [
      `host:${host}`,
      `x-amz-date:${timestamp}`,
      `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems`
    ].join('\n');

    const signedHeaders = 'host;x-amz-date;x-amz-target';
    const payloadHash = crypto.createHash('sha256').update(JSON.stringify(requestPayload)).digest('hex');
    
    const canonicalRequest = [
      'POST',
      endpoint,
      '',
      canonicalHeaders,
      '',
      signedHeaders,
      payloadHash
    ].join('\n');

    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${region}/ProductAdvertisingAPI/aws4_request`;
    const stringToSign = [
      algorithm,
      timestamp,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n');

    const kDate = crypto.createHmac('sha256', `AWS4${secretKey}`).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update('ProductAdvertisingAPI').digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
    const authorizationHeader = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    // Make request to Amazon PA-API
    const response = await fetch(`https://${host}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Host': host,
        'X-Amz-Date': timestamp,
        'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
        'Authorization': authorizationHeader
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      console.error('Amazon API error:', response.status, await response.text());
      return fallbackResponse(searchTerms);
    }

    const data = await response.json();
    
    // Parse Amazon response
    const products = [];
    if (data.SearchResult && data.SearchResult.Items) {
      for (const item of data.SearchResult.Items) {
        const title = item.ItemInfo?.Title?.DisplayValue || 'Unknown Product';
        const price = item.Offers?.Listings?.[0]?.Price?.DisplayAmount;
        const priceValue = item.Offers?.Listings?.[0]?.Price?.Amount / 100; // Convert from cents
        const imageUrl = item.Images?.Primary?.Medium?.URL;
        const availability = item.Offers?.Listings?.[0]?.Availability?.Type || 'Unknown';
        
        products.push({
          asin: item.ASIN,
          title,
          price: priceValue,
          priceFormatted: price,
          imageUrl,
          availability,
          detailPageURL: item.DetailPageURL,
          features: item.ItemInfo?.Features?.DisplayValues || []
        });
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        success: true,
        products,
        searchTerms,
        totalResults: products.length
      })
    };

  } catch (error) {
    console.error('Amazon product search error:', error);
    return fallbackResponse('general gifts');
  }
};

// Fallback response when Amazon API is not available
function fallbackResponse(searchTerms) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify({
      success: true,
      products: [
        {
          asin: 'B004LLIKVU',
          title: 'Amazon.com Gift Card',
          price: 25,
          priceFormatted: '$25.00',
          availability: 'Now',
          detailPageURL: 'https://amazon.com/dp/B004LLIKVU',
          features: ['Digital delivery', 'Never expires', 'Redeemable on Amazon.com']
        }
      ],
      searchTerms,
      totalResults: 1,
      fallbackUsed: true
    })
  };
}

module.exports = { handler }; 