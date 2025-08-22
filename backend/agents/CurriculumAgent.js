/**
 * Curriculum-Based Learning Agent
 * Specialized in curriculum-specific content delivery based on educational boards
 */

import { BaseAgent } from './BaseAgent.js';
import OpenAI from 'openai';

export class CurriculumAgent extends BaseAgent {
  constructor(openaiClient, config = {}) {
    super('CurriculumAgent', {
      maxTokens: 1500,
      temperature: 0.7,
      ...config
    });
    this.openai = openaiClient;
  }

  /**
   * Generate curriculum-based learning content
   */
  async generateCurriculumContent(query, ageGroup, board, grade, context = []) {
    this.validateInput(['query', 'ageGroup', 'board', 'grade'], { query, ageGroup, board, grade });

    if (!this.openai) {
      return this.getFallbackResponse({ board, grade, topic: query });
    }

    try {
      this.logActivity('generateCurriculumContent', { ageGroup, board, grade, queryLength: query.length });

      const ageConfig = this.getAgeConfig(ageGroup);
      const contextualQuery = this.buildContextPrompt(query, context);
      const curriculumConfig = this.getCurriculumConfig(board, grade);
      const guidelines = this.buildAgeSpecificGuidelines(ageConfig, 'curriculum');
      
      const prompt = this.buildCurriculumPrompt(ageConfig, contextualQuery, curriculumConfig, guidelines);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      });

