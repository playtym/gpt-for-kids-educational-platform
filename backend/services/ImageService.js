/**
 * Image Service
 * Handles image search, analysis, and context extraction
 * Can be used by multiple agents and modes
 * Uses Brave Search API as primary, Google Custom Search as fallback
 */

import { BraveImageService } from './BraveImageService.js';

export class ImageService {
  constructor(config = {}) {
    this.config = {
      safeSearch: 'active',
      maxResults: 3,
      imageSize: 'medium',
      ...config
    };
    
    // Initialize Brave Image Service
    this.braveService = new BraveImageService();
  }

  /**
   * Search for relevant images using Brave API (primary) or Google API (fallback)
   */
  async searchImages(query, options = {}) {
    try {
      // Try Brave Search API first
      const braveResults = await this.braveService.searchEducationalImages(query, {
        count: options.maxResults || this.config.maxResults,
        ageGroup: options.ageGroup || '8-10'
      });

      if (braveResults.images && braveResults.images.length > 0) {
        console.log('Using Brave Search API for images');
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

      // Fallback to Google Custom Search API
      console.log('Falling back to Google Custom Search API');
      return await this.searchImagesGoogle(query, options);

    } catch (error) {
      console.error('Error in primary image search, falling back to Google:', error);
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
        console.log('Google API credentials not configured');
        return null;
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
      console.error('Error searching for images with Google API:', error);
      return null;
    }
  }

  /**
   * Get a single relevant image for a topic
   */
  async getRelevantImage(topic, options = {}) {
    try {
      // Use Brave API directly for single image with better targeting
      if (process.env.BRAVE_API_KEY) {
        const braveResult = await this.braveService.getBestImageForTopic(topic, {
          ageGroup: options.ageGroup || '8-10',
          ...options
        });
        
        if (braveResult) {
          return {
            url: braveResult.url,
            title: braveResult.title,
            source: braveResult.domain,
            thumbnail: braveResult.thumbnailUrl,
            width: braveResult.width,
            height: braveResult.height,
            contextLink: braveResult.source,
            provider: 'brave',
            ageAppropriate: braveResult.ageAppropriate,
            educational: braveResult.educational,
            searchInfo: braveResult.searchInfo
          };
        }
      }
      
      // Fallback to regular search
      const images = await this.searchImages(topic, { maxResults: 1, ...options });
      return images && images.length > 0 ? images[0] : null;
    } catch (error) {
      console.error('Error getting relevant image:', error);
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
      console.error('Error analyzing image:', error);
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
      console.error('Error extracting educational context:', error);
      return null;
    }
  }

  /**
   * Convert image to base64 data URL (for local files)
   */
  async imageToDataUrl(imagePath) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const imageBuffer = fs.readFileSync(imagePath);
      const imageExtension = path.extname(imagePath).toLowerCase();
      
      let mimeType = 'image/jpeg';
      switch (imageExtension) {
        case '.png':
          mimeType = 'image/png';
          break;
        case '.gif':
          mimeType = 'image/gif';
          break;
        case '.webp':
          mimeType = 'image/webp';
          break;
      }
      
      const base64Image = imageBuffer.toString('base64');
      return `data:${mimeType};base64,${base64Image}`;
    } catch (error) {
      console.error('Error converting image to data URL:', error);
      return null;
    }
  }

  /**
   * Validate image URL or data URL
   */
  isValidImageUrl(url) {
    try {
      // Check if it's a data URL
      if (url.startsWith('data:image/')) {
        return true;
      }
      
      // Check if it's a valid URL
      new URL(url);
      
      // Check if it has image extension
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
      const urlLower = url.toLowerCase();
      
      return imageExtensions.some(ext => urlLower.includes(ext)) || 
             urlLower.includes('image') || 
             urlLower.includes('photo');
    } catch (error) {
      return false;
    }
  }

  /**
   * Get safe image search suggestions for a topic
   */
  getSafeSearchTerms(topic, ageGroup) {
    const safeTerms = [
      'educational',
      'safe for kids',
      'family friendly',
      'school appropriate',
      'learning'
    ];

    const ageSpecificTerms = {
      'K-2': ['cartoon', 'simple', 'colorful', 'fun'],
      '3-5': ['illustration', 'diagram', 'clear', 'bright'],
      '6-8': ['photo', 'real', 'detailed', 'scientific'],
      '9+': ['research', 'academic', 'professional', 'documentary']
    };

    const ageCat = this.categorizeAge(ageGroup);
    const ageTerms = ageSpecificTerms[ageCat] || ageSpecificTerms['6-8'];

    return `${topic} ${safeTerms.join(' ')} ${ageTerms.join(' ')}`;
  }

  /**
   * Categorize age group for image search
   */
  categorizeAge(ageGroup) {
    if (ageGroup.includes('K') || ageGroup.includes('1st') || ageGroup.includes('2nd')) {
      return 'K-2';
    } else if (ageGroup.includes('3rd') || ageGroup.includes('4th') || ageGroup.includes('5th')) {
      return '3-5';
    } else if (ageGroup.includes('6th') || ageGroup.includes('7th') || ageGroup.includes('8th')) {
      return '6-8';
    } else {
      return '9+';
    }
  }
}
