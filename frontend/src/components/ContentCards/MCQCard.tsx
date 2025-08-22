import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, HelpCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface MCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

interface MCQCardProps {
  question: string;
  options: MCQOption[];
  mode: string;
  timestamp: Date;
  onAnswer?: (selectedOption: MCQOption, isCorrect: boolean) => void;
}

const MCQCard: React.FC<MCQCardProps> = ({ 
  question, 
  options, 
  mode, 
  timestamp, 
  onAnswer 
}) => {
  const [selectedOption, setSelectedOption] = useState<MCQOption | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleOptionSelect = (option: MCQOption) => {
    if (!isSubmitted) {
      setSelectedOption(option);
    }
  };

  const handleSubmit = () => {
    if (!selectedOption) {
      toast({
        title: "Please select an option",
        description: "Choose an answer before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitted(true);
    setShowResults(true);
    
    if (onAnswer) {
      onAnswer(selectedOption, selectedOption.isCorrect);
    }

    toast({
      title: selectedOption.isCorrect ? "Correct! 🎉" : "Not quite right 📚",
      description: selectedOption.isCorrect 
        ? "Well done! You got it right." 
        : "Don't worry, learning is a journey. Try again!",
      variant: selectedOption.isCorrect ? "default" : "destructive"
    });
  };

  const handleReset = () => {
    setSelectedOption(null);
    setShowResults(false);
    setIsSubmitted(false);
  };

  const getOptionStyle = (option: MCQOption) => {
    if (!showResults) {
      return selectedOption?.id === option.id 
        ? 'border-blue-500 bg-blue-50 text-blue-900' 
        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50';
    }
    
    if (option.isCorrect) {
      return 'border-green-500 bg-green-50 text-green-900';
    }
    
    if (selectedOption?.id === option.id && !option.isCorrect) {
      return 'border-red-500 bg-red-50 text-red-900';
    }
    
    return 'border-gray-200 bg-gray-50 text-gray-600';
  };

  const getOptionIcon = (option: MCQOption) => {
    if (!showResults) return null;
    
    if (option.isCorrect) {
      return <CheckCircle size={20} className="text-green-600" />;
    }
    
    if (selectedOption?.id === option.id && !option.isCorrect) {
      return <XCircle size={20} className="text-red-600" />;
    }
    
    return null;
  };

  return (
    <Card className="max-w-4xl bg-white border-blue-200 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HelpCircle className="text-blue-600" size={20} />
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Multiple Choice Question
            </Badge>
          </div>
          <span className="text-xs text-gray-500">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <CardTitle className="text-lg font-semibold text-gray-800 mt-3">
          {question}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Options */}
        <div className="space-y-3">
          {options.map((option, index) => (
            <div key={option.id} className="space-y-2">
              <div
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${getOptionStyle(option)} ${
                  isSubmitted ? 'cursor-default' : 'cursor-pointer'
                }`}
                onClick={() => handleOptionSelect(option)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-semibold ${
                      selectedOption?.id === option.id ? 'border-current bg-current text-white' : 'border-current'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="font-medium">{option.text}</span>
                  </div>
                  {getOptionIcon(option)}
                </div>
              </div>
              
              {/* Show explanation after submission */}
              {showResults && option.explanation && (selectedOption?.id === option.id || option.isCorrect) && (
                <div className={`p-3 rounded-lg text-sm ${
                  option.isCorrect ? 'bg-green-50 text-green-800' : 'bg-blue-50 text-blue-800'
                }`}>
                  <strong>Explanation:</strong> {option.explanation}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            {showResults && (
              <Badge variant={selectedOption?.isCorrect ? "default" : "destructive"} className="flex items-center space-x-1">
                {selectedOption?.isCorrect ? (
                  <>
                    <CheckCircle size={14} />
                    <span>Correct</span>
                  </>
                ) : (
                  <>
                    <XCircle size={14} />
                    <span>Incorrect</span>
                  </>
                )}
              </Badge>
            )}
          </div>
          
          <div className="flex space-x-2">
            {isSubmitted ? (
              <Button 
                onClick={handleReset} 
                variant="outline" 
                size="sm"
                className="flex items-center space-x-1"
              >
                <RefreshCw size={14} />
                <span>Try Again</span>
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={!selectedOption}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                Submit Answer
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MCQCard;
