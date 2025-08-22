/**
 * Creative Content Agent
 * Specialized in generating stories, creative writing, and imaginative content
 */

import { BaseAgent } from './BaseAgent.js';
import Anthropic from '@anthropic-ai/sdk';

export class CreativeContentAgent extends BaseAgent {
  constructor(anthropicClient, config = {}) {
    super('CreativeContentAgent', {
      maxTokens: 1000,
      temperature: 0.8,
      ...config
    });
    this.anthropic = anthropicClient;
  }

  /**
   * Generate educational stories with radical age differentiation
   */
  async generateStory(topic, ageGroup, duration = 'short', context = []) {
    this.validateInput(['topic', 'ageGroup'], { topic, ageGroup });

    if (!this.anthropic) {
      return this.getFallbackStory(topic);
    }

    try {
      this.logActivity('generateStory', { topic, ageGroup, duration, hasContext: context.length > 0 });

      const ageConfig = this.getAgeConfig(ageGroup);
      const contextualTopic = this.buildContextPrompt(topic, context);
      const guidelines = this.buildAgeSpecificGuidelines(ageConfig, 'storytelling');
      
      const prompt = this.buildStoryPrompt(ageConfig, contextualTopic, duration, guidelines);

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: this.getTokensForAge(ageConfig),
        messages: [{ role: 'user', content: prompt }],
        temperature: this.getTemperatureForAge(ageConfig)
      });

