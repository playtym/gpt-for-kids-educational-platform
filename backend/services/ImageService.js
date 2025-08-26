/**
 * Image Service
 * Handles image search, analysis, and context extraction.
 * Consolidates image provider logic, using Brave Search API as primary and Google Custom Search as a fallback.
 */
import { Logger } from '../utils/Logger.js';

export class ImageService {
  constructor(config = {}) {
    this.config = {
      safeSearch: 'active',
      maxResults: 3,
      imageSize: 'medium',
      ...config
    };

    // Brave Search API configuration
    this.braveApiKey = process.env.BRAVE_API_KEY;
    this.braveBaseUrl = 'https://api.search.brave.com/res/v1/images/search';
  }

  // --- Private Brave Search Methods ---

  /**
   * Search for educational images using Brave Search API.
   * @private
   */
  async _searchBrave(query, options = {}) {
    try {
      if (!this.braveApiKey) {
        Logger.warn('Brave API key not configured, skipping image search.');
        return { images: [], source: 'no-api-key' };
      }

      if (process.env.DISABLE_BRAVE_API === 'true') {
        Logger.info('Brave API disabled via environment variable.');
        return { images: [], source: 'disabled' };
      }

      const {
        count = 5,
        ageGroup = '8-10',
        freshness = 'all',
        size = 'medium'
      } = options;

      const educationalQuery = this._enhanceQueryForEducation(query, ageGroup);

      const params = new URLSearchParams({
        q: educationalQuery,
        count: count.toString(),
        safesearch: 'strict',
        freshness,
        size,
        format: 'json'
      });

      const response = await fetch(`${this.braveBaseUrl}?${params}`, {
        method: 'GET',
        headers: {
          'X-Subscription-Token': this.braveApiKey,
          'Accept': 'application/json',
          'User-Agent': 'GPT-for-Kids-Educational-Platform/2.0.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        Logger.error('Brave API request failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        if (response.status === 429) {
          return { images: [], source: 'brave-rate-limited', query: educationalQuery };
        }
        if (response.status === 422) {
          return { images: [], source: 'brave-validation-error', query: educationalQuery };
        }
        return { images: [], source: 'brave-error', query: educationalQuery, error: response.statusText };
      }

      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        Logger.info('No images found for query:', educationalQuery);
        return { images: [], source: 'brave', query: educationalQuery };
      }

      const processedImages = this._processImageResults(data.results, ageGroup);

      Logger.info('Brave image search successful:', {
        originalQuery: query,
        enhancedQuery: educationalQuery,
        resultsCount: processedImages.length,
        ageGroup
      });

      return {
        images: processedImages,
        source: 'brave',
        query: educationalQuery,
        totalResults: data.results.length
      };

    } catch (error) {
      Logger.error('Error in Brave image search:', error.message);
      return { 
        images: [], 
        source: 'brave-error', 
        error: error.message,
        query 
      };
    }
  }

  /**
   * Enhance search query for educational content for Brave API.
   * @private
   */
  _enhanceQueryForEducation(query, ageGroup) {
    const trustedSources = [
      'site:wikipedia.org',
      'site:nationalgeographic.com',
      'site:nasa.gov',
      'site:education.com'
    ].join(' OR ');

    const ageEnhancements = {
      '5-7': 'simple diagram kids',
      '8-10': 'educational diagram kids',
      '11-13': 'educational scientific diagram',
      '14-17': 'scientific diagram academic'
    };

    const ageContext = ageEnhancements[ageGroup] || 'educational diagram';
    const baseQuery = `(${trustedSources}) ${query} ${ageContext} educational safe`;
    
    if (baseQuery.length > 400) {
      return `${query} ${ageContext} educational safe`.substring(0, 400);
    }
    
    return baseQuery;
  }

  /**
   * Process and filter Brave image results for educational appropriateness.
   * @private
   */
  _processImageResults(results, ageGroup) {
    return results
      .filter(result => this._isEducationallyAppropriate(result))
      .slice(0, 3)
      .map(result => ({
        url: result.src,
        thumbnailUrl: result.thumbnail?.src || result.src,
        title: result.title || 'Educational Image',
        description: result.description || '',
        width: result.properties?.width || null,
        height: result.properties?.height || null,
        source: result.page_url || '',
        domain: this._extractDomain(result.page_url || ''),
        ageAppropriate: this._calculateAgeAppropriateness(result, ageGroup),
        educational: true
      }));
  }

  /**
   * Check if an image result is educationally appropriate.
   * @private
   */
  _isEducationallyAppropriate(result) {
    const title = (result.title || '').toLowerCase();
    const description = (result.description || '').toLowerCase();
    const pageUrl = (result.page_url || '').toLowerCase();

    const trustedEducationalDomains = [
      'wikipedia.org', 'nationalgeographic.com', 'nasa.gov', 'education.com',
      'scholastic.com', 'kids.nationalgeographic.com', 'britannica.com',
      'smithsonian.com', 'pbs.org', 'khanacademy.org'
    ];

    const inappropriateKeywords = [
      'scary', 'horror', 'violent', 'adult', 'inappropriate', 'dangerous'
    ];

    if (inappropriateKeywords.some(keyword => title.includes(keyword) || description.includes(keyword))) {
      return false;
    }

    return trustedEducationalDomains.some(domain => pageUrl.includes(domain));
  }

  /**
   * Calculate age appropriateness score.
   * @private
   */
  _calculateAgeAppropriateness(result, ageGroup) {
    let score = 0.5;
    const title = (result.title || '').toLowerCase();
    const ageKeywords = {
      '5-7': ['simple', 'cartoon', 'colorful'],
      '8-10': ['kids', 'elementary', 'diagram'],
      '11-13': ['middle school', 'science', 'detailed'],
      '14-17': ['high school', 'advanced', 'complex']
    };
    const relevantKeywords = ageKeywords[ageGroup] || [];
    if (relevantKeywords.some(keyword => title.includes(keyword))) {
      score += 0.3;
    }
    return Math.min(score, 1.0);
  }

  /**
   * Extract domain from URL.
   * @private
   */
  _extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Test the Brave API connection.
   * @public
   */
  async testBraveConnection() {
    try {
      const result = await this._searchBrave('test educational', { count: 1 });
      return result.source === 'brave' && !result.error;
    } catch (error) {
      Logger.error('Brave API connection test failed:', error);
      return false;
    }
  }

  // --- Public Methods ---

  /**
   * Search for relevant images using Brave API (primary) or Google API (fallback).
   */
  async searchImages(query, options = {}) {
    try {
      const braveResults = await this._searchBrave(query, {
        count: options.maxResults || this.config.maxResults,
        ageGroup: options.ageGroup || '8-10'
      });

      if (braveResults.images && braveResults.images.length > 0) {
        Logger.info('Using Brave Search API for images');
        return braveResults.images.map(img => ({
          url: img.url,
          title: img.title,
          source: img.domain,
          thumbnail: img.thumbnailUrl,
          width: img.width,
          height: img.height,
          contextLink: img.source,
          provider: 'brave',
          ageAppropriate: img.ageAppropriate,
          educational: img.educational
        }));
      }

      Logger.warn('Brave search failed or returned no results, falling back to Google Custom Search.');
      return await this.searchImagesGoogle(query, options);

    } catch (error) {
      Logger.error('Error in primary image search, falling back to Google:', error);
      return await this.searchImagesGoogle(query, options);
    }
  }

  /**
   * Search for relevant images using Google Custom Search API (fallback)
   */
  async searchImagesGoogle(query, options = {}) {
    try {
      const searchQuery = `${query} educational safe for kids`;
      const apiKey = process.env.GOOGLE_API_KEY;
      const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

      if (!apiKey || !searchEngineId) {
        // Image search disabled - credentials not configured
        Logger.warn('Google API credentials not configured, cannot perform image search.');
        return [];
      }

      const searchParams = new URLSearchParams({
        key: apiKey,
        cx: searchEngineId,
        q: searchQuery,
        searchType: 'image',
        safe: this.config.safeSearch,
        num: options.maxResults || this.config.maxResults,
        imgSize: options.imageSize || this.config.imageSize,
        imgType: 'photo',
        rights: 'cc_publicdomain,cc_attribute,cc_sharealike,cc_noncommercial'
      });

      const searchUrl = `https://www.googleapis.com/customsearch/v1?${searchParams}`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        return data.items.map(item => ({
          url: item.link,
          title: item.title,
          source: item.displayLink,
          thumbnail: item.image?.thumbnailLink || item.link,
          width: item.image?.width,
          height: item.image?.height,
          contextLink: item.image?.contextLink,
          provider: 'google',
          ageAppropriate: 0.8, // Default for Google filtered results
          educational: true
        }));
      }

      return [];
    } catch (error) {
      Logger.error('Error searching for images with Google API:', error);
      return [];
    }
  }

