import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Brain, Sparkles, Zap, ArrowLeft, Sun, Moon, Settings, History, MessageSquare, Clock, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
interface UserType {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  nickname?: string;
  avatarUrl?: string | null;
  isPremium: boolean | null;
  isActivated: boolean | null;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  model?: 'groq' | 'gemini' | 'kaiz';
}

interface ChatHistory {
  id: string;
  title: string;
  messageCount: number;
  lastMessage: string;
  lastMessageAt: Date;
}

interface UsageStats {
  todayMessages: number;
  totalMessages: number;
  averageResponseTime: number;
  favoriteModel: string;
}

interface UTMEChatbotProps {
  user: UserType;
  onBack?: () => void;
}

const UTMEChatbot: React.FC<UTMEChatbotProps> = ({ user, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hey there! 👋 I\'m UTME AI - your friendly study buddy! I\'m here to help you ace your JAMB, WAEC, and POST-UTME exams. Whether you need help with tough questions, want to understand concepts better, or just need some study tips, I\'ve got you covered! What subject should we dive into today?',
      sender: 'ai',
      timestamp: new Date(),
      model: 'groq'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'groq' | 'gemini' | 'kaiz'>('groq');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    todayMessages: 0,
    totalMessages: 0,
    averageResponseTime: 1200,
    favoriteModel: 'groq'
  });
  const [currentConversationId, setCurrentConversationId] = useState<string>('default');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history on component mount
  useEffect(() => {
    loadChatHistory();
    loadUsageStats();
  }, []);

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat/history/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const formattedMessages = data.messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            sender: msg.sender,
            timestamp: new Date(msg.createdAt),
            model: msg.aiModel
          }));
          
          // If we have existing messages, add them to the default welcome message
          if (formattedMessages.length > 0) {
            setMessages(prev => [...prev, ...formattedMessages]);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const loadUsageStats = async () => {
    try {
      const response = await fetch(`/api/chat/stats/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsageStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText,
          model: selectedModel,
          userId: user.id,
          conversationId: currentConversationId,
          context: 'UTME preparation and study assistance'
        })
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          sender: 'ai',
          timestamp: new Date(),
          model: selectedModel
        };

        setMessages(prev => [...prev, aiMessage]);
        
        // Update usage stats
        setUsageStats(prev => ({
          ...prev,
          todayMessages: prev.todayMessages + 1,
          totalMessages: prev.totalMessages + 1,
          averageResponseTime: data.responseTime || prev.averageResponseTime
        }));
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to get response from AI. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Load chat history and usage stats on component mount
  useEffect(() => {
    const loadChatData = async () => {
      try {
        // Load usage stats
        const statsResponse = await fetch(`/api/chat/usage/${user.id}`);
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          setUsageStats(stats);
        }

        // Load chat history  
        const historyResponse = await fetch(`/api/chat/history/${user.id}`);
        if (historyResponse.ok) {
          const history = await historyResponse.json();
          setChatHistory(history);
        }
      } catch (error) {
        console.error('Failed to load chat data:', error);
      }
    };

    loadChatData();
  }, [user.id]);

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Mobile-Optimized Header */}
      <div className={`backdrop-blur-sm border-b sticky top-0 z-10 transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gray-800/80 border-gray-700' 
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Back Button */}
              {onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className={`transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}

              {/* UTME AI Logo */}
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800">
                  <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  UTME AI
                </h1>
                <p className={`text-sm transition-colors ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Your Intelligent Study Companion</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              {/* Model Selection */}
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-gray-500" />
                <Select value={selectedModel} onValueChange={(value: 'groq' | 'gemini' | 'kaiz') => setSelectedModel(value)}>
                  <SelectTrigger className={`w-36 h-8 text-xs ${
                    isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}>
                    <SelectItem value="groq" className="text-xs">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-3 h-3 text-purple-500" />
                        <span>Groq AI</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="gemini" className="text-xs">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-3 h-3 text-blue-500" />
                        <span>Google Gemini</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="kaiz" className="text-xs">
                      <div className="flex items-center space-x-2">
                        <Brain className="w-3 h-3 text-green-500" />
                        <span>Kaiz AI</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {user.isPremium ? (
                <Badge variant="default" className="bg-gradient-to-r from-yellow-400 to-orange-500">
                  Premium Access
                </Badge>
              ) : (
                <Badge variant="secondary">
                  Premium Required
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className={`h-[calc(100vh-200px)] flex flex-col shadow-xl border-0 backdrop-blur-sm transition-all duration-300 ${
          isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'
        }`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-blue-600" />
                <span className={`font-semibold transition-colors ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>Chat with UTME AI</span>
              </div>
              <div className={`text-sm transition-colors ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Model: {selectedModel === 'gemini' ? 'Google Gemini' : selectedModel === 'kaiz' ? 'Kaiz AI' : 'Groq AI'}
              </div>
            </div>
          </CardHeader>
          
          <Separator className="mx-6" />
          
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[80%] ${
                  message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                    message.sender === 'user' 
                      ? 'bg-blue-600' 
                      : message.model === 'gemini' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : message.model === 'gemini' ? (
                      <Sparkles className="w-4 h-4 text-white" />
                    ) : (
                      <Zap className="w-4 h-4 text-white" />
                    )}
                  </div>
                  
                  <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
                  }`}>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </div>
                    <div className={`text-xs mt-2 opacity-70 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {message.sender === 'ai' && message.model && (
                        <span className="ml-2 capitalize">• {message.model}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-[80%]">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                    selectedModel === 'gemini' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500'
                  }`}>
                    {selectedModel === 'gemini' ? (
                      <Sparkles className="w-4 h-4 text-white" />
                    ) : (
                      <Zap className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-2xl px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input Area */}
          <div className="p-6 pt-4">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    user.isPremium 
                      ? "Ask me anything about UTME preparation..." 
                      : "Premium access required to chat with UTME AI"
                  }
                  className="pr-12 py-6 text-base border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 rounded-xl bg-white dark:bg-gray-800"
                  disabled={!user.isPremium || isLoading}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Badge variant="outline" className="text-xs">
                    {selectedModel === 'gemini' ? 'Gemini' : 'Kaizenji'}
                  </Badge>
                </div>
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || !user.isPremium || isLoading}
                className="px-6 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            
            {!user.isPremium && (
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upgrade to premium to unlock UTME AI chatbot with Kaizenji Groq and Google Gemini models
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UTMEChatbot;