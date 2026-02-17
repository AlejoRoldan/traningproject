import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

describe("Supabase Integration", () => {
  it("should connect to Supabase with valid credentials", async () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    expect(supabaseUrl).toBeDefined();
    expect(supabaseAnonKey).toBeDefined();

    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

    // Test connection by querying auth status
    const { data, error } = await supabase.auth.getSession();

    // Connection is valid if we get a response (even if no session)
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it("should have service role key configured", () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(serviceRoleKey).toBeDefined();
    expect(serviceRoleKey).toMatch(/^eyJ/); // JWT starts with eyJ
  });
});
