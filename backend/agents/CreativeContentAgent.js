/**
 * Creative Content Agent - Redesigned
 * Two main themes:
 * 1. Provide feedback and constructive next steps for existing work
 * 2. Guide step-by-step creation from scratch with best practices
 */

import { BaseAgent } from './BaseAgent.js';
import Anthropic from '@anthropic-ai/sdk';

export class CreativeContentAgent extends BaseAgent {
  constructor(anthropicClient, config = {}) {
    super('CreativeContentAgent', {
      maxTokens: 1200, // Increased for longer, more detailed responses
      temperature: 0.7,
      ...config
    });
    this.anthropic = anthropicClient;
    this.creativeMediums = this.initializeCreativeMediums();
  }

  /**
   * Initialize creative medium frameworks with their key evaluation criteria
   */
  initializeCreativeMediums() {
    return {
      'short-stories': {
        name: 'Short Stories',
        criteria: {
          structure: "Does your story follow a clear three-act structure?",
          pacing: "How do you control the flow of information?",
          characterArc: "How does your protagonist change throughout?",
          tension: "Where do you build and release dramatic tension?",
          perspective: "Is your point of view consistent and purposeful?"
        }
      },
      'poetry': {
        name: 'Poetry',
        criteria: {
          form: "How does your chosen structure serve your meaning?",
          meter: "Is your rhythm pattern consistent or intentionally varied?",
          lineBreaks: "Where do you pause and why?",
          soundPattern: "How do consonants and vowels create texture?",
          imageryLayers: "How do metaphors build upon each other?"
        }
      },
      'essays': {
        name: 'Essays',
        criteria: {
          thesis: "Is your central argument clear and defendable?",
          structure: "Do paragraphs follow logical progression?",
          evidence: "How does each piece of support strengthen your case?",
          transitions: "How do ideas connect to create flow?",
          conclusion: "Does your ending synthesize rather than repeat?"
        }
      },
      'logical-arguments': {
        name: 'Logical Arguments',
        criteria: {
          premise: "Are your foundational assumptions clearly stated?",
          reasoning: "Do your conclusions follow logically from evidence?",
          counterarguments: "Have you addressed opposing viewpoints?",
          fallacies: "Are you avoiding logical errors in reasoning?",
          structure: "Is your argument chain clear and unbreakable?"
        }
      },
      'debate': {
        name: 'Debate & Discourse',
        criteria: {
          position: "Is your stance clearly defined and consistent?",
          evidence: "How strong is your supporting documentation?",
          rebuttals: "Can you anticipate and counter opposition?",
          rhetoric: "How do you balance logic, emotion, and credibility?",
          strategy: "What's your plan for winning key points?"
        }
      },
      'digital-art': {
        name: 'Digital Art',
        criteria: {
          composition: "How do you guide the viewer's eye through your piece?",
          hierarchy: "What establishes visual importance in your work?",
          colorTheory: "How do your color relationships create mood?",
          technique: "Are your digital brushwork and tools serving your vision?",
          contrast: "Where do you create visual tension and rest?"
        }
      },
      'photography': {
        name: 'Photography',
        criteria: {
          composition: "How do you use rule of thirds, leading lines, framing?",
          exposure: "Is your technical triangle (ISO/aperture/shutter) optimized?",
          depth: "How does your depth of field direct attention?",
          moment: "What makes this the decisive moment to capture?",
          postProcessing: "How does editing enhance rather than mask?"
        }
      },
      'music': {
        name: 'Music Composition',
        criteria: {
          harmony: "How do your chord progressions create emotional movement?",
          rhythm: "What rhythmic patterns drive your piece forward?",
          melody: "How does your melodic contour serve expression?",
          arrangement: "How do instruments interact and support each other?",
          form: "What structural framework organizes your musical ideas?"
        }
      },
      'video': {
        name: 'Video Creation',
        criteria: {
          editing: "How do your cuts serve pacing and emotion?",
          cinematography: "What do your camera angles and movements convey?",
          audio: "How do sound and music support your visual story?",
          structure: "How does each scene advance your narrative?",
          montage: "How do sequences create meaning through juxtaposition?"
        }
      },
      'dance': {
        name: 'Dance Choreography',
        criteria: {
          motif: "How do you develop and vary your movement themes?",
          dynamics: "How do you use energy, weight, and flow?",
          spatial: "How does your use of levels and pathways create interest?",
          musicality: "How do you interpret and respond to musical structure?",
          phrase: "How do movement sentences create larger paragraphs?"
        }
      },
      'theater': {
        name: 'Theater Performance',
        criteria: {
          objectives: "What does your character want in each scene?",
          tactics: "How do you pursue your goals through different strategies?",
          physicality: "How does your body language support character truth?",
          voice: "How do breath, pace, and tone serve meaning?",
          relationships: "How do you adjust based on other characters' energy?"
        }
      },
      'game-design': {
        name: 'Game Design',
        criteria: {
          coreLoop: "What's the fundamental cycle that keeps players engaged?",
          progression: "How do you balance challenge with player growth?",
          feedback: "How does your system communicate success and failure?",
          balance: "Are all player choices viable and interesting?",
          onboarding: "How do players learn your systems naturally?"
        }
      },
      'app-design': {
        name: 'App/Website Design',
        criteria: {
          userFlow: "How do users accomplish their primary goals?",
          hierarchy: "What guides users' attention and decision-making?",
          consistency: "Are your design patterns predictable across screens?",
          accessibility: "How do different users interact with your interface?",
          performance: "How does technical implementation serve user experience?"
        }
      },
      'cooking': {
        name: 'Cooking/Baking',
        criteria: {
          flavor: "Do tastes complement each other?",
          technique: "Are cooking methods executed properly?",
          texture: "How do different textures work together?",
          presentation: "Does plating enhance the eating experience?",
          innovation: "What makes this dish uniquely yours?"
        }
      },
      'crafts': {
        name: 'DIY/Crafts',
        criteria: {
          materials: "Are materials right for the purpose?",
          construction: "Are joints, connections sturdy?",
          aesthetics: "Is it visually pleasing?",
          functionality: "Does it work for its intended use?",
          finishing: "Are edges, surfaces properly completed?"
        }
      },
      'comics': {
        name: 'Comics/Graphic Novels',
        criteria: {
          visual: "Can readers follow the story without words?",
          layout: "Do panels guide the reader's eye effectively?",
          character: "Are characters visually distinct and expressive?",
          dialogue: "Do words and images work together?",
          world: "Is the setting consistent and believable?"
        }
      },
      'interactive-stories': {
        name: 'Interactive Stories',
        criteria: {
          branching: "Do choices lead to meaningfully different outcomes?",
          agency: "Do readers feel their decisions matter?",
          consequence: "Are choice results satisfying/logical?",
          flow: "Does each path maintain narrative momentum?",
          investment: "What keeps readers making choices?"
        }
      }
    };
  }

