import { Logger } from '../utils/Logger.js';

/**
 * Brave Search API Service for Educational Image Search
 * Provides safe, educational images for children's learning content
 */
export class BraveImageService {
  constructor() {
    this.apiKey = process.env.BRAVE_API_KEY;
    this.baseUrl = 'https://api.search.brave.com/res/v1/images/search';
    this.safesearch = 'strict'; // Always use strict safesearch for kids
  }

  /**
   * Search for educational images using Brave Search API
   * @param {string} query - Search query for images
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Search results with image URLs and metadata
   */
  async searchEducationalImages(query, options = {}) {
    try {
      if (!this.apiKey) {
        Logger.warn('Brave API key not configured, skipping image search');
        return { images: [], source: 'no-api-key' };
      }

      // Temporarily disable Brave API to test system stability
      if (process.env.DISABLE_BRAVE_API === 'true') {
        Logger.info('Brave API disabled via environment variable');
        return { images: [], source: 'disabled' };
      }

      const {
        count = 5,
        ageGroup = '8-10',
        safetylevel = 'strict',
        freshness = 'all', // all, day, week, month, year
        size = 'medium' // small, medium, large, xlarge
      } = options;

      // Enhance query for educational content
      const educationalQuery = this.enhanceQueryForEducation(query, ageGroup);

      const params = new URLSearchParams({
        q: educationalQuery,
        count: count.toString(),
        safesearch: 'strict', // Always strict for kids
        freshness,
        size,
        format: 'json'
      });

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'GET',
        headers: {
          'X-Subscription-Token': this.apiKey,
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

        // Handle rate limiting gracefully
        if (response.status === 429) {
          Logger.warn('Brave API rate limit exceeded, returning empty results');
          return { images: [], source: 'brave-rate-limited', query: educationalQuery };
        }

        // Handle validation errors gracefully
        if (response.status === 422) {
          Logger.warn('Brave API validation error, likely query too long, returning empty results');
          return { images: [], source: 'brave-validation-error', query: educationalQuery };
        }

        // Handle all other errors gracefully - don't throw exceptions
        Logger.warn(`Brave API error ${response.status}, returning empty results`);
        return { images: [], source: 'brave-error', query: educationalQuery, error: response.statusText };
      }

      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        Logger.info('No images found for query:', educationalQuery);
        return { images: [], source: 'brave', query: educationalQuery };
      }

      // Process and filter results for educational appropriateness
      const processedImages = this.processImageResults(data.results, ageGroup);

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
      // Always return a safe result instead of throwing
      return { 
        images: [], 
        source: 'brave-error', 
        error: error.message,
        query 
      };
    }
  }

  /**
   * Enhance search query for educational content
   * @param {string} query - Original search query
   * @param {string} ageGroup - Target age group
   * @returns {string} - Enhanced query
   */
  enhanceQueryForEducation(query, ageGroup) {
    // Limit to most essential trusted sources to keep query under 400 chars
    const trustedSources = [
      'site:wikipedia.org',
      'site:nationalgeographic.com',
      'site:nasa.gov',
      'site:education.com'
    ].join(' OR ');

    // Add educational context based on age group (shorter versions)
    const ageEnhancements = {
      '5-7': 'simple diagram kids',
      '8-10': 'educational diagram kids',
      '11-13': 'educational scientific diagram',
      '14-17': 'scientific diagram academic'
    };

    const ageContext = ageEnhancements[ageGroup] || 'educational diagram';
    
    // Create enhanced query with length limit check
    const baseQuery = `(${trustedSources}) ${query} ${ageContext} educational safe`;
    
    // Ensure query stays under 400 characters
    if (baseQuery.length > 400) {
      // Fallback to simpler query if too long
      return `${query} ${ageContext} educational safe`.substring(0, 400);
    }
    
    return baseQuery;
  }

  /**
   * Process and filter image results for educational appropriateness
   * @param {Array} results - Raw results from Brave API
   * @param {string} ageGroup - Target age group
   * @returns {Array} - Processed image objects
   */
  processImageResults(results, ageGroup) {
    return results
      .filter(result => this.isEducationallyAppropriate(result))
      .slice(0, 3) // Limit to top 3 most relevant
      .map(result => ({
        url: result.src,
        thumbnailUrl: result.thumbnail?.src || result.src,
        title: result.title || 'Educational Image',
        description: result.description || '',
        width: result.properties?.width || null,
        height: result.properties?.height || null,
        source: result.page_url || '',
        domain: this.extractDomain(result.page_url || ''),
        ageAppropriate: this.calculateAgeAppropriateness(result, ageGroup),
        educational: true
      }));
  }

  /**
   * Check if image result is educationally appropriate
   * @param {Object} result - Image result from API
   * @returns {boolean} - Whether the image is appropriate
   */
  isEducationallyAppropriate(result) {
    const title = (result.title || '').toLowerCase();
    const description = (result.description || '').toLowerCase();
    const url = (result.src || '').toLowerCase();
    const pageUrl = (result.page_url || '').toLowerCase();

    // High-priority educational domains
    const trustedEducationalDomains = [
      'wikipedia.org',
      'nationalgeographic.com',
      'nasa.gov',
      'education.com',
      'scholastic.com',
      'kids.nationalgeographic.com',
      'britannica.com',
      'smithsonian.com',
      'pbs.org',
      'khanacademy.org',
      'scienceforkidsclub.com',
      'dkfindout.com',
      'natgeokids.com',
      'kids.britannica.com',
      'coolkidfacts.com',
      'sciencekids.co.nz'
    ];

    // Educational institutions and museums
    const educationalInstitutions = [
      '.edu',
      'museum',
      'library',
      'university',
      'school',
      'science.org',
      'nature.com'
    ];

    // Check for trusted educational domains (highest priority)
    const isFromTrustedSite = trustedEducationalDomains.some(domain => 
      pageUrl.includes(domain)
    );

    // Check for educational institutions
    const isFromEducationalInstitution = educationalInstitutions.some(term => 
      pageUrl.includes(term)
    );

    // Strong educational keywords
    const strongEducationalKeywords = [
      'educational', 'learning', 'school', 'science', 'kids', 'children',
      'diagram', 'illustration', 'infographic', 'lesson', 'teaching',
      'study', 'facts', 'encyclopedia', 'discovery', 'experiment'
    ];

    const hasStrongEducationalKeywords = strongEducationalKeywords.some(keyword =>
      title.includes(keyword) || description.includes(keyword)
    );

    // Exclude inappropriate content more strictly
    const inappropriateKeywords = [
      'scary', 'horror', 'violent', 'adult', 'inappropriate', 'dangerous',
      'weapon', 'war', 'death', 'accident', 'disaster', 'tragedy'
    ];

    const hasInappropriateContent = inappropriateKeywords.some(keyword =>
      title.includes(keyword) || description.includes(keyword) || pageUrl.includes(keyword)
    );

    // Prioritize trusted sources
    if (isFromTrustedSite) return !hasInappropriateContent;
    if (isFromEducationalInstitution) return hasStrongEducationalKeywords && !hasInappropriateContent;
    
    // For other sources, require strong educational keywords
    return hasStrongEducationalKeywords && !hasInappropriateContent;
  }

  /**
   * Calculate age appropriateness score
   * @param {Object} result - Image result
   * @param {string} ageGroup - Target age group
   * @returns {number} - Appropriateness score (0-1)
   */
  calculateAgeAppropriateness(result, ageGroup) {
    let score = 0.5; // Base score

    const title = (result.title || '').toLowerCase();
    const description = (result.description || '').toLowerCase();

    // Age-specific keywords
    const ageKeywords = {
      '5-7': ['simple', 'basic', 'cartoon', 'colorful', 'fun'],
      '8-10': ['kids', 'elementary', 'diagram', 'illustration'],
      '11-13': ['middle school', 'students', 'science', 'detailed'],
      '14-17': ['high school', 'advanced', 'complex', 'detailed']
    };

    const relevantKeywords = ageKeywords[ageGroup] || [];
    const keywordMatches = relevantKeywords.filter(keyword =>
      title.includes(keyword) || description.includes(keyword)
    ).length;

    score += keywordMatches * 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Extract domain from URL
   * @param {string} url - Full URL
   * @returns {string} - Domain name
   */
  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get the best image for a topic
   * @param {string} topic - Topic to search for
   * @param {Object} options - Search options
   * @returns {Promise<Object|null>} - Best image result or null
   */
  async getBestImageForTopic(topic, options = {}) {
    const results = await this.searchEducationalImages(topic, { ...options, count: 1 });
    
    if (results.images && results.images.length > 0) {
      return {
        ...results.images[0],
        searchInfo: {
          query: results.query,
          source: results.source,
          totalResults: results.totalResults
        }
      };
    }

    return null;
  }

  /**
   * Test the API connection
   * @returns {Promise<boolean>} - Whether API is working
   */
  async testConnection() {
    try {
      const result = await this.searchEducationalImages('test educational', { count: 1 });
      return result.source === 'brave' && !result.error;
    } catch (error) {
      Logger.error('Brave API connection test failed:', error);
      return false;
    }
  }
}
