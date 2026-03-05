import { Injectable, Logger } from '@nestjs/common';

/**
 * Prompt Builder Service
 *
 * Constructs optimized prompts for GPT-4o across different use cases:
 * - AI client greeting and responses
 * - Session evaluation
 * - Feedback generation
 * - Prompt engineering for specific scenarios
 *
 * Features:
 * - Personality-aware prompt generation
 * - Context injection
 * - Token optimization
 * - Consistency in tone and style
 * - Scenario-specific instructions
 */
@Injectable()
export class PromptBuilderService {
  private readonly logger = new Logger(
    PromptBuilderService.name,
  );

  /**
   * Build greeting prompt for AI client
   *
   * Generates a prompt for GPT-4o to create initial customer greeting
   *
   * @param scenario Scenario details
   * @param clientProfile AI client personality
   * @returns Optimized prompt
   */
  buildGreetingPrompt(scenario: any): string {
    return `
You are a customer service representative in a bank in Paraguay.

Context: ${scenario.context}
Client Name: ${scenario.clientName}
Your Personality: ${scenario.clientPersonality}

Generate a natural, authentic greeting that a customer might use when calling the bank.
The greeting should:
- Be 1-2 sentences max
- Reflect the scenario context
- Use natural Spanish (Paraguay Spanish if appropriate)
- Show the personality type in how you speak

Only respond with the greeting text, nothing else.
Example format: "Buenos días, tengo un problema con mi factura..."
    `;
  }

  /**
   * Build AI client response prompt
   *
   * Generates a prompt for GPT-4o to create a realistic customer response
   *
   * @param clientProfile AI client personality
   * @param scenario Scenario details
   * @param conversationHistory Previous exchanges
   * @param agentInput What the agent just said
   * @returns Optimized prompt
   */
  buildResponsePrompt(
    clientProfile: any,
    scenario: any,
    conversationHistory: Array<{
      role: 'agent' | 'client';
      content: string;
    }>,
    agentInput: string,
  ): string {
    // Build conversation context (last 5 exchanges)
    const recentHistory = conversationHistory.slice(-10);
    const conversationText = recentHistory
      .map(
        (m) =>
          `${m.role === 'agent' ? 'AGENTE' : 'CLIENTE'}: ${m.content}`,
      )
      .join('\n');

    const personalityPrompt =
      this.buildPersonalityPrompt(clientProfile);

    return `
You are a customer in a training simulation for a bank in Paraguay.

CLIENT PROFILE:
Name: ${clientProfile.name}
Personality Type: ${clientProfile.personality}
${personalityPrompt}

SCENARIO CONTEXT:
${scenario.description}

CONVERSATION SO FAR:
${conversationText}

AGENT JUST SAID:
${agentInput}

Respond as the customer would react to what the agent said. Keep in mind:
1. Your personality and emotional state
2. The scenario context and your problem
3. Whether the agent is helping or frustrating you
4. Natural speech patterns (Paraguay Spanish if applicable)

Keep your response to 1-3 sentences. Be natural and realistic.
Respond with ONLY the customer's response text, nothing else.
    `;
  }

  /**
   * Build evaluation prompt
   *
   * Creates comprehensive prompt for GPT-4o to evaluate agent performance
   *
   * @param conversation Full conversation transcript
   * @param clientProfile AI client personality
   * @param scenario Scenario details
   * @returns Evaluation prompt
   */
  buildEvaluationPrompt(
    conversation: string,
    clientProfile: any,
    scenario: any,
  ): string {
    return `
You are an expert evaluator of customer service interactions. Evaluate this training simulation.

CLIENT PROFILE:
- Name: ${clientProfile.name}
- Personality: ${clientProfile.personality}
- Context: ${clientProfile.context}

SCENARIO:
${scenario.description}

COMPLETE CONVERSATION:
${conversation}

Evaluate the agent's performance on these 5 dimensions (1-10 scale):

1. EMPATHY: Did the agent show understanding and emotional connection?
2. CLARITY: Were responses clear, professional, and well-structured?
3. PROTOCOL: Did the agent follow procedures and use correct script?
4. RESOLUTION: Did the agent effectively solve the customer's problem?
5. CONFIDENCE: Did the agent inspire trust in the customer?

Also identify:
- Key strengths demonstrated
- Areas for improvement
- Specific recommendations
- Effective keywords/phrases used
- Keywords that should have been used
- Overall detailed feedback

Return a JSON object with all evaluations and analysis.
    `;
  }

