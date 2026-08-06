class AiService {
    /**
   * Analyzes the sentiment of a message content.
   * In production, this would call OpenAI, HuggingFace, or a dedicated NLP microservice.
   */
    async analyzeSentiment(content) {
    // Simulated AI processing time
        await new Promise((resolve) => setTimeout(resolve, 300));

        const text = content.toLowerCase();

        // Basic rule-based sentiment (for demo purposes)
        const positiveWords = [
            'happy',
            'great',
            'love',
            'amazing',
            'excellent',
            'fantastic',
            'success',
            'congrats',
            'won',
            'yes'
        ];
        const negativeWords = [
            'sad',
            'bad',
            'hate',
            'terrible',
            'awful',
            'fail',
            'error',
            'stop',
            'quit',
            'no',
            'problem',
            'fix'
        ];

        let score = 0.5; // Neutral baseline
        let positiveCount = 0;
        let negativeCount = 0;

        positiveWords.forEach((w) => {
            if (text.includes(w)) positiveCount++;
        });
        negativeWords.forEach((w) => {
            if (text.includes(w)) negativeCount++;
        });

        if (positiveCount > negativeCount) {
            score = 0.7 + positiveCount * 0.05;
        } else if (negativeCount > positiveCount) {
            score = 0.3 - negativeCount * 0.05;
        }

        score = Math.max(0, Math.min(1, score));

        let sentiment = 'neutral';
        if (score > 0.6) sentiment = 'positive';
        if (score < 0.4) sentiment = 'negative';

        return {
            sentiment,
            score: parseFloat(score.toFixed(2))
        };
    }

    /**
   * Batch analyzes multiple messages for campaign reporting.
   */
    async analyzeCampaignSentiment(messages) {
        const results = await Promise.all(
            messages.map((m) => this.analyzeSentiment(m.content))
        );
        const summary = {
            positive: 0,
            neutral: 0,
            negative: 0,
            averageScore: 0
        };

        results.forEach((r) => {
            summary[r.sentiment]++;
            summary.averageScore += r.score;
        });

        summary.averageScore = (summary.averageScore / results.length).toFixed(2);
        return summary;
    }
}

module.exports = new AiService();