  /**
   * THEME 1: Provide feedback and constructive next steps
   * Automatically identifies context, stage, and provides age-appropriate feedback
   */
  async provideFeedback(userInput, ageGroup, medium = null) {
    this.validateInput(['userInput', 'ageGroup'], { userInput, ageGroup });

    try {
      this.logActivity('provideFeedback', { ageGroup, medium, inputLength: userInput.length });

      // Auto-detect medium and stage if not provided
      const detectedMedium = medium || await this.detectCreativeMedium(userInput);
      const stage = await this.detectCreativeStage(userInput, detectedMedium);
      const ageConfig = this.getAgeConfig(ageGroup);

      const feedbackPrompt = this.buildFeedbackPrompt(userInput, detectedMedium, stage, ageConfig);

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: this.getTokensForAge(ageConfig),
        messages: [{ role: 'user', content: feedbackPrompt }],
        temperature: 0.7
      });

      const feedback = response.content[0].text;
      return await this.applySafetyCheck(feedback, ageGroup, { 
        type: 'feedback', 
        medium: detectedMedium, 
        stage 
      });

    } catch (error) {
      this.handleError(error, { ageGroup, medium });
      return this.getFallbackFeedback(ageGroup);
    }
  }

  /**
   * Auto-detect creative medium from user input
   */
  async detectCreativeMedium(userInput) {
    const keywords = {
      'short-stories': ['story', 'narrative', 'fiction', 'character', 'plot', 'tale'],
      'poetry': ['poem', 'verse', 'rhyme', 'stanza', 'haiku', 'sonnet'],
      'essays': ['essay', 'argument', 'thesis', 'analysis', 'opinion', 'academic'],
      'logical-arguments': ['argument', 'logic', 'reasoning', 'evidence', 'proof', 'premise'],
      'debate': ['debate', 'argue', 'position', 'opponent', 'counterargument', 'refute'],
      'digital-art': ['drawing', 'painting', 'digital art', 'illustration', 'artwork'],
      'photography': ['photo', 'camera', 'shot', 'lighting', 'composition', 'picture'],
      'music': ['song', 'melody', 'rhythm', 'chord', 'beat', 'composition'],
      'video': ['video', 'film', 'movie', 'scene', 'editing', 'cinematography'],
      'dance': ['dance', 'choreography', 'movement', 'performance', 'ballet'],
      'theater': ['play', 'acting', 'stage', 'character', 'script', 'drama'],
      'game-design': ['game', 'level', 'player', 'mechanics', 'gameplay', 'rules'],
      'app-design': ['app', 'website', 'interface', 'user', 'design', 'ui'],
      'cooking': ['recipe', 'cooking', 'baking', 'ingredient', 'dish', 'culinary'],
      'crafts': ['craft', 'making', 'building', 'materials', 'diy', 'handmade'],
      'comics': ['comic', 'panel', 'graphic novel', 'illustration', 'manga'],
      'interactive-stories': ['choose', 'choice', 'interactive', 'branching', 'adventure']
    };

    const input = userInput.toLowerCase();
    let bestMatch = 'essays'; // default to essays for general writing
    let maxScore = 0;

    for (const [medium, words] of Object.entries(keywords)) {
      const score = words.filter(word => input.includes(word)).length;
      if (score > maxScore) {
        maxScore = score;
        bestMatch = medium;
      }
    }

    return bestMatch;
  }

  /**
   * Detect what stage of creation the user is in
   */
  async detectCreativeStage(userInput, medium) {
    const stageKeywords = {
      'planning': ['idea', 'plan', 'thinking', 'want to', 'going to', 'outline'],
      'drafting': ['first draft', 'rough', 'trying', 'working on', 'started'],
      'revising': ['better', 'improve', 'change', 'fix', 'edit', 'revise'],
      'polishing': ['almost done', 'final', 'finishing', 'last touches'],
      'sharing': ['feedback', 'opinion', 'what do you think', 'ready to show']
    };

    const input = userInput.toLowerCase();
    let bestStage = 'drafting'; // default
    let maxScore = 0;

    for (const [stage, words] of Object.entries(stageKeywords)) {
      const score = words.filter(word => input.includes(word)).length;
      if (score > maxScore) {
        maxScore = score;
        bestStage = stage;
      }
    }

    return bestStage;
  }

  /**
   * Build age-appropriate feedback prompt
   */
  buildFeedbackPrompt(userInput, medium, stage, ageConfig) {
    const mediumInfo = this.creativeMediums[medium];
    const criteria = mediumInfo ? mediumInfo.criteria : {};
    const ageGuidelines = this.buildAgeSpecificGuidelines(ageConfig, 'creative');
    const feedbackStyle = this.getFeedbackStyle(ageConfig);

    // Special handling for debate mode - agent plays opposing role
    if (medium === 'debate') {
      return this.buildDebatePrompt(userInput, ageConfig);
    }

    return `
You are an encouraging creative mentor providing structured feedback on a ${mediumInfo?.name || medium} project.

STUDENT INPUT: "${userInput}"

MEDIUM: ${mediumInfo?.name || medium}
STAGE: ${stage}
AGE GROUP: ${ageConfig.grade}
LANGUAGE LEVEL: ${ageConfig.vocabulary} vocabulary, ${ageConfig.sentenceLength}
RESPONSE STYLE: ${feedbackStyle}

EVALUATION CRITERIA for ${mediumInfo?.name || medium}:
${Object.entries(criteria).map(([key, question]) => `• ${key}: "${question}"`).join('\n')}

IMPORTANT: Adapt your language to be age-appropriate:
- Sentence length: ${ageConfig.sentenceLength}
- Vocabulary: ${ageConfig.vocabulary} level
- Explanation style: ${ageConfig.explanationStyle}
- Question types: ${ageConfig.questionStyle}
- Examples: Use ${ageConfig.examples}

Provide a playful letter grade (A+, A, A-, B+, B, B-, C+, C, C-) and structure your response with these EXACT sections and emojis:

**CRITIQUE:**
[Provide honest but encouraging analysis adapted for ${ageConfig.grade} level. Use ${ageConfig.vocabulary} vocabulary and ${ageConfig.sentenceLength}. Give a playful letter grade (A+, A, A-, B+, B, B-, C+, C, C-). Include "🌟 Grade: [letter grade]" and make it fun and encouraging!]

✨ **WHAT'S SHINING**
[Celebrate specific technical or creative choices they made well]

� **CREATIVE OPPORTUNITY**
[One main area where they can strengthen their work - focus on technique, structure, or craft]

🎯 **NEXT STEPS**
1. [Specific technical action they can take]
2. [Structural improvement to try]
3. [Craft technique to practice]

🤔 **THINK ABOUT THIS**
[A thought-provoking question about their creative choices or an interesting example from literature/art that relates to their work]

**ENCOURAGEMENT:**
[Motivating message that celebrates their progress and encourages them to keep refining their work. End with "Try retyping parts of your artifact to strengthen it!"]

Focus on celebrating effort, providing constructive guidance, and inspiring continued creation.
    `;
  }

  /**
   * Special debate prompt where agent takes opposing position
   */
  buildDebatePrompt(userInput, ageConfig) {
    const feedbackStyle = this.getFeedbackStyle(ageConfig);
    
    return `
You are a skilled debate opponent providing RESPECTFUL COUNTER-ARGUMENTS to strengthen the student's argumentation skills.

STUDENT'S POSITION: "${userInput}"

AGE GROUP: ${ageConfig.grade} (${ageConfig.age} years old)
DEBATE STYLE: ${feedbackStyle}

Your role is to:
1. Identify the student's main argument and evidence
2. Present respectful counter-arguments to test their reasoning
3. Point out logical gaps or assumptions
4. Challenge them to strengthen their position
5. Remain educational and encouraging

Format your response as:

🤔 **YOUR ARGUMENT ANALYSIS**
[Summarize their position fairly and identify key claims]

⚖️ **COUNTER-PERSPECTIVE**
[Present opposing viewpoint respectfully and logically]

🔍 **LOGICAL CHALLENGES**
1. [Question an assumption they made]
2. [Point out missing evidence]
3. [Present alternative interpretation]

💪 **STRENGTHEN YOUR CASE**
[How they can address these challenges and improve their argument]

Remember: You're helping them become a better debater by providing worthy opposition, not trying to "win" against a student.
    `;
  }

  /**
   * Get age-appropriate feedback style
   */
  getFeedbackStyle(ageConfig) {
    // Use vocabulary and complexity level instead of undefined age property
    if (ageConfig.vocabulary === 'simple' || ageConfig.vocabulary === 'elementary') {
      return `Use ${ageConfig.sentenceLength} sentences with ${ageConfig.vocabulary} vocabulary. Focus on effort and creativity with ${ageConfig.explanationStyle}. Ask simple ${ageConfig.questionStyle} questions.`;
    } else if (ageConfig.vocabulary === 'middle') {
      return `Use ${ageConfig.sentenceLength} sentences with ${ageConfig.vocabulary} vocabulary. Balance encouragement with gentle technical guidance using ${ageConfig.explanationStyle}. Ask ${ageConfig.questionStyle} questions about choices and alternatives.`;
    } else {
      return `Use ${ageConfig.sentenceLength} sentences with ${ageConfig.vocabulary} vocabulary. Provide sophisticated feedback with technical depth using ${ageConfig.explanationStyle}. Challenge them with ${ageConfig.questionStyle} questions to think critically.`;
    }
  }
  /**
   * THEME 2: Step-by-step creation from scratch
   * Reveals best practices one by one, focusing on each step based on medium
   */
  async guideCreation(medium, step = 1, ageGroup, previousSteps = []) {
    this.validateInput(['medium', 'ageGroup'], { medium, ageGroup });

    try {
      this.logActivity('guideCreation', { medium, step, ageGroup, previousStepsCount: previousSteps.length });

      const ageConfig = this.getAgeConfig(ageGroup);
      const mediumInfo = this.creativeMediums[medium];
      
      if (!mediumInfo) {
        throw new Error(`Unknown creative medium: ${medium}`);
      }

      const creationPrompt = this.buildCreationPrompt(mediumInfo, step, ageConfig, previousSteps);

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: this.getTokensForAge(ageConfig),
        messages: [{ role: 'user', content: creationPrompt }],
        temperature: 0.6 // Lower temperature for instructional content
      });

      const guidance = response.content[0].text;
      return await this.applySafetyCheck(guidance, ageGroup, { 
        type: 'creation-guidance', 
        medium, 
        step 
      });

    } catch (error) {
      this.handleError(error, { medium, step, ageGroup });
      return this.getFallbackCreationGuidance(medium, step, ageGroup);
    }
  }

  /**
   * Build step-by-step creation prompt
   */
  buildCreationPrompt(mediumInfo, step, ageConfig, previousSteps) {
    const criteria = Object.entries(mediumInfo.criteria);
    const currentCriterion = criteria[Math.min(step - 1, criteria.length - 1)];
    const instructionalStyle = this.getInstructionalStyle(ageConfig);

    return `
You are a creative mentor teaching ${mediumInfo.name} to ${ageConfig.grade} students (age ${ageConfig.age}).

CURRENT FOCUS: Step ${step} of ${criteria.length}
FOCUS AREA: ${currentCriterion[0]} - "${currentCriterion[1]}"

PREVIOUS STEPS COMPLETED: ${previousSteps.join(', ') || 'None yet'}

INSTRUCTIONAL STYLE: ${instructionalStyle}

ALL CRITERIA FOR ${mediumInfo.name}:
${criteria.map(([key, question], index) => 
  `${index + 1}. ${key}: "${question}"${index + 1 === step ? ' ← CURRENT FOCUS' : ''}`
).join('\n')}

Create a focused lesson on the current step that:
1. Explains WHY this element matters
2. Provides age-appropriate techniques and tips
3. Includes a specific practice exercise
4. Connects to what they've already learned
5. Previews what comes next

Format your response as:

🎯 **STEP ${step}: ${currentCriterion[0].toUpperCase()}**

🤔 **WHY THIS MATTERS**
[Clear explanation of importance]

✨ **KEY TECHNIQUES** (${ageConfig.grade} level)
• [Technique 1 with simple explanation]
• [Technique 2 with practical tip]
• [Technique 3 with encouraging note]

🎮 **PRACTICE CHALLENGE**
[Specific, engaging exercise to try right now]

🔗 **BUILDING ON PREVIOUS STEPS**
[How this connects to what they've learned]

➡️ **COMING UP NEXT**
[Brief preview of next step to build excitement]

Remember: ${instructionalStyle}
    `;
  }

  /**
   * Get age-appropriate instructional style
   */
  getInstructionalStyle(ageConfig) {
    if (ageConfig.age <= 9) {
      return "Use playful language, lots of analogies, and hands-on activities. Keep instructions simple and visual.";
    } else if (ageConfig.age <= 13) {
      return "Balance fun with learning. Introduce technical terms gradually. Use examples they can relate to.";
    } else {
      return "Provide sophisticated instruction with technical depth. Discuss professional techniques and advanced concepts.";
    }
  }

  /**
   * Get available creative mediums
   */
  getAvailableMediums() {
    return Object.keys(this.creativeMediums).map(key => ({
      id: key,
      name: this.creativeMediums[key].name,
      steps: Object.keys(this.creativeMediums[key].criteria).length
    }));
  }

  /**
   * Get specific medium information
   */
  getMediumInfo(medium) {
    return this.creativeMediums[medium] || null;
  }

  /**
   * Utility methods
   */
  getTokensForAge(ageConfig) {
    if (ageConfig.age <= 9) return 300;
    if (ageConfig.age <= 13) return 500;
    return 800;
  }

  getTemperatureForAge(ageConfig) {
    if (ageConfig.age <= 9) return 0.6;
    if (ageConfig.age <= 13) return 0.7;
    return 0.8;
  }

  /**
   * Fallback responses when API is unavailable
   */
  getFallbackFeedback(ageGroup) {
    const ageConfig = this.getAgeConfig(ageGroup);
    
    if (ageConfig.age <= 9) {
      return `🌟 **WHAT'S SHINING** 
I can see you're being very creative! 

💡 **CREATIVE OPPORTUNITY**
Let's think about making it even more amazing!

🎯 **NEXT STEPS**
1. Tell me more about your favorite part
2. Think about what happens next
3. Add more colors or sounds to your story

🤔 **THINK ABOUT THIS**
What makes you most excited about your creation?`;
    } else if (ageConfig.age <= 13) {
      return `🌟 **WHAT'S SHINING** 
Your creative work shows real thoughtfulness and effort!

💡 **CREATIVE OPPORTUNITY**
There's potential to develop this further with some focused techniques.

🎯 **NEXT STEPS**
1. Identify your strongest element and expand on it
2. Consider your audience and how they'll experience this
3. Experiment with one new technique or approach

🤔 **THINK ABOUT THIS**
What story are you trying to tell, and how can each element serve that story?`;
    } else {
      return `� **WHAT'S SHINING** 
Your work demonstrates sophisticated creative thinking and technical awareness.

💡 **CREATIVE OPPORTUNITY**
Consider how you might push the boundaries of conventional approaches in this medium.

🎯 **NEXT STEPS**
1. Analyze the relationship between form and content in your work
2. Research how professionals in this field approach similar challenges
3. Experiment with advanced techniques that serve your artistic vision

🤔 **THINK ABOUT THIS**
How does your creative voice distinguish this work, and what deeper themes or messages are emerging?`;
    }
  }

  getFallbackCreationGuidance(medium, step, ageGroup) {
    const mediumInfo = this.creativeMediums[medium];
    const ageConfig = this.getAgeConfig(ageGroup);
    const mediumName = mediumInfo?.name || medium;

    return `🎯 **STEP ${step}: CREATIVE EXPLORATION**

🤔 **WHY THIS MATTERS**
Every great ${mediumName} project starts with understanding the fundamentals!

✨ **KEY TECHNIQUES** (${ageConfig.grade} level)
• Start with what you know and love
• Practice makes progress (not perfection!)
• Every creative choice should have a reason

� **PRACTICE CHALLENGE**
Spend 10 minutes exploring this element in your ${mediumName} project. Don't worry about making it perfect – focus on understanding how it works!

🔗 **BUILDING ON PREVIOUS STEPS**
Each element builds on the others to create something amazing.

➡️ **COMING UP NEXT**
We'll explore how to connect this element with others to strengthen your overall creation.`;
  }

  /**
   * Generate educational stories for Learn and Explore modes (legacy support)
   */
  async generateStory(topic, ageGroup, duration = 'short', context = []) {
    // This now provides feedback on story creation instead of generating complete stories
    return this.provideFeedback(
      `I want to write a ${duration} story about ${topic}`, 
      ageGroup, 
      'short-stories'
    );
  }

  /**
   * Generate creative writing prompts (legacy support)
   */
  async generateWritingPrompt(theme, ageGroup, type = 'story', context = []) {
    // This now guides creation instead of just giving prompts
    return this.guideCreation(
      type === 'story' ? 'short-stories' : 'poetry',
      1,
      ageGroup
    );
  }

  /**
   * Generate poems (legacy support)
   */
  async generatePoem(topic, ageGroup, style = 'fun', context = []) {
    // This now provides feedback on poetry creation
    return this.provideFeedback(
      `I want to write a ${style} poem about ${topic}`, 
      ageGroup, 
      'poetry'
    );
  }
}