  /**
   * Build feedback generation prompt
   *
   * Creates prompt for personalized feedback to agent
   *
   * @param scores Evaluation scores
   * @param strengths Agent strengths
   * @param weaknesses Agent weaknesses
   * @param agentName Agent's name
   * @returns Feedback prompt
   */
  buildFeedbackPrompt(
    scores: Record<string, number>,
    strengths: string[],
    weaknesses: string[],
    agentName: string,
  ): string {
    return `
Generate personalized, encouraging feedback for ${agentName} based on this performance evaluation:

SCORES:
- Empathy: ${scores.empathy}/10
- Clarity: ${scores.clarity}/10
- Protocol: ${scores.protocol}/10
- Resolution: ${scores.resolution}/10
- Confidence: ${scores.confidence}/10

STRENGTHS:
${strengths.map((s) => `- ${s}`).join('\n')}

AREAS FOR IMPROVEMENT:
${weaknesses.map((w) => `- ${w}`).join('\n')}

Write 2-3 paragraphs of constructive feedback that:
1. Acknowledges specific successes
2. Provides clear improvement areas
3. Gives actionable next steps
4. Is motivating and professional

Keep tone positive and encouraging.
    `;
  }

  /**
   * Build personality-specific prompt addition
   *
   * Generates system prompt guidelines for specific personality
   *
   * @param clientProfile Client profile
   * @returns Personality prompt
   */
  private buildPersonalityPrompt(
    clientProfile: any,
  ): string {
    const personalities: Record<string, string> = {
      angry: `
ANGRY CUSTOMER GUIDELINES:
- You are frustrated and impatient
- Speak with elevated emotion and urgency
- Respond with short, direct statements
- Interrupt if the agent is taking too long
- Demand immediate resolution
- May be sarcastic or use sharp words
- Interested in fast solutions, not lengthy explanations
- Phrases: "Necesito...", "Ahora", "Inaceptable", "No entiendo..."
      `,

      confused: `
CONFUSED CUSTOMER GUIDELINES:
- You don't understand easily
- Ask many clarifying questions
- Express uncertainty frequently
- Need detailed, step-by-step explanations
- May ask the same thing multiple ways
- Slow to comprehend technical information
- Appreciate patience and repetition
- Phrases: "No entiendo bien", "¿Puede explicar?", "¿Nuevamente por favor?"
      `,

      friendly: `
FRIENDLY CUSTOMER GUIDELINES:
- You are cooperative and pleasant
- Listen well to the agent's suggestions
- Appreciate good service and say so
- Patient and understanding
- Willing to try solutions
- Positive outlook and demeanor
- Phrases: "Gracias", "Entiendo", "No hay problema", "Gracias por ayudar"
      `,

      demanding: `
DEMANDING CUSTOMER GUIDELINES:
- You have high professional standards
- Expect efficiency and competence
- Don't accept excuses or delays
- Demand specific solutions
- Professional but firm tone
- Impatient with incompetence
- Value professionalism
- Phrases: "Necesito eficiencia", "Competencia profesional", "Inmediato"
      `,
    };

    return (
      personalities[clientProfile.personality.toLowerCase()] ||
      personalities.friendly
    );
  }

