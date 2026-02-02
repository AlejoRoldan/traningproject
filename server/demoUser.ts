// Demo user for public access (no authentication)
export const DEMO_USER = {
  id: 1,
  openId: "demo-user-kaitel",
  name: "Usuario Demo",
  email: "demo@kaitel.com",
  loginMethod: "demo",
  role: "admin" as const,
  department: null,
  supervisorId: null,
  level: "intermediate" as const,
  points: 0,
  badges: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export type DemoUser = typeof DEMO_USER;
