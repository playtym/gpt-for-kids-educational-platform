/**
 * MCP Agent Manager for file processing coordination
 * Manages PDF and Image analysis agents with educational focus
 */
import { PDFAnalysisAgent } from './PDFAnalysisAgent.js';
import { ImageAnalysisAgent } from './ImageAnalysisAgent.js';
import { Logger } from '../utils/Logger.js';

class MCPAgentManager {
  constructor() {
    this.logger = new Logger('MCPAgentManager');
    this.pdfAgent = new PDFAnalysisAgent();
    this.imageAgent = new ImageAnalysisAgent();
    this.processingQueue = new Map(); // Track ongoing processing
  }

  /**
   * Process uploaded files with appropriate agents
   * @param {Array} files - Array of file objects {buffer, filename, mimeType}
   * @param {Object} options - Processing options
   * @returns {Object} Processing results
   */
  async processFiles(files, options = {}) {
    try {
      this.logger.info(`Processing ${files.length} files`);
      
      const results = {
        processed: [],
        errors: [],
        summary: null
      };

      // Process each file with appropriate agent
      for (const file of files) {
        const processingId = this.generateProcessingId();
        this.processingQueue.set(processingId, {
          filename: file.filename,
          status: 'processing',
          startTime: Date.now()
        });

        try {
          let result = null;
          
          if (this.pdfAgent.isSupported(file.mimeType)) {
            result = await this.processPDF(file, options);
            result.agent = 'pdf-analysis';
          } else if (this.imageAgent.isSupported(file.mimeType)) {
            result = await this.processImage(file, options);
            result.agent = 'image-analysis';
          } else {
            throw new Error(`Unsupported file type: ${file.mimeType}`);
          }

          this.processingQueue.set(processingId, {
            filename: file.filename,
            status: 'completed',
            startTime: this.processingQueue.get(processingId).startTime,
            endTime: Date.now()
          });

          results.processed.push(result);
          
        } catch (error) {
          this.logger.error(`Error processing ${file.filename}:`, error);
          
          this.processingQueue.set(processingId, {
            filename: file.filename,
            status: 'error',
            error: error.message,
            startTime: this.processingQueue.get(processingId).startTime,
            endTime: Date.now()
          });

          results.errors.push({
            filename: file.filename,
            error: error.message
          });
        }
      }

      // Generate summary if multiple files processed
      if (results.processed.length > 1) {
        results.summary = await this.generateProcessingSummary(results.processed, options);
      }

      return results;
      
    } catch (error) {
      this.logger.error('Error in file processing:', error);
      throw error;
    }
  }

  /**
   * Process PDF file with PDF Analysis Agent
   * @param {Object} file - File object
   * @param {Object} options - Processing options
   * @returns {Object} PDF analysis result
   */
  async processPDF(file, options) {
    try {
      const analysis = await this.pdfAgent.analyzePDF(file.buffer, file.filename, options);
      
      // Create educational content based on age group
      const educationalContent = await this.pdfAgent.createEducationalContent(
        analysis.analysis, 
        options.ageGroup || 'middle'
      );

      return {
        type: 'pdf',
        filename: file.filename,
        analysis: analysis.analysis,
        educationalContent,
        processingTime: Date.now() - (this.processingQueue.get(this.getProcessingId(file.filename))?.startTime || Date.now())
      };
    } catch (error) {
      this.logger.error(`PDF processing error for ${file.filename}:`, error);
      throw error;
    }
  }

  /**
   * Process image file with Image Analysis Agent
   * @param {Object} file - File object
   * @param {Object} options - Processing options
   * @returns {Object} Image analysis result
   */
  async processImage(file, options) {
    try {
      const analysis = await this.imageAgent.analyzeImage(file.buffer, file.filename, options);
      
      // Create educational content based on age group
      const educationalContent = await this.imageAgent.createEducationalContent(
        analysis.analysis,
        options.ageGroup || 'middle'
      );

      return {
        type: 'image',
        filename: file.filename,
        analysis: analysis.analysis,
        educationalContent,
        processingTime: Date.now() - (this.processingQueue.get(this.getProcessingId(file.filename))?.startTime || Date.now())
      };
    } catch (error) {
      this.logger.error(`Image processing error for ${file.filename}:`, error);
      throw error;
    }
  }

