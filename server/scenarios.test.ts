import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@kaitel.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("scenarios.list", () => {
  it("returns list of scenarios with filters", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.scenarios.list({
      category: undefined,
      complexity: undefined,
      isActive: true,
    });

    expect(Array.isArray(result)).toBe(true);
    // Should return only active scenarios
    result.forEach(scenario => {
      expect(scenario.isActive).toBe(1); // MySQL returns 1 for true
    });
  });

  it("filters scenarios by complexity", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get all scenarios first
    const allScenarios = await caller.scenarios.list({
      category: undefined,
      complexity: undefined,
      isActive: undefined,
    });

    if (allScenarios.length > 0) {
      const targetComplexity = allScenarios[0].complexity;
      const result = await caller.scenarios.list({
        category: undefined,
        complexity: targetComplexity,
        isActive: undefined,
      });

      expect(Array.isArray(result)).toBe(true);
      result.forEach(scenario => {
        expect(scenario.complexity).toBe(targetComplexity);
      });
    }
  });

  it("filters scenarios by category", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get all scenarios first
    const allScenarios = await caller.scenarios.list({
      category: undefined,
      complexity: undefined,
      isActive: undefined,
    });

    if (allScenarios.length > 0) {
      const targetCategory = allScenarios[0].category;
      const result = await caller.scenarios.list({
        category: targetCategory,
        complexity: undefined,
        isActive: undefined,
      });

      expect(Array.isArray(result)).toBe(true);
      result.forEach(scenario => {
        expect(scenario.category).toBe(targetCategory);
      });
    }
  });
});

describe("scenarios.getById", () => {
  it("returns scenario details by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First get list to get a valid ID
    const scenarios = await caller.scenarios.list({
      category: undefined,
      complexity: undefined,
      isActive: true,
    });

    if (scenarios.length > 0) {
      const scenario = await caller.scenarios.getById({ id: scenarios[0].id });
      expect(scenario).toBeDefined();
      expect(scenario.id).toBe(scenarios[0].id);
      expect(scenario.title).toBeDefined();
      expect(scenario.description).toBeDefined();
    }
  });

  it("throws error for non-existent scenario", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.scenarios.getById({ id: 99999 })
    ).rejects.toThrow();
  });
});

describe("simulations.start", () => {
  it("creates a new simulation for valid scenario", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get a valid scenario
    const scenarios = await caller.scenarios.list({
      category: undefined,
      complexity: undefined,
      isActive: true,
    });

    if (scenarios.length > 0) {
      const result = await caller.simulations.start({
        scenarioId: scenarios[0].id,
      });

      expect(result).toBeDefined();
      expect(result.simulationId).toBeDefined();
      expect(typeof result.simulationId).toBe("number");
      // initialMessage may or may not be present depending on implementation
    }
  });

  it("throws error for invalid scenario", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.simulations.start({ scenarioId: 99999 })
    ).rejects.toThrow();
  });
});

describe("user.stats", () => {
  it("returns user statistics", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.user.stats();

    expect(stats).toBeDefined();
    expect(typeof stats.totalSimulations).toBe("number");
    expect(typeof stats.averageScore).toBe("number");
    expect(stats.totalSimulations).toBeGreaterThanOrEqual(0);
    expect(stats.averageScore).toBeGreaterThanOrEqual(0);
    expect(stats.averageScore).toBeLessThanOrEqual(100);
  });
});
