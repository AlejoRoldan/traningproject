import { describe, expect, it } from "vitest";
import { testOpenAIConnection } from "./openaiService";

describe("OpenAI API Integration", () => {
  it("should successfully connect to OpenAI API with provided key", async () => {
    const isConnected = await testOpenAIConnection();
    expect(isConnected).toBe(true);
  }, 30000); // 30 second timeout for API call
});
