import { createHash } from "node:crypto";

export type RequestActor = {
  organizationId: string;
  userId: string;
  role: "admin" | "agent";
  safetyIdentifier: string;
};

export function getRequestActor(headers: Headers): RequestActor {
  // Demo identity boundary. Production replaces this with verified session claims.
  const organizationId = headers.get("x-organization-id") ?? "org_northstar";
  const userId = headers.get("x-user-id") ?? "user_maya";

  return {
    organizationId,
    userId,
    role: "agent",
    safetyIdentifier: createHash("sha256")
      .update(`${organizationId}:${userId}`)
      .digest("hex")
      .slice(0, 32)
  };
}
