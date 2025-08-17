import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, ExternalLink, BookOpen, Calendar, FileText, ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { WikiSearchResult } from '@/types';

interface WikiSearchProps {
  user?: any;
  onBack: () => void;
}

export default function WikiSearch({ user, onBack }: WikiSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WikiSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await apiRequest('GET', `/api/wikipedia/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error searching Wikipedia:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const quickSearches = [
    'Cell Biology',
    'Nigerian History', 
    'Algebra',
    'Physics Laws',
    'Photosynthesis',
    'Government Structure'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">🌐</div>
          <div>
            <h2 className="text-3xl font-bold text-white">Wikipedia Search</h2>
            <p className="text-gray-400">Research any topic for deeper understanding</p>
          </div>
        </div>
        <Button
          onClick={onBack}
          variant="ghost"
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Search interface */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search Wikipedia (e.g., Photosynthesis, Nigerian Civil War, Quadratic Equations)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full p-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <Button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-4 rounded-lg transition-colors font-medium whitespace-nowrap disabled:opacity-50"
            >
              <Search className="h-5 w-5 mr-2" />
              Search
            </Button>
          </form>

          {/* Quick search suggestions */}
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {quickSearches.map((suggestion) => (
                <Button
                  key={suggestion}
                  onClick={() => {
                    setQuery(suggestion);
                    performSearch(suggestion);
                  }}
                  variant="outline"
                  className="bg-gray-700 hover:bg-gray-600 border-gray-600 hover:border-gray-500 px-3 py-1 rounded-full text-sm transition-colors"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {isLoading && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Searching Wikipedia...</p>
          </CardContent>
        </Card>
      )}

      {/* Search results */}
      <div className="space-y-4">
        {results.length > 0 ? (
          results.map((result, index) => (
            <Card key={index} className="bg-gray-800 border-gray-700 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4 mb-4">
                  {/* Wikipedia/thumbnail image */}
                  <div className="flex-shrink-0">
                    {result.thumbnail ? (
                      <img
                        src={result.thumbnail.source}
                        alt={result.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{result.title}</h3>
                    <p className="text-gray-400 text-sm mb-2">From Wikipedia, the free encyclopedia</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      {result.lastModified && (
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Last updated: {new Date(result.lastModified).toLocaleDateString()}
                        </span>
                      )}
                      {result.wordCount && (
                        <span className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          {result.wordCount.toLocaleString()} words
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed mb-4">
                    {result.extract || result.snippet}
                  </p>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg flex justify-between items-center">
                  <Button
                    onClick={() => window.open(result.url, '_blank')}
                    className="text-blue-400 hover:text-blue-300 bg-transparent hover:bg-gray-800 text-sm transition-colors"
                    variant="ghost"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Read Full Article
                  </Button>
                  <Button
                    className="text-green-400 hover:text-green-300 bg-transparent hover:bg-gray-800 text-sm transition-colors"
                    variant="ghost"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Add to Study Notes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : hasSearched && !isLoading ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-white mb-2">No Results Found</h3>
              <p className="text-gray-400">
                Try searching with different keywords or check your spelling.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