  /**
   * Get a single relevant image for a topic
   */
  async getRelevantImage(topic, options = {}) {
    try {
      if (this.braveApiKey) {
        const results = await this._searchBrave(topic, { ...options, count: 1 });
        if (results.images && results.images.length > 0) {
          const bestImage = results.images[0];
          return {
            url: bestImage.url,
            title: bestImage.title,
            source: bestImage.domain,
            thumbnail: bestImage.thumbnailUrl,
            width: bestImage.width,
            height: bestImage.height,
            contextLink: bestImage.source,
            provider: 'brave',
            ageAppropriate: bestImage.ageAppropriate,
            educational: bestImage.educational,
            searchInfo: {
              query: results.query,
              source: results.source,
              totalResults: results.totalResults
            }
          };
        }
      }
      
      Logger.warn('Brave search for single image failed, falling back to Google.');
      const images = await this.searchImagesGoogle(topic, { maxResults: 1, ...options });
      return images && images.length > 0 ? images[0] : null;
    } catch (error) {
      Logger.error('Error getting relevant image:', error);
      return null;
    }
  }

  /**
   * Analyze image content using OpenAI Vision API
   */
  async analyzeImage(imageUrl, prompt = "Describe what you see in this image", openaiClient) {
    try {
      if (!openaiClient) {
        throw new Error('OpenAI client required for image analysis');
      }

      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      return completion.choices[0]?.message?.content || 'Unable to analyze image';
    } catch (error) {
      Logger.error('Error analyzing image:', error);
      return 'Unable to analyze image at this time';
    }
  }

  /**
   * Extract educational context from an image
   */
  async extractEducationalContext(imageUrl, ageGroup, openaiClient) {
    try {
      const prompt = `Analyze this image and extract educational context suitable for ${ageGroup}. 
      Focus on:
      1. What subjects or topics this relates to
      2. Key learning concepts visible
      3. Age-appropriate discussion points
      4. Potential follow-up questions
      
      Format your response as:
      SUBJECTS: [list of relevant subjects]
      CONCEPTS: [key learning concepts]
      DISCUSSION: [age-appropriate points]
      QUESTIONS: [potential follow-up questions]`;

      return await this.analyzeImage(imageUrl, prompt, openaiClient);
    } catch (error) {
      Logger.error('Error extracting educational context:', error);
      return null;
    }
  }
}