  /**
   * Generate a comprehensive summary when multiple files are processed
   * @param {Array} processedFiles - Array of processing results
   * @param {Object} options - Processing options
   * @returns {Object} Summary of all processed files
   */
  async generateProcessingSummary(processedFiles, options) {
    try {
      const summary = {
        totalFiles: processedFiles.length,
        fileTypes: this.categorizeFileTypes(processedFiles),
        combinedInsights: await this.generateCombinedInsights(processedFiles),
        recommendedActivities: this.generateCombinedActivities(processedFiles, options.ageGroup),
        crossFileConnections: this.findCrossFileConnections(processedFiles),
        overallEducationalValue: this.assessOverallEducationalValue(processedFiles)
      };

      return summary;
    } catch (error) {
      this.logger.error('Error generating processing summary:', error);
      throw error;
    }
  }

  categorizeFileTypes(processedFiles) {
    const types = {
      pdfs: processedFiles.filter(f => f.type === 'pdf').length,
      images: processedFiles.filter(f => f.type === 'image').length
    };

    return types;
  }

  async generateCombinedInsights(processedFiles) {
    const insights = {
      mainTopics: [],
      sharedThemes: [],
      learningObjectives: [],
      difficulty: 'mixed'
    };

    // Extract main topics from all files
    processedFiles.forEach(file => {
      if (file.type === 'pdf') {
        insights.mainTopics.push(...file.analysis.chapters.map(c => c.title));
        insights.learningObjectives.push(...file.analysis.learningPath.learningObjectives);
      } else if (file.type === 'image') {
        insights.mainTopics.push(file.analysis.educationalContext.primarySubject);
        insights.learningObjectives.push(...file.analysis.learningOpportunities);
      }
    });

    // Remove duplicates and limit results
    insights.mainTopics = [...new Set(insights.mainTopics)].slice(0, 10);
    insights.learningObjectives = [...new Set(insights.learningObjectives)].slice(0, 8);

    // Find shared themes
    insights.sharedThemes = this.findSharedThemes(processedFiles);

    return insights;
  }

  findSharedThemes(processedFiles) {
    const themes = [];
    
    // Simple theme detection based on content analysis
    const allContent = processedFiles.map(file => {
      if (file.type === 'pdf') {
        return file.analysis.chapters.map(c => c.title + ' ' + c.summary).join(' ');
      } else {
        return file.analysis.description + ' ' + file.analysis.educationalContext.primarySubject;
      }
    }).join(' ').toLowerCase();

    // Common educational themes
    const commonThemes = [
      'mathematics', 'science', 'history', 'art', 'geography', 
      'literature', 'technology', 'nature', 'culture', 'society'
    ];

    commonThemes.forEach(theme => {
      if (allContent.includes(theme)) {
        themes.push(theme);
      }
    });

    return themes;
  }

  generateCombinedActivities(processedFiles, ageGroup = 'middle') {
    const activities = [
      "Compare and contrast the main ideas from all uploaded materials",
      "Create a concept map connecting ideas from different files",
      "Write a summary that combines insights from all materials",
      "Identify questions that span across multiple uploaded items"
    ];

    if (ageGroup === 'high' || ageGroup === 'adult') {
      activities.push(
        "Research additional sources that relate to these materials",
        "Create a presentation that synthesizes all the information",
        "Develop a project that applies concepts from multiple files"
      );
    }

    return activities;
  }

  findCrossFileConnections(processedFiles) {
    const connections = [];

    // Find connections between PDFs and images
    const pdfs = processedFiles.filter(f => f.type === 'pdf');
    const images = processedFiles.filter(f => f.type === 'image');

    pdfs.forEach(pdf => {
      images.forEach(image => {
        // Simple connection detection
        const pdfTopics = pdf.analysis.chapters.map(c => c.title.toLowerCase());
        const imageSubject = image.analysis.educationalContext.primarySubject.toLowerCase();
        
        if (pdfTopics.some(topic => topic.includes(imageSubject) || imageSubject.includes(topic))) {
          connections.push({
            type: 'topic-match',
            files: [pdf.filename, image.filename],
            connection: `The PDF content relates to the subject matter in the image`
          });
        }
      });
    });

    return connections;
  }