      const content = response.choices[0].message.content;
      return await this.applySafetyCheck(content, ageGroup, { type: 'curriculum', board, grade });

    } catch (error) {
      this.handleError(error, { query, ageGroup, board, grade });
    }
  }

  /**
   * Generate table of contents for a subject
   */
  async generateTableOfContents(subject, board, grade, ageGroup, context = []) {
    this.validateInput(['subject', 'board', 'grade', 'ageGroup'], { subject, board, grade, ageGroup });

    try {
      this.logActivity('generateTableOfContents', { subject, board, grade, ageGroup });

      const curriculumConfig = this.getCurriculumConfig(board, grade);
      const ageConfig = this.getAgeConfig(ageGroup);
      
      const prompt = this.buildTOCPrompt(subject, curriculumConfig, ageConfig);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.6
      });

      const content = response.choices[0].message.content;
      return await this.applySafetyCheck(content, ageGroup, { type: 'toc', subject, board, grade });

    } catch (error) {
      this.handleError(error, { subject, board, grade, ageGroup });
    }
  }

  /**
   * Generate chapter summary
   */
  async generateChapterSummary(subject, chapter, board, grade, ageGroup, context = []) {
    this.validateInput(['subject', 'chapter', 'board', 'grade'], { subject, chapter, board, grade });

    try {
      this.logActivity('generateChapterSummary', { subject, chapter, board, grade });

      const curriculumConfig = this.getCurriculumConfig(board, grade);
      const ageConfig = this.getAgeConfig(ageGroup);
      
      const prompt = this.buildChapterSummaryPrompt(subject, chapter, curriculumConfig, ageConfig);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
        temperature: 0.7
      });

      const content = response.choices[0].message.content;
      return await this.applySafetyCheck(content, ageGroup, { type: 'summary', subject, chapter, board, grade });

    } catch (error) {
      this.handleError(error, { subject, chapter, board, grade });
    }
  }

  /**
   * Generate practice exercises
   */
  async generatePracticeExercises(subject, topic, board, grade, ageGroup, context = []) {
    this.validateInput(['subject', 'topic', 'board', 'grade'], { subject, topic, board, grade });

    try {
      this.logActivity('generatePracticeExercises', { subject, topic, board, grade });

      const curriculumConfig = this.getCurriculumConfig(board, grade);
      const ageConfig = this.getAgeConfig(ageGroup);
      
      const prompt = this.buildPracticePrompt(subject, topic, curriculumConfig, ageConfig);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1400,
        temperature: 0.8
      });

      const content = response.choices[0].message.content;
      return await this.applySafetyCheck(content, ageGroup, { type: 'practice', subject, topic, board, grade });

    } catch (error) {
      this.handleError(error, { subject, topic, board, grade });
    }
  }

  /**
   * Get curriculum configuration for different boards
   */
  getCurriculumConfig(board, grade) {
    const configs = {
      'NCERT': {
        name: 'National Council of Educational Research and Training',
        approach: 'activity-based learning with real-world applications',
        examFormat: 'descriptive and application-based questions',
        textbooks: 'NCERT textbooks',
        assessment: 'continuous and comprehensive evaluation',
        subjects: this.getNCERTSubjects(grade),
        specialFeatures: 'interdisciplinary learning, value education'
      },
      'CBSE': {
        name: 'Central Board of Secondary Education',
        approach: 'competency-based education with skill development',
        examFormat: 'multiple choice and descriptive questions',
        textbooks: 'NCERT and CBSE approved books',
        assessment: 'internal assessment + board examinations',
        subjects: this.getCBSESubjects(grade),
        specialFeatures: 'coding, artificial intelligence, life skills'
      },
      'ICSE': {
        name: 'Indian Certificate of Secondary Education',
        approach: 'comprehensive education with analytical thinking',
        examFormat: 'detailed descriptive and analytical questions',
        textbooks: 'council prescribed textbooks',
        assessment: 'internal assessment + council examinations',
        subjects: this.getICSESubjects(grade),
        specialFeatures: 'detailed syllabi, extensive practical work'
      },
      'ISC': {
        name: 'Indian School Certificate',
        approach: 'in-depth subject knowledge with critical analysis',
        examFormat: 'extensive descriptive and research-based questions',
        textbooks: 'council prescribed advanced textbooks',
        assessment: 'practical + theory examinations',
        subjects: this.getISCSubjects(grade),
        specialFeatures: 'research projects, advanced laboratory work'
      },
      'IB': {
        name: 'International Baccalaureate',
        approach: 'inquiry-based learning with global perspective',
        examFormat: 'extended essays, internal assessments, examinations',
        textbooks: 'IB prescribed resources and additional materials',
        assessment: 'continuous assessment + final examinations',
        subjects: this.getIBSubjects(grade),
        specialFeatures: 'Theory of Knowledge, CAS (Creativity, Activity, Service)'
      },
      'Cambridge': {
        name: 'Cambridge International Education',
        approach: 'international curriculum with analytical skills',
        examFormat: 'objective, structured, and essay questions',
        textbooks: 'Cambridge prescribed textbooks',
        assessment: 'coursework + Cambridge examinations',
        subjects: this.getCambridgeSubjects(grade),
        specialFeatures: 'international recognition, flexible curriculum'
      }
    };

    return configs[board] || configs['NCERT'];
  }

  /**
   * Build curriculum-specific learning prompts
   */
  buildCurriculumPrompt(ageConfig, query, curriculumConfig, guidelines) {
    if (ageConfig.grade.includes('kindergarten') || ageConfig.grade.includes('1st')) {
      return `
        You are a ${curriculumConfig.name} curriculum specialist for early learners.
        
        Student asks: "${query}"
        Board: ${curriculumConfig.name}
        Approach: ${curriculumConfig.approach}
        
        🎒 **${curriculumConfig.name} LEARNING BUDDY** 🎒
        
        Early learning guidelines:
        ${guidelines.language}
        ${guidelines.cognitive}
        
        Format as curriculum guide:
        📚 **FROM YOUR TEXTBOOK:** [Simple explanation using ${curriculumConfig.textbooks}]
        🎨 **FUN ACTIVITY:** [Activity suggested by ${curriculumConfig.name} curriculum]
        ⭐ **LEARNING GOAL:** [What ${curriculumConfig.name} wants you to learn]
        
        - Follow ${curriculumConfig.name} early learning methods
        - Use ${curriculumConfig.approach}
        - Include ${curriculumConfig.specialFeatures}
      `;
    } else if (ageConfig.grade.includes('2nd') || ageConfig.grade.includes('4th')) {
      return `
        You are a ${curriculumConfig.name} curriculum teacher for elementary students.
        
        Student's question: "${query}"
        Board: ${curriculumConfig.name}
        Curriculum approach: ${curriculumConfig.approach}
        
        📖 **${curriculumConfig.name} CLASSROOM** 📖
        
        Elementary teaching standards:
        ${guidelines.language}
        ${guidelines.cognitive}
        
        Format as curriculum lesson:
        📚 **TEXTBOOK LEARNING:** [Content from ${curriculumConfig.textbooks} explained clearly]
        🔍 **CURRICULUM CONCEPT:** [Key concept as per ${curriculumConfig.name} syllabus]
        📝 **PRACTICE WORK:** [Exercise in ${curriculumConfig.examFormat} style]
        🎯 **CURRICULUM GOAL:** [Learning objective from ${curriculumConfig.name} standards]
        
        - Strictly follow ${curriculumConfig.name} curriculum standards
        - Use ${curriculumConfig.assessment} approach
        - Incorporate ${curriculumConfig.specialFeatures}
      `;
    } else if (ageConfig.grade.includes('5th') || ageConfig.grade.includes('7th')) {
      return `
        You are a ${curriculumConfig.name} subject specialist for middle school students.
        
        Curriculum inquiry: "${query}"
        Educational board: ${curriculumConfig.name}
        Pedagogical approach: ${curriculumConfig.approach}
        
        🎓 **${curriculumConfig.name} ACADEMIC CENTER** 🎓
        
        Middle school curriculum standards:
        ${guidelines.language}
        ${guidelines.cognitive}
        
        Format as subject-specific curriculum guide:
        📚 **SYLLABUS CONTENT:** [Detailed content from ${curriculumConfig.textbooks}]
        🔬 **CURRICULUM METHODOLOGY:** [Using ${curriculumConfig.approach}]
        📊 **EXAM PREPARATION:** [Questions in ${curriculumConfig.examFormat} pattern]
        🎯 **CURRICULUM OBJECTIVES:** [${curriculumConfig.name} learning outcomes]
        
        - Align with ${curriculumConfig.name} syllabus requirements
        - Follow ${curriculumConfig.assessment} standards
        - Emphasize ${curriculumConfig.specialFeatures}
      `;
    } else {
      return `
        You are a ${curriculumConfig.name} academic coordinator for senior students.
        
        Advanced curriculum query: "${query}"
        Educational board: ${curriculumConfig.name}
        Academic methodology: ${curriculumConfig.approach}
        
        🏛️ **${curriculumConfig.name} ACADEMIC INSTITUTE** 🏛️
        
        Senior curriculum requirements:
        ${guidelines.language}
        ${guidelines.cognitive}
        
        Format as comprehensive curriculum analysis:
        📚 **ADVANCED SYLLABUS:** [Comprehensive content from ${curriculumConfig.textbooks}]
        🎯 **CURRICULUM ANALYSIS:** [Deep analysis using ${curriculumConfig.approach}]
        📝 **EXAMINATION STRATEGY:** [Advanced preparation for ${curriculumConfig.examFormat}]
        🔬 **RESEARCH COMPONENT:** [Integration of ${curriculumConfig.specialFeatures}]
        
        - Strictly adhere to ${curriculumConfig.name} advanced curriculum
        - Implement ${curriculumConfig.assessment} at highest level
        - Fully utilize ${curriculumConfig.specialFeatures} for academic excellence
      `;
    }
  }

  /**
   * Build Table of Contents prompt
   */
  buildTOCPrompt(subject, curriculumConfig, ageConfig) {
    return `
      Create a comprehensive Table of Contents for ${subject} according to ${curriculumConfig.name} curriculum.
      
      Board: ${curriculumConfig.name}
      Subject: ${subject}
      Teaching approach: ${curriculumConfig.approach}
      Textbooks: ${curriculumConfig.textbooks}
      
      📚 **${curriculumConfig.name} ${subject.toUpperCase()} SYLLABUS** 📚
      
      Create detailed TOC following ${curriculumConfig.name} standards:
      
      🗂️ **COMPLETE SYLLABUS BREAKDOWN:**
      [List all units/chapters as per official ${curriculumConfig.name} curriculum]
      
      📖 **CHAPTER STRUCTURE:**
      [For each major unit, show sub-topics and learning objectives]
      
      🎯 **CURRICULUM MILESTONES:**
      [Key learning outcomes as per ${curriculumConfig.name} standards]
      
      📝 **ASSESSMENT PATTERN:**
      [How this subject is evaluated in ${curriculumConfig.examFormat}]
      
      Requirements:
      - Follow official ${curriculumConfig.name} syllabus structure
      - Include all mandatory topics from ${curriculumConfig.textbooks}
      - Highlight ${curriculumConfig.specialFeatures} integration
      - Show progression aligned with ${curriculumConfig.assessment}
    `;
  }

  /**
   * Build Chapter Summary prompt
   */
  buildChapterSummaryPrompt(subject, chapter, curriculumConfig, ageConfig) {
    return `
      Create a comprehensive chapter summary for "${chapter}" in ${subject} following ${curriculumConfig.name} standards.
      
      Chapter: ${chapter}
      Subject: ${subject}
      Board: ${curriculumConfig.name}
      Curriculum approach: ${curriculumConfig.approach}
      
      📖 **${curriculumConfig.name} CHAPTER SUMMARY** 📖
      
      📚 **CHAPTER OVERVIEW:**
      [Introduction to the chapter as per ${curriculumConfig.textbooks}]
      
      🎯 **KEY CONCEPTS:**
      [Main concepts following ${curriculumConfig.name} curriculum structure]
      
      📝 **IMPORTANT DEFINITIONS:**
      [All definitions as per ${curriculumConfig.textbooks} terminology]
      
      🔍 **CURRICULUM CONNECTIONS:**
      [How this chapter connects to other topics in ${curriculumConfig.name} syllabus]
      
      📊 **EXAM FOCUS AREAS:**
      [Topics likely to appear in ${curriculumConfig.examFormat}]
      
      🎪 **PRACTICAL APPLICATIONS:**
      [Real-world applications following ${curriculumConfig.approach}]
      
      Requirements:
      - Strictly follow ${curriculumConfig.name} chapter structure
      - Use terminology from ${curriculumConfig.textbooks}
      - Highlight concepts important for ${curriculumConfig.assessment}
      - Include ${curriculumConfig.specialFeatures} where relevant
    `;
  }

  /**
   * Build Practice Exercises prompt
   */
  buildPracticePrompt(subject, topic, curriculumConfig, ageConfig) {
    return `
      Create practice exercises for "${topic}" in ${subject} following ${curriculumConfig.name} examination pattern.
      
      Topic: ${topic}
      Subject: ${subject}
      Board: ${curriculumConfig.name}
      Exam format: ${curriculumConfig.examFormat}
      
      📝 **${curriculumConfig.name} PRACTICE EXERCISES** 📝
      
      🎯 **WARM-UP QUESTIONS:**
      [Basic questions following ${curriculumConfig.textbooks} examples]
      
      📚 **TEXTBOOK-STYLE PROBLEMS:**
      [Questions similar to those in ${curriculumConfig.textbooks}]
      
      🧠 **EXAM-PATTERN QUESTIONS:**
      [Questions following ${curriculumConfig.examFormat} exactly]
      
      ⚡ **CHALLENGE PROBLEMS:**
      [Advanced questions incorporating ${curriculumConfig.specialFeatures}]
      
      📊 **ANSWER GUIDANCE:**
      [Hints and approaches for solving as per ${curriculumConfig.name} methodology]
      
      🎪 **PRACTICAL APPLICATIONS:**
      [Real-world problems using ${curriculumConfig.approach}]
      
      Requirements:
      - Follow exact ${curriculumConfig.examFormat} pattern
      - Use difficulty progression from ${curriculumConfig.textbooks}
      - Align with ${curriculumConfig.assessment} standards
      - Include variety matching ${curriculumConfig.name} exam papers
    `;
  }

  /**
   * Get subject lists for different boards and grades
   */
  getNCERTSubjects(grade) {
    const gradeNum = parseInt(grade.replace('Grade ', ''));
    if (gradeNum <= 5) {
      return ['Mathematics', 'English', 'Hindi', 'Environmental Studies', 'Art Education'];
    } else if (gradeNum <= 8) {
      return ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Sanskrit'];
    } else if (gradeNum <= 10) {
      return ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Sanskrit', 'Computer Science'];
    } else {
      return ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Hindi', 'Computer Science', 'Economics', 'Political Science', 'History', 'Geography'];
    }
  }

  getCBSESubjects(grade) {
    return this.getNCERTSubjects(grade);
  }

  getICSESubjects(grade) {
    const gradeNum = parseInt(grade.replace('Grade ', ''));
    if (gradeNum <= 8) {
      return ['Mathematics', 'English', 'Hindi', 'Science', 'History & Civics', 'Geography', 'Computer Applications'];
    } else if (gradeNum <= 10) {
      return ['Mathematics', 'English', 'Hindi', 'Physics', 'Chemistry', 'Biology', 'History & Civics', 'Geography', 'Computer Applications'];
    } else {
      return ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Economics', 'Commerce', 'Accounts'];
    }
  }

  getISCSubjects(grade) {
    return ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Economics', 'Commerce', 'Political Science', 'Psychology'];
  }

  getIBSubjects(grade) {
    return ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Economics', 'History', 'Geography', 'Psychology', 'Computer Science', 'Theory of Knowledge'];
  }

  getCambridgeSubjects(grade) {
    const gradeNum = parseInt(grade.replace('Grade ', ''));
    if (gradeNum <= 10) {
      return ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Economics', 'History', 'Geography'];
    } else {
      return ['Mathematics', 'Further Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Economics', 'Business Studies', 'Psychology'];
    }
  }

  /**
   * Curriculum-specific fallback responses
   */
  getFallbackResponse(context = {}) {
    const { board = 'NCERT', grade = 'Grade 8', topic = 'this subject' } = context;
    
    return `🎒 **${board} LEARNING BUDDY** 📚 **FROM YOUR TEXTBOOK:** Let's explore ${topic} using your ${board} curriculum! 🎯 **LEARNING GOAL:** ${board} wants you to understand this concept step by step. What specific chapter or topic would you like to study?`;
  }
}
