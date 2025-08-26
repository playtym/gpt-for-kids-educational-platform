import React, { useState, useRef } from 'react';
import { Send, Paperclip, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type ChatMode = 'explore' | 'learn' | 'create' | 'curriculum';

interface ModeConfig {
  placeholder: string;
}

const modeConfig: Record<ChatMode, ModeConfig> = {
  explore: {
    placeholder: 'Ask about anything you want to discover...'
  },
  learn: {
    placeholder: 'What would you like to learn about today?'
  },
  create: {
    placeholder: 'Let\'s create something amazing together...'
  },
  curriculum: {
    placeholder: 'Ask questions about your school subjects...'
  }
};

interface InputAreaProps {
  currentMode: ChatMode;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({
  currentMode,
  inputValue,
  onInputChange,
  onSubmit,
  onFileUpload,
  isLoading,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && inputValue.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      onFileUpload(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const currentConfig = modeConfig[currentMode];

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* File Upload Preview */}
      {uploadedFile && (
        <div className="mb-3 flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
          {uploadedFile.type.startsWith('image/') ? (
            <ImageIcon size={16} />
          ) : (
            <FileText size={16} />
          )}
          <span>{uploadedFile.name}</span>
          <span className="text-xs">({(uploadedFile.size / 1024).toFixed(1)}KB)</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUploadedFile(null)}
            className="h-6 w-6 p-0 ml-auto"
          >
            ×
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 relative">
          <Input
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={currentConfig.placeholder}
            disabled={disabled || isLoading}
            className="pr-12"
          />
          
          {/* File Upload Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={triggerFileUpload}
                disabled={disabled || isLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <Paperclip size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Attach file or image</TooltipContent>
          </Tooltip>
        </div>

        <Button
          onClick={onSubmit}
          disabled={disabled || isLoading || !inputValue.trim()}
          className="px-4"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Send size={16} />
          )}
        </Button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Quick Actions for Current Mode */}
      {currentMode === 'explore' && !inputValue && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onInputChange("What is")}
            className="text-xs"
          >
            What is...
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onInputChange("How does")}
            className="text-xs"
          >
            How does...
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onInputChange("Why do")}
            className="text-xs"
          >
            Why do...
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onInputChange("Tell me about")}
            className="text-xs"
          >
            Tell me about...
          </Button>
        </div>
      )}

      {currentMode === 'learn' && !inputValue && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onInputChange("Explain")}
            className="text-xs"
          >
            Explain...
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onInputChange("Teach me")}
            className="text-xs"
          >
            Teach me...
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onInputChange("I want to understand")}
            className="text-xs"
          >
            I want to understand...
          </Button>
        </div>
      )}

      {currentMode === 'create' && !inputValue && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onInputChange("Write a story about")}
            className="text-xs"
          >
            Write a story...
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onInputChange("Create a poem about")}
            className="text-xs"
          >
            Create a poem...
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onInputChange("Help me design")}
            className="text-xs"
          >
            Help me design...
          </Button>
        </div>
      )}
    </div>
  );
};

export default InputArea;