  assessOverallEducationalValue(processedFiles) {
    const assessment = {
      comprehensiveness: 'moderate',
      ageAppropriate: true,
      interdisciplinary: false,
      practicalApplication: true,
      cognitiveLoad: 'balanced'
    };

    // Assess comprehensiveness based on variety and depth
    if (processedFiles.length > 3) {
      assessment.comprehensiveness = 'high';
    } else if (processedFiles.length === 1) {
      assessment.comprehensiveness = 'focused';
    }

    // Check for interdisciplinary content
    const subjects = new Set();
    processedFiles.forEach(file => {
      if (file.type === 'pdf') {
        subjects.add('document-based-learning');
      } else if (file.type === 'image') {
        subjects.add(file.analysis.imageType);
      }
    });

    assessment.interdisciplinary = subjects.size > 2;

    return assessment;
  }

  /**
   * Query processed content using RAG-like functionality
   * @param {string} query - User query
   * @param {Array} processedFiles - Previously processed files
   * @returns {Object} Query response with relevant content
   */
  async queryProcessedContent(query, processedFiles) {
    try {
      const responses = [];

      for (const file of processedFiles) {
        if (file.type === 'pdf') {
          const response = await this.pdfAgent.queryContent(query, file.analysis);
          responses.push({
            filename: file.filename,
            type: 'pdf',
            response: response
          });
        }
        // Image querying could be added here for image-specific questions
      }

      // Combine and rank responses
      const combinedResponse = this.combineQueryResponses(query, responses);
      return combinedResponse;

    } catch (error) {
      this.logger.error('Error querying processed content:', error);
      throw error;
    }
  }

  combineQueryResponses(query, responses) {
    if (responses.length === 0) {
      return {
        found: false,
        message: "I don't have any relevant information about that in the uploaded files."
      };
    }

    // Sort by confidence and take the best response
    const bestResponse = responses.sort((a, b) => 
      (b.response.confidence || 0) - (a.response.confidence || 0)
    )[0];

    return {
      found: true,
      primarySource: bestResponse.filename,
      response: bestResponse.response.response,
      confidence: bestResponse.response.confidence,
      additionalSources: responses.length > 1 ? responses.slice(1).map(r => r.filename) : [],
      suggestedQuestions: bestResponse.response.suggestedQuestions || []
    };
  }

  /**
   * Get processing status for a file
   * @param {string} filename - Filename to check
   * @returns {Object} Processing status
   */
  getProcessingStatus(filename) {
    const processingId = this.getProcessingId(filename);
    return this.processingQueue.get(processingId) || { status: 'not-found' };
  }

  /**
   * Clear processing queue
   */
  clearProcessingQueue() {
    this.processingQueue.clear();
  }

  /**
   * Get supported file types
   * @returns {Object} Supported file types by agent
   */
  getSupportedFileTypes() {
    return {
      pdf: this.pdfAgent.supportedFormats,
      image: this.imageAgent.supportedFormats
    };
  }

  // Helper methods
  generateProcessingId() {
    return `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getProcessingId(filename) {
    // Find processing ID by filename
    for (const [id, data] of this.processingQueue.entries()) {
      if (data.filename === filename) {
        return id;
      }
    }
    return null;
  }

  /**
   * Health check for MCP agents
   * @returns {Object} Health status
   */
  async healthCheck() {
    return {
      status: 'healthy',
      agents: {
        pdfAgent: 'active',
        imageAgent: 'active'
      },
      processingQueue: {
        active: Array.from(this.processingQueue.values()).filter(p => p.status === 'processing').length,
        completed: Array.from(this.processingQueue.values()).filter(p => p.status === 'completed').length,
        errors: Array.from(this.processingQueue.values()).filter(p => p.status === 'error').length
      },
      supportedFormats: this.getSupportedFileTypes()
    };
  }
}

export { MCPAgentManager };
