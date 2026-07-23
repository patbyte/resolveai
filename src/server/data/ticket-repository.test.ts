import { afterEach, describe, expect, it } from "vitest";
import type { RequestActor } from "@/server/auth/request-actor";
import {
  createTicketRepository,
  DemoTicketRepository,
  getTicketStoreMode
} from "./ticket-repository";

const actor: RequestActor = {
  organizationId: "org_northstar",
  userId: "user_maya",
  role: "agent",
  safetyIdentifier: "repository-test"
};

afterEach(() => {
  delete process.env.TICKET_STORE;
});

describe("ticket repository selection", () => {
  it("uses deterministic fixtures by default", async () => {
    const repository = await createTicketRepository();

    expect(repository).toBeInstanceOf(DemoTicketRepository);
    expect(getTicketStoreMode()).toBe("demo");
  });

  it("scopes deterministic tickets to the actor's tenant", async () => {
    const repository = new DemoTicketRepository();

    await expect(repository.findById(actor, "ticket_1048")).resolves.toMatchObject({
      organizationId: "org_northstar"
    });
    await expect(
      repository.findById({ ...actor, organizationId: "org_other" }, "ticket_1048")
    ).resolves.toBeNull();
  });
});
