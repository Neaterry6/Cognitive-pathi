import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User } from '@shared/schema';
import { Search, ExternalLink, BookOpen, ArrowLeft, Loader2 } from 'lucide-react';

interface WikiSearchProps {
  user: User;
  onBack: () => void;
}

interface WikiResult {
  title: string;
  extract: string;
  url: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
}

export default function EnhancedWikiSearch({ user, onBack }: WikiSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<WikiResult[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);

  // Popular search suggestions for different subjects
  const suggestions = [
    'Physics fundamentals',
    'Organic chemistry',
    'Cell biology',
    'Calculus basics',
    'English literature',
    'World history',
    'Economic principles',
    'Geography concepts',
  ];

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    setSearchResults([]);
    try {
      const response = await fetch(`/api/wiki/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Error searching Wikipedia:', error);
      // Mock data for demo
      setSearchResults([
        {
          title: searchTerm,
          extract: `This is a comprehensive overview of ${searchTerm}. Wikipedia provides detailed information about this topic that can help with your studies. Understanding this concept is crucial for academic success.`,
          url: `https://en.wikipedia.org/wiki/${searchTerm.replace(/\s+/g, '_')}`,
          thumbnail: {
            source: 'https://via.placeholder.com/150',
            width: 150,
            height: 150
          }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFullArticle = async (result: WikiResult) => {
    setIsLoadingArticle(true);
    try {
      const response = await fetch(`/api/wiki/article?title=${encodeURIComponent(result.title)}`);
      const data = await response.json();
      setSelectedArticle(data);
    } catch (error) {
      console.error('Error loading article:', error);
      // Fallback content
      setSelectedArticle({
        title: result.title,
        content: result.extract + '\n\nThis is a comprehensive article about ' + result.title + ' that provides detailed information for your studies. Key concepts include fundamental principles, practical applications, and theoretical frameworks that are essential for understanding this topic.',
        images: result.thumbnail ? [result.thumbnail.source] : [],
        references: ['Wikipedia.org'],
      });
    } finally {
      setIsLoadingArticle(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    // Auto-search when suggestion is clicked
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Header */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold text-white">📚 Wiki Research</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {!selectedArticle ? (
          <>
            {/* Search Section */}
            <Card className="bg-white bg-opacity-10 border-white border-opacity-20 mb-6">
              <CardContent className="p-6">
                <div className="flex gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search for educational topics, concepts, or subjects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10 bg-white bg-opacity-20 border-white border-opacity-30 text-white placeholder-gray-300"
                    />
                  </div>
                  <Button 
                    onClick={handleSearch} 
                    disabled={isLoading || !searchTerm.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>

                {/* Search Suggestions */}
                <div>
                  <p className="text-white text-sm mb-3">Popular topics:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="bg-white bg-opacity-10 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-20 text-xs"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <Card key={index} className="bg-white bg-opacity-10 border-white border-opacity-20">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      {result.thumbnail && (
                        <img 
                          src={result.thumbnail.source} 
                          alt={result.title}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => {
                            // Hide broken thumbnails gracefully
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-white mb-2">{result.title}</h3>
                        <p className="text-gray-200 mb-4 line-clamp-3">{result.extract}</p>
                        <div className="flex items-center space-x-3">
                          <Button 
                            onClick={() => loadFullArticle(result)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Read Full Article
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(result.url, '_blank')}
                            className="bg-white bg-opacity-10 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-20"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open Wikipedia
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {searchResults.length === 0 && searchTerm && !isLoading && (
                <Card className="bg-white bg-opacity-10 border-white border-opacity-20">
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-gray-300 text-lg mb-2">No results found for "{searchTerm}"</p>
                    <p className="text-gray-400">Try different keywords or check the spelling</p>
                  </CardContent>
                </Card>
              )}

              {!searchTerm && (
                <Card className="bg-white bg-opacity-10 border-white border-opacity-20">
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl mb-4">📚</div>
                    <h3 className="text-white text-xl font-semibold mb-2">Research Any Topic</h3>
                    <p className="text-gray-300 mb-4">Search Wikipedia for educational content to enhance your learning</p>
                    <Badge variant="secondary" className="bg-blue-600 text-white">
                      Educational Research Tool
                    </Badge>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        ) : (
          /* Article View */
          <Card className="bg-white bg-opacity-10 border-white border-opacity-20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl text-white">{selectedArticle.title}</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedArticle(null)}
                  className="bg-white bg-opacity-10 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-20"
                >
                  ← Back to Results
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingArticle ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-white mr-3" />
                  <span className="text-white">Loading article...</span>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {selectedArticle.content}
                  </div>
                  {selectedArticle.images && selectedArticle.images.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-white font-semibold mb-3">Related Images</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedArticle.images.map((image: any, index: number) => {
                          const imageUrl = typeof image === 'string' ? image : image.url;
                          const caption = typeof image === 'object' ? image.caption : `Image ${index + 1}`;
                          
                          return (
                            <div key={index} className="relative group">
                              <img 
                                src={imageUrl} 
                                alt={caption || `${selectedArticle.title} related image ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg transition-transform group-hover:scale-105"
                                onError={(e) => {
                                  // Hide broken images gracefully
                                  const imgElement = e.target as HTMLImageElement;
                                  imgElement.style.display = 'none';
                                  console.log(`Failed to load image: ${imageUrl}`);
                                }}
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                <button 
                                  onClick={() => window.open(imageUrl, '_blank')}
                                  className="opacity-0 group-hover:opacity-100 text-white bg-black bg-opacity-50 px-2 py-1 rounded text-sm transition-opacity"
                                >
                                  View Full Size
                                </button>
                              </div>
                              {caption && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                  {caption}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}