import React from 'react';
import TextCard from './TextCard';
import MCQCard, { MCQOption } from './MCQCard';
import LongFormCard from './LongFormCard';
import CreativeCard from './CreativeCard';

interface ContentRendererProps {
  content: string;
  messageType: 'user' | 'assistant';
  timestamp?: string;
  mode?: string;
}

// Type definitions for content structures
interface MCQContent {
  type: 'mcq';
  question: string;
  options: MCQOption[];
  correctAnswer: number;
  explanation?: string;
  hint?: string;
}

interface LongFormContent {
  type: 'longform';
  question: string;
  context?: string;
  rubric?: string[];
  expectedLength?: 'short' | 'medium' | 'long';
  hints?: string[];
}

interface CreativeContent {
  type: 'creative';
  content: string;
  medium?: string;
}

interface TextContent {
  type: 'text';
  content: string;
}

type ContentData = MCQContent | LongFormContent | CreativeContent | TextContent;

const ContentRenderer: React.FC<ContentRendererProps> = ({
  content,
  messageType,
  timestamp,
  mode = 'learn'
}) => {
  // Helper function to detect content type and parse structured content
  const parseContent = (rawContent: string): ContentData => {
    // Validate input
    if (!rawContent || typeof rawContent !== 'string') {
      console.warn('parseContent: Invalid rawContent input:', rawContent);
      return {
        type: 'text',
        content: 'Invalid content received'
      };
    }

    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(rawContent);
      
      // Check if it's an MCQ
      if (parsed.type === 'mcq' || (parsed.question && parsed.options && Array.isArray(parsed.options))) {
        const options: MCQOption[] = Array.isArray(parsed.options) 
          ? parsed.options.map((opt: any, index: number) => 
              typeof opt === 'string' 
                ? { id: index.toString(), text: opt, isCorrect: index === (parsed.correctAnswer || parsed.correct_answer || 0) }
                : { ...opt, id: opt.id?.toString() || index.toString() }
            )
          : [];
          
        return {
          type: 'mcq',
          question: parsed.question,
          options,
          correctAnswer: parsed.correctAnswer || parsed.correct_answer || 0,
          explanation: parsed.explanation,
          hint: parsed.hint
        };
      }
      
      // Check if it's a long form question
      if (parsed.type === 'longform' || (parsed.question && (parsed.rubric || parsed.expectedLength))) {
        const expectedLength: 'short' | 'medium' | 'long' = 
          parsed.expectedLength === 'short' || parsed.expectedLength === 'medium' || parsed.expectedLength === 'long'
            ? parsed.expectedLength
            : 'medium';
            
        return {
          type: 'longform',
          question: parsed.question,
          context: parsed.context,
          rubric: parsed.rubric,
          expectedLength,
          hints: parsed.hints
        };
      }
      
      // If it has content, treat as text
      if (parsed.content) {
        return {
          type: 'text',
          content: parsed.content
        };
      }
      
      // Default to text with the parsed content
      return {
        type: 'text',
        content: typeof parsed === 'string' ? parsed : JSON.stringify(parsed)
      };
      
    } catch (error) {
      // Not JSON, check for patterns in the text
      
      // Creative Content Pattern Detection (for CREATE mode)
      const creativePatterns = [
        /🌟\s*\*\*WHAT'S SHINING\*\*/i,
        /💡\s*\*\*CREATIVE OPPORTUNITY\*\*/i,
        /🎯\s*\*\*NEXT STEPS\*\*/i,
        /🤔\s*\*\*THINK ABOUT THIS\*\*/i
      ];
      
      // Check if it's creative feedback
      const isCreativeContent = creativePatterns.some(pattern => pattern.test(rawContent));
      if (isCreativeContent || mode === 'create') {
        return {
          type: 'creative',
          content: rawContent,
          medium: mode === 'create' ? 'Creative Work' : undefined
        };
      }
      
      // MCQ Pattern Detection
      const mcqPatterns = [
        /(?:Question|Q):\s*(.+?)\s*(?:Options|Choices|A\)|a\))/i,
        /(.+?)\s*(?:\n|^)\s*(?:A\)|a\)|\(A\)|\(a\)|1\.)/i
      ];
      
      const longFormPatterns = [
        /(?:Question|Essay|Explain|Describe|Discuss):\s*(.+?)(?:\n|$)/i,
        /(?:Write|Answer|Elaborate).*?(?:words?|sentences?|paragraphs?)/i,
        /Rubric|Criteria|Expected|guidelines/i
      ];
      
      // Check for MCQ pattern
      for (const pattern of mcqPatterns) {
        if (pattern.test(rawContent)) {
          const mcqMatch = rawContent.match(/(?:Question|Q):\s*(.+?)(?:\n|$)/i);
          const optionsMatch = rawContent.match(/(?:A\)|a\)|\(A\)|\(a\)|1\.)\s*(.+?)(?:\n|$)/gi);
          
          if (mcqMatch && optionsMatch && optionsMatch.length >= 2) {
            return {
              type: 'mcq',
              question: mcqMatch[1].trim(),
              options: optionsMatch.map((opt, index) => ({
                id: index.toString(),
                text: opt.replace(/^(?:A\)|a\)|\(A\)|\(a\)|1\.)\s*/, '').trim(),
                isCorrect: index === 0 // Default to first option
              })),
              correctAnswer: 0, // Default to first option
              explanation: "Select the correct answer."
            };
          }
        }
      }
      
      // Check for long form pattern
      for (const pattern of longFormPatterns) {
        if (pattern.test(rawContent)) {
          const questionMatch = rawContent.match(/(?:Question|Essay|Explain|Describe|Discuss):\s*(.+?)(?:\n|$)/i);
          if (questionMatch) {
            return {
              type: 'longform',
              question: questionMatch[1].trim(),
              context: rawContent,
              expectedLength: "medium" as const
            };
          }
        }
      }
      
      // Default to regular text
      return {
        type: 'text',
        content: rawContent
      };
    }
  };

  const contentData = parseContent(content);
  
  // Convert timestamp string to Date object
  const timestampDate = timestamp ? new Date(timestamp) : new Date();

  // Render appropriate card based on content type
  switch (contentData.type) {
    case 'mcq':
      return (
        <MCQCard
          question={contentData.question}
          options={contentData.options}
          mode={mode}
          timestamp={timestampDate}
        />
      );
      
    case 'longform':
      return (
        <LongFormCard
          question={contentData.question}
          context={contentData.context}
          mode={mode}
          timestamp={timestampDate}
          expectedLength={contentData.expectedLength}
          rubric={contentData.rubric}
        />
      );
      
    case 'creative':
      return (
        <CreativeCard
          content={contentData.content}
          timestamp={timestampDate}
          medium={contentData.medium}
        />
      );
      
    case 'text':
    default:
      return (
        <TextCard
          content={contentData.content}
          mode={mode}
          timestamp={timestampDate}
          isUser={messageType === 'user'}
        />
      );
  }
};

export default ContentRenderer;
