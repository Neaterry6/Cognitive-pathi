// Global question tracking service to prevent repetition across sessions
class QuestionTracker {
  private static instance: QuestionTracker;
  private usedQuestionIds: Set<string> = new Set();
  private maxTrackedQuestions = 1000; // Limit memory usage

  static getInstance(): QuestionTracker {
    if (!QuestionTracker.instance) {
      QuestionTracker.instance = new QuestionTracker();
    }
    return QuestionTracker.instance;
  }

  addUsedQuestion(questionId: string): void {
    this.usedQuestionIds.add(questionId);
    
    // Clean up if we have too many tracked questions
    if (this.usedQuestionIds.size > this.maxTrackedQuestions) {
      const firstItems = Array.from(this.usedQuestionIds).slice(0, 200);
      firstItems.forEach(id => this.usedQuestionIds.delete(id));
    }
  }

  isQuestionUsed(questionId: string): boolean {
    return this.usedQuestionIds.has(questionId);
  }

  getUsedQuestionsCount(): number {
    return this.usedQuestionIds.size;
  }

  clearOldQuestions(): void {
    // Clear half of the tracked questions periodically
    const questions = Array.from(this.usedQuestionIds);
    const toRemove = questions.slice(0, Math.floor(questions.length / 2));
    toRemove.forEach(id => this.usedQuestionIds.delete(id));
  }

  getAvailableQuestionIds(totalRange: number): number[] {
    const allIds = Array.from({length: totalRange}, (_, i) => i + 1);
    return allIds.filter(id => !this.usedQuestionIds.has(id.toString()));
  }
}

export const questionTracker = QuestionTracker.getInstance();