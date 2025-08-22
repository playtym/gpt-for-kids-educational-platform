import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, MessageCircle, Lightbulb, TrendingUp } from 'lucide-react';

const MemorySystemDemo: React.FC = () => {
  const [step, setStep] = useState(0);

  const demoSteps = [
    {
      title: "Welcome to the Memory System!",
      description: "I'll remember our conversation to provide personalized learning experiences.",
      icon: Brain,
      color: "text-purple-600",
      example: "Let's start by asking me about math concepts."
    },
    {
      title: "Learning Your Preferences",
      description: "I notice you prefer visual explanations and step-by-step guidance.",
      icon: TrendingUp,
      color: "text-green-600",
      example: "Memory saved: 'Student prefers visual learning and detailed explanations'"
    },
    {
      title: "Tracking Your Progress", 
      description: "I remember what concepts you've mastered and what you're working on.",
      icon: Lightbulb,
      color: "text-yellow-600",
      example: "Memory saved: 'Student mastered basic algebra, struggling with quadratic equations'"
    },
    {
      title: "Continuous Conversation",
      description: "Future messages reference your learning history for personalized responses.",
      icon: MessageCircle,
      color: "text-blue-600",
      example: "Context provided: 'Building on previous algebra discussion, considering visual learning preference...'"
    }
  ];

  const currentStep = demoSteps[step];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="text-purple-600" />
          Mem0-Like Memory System
          <Badge variant="secondary" className="ml-2">
            {step + 1} / {demoSteps.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <div className={`mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center ${currentStep.color}`}>
            <currentStep.icon size={32} />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2">{currentStep.title}</h3>
            <p className="text-gray-600 mb-4">{currentStep.description}</p>
          </div>

          <Card className="bg-gray-50 border-dashed">
            <CardContent className="p-4">
              <div className="text-sm text-gray-700 italic">
                "{currentStep.example}"
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            Previous
          </Button>
          
          <div className="flex space-x-1">
            {demoSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === step ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <Button
            variant="outline"
            onClick={() => setStep(Math.min(demoSteps.length - 1, step + 1))}
            disabled={step === demoSteps.length - 1}
          >
            Next
          </Button>
        </div>

        {step === demoSteps.length - 1 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="text-center">
                <h4 className="font-semibold text-blue-900 mb-2">Memory System Active!</h4>
                <p className="text-blue-700 text-sm">
                  The memory system is now tracking your conversation to provide personalized learning experiences. 
                  Check the "Memory" button in the chat header to see what I remember about you!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default MemorySystemDemo;