  /**
   * Build scenario context prompt
   *
   * Injects scenario-specific context into prompts
   *
   * @param category Scenario category
   * @returns Context text
   */
  buildScenarioContext(category: string): string {
    const contexts: Record<string, string> = {
      BILLING_DISPUTE: `
You are unhappy with your recent bill. You believe you were overcharged.
Your account number is 12345-6789.
You received a bill for 500,000 ARS when you usually pay about 250,000 ARS.
This is completely unexpected.
      `,

      TECHNICAL_ISSUE: `
You're experiencing a problem with mobile banking.
You can't log into your account.
You've tried resetting your password but it's not working.
You need to access your account urgently for a transfer.
      `,

      ACCOUNT_CLOSURE: `
You want to close your bank account.
You're unhappy with the service.
You've been a customer for 5 years.
You want to know the process and any penalties.
      `,

      FRAUD_REPORT: `
You've noticed unauthorized transactions on your account.
Three purchases for 50,000 ARS each in stores you don't recognize.
This happened in the last 24 hours.
You're very concerned about security.
You want the charges reversed immediately.
      `,

      PAYMENT_PLAN: `
You missed a payment and now have overdue debt.
You want to set up a payment plan.
You're experiencing financial difficulties.
You want to discuss your options.
You can pay some amount but need time for the full amount.
      `,

      PRODUCT_INQUIRY: `
You're interested in learning about investment products.
You have some savings you want to invest.
You want to understand the risks and returns.
You want to compare different options.
      `,
    };

    return (
      contexts[category] ||
      'You are a customer with a banking issue.'
    );
  }

  /**
   * Optimize prompt for token efficiency
   *
   * Reduces prompt size while maintaining quality
   *
   * @param prompt Raw prompt
   * @returns Optimized prompt
   */
  optimizePrompt(prompt: string): string {
    // Remove excessive whitespace
    let optimized = prompt.replace(/\s+/g, ' ').trim();

    // Remove redundant instructions
    optimized = optimized.replace(
      /Please|kindly|Thank you/gi,
      '',
    );

    // Condense long phrases
    optimized = optimized.replace(
      /In order to/gi,
      'To',
    );

    return optimized;
  }

  /**
   * Build streaming response prompt
   *
   * For streaming responses, simpler prompt for fast responses
   *
   * @param clientProfile Client profile
   * @param lastMessage Last message from agent
   * @returns Simplified streaming prompt
   */
  buildStreamingPrompt(
    clientProfile: any,
    lastMessage: string,
  ): string {
    return `You are ${clientProfile.name}, a ${clientProfile.personality} customer.

The agent said: "${lastMessage}"

Respond naturally (1-2 sentences max) as ${clientProfile.personality}:
    `;
  }

  /**
   * Build tone-adjusted prompt
   *
   * Adjusts prompt based on desired tone/emotion
   *
   * @param basePrompt Base prompt
   * @param tone Desired tone
   * @returns Tone-adjusted prompt
   */
  adjustTone(basePrompt: string, tone: string): string {
    const toneAdjustments: Record<string, string> = {
      formal: 'Use formal, professional language throughout.',
      casual: 'Use casual, conversational language.',
      urgent: 'Convey a sense of urgency in your response.',
      calm: 'Maintain a calm, composed demeanor.',
      empathetic:
        'Show empathy and understanding in your response.',
      direct: 'Be direct and to the point.',
    };

    const adjustment = toneAdjustments[tone] || '';
    return `${basePrompt}\n\nTone Instruction: ${adjustment}`;
  }

  /**
   * Count tokens in prompt (rough estimate)
   *
   * @param prompt Prompt text
   * @returns Estimated token count
   */
  estimateTokens(prompt: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(prompt.length / 4);
  }

  /**
   * Get prompt template for use case
   *
   * @param useCase Type of prompt needed
   * @returns Template prompt
   */
  getTemplate(
    useCase:
      | 'greeting'
      | 'response'
      | 'evaluation'
      | 'feedback',
  ): string {
    const templates: Record<string, string> = {
      greeting: `You are a customer calling a bank.

Context: [Insert scenario context]

Generate a natural greeting (1-2 sentences).
Reflect your personality: [personality type]

Respond with only the greeting text.`,

      response: `You are a customer in a banking support call.

Personality: [personality]
Recent message from agent: [agent message]

Respond naturally (1-2 sentences) as this customer would.`,

      evaluation: `Evaluate the agent's performance on:
1. Empathy (1-10)
2. Clarity (1-10)
3. Protocol (1-10)
4. Resolution (1-10)
5. Confidence (1-10)

Conversation: [insert conversation]

Return JSON with scores and analysis.`,

      feedback: `Generate personalized feedback for agent [name].

Scores: [empathy, clarity, protocol, resolution, confidence]
Strengths: [list]
Weaknesses: [list]

Write 2-3 encouraging paragraphs with actionable next steps.`,
    };

    return templates[useCase];
  }
}