      const content = response.content[0].text;
      return await this.applySafetyCheck(content, ageGroup, { type: 'story', topic, duration });

    } catch (error) {
      this.handleError(error, { topic, ageGroup, duration });
    }
  }

  /**
   * Build age-specific story prompts
   */
  buildStoryPrompt(ageConfig, topic, duration, guidelines) {
    if (ageConfig.grade.includes('kindergarten')) {
      return `
        You are a bedtime story teller for very young children (ages 5-7). Create a simple story about: "${topic}"
        
        🌙 **BEDTIME STORY TIME** 🌙
        
        Story requirements:
        ${guidelines.language}
        ${guidelines.cognitive}
        
        Format as a picture book story:
        📖 **Once upon a time...** [Simple opening with familiar setting]
        🐰 **[Character name] meets [problem]** [Very simple problem they understand]
        ✨ **Magic happens!** [Easy solution with happy ending]
        🌈 **The end!** [Simple lesson in one sentence]
        💤 **Sleepy question:** [Gentle what question to end]
        
        - Use repetitive phrases ("And then... and then...")
        - Include animal friends or favorite toys
        - Everything happens "once upon a time"
        - Use lots of colors and sounds
        - Keep it very short and simple
        - Make it feel safe and cozy
      `;
    } else if (ageConfig.grade.includes('2nd')) {
      return `
        You are an adventure story creator for young readers (ages 8-10). Write about: "${topic}"
        
        📚 **ADVENTURE STORY WORKSHOP** 📚
        
        Story guidelines:
        ${guidelines.language}
        ${guidelines.cognitive}
        
        Format as chapter book style:
        🚀 **Chapter 1: The Discovery** [Exciting beginning with clear setting]
        ⚡ **Chapter 2: The Challenge** [Problem that needs solving]
        🏆 **Chapter 3: The Solution** [How characters work together]
        🌟 **Epilogue: What We Learned** [Clear lesson about friendship/courage]
        📝 **Reader's Quest:** [Fun question about the adventure]
        
        - Include dialogue between characters
        - Use action words and exciting moments
        - Show characters solving problems together
        - Include clear beginning, middle, end
        - Connect to school or friendship themes
      `;
    } else if (ageConfig.grade.includes('5th')) {
      return `
        You are a creative writing mentor for middle-grade authors (ages 11-13). Craft a story about: "${topic}"
        
        ✍️ **CREATIVE WRITING STUDIO** ✍️
        
        Literary standards:
        ${guidelines.language}
        ${guidelines.cognitive}
        
        Format as young adult short story:
        🎭 **Setting the Scene:** [Rich setting with sensory details]
        👥 **Character Development:** [Complex characters with motivations]
        ⚡ **Rising Action:** [Multiple plot points and character growth]
        🌟 **Climax and Resolution:** [Meaningful resolution with character change]
        🤔 **Author's Note:** [Discussion questions about themes]
        
        - Include character internal thoughts and growth
        - Use descriptive language and imagery
        - Explore themes like identity, friendship, courage
        - Include subtle moral complexity
        - Encourage empathy and perspective-taking
      `;
    } else {
      return `
        You are a literary mentor for advanced student writers (ages 14-17). Create a sophisticated narrative about: "${topic}"
        
        📖 **ADVANCED LITERARY WORKSHOP** 📖
        
        Literary technique requirements:
        ${guidelines.language}
        ${guidelines.cognitive}
        
        Format as literary short fiction:
        🎨 **Narrative Structure:** [Complex plot with literary devices]
        🧠 **Character Psychology:** [Deep character development and motivation]
        🌊 **Thematic Elements:** [Sophisticated themes and symbolism]
        💡 **Literary Analysis:** [Discussion of technique and meaning]
        🎯 **Creative Challenge:** [Advanced writing techniques to explore]
        
        - Use advanced literary techniques (symbolism, metaphor, irony)
        - Explore complex themes and moral ambiguity
        - Include sophisticated character psychology
        - Demonstrate advanced narrative structure
        - Connect to broader literary traditions and social issues
      `;
    }
  }

  /**
   * Get age-appropriate token counts and creativity levels
   */
  getTokensForAge(ageConfig) {
    if (ageConfig.grade.includes('kindergarten')) return 200;
    if (ageConfig.grade.includes('2nd')) return 400;
    if (ageConfig.grade.includes('5th')) return 700;
    return 1000;
  }

  getTemperatureForAge(ageConfig) {
    if (ageConfig.grade.includes('kindergarten')) return 0.6; // Simple, predictable
    if (ageConfig.grade.includes('2nd')) return 0.7; // Some creativity
    if (ageConfig.grade.includes('5th')) return 0.8; // More creative
    return 0.9; // Highly creative and sophisticated
  }

  /**
   * Generate creative writing prompts
   */
  async generateWritingPrompt(theme, ageGroup, type = 'story', context = []) {
    this.validateInput(['theme', 'ageGroup'], { theme, ageGroup });

    try {
      this.logActivity('generateWritingPrompt', { theme, ageGroup, type });

      const ageConfig = this.getAgeConfig(ageGroup);
      const contextualTheme = this.buildContextPrompt(theme, context);
      
      const prompt = `
        Create an inspiring creative writing prompt for ${ageConfig.grade} students about: ${contextualTheme}
        
        Type: ${type}
        Age group: ${ageGroup}
        Vocabulary level: ${ageConfig.vocabulary}
        
        The prompt should:
        - Spark imagination and creativity
        - Be clear and easy to understand
        - Include specific details to help them get started
        - Encourage personal expression
        - Be age-appropriate and engaging
        - Provide 2-3 guiding questions to help them develop their ideas
        
        Format as a creative writing studio assignment:
        🎨 **CREATIVE WRITING STUDIO** 🎨
        
        ✍️ **YOUR WRITING MISSION:** [Main writing prompt with artistic flair]
        
        🎪 **IMAGINATION STARTERS:** [2-3 creative questions with whimsical language]
        
        🌈 **CREATIVE TIP:** [Artistic writing advice]
        
        🎭 **STUDIO NOTES:** [Encouraging artistic guidance]
      `;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8
      });

      const content = response.content[0].text;
      return await this.applySafetyCheck(content, ageGroup, { type: 'writing-prompt', theme });

    } catch (error) {
      this.handleError(error, { theme, ageGroup, type });
    }
  }

  /**
   * Generate poem or creative text
   */
  async generatePoem(topic, ageGroup, style = 'fun', context = []) {
    this.validateInput(['topic', 'ageGroup'], { topic, ageGroup });

    try {
      this.logActivity('generatePoem', { topic, ageGroup, style });

      const ageConfig = this.getAgeConfig(ageGroup);
      const contextualTopic = this.buildContextPrompt(topic, context);
      
      const prompt = `
        Write a ${style} poem for ${ageConfig.grade} students about: ${contextualTopic}
        
        Style: ${style}
        Age group: ${ageGroup}
        Vocabulary: ${ageConfig.vocabulary}
        
        Requirements:
        - 4-8 lines long
        - Simple rhyme scheme (AABB or ABAB)
        - Use words appropriate for ${ageGroup} year olds
        - Be educational and fun
        - Include vivid, child-friendly imagery
        - End on a positive note
        
        Present as a poetry workshop creation:
        🎵 **POETRY WORKSHOP** 🎵
        
        📜 [Title in decorative format]
        
        [The poem with artistic line breaks and rhythm markers]
        
        🎶 **RHYTHM NOTE:** [Comment on the poem's musical quality]
        
        Make it feel like a crafted artistic piece with creative presentation!
      `;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9
      });

      const content = response.content[0].text;
      return await this.applySafetyCheck(content, ageGroup, { type: 'poem', topic, style });

    } catch (error) {
      this.handleError(error, { topic, ageGroup, style });
    }
  }

  /**
   * Creative-specific fallback responses with artistic flair
   */
  getFallbackResponse(context = {}) {
    const { type = 'story', topic = 'adventure' } = context;
    
    switch (type) {
      case 'story':
        return `🌟 **STORY TIME** 🌟 Once upon a time, there was a curious artist just like you who loved to paint the world with imagination... ✨ *Magic moment:* Every day brought new creative possibilities! 📖 **The End... or is it?** What kind of ${topic} story calls to your creative spirit?`;
      case 'writing-prompt':
        return `🎨 **CREATIVE WRITING STUDIO** 🎨 ✍️ **YOUR WRITING MISSION:** Imagine the most amazing ${topic} your heart can dream! 🌈 **CREATIVE TIP:** Let your imagination dance across the page!`;
      case 'poem':
        return `🎵 **POETRY WORKSHOP** 🎵 📜 *Rhythm and Rhyme* Let's weave words like musical notes about "${topic}"! 🎶 **RHYTHM NOTE:** Every word has its own special beat!`;
      default:
        return `🎨 **CREATIVE WRITING STUDIO** 🎨 Let's paint stories with words! What kind of ${topic} masterpiece shall we create today?`;
    }
  }

  /**
   * Fallback story when API is unavailable
   */
  getFallbackStory(topic) {
    return `Once upon a time, in a world much like ours, there lived a young explorer who was curious about ${topic}. 

Every day, this brave adventurer would ask questions and seek new discoveries. "What makes ${topic} so special?" they wondered. 

Through their journey of learning and exploration, they discovered that the most amazing thing about ${topic} was how it connected to so many other wonderful things in the world.

What questions do you have about ${topic}? Let's explore together!`;
  }
}
