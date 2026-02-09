import {ChatMessage, BibleVerse} from '../types';
import {BibleService} from './bibleService';

export class ChatService {
  static async processMessage(
    userMessage: string,
  ): Promise<{response: string; verses: BibleVerse[]}> {
    const lowerMessage = userMessage.toLowerCase();
    const verses: BibleVerse[] = [];

    // Simple keyword-based responses (in production, use AI/ML)
    let response = '';

    // Search for verses
    if (
      lowerMessage.includes('verse') ||
      lowerMessage.includes('scripture') ||
      lowerMessage.includes('bible')
    ) {
      // Try to extract reference
      const referenceMatch = userMessage.match(/(\w+)\s+\d+:\d+/i);
      if (referenceMatch) {
        const verse = BibleService.parseReference(referenceMatch[0]);
        if (verse) {
          verses.push(verse);
          response = `Here's ${verse.reference}:\n\n"${verse.text}"`;
        } else {
          response = "I couldn't find that verse. Could you check the reference?";
        }
      } else {
        // Search by keywords
        const searchResults = BibleService.searchVerses(userMessage);
        if (searchResults.length > 0) {
          verses.push(...searchResults.slice(0, 5)); // Limit to 5 results
          response = `I found ${searchResults.length} verse(s) related to your query. Here are some:\n\n`;
          verses.forEach(v => {
            response += `${v.reference}: "${v.text}"\n\n`;
          });
        } else {
          response =
            "I couldn't find verses matching your query. Try searching for a specific topic or verse reference.";
        }
      }
    } else if (lowerMessage.includes('collection') || lowerMessage.includes('save')) {
      response =
        'To create a collection, select verses from search results and tap "Add to Collection".';
    } else if (lowerMessage.includes('schedule') || lowerMessage.includes('widget')) {
      response =
        'To schedule verses for your widget, select a verse and choose "Schedule for Widget".';
    } else {
      response =
        'I can help you find Bible verses, create collections, and schedule verses for your widget. Try asking for a specific verse like "John 3:16" or search by topic.';
    }

    return {response, verses};
  }

  static createMessage(
    role: 'user' | 'assistant',
    content: string,
    verses?: BibleVerse[],
  ): ChatMessage {
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      role,
      content,
      verses,
      timestamp: new Date(),
    };
  }
}
