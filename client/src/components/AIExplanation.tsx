import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, Sparkles, RefreshCw } from 'lucide-react';

interface AIExplanationProps {
  question: string;
  correctAnswer: string;
  options: { id: string; text: string }[];
  subject: string;
  basicExplanation?: string;
  onClose?: () => void;
}

interface AIResponse {
  explanation: string;
  provider: 'gemini' | 'openai' | 'fallback' | 'error';
  enhanced: boolean;
}

export default function AIExplanation({ 
  question, 
  correctAnswer, 
  options, 
  subject, 
  basicExplanation,
  onClose 
}: AIExplanationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateAIExplanation = async (provider: 'gemini' | 'gpt4' = 'gemini') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/quiz/explanation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          correctAnswer,
          options,
          subject,
          provider // Allow user to choose AI provider
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate explanation');
      }

      const data = await response.json();
      setAiResponse(data);
    } catch (err) {
      setError('Failed to generate AI explanation. Please try again.');
      console.error('AI explanation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'gemini':
        return <Sparkles className="w-4 h-4" />;
      case 'openai':
        return <Brain className="w-4 h-4" />;
      default:
        return <RefreshCw className="w-4 h-4" />;
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'gemini':
        return 'Gemini AI';
      case 'openai':
        return 'GPT-4';
      case 'fallback':
        return 'Standard';
      default:
        return 'System';
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'gemini':
        return 'bg-blue-600';
      case 'openai':
        return 'bg-green-600';
      case 'fallback':
        return 'bg-gray-600';
      default:
        return 'bg-red-600';
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700 mb-4">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Explanation</span>
          </h3>
          {aiResponse && (
            <Badge className={`${getProviderColor(aiResponse.provider)} text-white flex items-center space-x-1`}>
              {getProviderIcon(aiResponse.provider)}
              <span>{getProviderName(aiResponse.provider)}</span>
            </Badge>
          )}
        </div>

        {/* Basic explanation (always shown if available) */}
        {basicExplanation && (
          <div className="mb-4 p-4 bg-gray-700 rounded-lg">
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {basicExplanation}
            </p>
          </div>
        )}

        {/* AI-generated explanation */}
        {aiResponse && (
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg border border-blue-500 border-opacity-30">
            <div className="flex items-center space-x-2 mb-2">
              {getProviderIcon(aiResponse.provider)}
              <span className="text-blue-300 text-sm font-medium">
                {aiResponse.enhanced ? 'AI-Enhanced Explanation' : 'Standard Explanation'}
              </span>
            </div>
            <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
              {aiResponse.explanation}
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-900 bg-opacity-50 rounded-lg border border-red-500 border-opacity-30">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center space-x-3">
          {!aiResponse && !isLoading && (
            <Button
              onClick={() => generateAIExplanation()}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
              data-testid="button-generate-ai-explanation"
            >
              <Brain className="w-4 h-4" />
              <span>Get AI Explanation</span>
            </Button>
          )}

          {isLoading && (
            <Button disabled className="bg-blue-600 text-white flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating...</span>
            </Button>
          )}

          {aiResponse && (
            <Button
              onClick={() => generateAIExplanation()}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
              data-testid="button-regenerate-explanation"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Regenerate</span>
            </Button>
          )}

          {onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-gray-400 hover:text-white"
              data-testid="button-close-explanation"
            >
              Close
            </Button>
          )}
        </div>

        {/* Help text */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-gray-500 text-xs">
            AI explanations provide detailed, context-aware learning support. 
            {aiResponse?.provider === 'fallback' && ' Configure AI services for enhanced explanations.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}