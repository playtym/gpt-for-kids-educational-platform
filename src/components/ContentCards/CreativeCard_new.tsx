import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Wrench, Settings, Construction, Target, HelpCircle, Palette, MessageSquare, Zap } from 'lucide-react';

interface CreativeCardProps {
  content: string;
  timestamp: Date;
  medium?: string;
}

const CreativeCard: React.FC<CreativeCardProps> = ({ content, timestamp, medium }) => {
  // Parse the structured creative feedback - handles multiple formats
  const parseCreativeContent = (text: string) => {
    const sections = {
      // Structural format
      structural: '',
      technical: '',
      buildingBlocks: [] as string[],
      structuralQuestion: '',
      isStructural: false,
      
      // Debate format
      argumentAnalysis: '',
      counterPerspective: '',
      logicalChallenges: [] as string[],
      strengthenCase: '',
      isDebate: false,
      
      // Original format
      shining: '',
      opportunity: '',
      nextSteps: [] as string[],
      thinkAbout: '',
      medium: medium || 'Creative Work'
    };

    // Check for debate format first
    if (text.includes('**Your Argument Analysis:**') || text.includes('**Counter-Perspective:**')) {
      sections.isDebate = true;
      
      const argMatch = text.match(/\*\*Your Argument Analysis:\*\*\s*(.*?)(?=\*\*|$)/s);
      if (argMatch) sections.argumentAnalysis = argMatch[1].trim();
      
      const counterMatch = text.match(/\*\*Counter-Perspective:\*\*\s*(.*?)(?=\*\*|$)/s);
      if (counterMatch) sections.counterPerspective = counterMatch[1].trim();
      
      const challengesMatch = text.match(/\*\*Logical Challenges:\*\*\s*(.*?)(?=\*\*|$)/s);
      if (challengesMatch) {
        sections.logicalChallenges = challengesMatch[1]
          .split(/\d+\./)
          .filter(item => item.trim())
          .map(item => item.trim());
      }
      
      const strengthenMatch = text.match(/\*\*Strengthen Your Case:\*\*\s*(.*?)(?=\*\*|$)/s);
      if (strengthenMatch) sections.strengthenCase = strengthenMatch[1].trim();
      
      return sections;
    }

    // Check for structural format
    if (text.includes('**Structural Foundation:**') || text.includes('**Technical Opportunity:**')) {
      sections.isStructural = true;
      
      const structMatch = text.match(/\*\*Structural Foundation:\*\*\s*(.*?)(?=\*\*|$)/s);
      if (structMatch) sections.structural = structMatch[1].trim();
      
      const techMatch = text.match(/\*\*Technical Opportunity:\*\*\s*(.*?)(?=\*\*|$)/s);
      if (techMatch) sections.technical = techMatch[1].trim();
      
      const blocksMatch = text.match(/\*\*Building Blocks:\*\*\s*(.*?)(?=\*\*|$)/s);
      if (blocksMatch) {
        sections.buildingBlocks = blocksMatch[1]
          .split(/\d+\./)
          .filter(item => item.trim())
          .map(item => item.trim());
      }
      
      const structQMatch = text.match(/\*\*Structural Question:\*\*\s*(.*?)(?=\*\*|$)/s);
      if (structQMatch) sections.structuralQuestion = structQMatch[1].trim();
      
      return sections;
    }

    // Fall back to original format
    const shiningMatch = text.match(/\*\*What's Shining:\*\*\s*(.*?)(?=\*\*|$)/s);
    if (shiningMatch) sections.shining = shiningMatch[1].trim();

    const oppMatch = text.match(/\*\*Creative Opportunity:\*\*\s*(.*?)(?=\*\*|$)/s);
    if (oppMatch) sections.opportunity = oppMatch[1].trim();

    const stepsMatch = text.match(/\*\*Next Steps:\*\*\s*(.*?)(?=\*\*|$)/s);
    if (stepsMatch) {
      sections.nextSteps = stepsMatch[1]
        .split(/\d+\./)
        .filter(item => item.trim())
        .map(item => item.trim());
    }

    const thinkMatch = text.match(/\*\*Think About This:\*\*\s*(.*?)(?=\*\*|$)/s);
    if (thinkMatch) sections.thinkAbout = thinkMatch[1].trim();

    return sections;
  };

  const sections = parseCreativeContent(content);

  return (
    <Card className="max-w-4xl transition-all duration-300 hover:shadow-md bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-green-500 text-white">
              {sections.isDebate ? <MessageSquare size={18} /> : <Palette size={18} />}
            </div>
            <div>
              <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                {sections.isDebate ? 'Debate Challenge' : sections.isStructural ? 'Technical Analysis' : 'Creative Guidance'}
              </Badge>
              <p className="text-sm text-gray-600 mt-1">{sections.medium}</p>
            </div>
          </div>
          <span className="text-xs text-gray-500">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Debate Format */}
        {sections.isDebate && (
          <>
            {sections.argumentAnalysis && (
              <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                <div className="flex items-start space-x-3">
                  <HelpCircle className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-800 mb-2">Your Argument Analysis</h3>
                    <p className="text-blue-700 leading-relaxed">{sections.argumentAnalysis}</p>
                  </div>
                </div>
              </div>
            )}

            {sections.counterPerspective && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                <div className="flex items-start space-x-3">
                  <MessageSquare className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-800 mb-2">Counter-Perspective</h3>
                    <p className="text-red-700 leading-relaxed">{sections.counterPerspective}</p>
                  </div>
                </div>
              </div>
            )}

            {sections.logicalChallenges.length > 0 && (
              <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-400 rounded-r-lg">
                <div className="flex items-start space-x-3">
                  <Zap className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-orange-800 mb-3">Logical Challenges</h3>
                    <div className="space-y-2">
                      {sections.logicalChallenges.map((challenge, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-orange-500 rounded-full flex-shrink-0">
                            {index + 1}
                          </span>
                          <p className="text-orange-700 leading-relaxed">{challenge}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {sections.strengthenCase && (
              <div className="p-4 bg-purple-50 border-l-4 border-purple-400 rounded-r-lg">
                <div className="flex items-start space-x-3">
                  <Target className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-purple-800 mb-2">Strengthen Your Case</h3>
                    <p className="text-purple-700 leading-relaxed">{sections.strengthenCase}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Structural Format */}
        {sections.isStructural && (
          <>
            {sections.structural && (
              <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                <div className="flex items-start space-x-3">
                  <Wrench className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-800 mb-2">Structural Foundation</h3>
                    <p className="text-blue-700 leading-relaxed">{sections.structural}</p>
                  </div>
                </div>
              </div>
            )}

            {sections.technical && (
              <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-400 rounded-r-lg">
                <div className="flex items-start space-x-3">
                  <Settings className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-orange-800 mb-2">Technical Opportunity</h3>
                    <p className="text-orange-700 leading-relaxed">{sections.technical}</p>
                  </div>
                </div>
              </div>
            )}

            {sections.buildingBlocks.length > 0 && (
              <div className="mb-6 p-4 bg-purple-50 border-l-4 border-purple-400 rounded-r-lg">
                <div className="flex items-start space-x-3">
                  <Construction className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-800 mb-3">Building Blocks</h3>
                    <div className="space-y-2">
                      {sections.buildingBlocks.map((block, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-purple-500 rounded-full flex-shrink-0">
                            {index + 1}
                          </span>
                          <p className="text-purple-700 leading-relaxed">{block}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {sections.structuralQuestion && (
              <div className="p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-lg">
                <div className="flex items-start space-x-3">
                  <HelpCircle className="w-5 h-5 text-indigo-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-indigo-800 mb-2">Structural Question</h3>
                    <p className="text-indigo-700 leading-relaxed italic">{sections.structuralQuestion}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Original Format (fallback) */}
        {!sections.isDebate && !sections.isStructural && (
          <>
            {sections.shining && (
              <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                <div className="flex items-start space-x-3">
                  <Sparkles className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-yellow-800 mb-2">What's Shining</h3>
                    <p className="text-yellow-700 leading-relaxed">{sections.shining}</p>
                  </div>
                </div>
              </div>
            )}

            {sections.opportunity && (
              <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                <div className="flex items-start space-x-3">
                  <Wrench className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-800 mb-2">Creative Opportunity</h3>
                    <p className="text-blue-700 leading-relaxed">{sections.opportunity}</p>
                  </div>
                </div>
              </div>
            )}

            {sections.nextSteps.length > 0 && (
              <div className="mb-6 p-4 bg-purple-50 border-l-4 border-purple-400 rounded-r-lg">
                <div className="flex items-start space-x-3">
                  <Target className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-800 mb-3">Next Steps</h3>
                    <div className="space-y-2">
                      {sections.nextSteps.map((step, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-purple-500 rounded-full flex-shrink-0">
                            {index + 1}
                          </span>
                          <p className="text-purple-700 leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {sections.thinkAbout && (
              <div className="p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-lg">
                <div className="flex items-start space-x-3">
                  <HelpCircle className="w-5 h-5 text-indigo-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-indigo-800 mb-2">Think About This</h3>
                    <p className="text-indigo-700 leading-relaxed italic">{sections.thinkAbout}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="flex items-center justify-center mt-6 pt-4 border-t border-green-200">
          <div className="flex items-center space-x-2 text-green-600">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">
              {sections.isDebate ? 'Keep challenging ideas!' : sections.isStructural ? 'Master the fundamentals!' : 'Keep creating and exploring!'}
            </span>
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreativeCard;
