/**
 * Content Safety Manager
 * Handles dual AI provider safety validation with comprehensive checks
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Logger } from '../utils/Logger.js';

export class ContentSafetyManager {
  static openai = null;
  static anthropic = null;

  static init(openaiClient, anthropicClient) {
    this.openai = openaiClient;
    this.anthropic = anthropicClient;
  }

  /**
   * Check if content is safe for a specific age group
   */
  static async isContentSafe(content, ageGroup, role = 'primary') {
    try {
      const prompt = this.buildSafetyPrompt(content, ageGroup);
      const client = role === 'primary' ? this.openai : this.anthropic;
      
      let response;

      if (role === 'primary' && this.openai) {
        response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
          temperature: 0
        });
        return response.choices[0].message.content.trim();
      } else if (role === 'secondary' && this.anthropic) {
        response = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 100,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0
        });
        return response.content[0].text.trim();
      } else {
        Logger.warn(`No ${role} API client available for safety check`);
        return 'SAFE - No API client available';
      }
    } catch (error) {
      Logger.error('Single safety check failed', { 
        error: error.message, 
        role, 
        ageGroup,
        contentPreview: content.substring(0, 50)
      });
      return 'UNSAFE - Error in safety check';
    }
  }

  /**
   * Perform dual AI provider safety validation
   */
  static async doubleCheckSafety(content, ageGroup) {
    try {
      const [primaryCheck, secondaryCheck] = await Promise.all([
        this.isContentSafe(content, ageGroup, 'primary'),
        this.isContentSafe(content, ageGroup, 'secondary')
      ]);

      const isPrimarySafe = primaryCheck.startsWith('SAFE');
      const isSecondarySafe = secondaryCheck.startsWith('SAFE');

      // Both must pass for content to be considered safe
      if (!isPrimarySafe || !isSecondarySafe) {
        Logger.warn('Content flagged as unsafe by safety validation', {
          primaryCheck,
          secondaryCheck,
          ageGroup,
          contentPreview: content.substring(0, 100)
        });
        
        return {
          safe: false,
          reason: `Primary: ${primaryCheck}, Secondary: ${secondaryCheck}`,
          details: {
            primary: { safe: isPrimarySafe, response: primaryCheck },
            secondary: { safe: isSecondarySafe, response: secondaryCheck }
          }
        };
      }

      return { 
        safe: true, 
        details: {
          primary: { safe: true, response: primaryCheck },
          secondary: { safe: true, response: secondaryCheck }
        }
      };
    } catch (error) {
      Logger.error('Dual safety check failed', { 
        error: error.message, 
        ageGroup,
        contentPreview: content.substring(0, 50)
      });
      
      return {
        safe: false,
        reason: 'Safety validation system error',
        error: error.message
      };
    }
  }

  /**
   * Build safety validation prompt
   */
  static buildSafetyPrompt(content, ageGroup) {
    return `
      Analyze this content for age-appropriateness for children aged ${ageGroup}:
      
      Content: "${content}"
      
      Check for these safety concerns:
      1. Violence, scary, or disturbing content
      2. Adult themes or inappropriate material
      3. Profanity or inappropriate language
      4. Dangerous activities or instructions
      5. Commercial or promotional content
      6. Political bias or controversial topics
      7. Content that could cause emotional distress
      8. Misinformation or harmful advice
      
      Educational appropriateness:
      - Is this educational and constructive?
      - Does it promote positive learning?
      - Is the language age-appropriate?
      - Does it encourage healthy curiosity?
      
      Respond with only: SAFE or UNSAFE
      If UNSAFE, briefly explain why in one sentence.
      
      Remember: We're being extra cautious to protect children's well-being and ensure positive educational experiences.
    `;
  }

  /**
   * Quick safety check for common patterns
   */
  static quickSafetyCheck(content, ageGroup) {
    const content_lower = content.toLowerCase();
    
    // Immediate red flags
    const redFlags = [
      'violence', 'violent', 'fight', 'blood', 'death', 'kill', 'murder',
      'scary', 'frightening', 'horror', 'nightmare', 'terror',
      'adult', 'inappropriate', 'sexual', 'romantic',
      'dangerous', 'poison', 'weapon', 'gun', 'knife',
      'politics', 'political', 'religion', 'religious conflict'
    ];

    const hasRedFlag = redFlags.some(flag => content_lower.includes(flag));
    
    if (hasRedFlag) {
      Logger.warn('Content failed quick safety check', { 
        ageGroup, 
        contentPreview: content.substring(0, 50),
        trigger: 'red flag pattern'
      });
      return false;
    }

    return true;
  }

  /**
   * Get safety guidelines for age group
   */
  static getSafetyGuidelines(ageGroup) {
    const guidelines = {
      '5-7': {
        vocabulary: 'Very simple words only',
        concepts: 'Basic, concrete concepts',
        complexity: 'Single-step ideas',
        avoid: 'Abstract concepts, complex emotions, any conflict'
      },
      '8-10': {
        vocabulary: 'Elementary vocabulary',
        concepts: 'Simple cause-and-effect',
        complexity: 'Multi-step processes with guidance',
        avoid: 'Complex social issues, detailed scientific processes'
      },
      '11-13': {
        vocabulary: 'Middle school vocabulary',
        concepts: 'More complex relationships and systems',
        complexity: 'Abstract thinking with concrete examples',
        avoid: 'Highly controversial topics, advanced adult themes'
      },
      '14-17': {
        vocabulary: 'High school vocabulary',
        concepts: 'Complex systems and abstract ideas',
        complexity: 'Critical thinking and analysis',
        avoid: 'Graphic content, extreme viewpoints'
      }
    };

    return guidelines[ageGroup] || guidelines['8-10'];
  }

  /**
   * Log safety activity for monitoring
   */
  static logSafetyActivity(activity, data = {}) {
    Logger.info(`Safety: ${activity}`, {
      component: 'ContentSafetyManager',
      timestamp: new Date().toISOString(),
      ...data
    });
  }
}
