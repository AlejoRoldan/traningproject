import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationService } from '../evaluation.service';
import { OpenAIService } from '../openai.service';
import { Logger } from '@nestjs/common';

/**
 * Evaluation Service Unit Tests
 *
 * Tests for multi-dimensional performance evaluation logic
 */
describe('EvaluationService', () => {
  let service: EvaluationService;
  let openaiService: OpenAIService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationService,
        {
          provide: OpenAIService,
          useValue: {
            evaluatePerformance: jest.fn(),
            generateText: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EvaluationService>(EvaluationService);
    openaiService = module.get<OpenAIService>(OpenAIService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateOverallScore', () => {
    it('should calculate average of all dimension scores', () => {
      const evaluation = {
        empathyScore: 8,
        clarityScore: 7,
        protocolScore: 9,
        resolutionScore: 8,
        confidenceScore: 7,
      };

      // Access private method for testing
      const result = (service as any).calculateOverallScore(
        evaluation,
      );

      expect(result).toBe(7.8);
    });

    it('should return 5 when no scores provided', () => {
      const evaluation = {};

      const result = (service as any).calculateOverallScore(
        evaluation,
      );

      expect(result).toBe(5);
    });

    it('should filter out non-numeric scores', () => {
      const evaluation = {
        empathyScore: 8,
        clarityScore: 'invalid' as any,
        protocolScore: 9,
        resolutionScore: null,
        confidenceScore: 7,
      };

      const result = (service as any).calculateOverallScore(
        evaluation,
      );

      // (8 + 9 + 7) / 3 = 8
      expect(result).toBe(8);
    });
  });

  describe('normalizeScore', () => {
    it('should clamp score to 1-10 range', () => {
      expect((service as any).normalizeScore(15)).toBe(10);
      expect((service as any).normalizeScore(0)).toBe(1);
      expect((service as any).normalizeScore(-5)).toBe(1);
    });

    it('should round score to one decimal place', () => {
      expect((service as any).normalizeScore(7.456)).toBe(7.5);
      expect((service as any).normalizeScore(8.12)).toBe(8.1);
    });

    it('should return 5 for non-numeric input', () => {
      expect((service as any).normalizeScore('invalid')).toBe(5);
      expect((service as any).normalizeScore(null)).toBe(5);
    });
  });

  describe('benchmarkScore', () => {
    it('should return expert level for score >= 9', () => {
      const result = service.benchmarkScore(9.5);

      expect(result.level).toBe('expert');
      expect(result.label).toBe('Expert Level');
      expect(result.xpMultiplier).toBe(1.5);
    });

    it('should return advanced level for score >= 8', () => {
      const result = service.benchmarkScore(8.2);

      expect(result.level).toBe('advanced');
      expect(result.xpMultiplier).toBe(1.25);
    });

    it('should return proficient level for score >= 7', () => {
      const result = service.benchmarkScore(7.5);

      expect(result.level).toBe('proficient');
      expect(result.xpMultiplier).toBe(1.0);
    });

    it('should return acceptable level for score >= 6', () => {
      const result = service.benchmarkScore(6.8);

      expect(result.level).toBe('acceptable');
      expect(result.xpMultiplier).toBe(0.75);
    });

    it('should return developing level for score < 6', () => {
      const result = service.benchmarkScore(5.2);

      expect(result.level).toBe('developing');
      expect(result.xpMultiplier).toBe(0.5);
    });
  });

  describe('analyzeProgression', () => {
    it('should return insufficient_data for < 2 evaluations', () => {
      const result = service.analyzeProgression([]);

      expect(result.trend).toBe('insufficient_data');
      expect(result.overallProgress).toBe(0);
    });

    it('should detect strong improvement (>10%)', () => {
      const evaluations = [
        {
          overallScore: 5,
          empathyScore: 5,
          clarityScore: 5,
          protocolScore: 5,
          resolutionScore: 5,
          confidenceScore: 5,
          strengths: [],
          weaknesses: [],
          recommendations: [],
          detailedFeedback: '',
          keywordsUsed: [],
          missedKeywords: [],
        },
        {
          overallScore: 7,
          empathyScore: 7,
          clarityScore: 7,
          protocolScore: 7,
          resolutionScore: 7,
          confidenceScore: 7,
          strengths: [],
          weaknesses: [],
          recommendations: [],
          detailedFeedback: '',
          keywordsUsed: [],
          missedKeywords: [],
        },
      ];

      const result = service.analyzeProgression(evaluations);

      expect(result.trend).toBe('strong_improvement');
      expect(result.overallProgress).toBeGreaterThan(10);
    });

    it('should detect slight improvement (0-10%)', () => {
      const evaluations = [
        {
          overallScore: 7,
          empathyScore: 7,
          clarityScore: 7,
          protocolScore: 7,
          resolutionScore: 7,
          confidenceScore: 7,
          strengths: [],
          weaknesses: [],
          recommendations: [],
          detailedFeedback: '',
          keywordsUsed: [],
          missedKeywords: [],
        },
        {
          overallScore: 7.5,
          empathyScore: 7.5,
          clarityScore: 7.5,
          protocolScore: 7.5,
          resolutionScore: 7.5,
          confidenceScore: 7.5,
          strengths: [],
          weaknesses: [],
          recommendations: [],
          detailedFeedback: '',
          keywordsUsed: [],
          missedKeywords: [],
        },
      ];

      const result = service.analyzeProgression(evaluations);

      expect(result.trend).toBe('slight_improvement');
    });
  });
});
