export class WikipediaService {
  private readonly baseUrl = 'https://en.wikipedia.org/api/rest_v1';
  private readonly searchUrl = 'https://en.wikipedia.org/w/api.php';

  async search(query: string, limit: number = 5): Promise<any[]> {
    try {
      const searchParams = new URLSearchParams({
        action: 'query',
        format: 'json',
        list: 'search',
        srsearch: query,
        srlimit: limit.toString(),
        origin: '*'
      });

      const searchResponse = await fetch(`${this.searchUrl}?${searchParams}`, {
        headers: {
          'User-Agent': 'CognitivePath/1.0 (Educational Platform)'
        }
      });
      
      if (!searchResponse.ok) {
        throw new Error(`Wikipedia API error: ${searchResponse.status}`);
      }
      
      const searchData = await searchResponse.json();

      if (!searchData.query || !searchData.query.search) {
        return [];
      }

      const results = [];
      
      for (const item of searchData.query.search.slice(0, limit)) {
        try {
          const pageData = await this.getPageSummary(item.title);
          if (pageData && pageData.extract) {
            results.push({
              title: item.title,
              snippet: this.cleanHtml(item.snippet || ''),
              ...pageData
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch summary for ${item.title}:`, error);
          // Include basic search result even if summary fails
          results.push({
            title: item.title,
            snippet: this.cleanHtml(item.snippet || ''),
            extract: this.cleanHtml(item.snippet || ''),
            thumbnail: null,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
            wordCount: item.snippet ? item.snippet.split(' ').length : 0
          });
        }
      }

      return results.filter(result => result.extract && result.extract.length > 50);
    } catch (error) {
      console.error('Wikipedia search error:', error);
      throw new Error('Failed to search Wikipedia');
    }
  }

  private cleanHtml(text: string): string {
    return text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  private async getPageSummary(title: string): Promise<any | null> {
    try {
      const encodedTitle = encodeURIComponent(title);
      const summaryResponse = await fetch(`${this.baseUrl}/page/summary/${encodedTitle}`, {
        headers: {
          'User-Agent': 'CognitivePath/1.0 (Educational Platform)'
        }
      });
      
      if (!summaryResponse.ok) {
        console.warn(`Failed to fetch summary for ${title}: ${summaryResponse.status}`);
        return null;
      }

      const summaryData = await summaryResponse.json();
      
      if (!summaryData || !summaryData.extract) {
        return null;
      }
      
      return {
        extract: summaryData.extract || '',
        thumbnail: summaryData.thumbnail ? {
          source: summaryData.thumbnail.source,
          width: summaryData.thumbnail.width,
          height: summaryData.thumbnail.height
        } : null,
        url: summaryData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodedTitle}`,
        lastModified: summaryData.timestamp,
        wordCount: summaryData.extract ? summaryData.extract.split(' ').length : 0
      };
    } catch (error) {
      console.warn('Failed to get page summary:', error);
      return null;
    }
  }

  async getFullArticle(title: string): Promise<any> {
    try {
      const encodedTitle = encodeURIComponent(title);
      
      // Get page summary first for basic info and thumbnail
      const summary = await this.getPageSummary(title);
      
      // Get page sections and content
      let textContent = '';
      let images: string[] = [];
      
      try {
        // Get page content in wikitext format for better text extraction
        const contentParams = new URLSearchParams({
          action: 'query',
          format: 'json',
          titles: title,
          prop: 'extracts|images',
          exintro: 'false',
          explaintext: 'true',
          exsectionformat: 'wiki',
          imlimit: '10',
          origin: '*'
        });

        const contentResponse = await fetch(`${this.searchUrl}?${contentParams}`, {
          headers: {
            'User-Agent': 'CognitivePath/1.0 (Educational Platform)'
          }
        });
        
        if (!contentResponse.ok) {
          throw new Error(`Content fetch failed: ${contentResponse.status}`);
        }
        
        const contentData = await contentResponse.json();
        
        if (contentData.query && contentData.query.pages) {
          const pageId = Object.keys(contentData.query.pages)[0];
          const page = contentData.query.pages[pageId];
          
          if (page.extract) {
            textContent = page.extract;
          }
          
          // Get images from the page
          if (page.images) {
            const imagePromises = page.images.slice(0, 6).map(async (img: any) => {
              try {
                const imageParams = new URLSearchParams({
                  action: 'query',
                  format: 'json',
                  titles: img.title,
                  prop: 'imageinfo',
                  iiprop: 'url|size',
                  origin: '*'
                });
                
                const imageResponse = await fetch(`${this.searchUrl}?${imageParams}`, {
                  headers: {
                    'User-Agent': 'CognitivePath/1.0 (Educational Platform)'
                  }
                });
                
                if (!imageResponse.ok) {
                  return null;
                }
                
                const imageData = await imageResponse.json();
                
                if (imageData.query && imageData.query.pages) {
                  const imagePageId = Object.keys(imageData.query.pages)[0];
                  const imagePage = imageData.query.pages[imagePageId];
                  
                  if (imagePage.imageinfo && imagePage.imageinfo[0]) {
                    const imageInfo = imagePage.imageinfo[0];
                    // Only include actual images, not icons/logos
                    if (imageInfo.width > 200 && imageInfo.height > 150) {
                      return imageInfo.url;
                    }
                  }
                }
                return null;
              } catch {
                return null;
              }
            });
            
            const resolvedImages = await Promise.all(imagePromises);
            images = resolvedImages.filter(Boolean) as string[];
          }
        }
      } catch (error) {
        console.warn('Error fetching detailed content:', error);
      }
      
      // Fallback to summary content if detailed content fails
      if (!textContent && summary?.extract) {
        textContent = summary.extract;
      }
      
      // Include thumbnail if no other images found
      if (images.length === 0 && summary?.thumbnail) {
        images.push(summary.thumbnail.source);
      }
      
      return {
        title,
        content: textContent || 'Content not available for this article.',
        images: images,
        references: [`https://en.wikipedia.org/wiki/${encodedTitle}`],
        lastModified: summary?.lastModified,
        url: summary?.url || `https://en.wikipedia.org/wiki/${encodedTitle}`
      };
    } catch (error) {
      console.error('Error fetching full article:', error);
      // Provide fallback content instead of throwing
      return {
        title,
        content: `Unable to load the full article for "${title}". This may be due to network issues or the article may not be available.`,
        images: [],
        references: [`https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`],
        lastModified: null,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`
      };
    }
  }

  async getRandomArticle(): Promise<any> {
    try {
      const randomResponse = await fetch(`${this.baseUrl}/page/random/summary`);
      const randomData = await randomResponse.json();
      return randomData;
    } catch (error) {
      console.error('Failed to get random article:', error);
      throw new Error('Failed to get random article');
    }
  }
}

export const wikiService = new WikipediaService();
