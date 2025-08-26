import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Award, Target, HelpCircle, BookOpen, MessageSquare, Zap, Star, TrendingUp, Edit3, FileText, RotateCcw } from 'lucide-react';

interface CreativeCardProps {
  content: string;
  originalUserInput?: string;
  timestamp: Date;
  medium?: string;
  onRecreateSection?: (instruction: string) => void;
}

const CreativeCard: React.FC<CreativeCardProps> = ({ content, originalUserInput, timestamp, medium, onRecreateSection }) => {
  // Parse the structured creative feedback with quality scoring
  const parseCreativeContent = (text: string) => {
    const sections = {
      // Core sections - no fallbacks
      shining: '',
      opportunity: '',
      nextSteps: [] as string[],
      thinkAbout: '',
      critique: '',
      letterGrade: '',
      encouragement: '',
      medium: medium || 'Creative Work'
    };

    // Extract letter grade (look for patterns like "🌟 Grade: A+" or "Grade: B-")
    const gradeMatch = text.match(/(?:🌟\s*)?(?:Grade|GRADE):\s*([A-F][+-]?)/i);
    if (gradeMatch) {
      sections.letterGrade = gradeMatch[1];
    } else {
      // Fallback: convert old numerical scores to letter grades for backward compatibility
      const oldScoreMatch = text.match(/(?:Quality|Score):\s*(\d+)(?:\/100)?/i);
      if (oldScoreMatch) {
        const score = parseInt(oldScoreMatch[1]);
        if (score >= 97) sections.letterGrade = 'A+';
        else if (score >= 93) sections.letterGrade = 'A';
        else if (score >= 90) sections.letterGrade = 'A-';
        else if (score >= 87) sections.letterGrade = 'B+';
        else if (score >= 83) sections.letterGrade = 'B';
        else if (score >= 80) sections.letterGrade = 'B-';
        else if (score >= 77) sections.letterGrade = 'C+';
        else if (score >= 73) sections.letterGrade = 'C';
        else sections.letterGrade = 'C-';
      }
    }

    // Extract critique section
    const critiqueMatch = text.match(/\*\*(?:CRITIQUE|Critique):\*\*\s*(.*?)(?=\*\*|$)/s);
    if (critiqueMatch) sections.critique = critiqueMatch[1].trim();

    // Extract encouragement
    const encouragementMatch = text.match(/\*\*(?:ENCOURAGEMENT|Encouragement):\*\*\s*(.*?)(?=\*\*|$)/s);
    if (encouragementMatch) sections.encouragement = encouragementMatch[1].trim();

    // Extract What's Shining
    const shiningMatch = text.match(/✨\s*\*\*(?:WHAT'S SHINING|What's Shining):\*\*\s*(.*?)(?=💡|🎯|🤔|\*\*|$)/s);
    if (shiningMatch) sections.shining = shiningMatch[1].trim();

    // Extract Creative Opportunity
    const oppMatch = text.match(/💡\s*\*\*(?:CREATIVE OPPORTUNITY|Creative Opportunity):\*\*\s*(.*?)(?=🎯|🤔|✨|\*\*|$)/s);
    if (oppMatch) sections.opportunity = oppMatch[1].trim();

    // Extract Next Steps
    const stepsMatch = text.match(/🎯\s*\*\*(?:NEXT STEPS|Next Steps):\*\*\s*(.*?)(?=🤔|✨|💡|\*\*|$)/s);
    if (stepsMatch) {
      sections.nextSteps = stepsMatch[1]
        .split(/\d+\./)
        .filter(item => item.trim())
        .map(item => item.trim());
    }

    // Extract Think About This
    const thinkMatch = text.match(/🤔\s*\*\*(?:THINK ABOUT THIS|Think About This):\*\*\s*(.*?)(?=✨|💡|🎯|\*\*|$)/s);
    if (thinkMatch) sections.thinkAbout = thinkMatch[1].trim();

    return sections;
  };

  const sections = parseCreativeContent(content);

  // Extract specific recreation instructions from the feedback
  const extractRecreationInstructions = (feedback: string) => {
    const instructions = [];
    
    // Look for specific instruction patterns in the feedback
    if (sections.critique) {
      // Extract specific areas that need improvement from critique
      const critiqueLines = sections.critique.split(/[.!?]+/).filter(line => line.trim());
      critiqueLines.forEach(line => {
        if (line.includes('rewrite') || line.includes('revise') || line.includes('strengthen') || 
            line.includes('improve') || line.includes('clarify') || line.includes('expand')) {
          instructions.push(line.trim());
        }
      });
    }

    // Look in next steps for specific recreation tasks
    if (sections.nextSteps.length > 0) {
      sections.nextSteps.forEach(step => {
        if (step.includes('rewrite') || step.includes('revise') || step.includes('try writing') ||
            step.includes('recreate') || step.includes('rework')) {
          instructions.push(step);
        }
      });
    }

    // Generate fallback instructions if none found
    if (instructions.length === 0 && originalUserInput) {
      instructions.push("Try rewriting your opening paragraph with more vivid details");
      instructions.push("Recreate the emotional core of your piece with stronger language");
    }

    return instructions.slice(0, 3); // Limit to 3 instructions
  };

  const recreationInstructions = extractRecreationInstructions(content);

  // Generate fun grade colors and emojis
  const getGradeStyle = (grade: string) => {
    switch (grade.toUpperCase()) {
      case 'A+': return { 
        className: 'text-purple-700 bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300', 
        emoji: '🌟', 
        message: 'Outstanding!' 
      };
      case 'A': return { 
        className: 'text-green-700 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300', 
        emoji: '🎉', 
        message: 'Excellent!' 
      };
      case 'A-': return { 
        className: 'text-green-600 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300', 
        emoji: '✨', 
        message: 'Great work!' 
      };
      case 'B+': return { 
        className: 'text-blue-700 bg-gradient-to-r from-blue-100 to-sky-100 border-2 border-blue-300', 
        emoji: '🚀', 
        message: 'Well done!' 
      };
      case 'B': return { 
        className: 'text-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300', 
        emoji: '👍', 
        message: 'Good job!' 
      };
      case 'B-': return { 
        className: 'text-blue-500 bg-gradient-to-r from-blue-50 to-sky-100 border-2 border-blue-300', 
        emoji: '😊', 
        message: 'Nice effort!' 
      };
      case 'C+': return { 
        className: 'text-yellow-700 bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-300', 
        emoji: '🌱', 
        message: 'Getting there!' 
      };
      case 'C': return { 
        className: 'text-yellow-600 bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300', 
        emoji: '💪', 
        message: 'Keep going!' 
      };
      case 'C-': return { 
        className: 'text-orange-600 bg-gradient-to-r from-orange-50 to-yellow-100 border-2 border-orange-300', 
        emoji: '📚', 
        message: 'Practice more!' 
      };
      default: return { 
        className: 'text-gray-600 bg-gray-100 border-2 border-gray-300', 
        emoji: '📝', 
        message: 'Keep creating!' 
      };
    }
  };

  return (
    <Card className="max-w-4xl transition-all duration-300 hover:shadow-md bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
      <CardContent className="p-6">
        {/* Header with Quality Score */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-green-500 text-white">
              <BookOpen size={18} />
            </div>
            <div>
              <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                Creative Analysis
              </Badge>
              <p className="text-sm text-gray-600 mt-1">{sections.medium}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {sections.letterGrade && (
              <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 shadow-sm ${getGradeStyle(sections.letterGrade).className}`}>
                <span className="text-lg">{getGradeStyle(sections.letterGrade).emoji}</span>
                <span className="text-lg">{sections.letterGrade}</span>
                <span className="text-xs opacity-80">{getGradeStyle(sections.letterGrade).message}</span>
              </div>
            )}
            <span className="text-xs text-gray-500">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Original User Work Section */}
        {originalUserInput && (
          <div className="mb-6 p-4 bg-gray-50 border-l-4 border-gray-400 rounded-r-lg">
            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-2">📝 Your Creative Work</h3>
                <div className="bg-white p-3 rounded border border-gray-200">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{originalUserInput}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Critique Section */}
        {sections.critique && (
          <div className="mb-6 p-4 bg-purple-50 border-l-4 border-purple-400 rounded-r-lg">
            <div className="flex items-start space-x-3">
              <MessageSquare className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-purple-800 mb-2">Critique & Analysis</h3>
                <p className="text-purple-700 leading-relaxed">{sections.critique}</p>
              </div>
            </div>
          </div>
        )}

        {/* What's Shining Section */}
        {sections.shining && (
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">✨ What's Shining</h3>
                <p className="text-yellow-700 leading-relaxed">{sections.shining}</p>
              </div>
            </div>
          </div>
        )}

        {/* Creative Opportunity Section */}
        {sections.opportunity && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">💡 Creative Opportunity</h3>
                <p className="text-blue-700 leading-relaxed">{sections.opportunity}</p>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps Section */}
        {sections.nextSteps.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
            <div className="flex items-start space-x-3">
              <Target className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 mb-3">🎯 Next Steps</h3>
                <div className="space-y-2">
                  {sections.nextSteps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-green-500 rounded-full flex-shrink-0">
                        {index + 1}
                      </span>
                      <p className="text-green-700 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Think About This Section */}
        {sections.thinkAbout && (
          <div className="mb-6 p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-lg">
            <div className="flex items-start space-x-3">
              <HelpCircle className="w-5 h-5 text-indigo-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-indigo-800 mb-2">🤔 Think About This</h3>
                <p className="text-indigo-700 leading-relaxed italic">{sections.thinkAbout}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recreate This Part Section */}
        {recreationInstructions.length > 0 && onRecreateSection && (
          <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-400 rounded-r-lg">
            <div className="flex items-start space-x-3">
              <Edit3 className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-800 mb-3">✏️ Try Recreating These Parts</h3>
                <p className="text-orange-700 text-sm mb-3">
                  Based on the feedback, here are specific parts of your work to recreate:
                </p>
                <div className="space-y-2">
                  {recreationInstructions.map((instruction, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-left p-3 h-auto border-orange-200 hover:bg-orange-100 hover:border-orange-300 transition-colors"
                      onClick={() => onRecreateSection(instruction)}
                    >
                      <div className="flex items-start space-x-3 w-full">
                        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-orange-500 rounded-full flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-orange-800 text-sm leading-relaxed">{instruction}</p>
                        </div>
                        <RotateCcw size={16} className="text-orange-500 opacity-70 flex-shrink-0 mt-0.5" />
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Encouragement Section */}
        {sections.encouragement && (
          <div className="p-4 bg-rose-50 border-l-4 border-rose-400 rounded-r-lg">
            <div className="flex items-start space-x-3">
              <Award className="w-5 h-5 text-rose-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-rose-800 mb-2">Keep Going!</h3>
                <p className="text-rose-700 leading-relaxed">{sections.encouragement}</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-center mt-6 pt-4 border-t border-green-200">
          <div className="flex items-center space-x-2 text-green-600">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">
              {recreationInstructions.length > 0 
                ? "Click the recreation suggestions above to get started!" 
                : "Keep creating and improving your work!"
              }
            </span>
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreativeCard;
