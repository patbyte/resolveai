import { SupportWorkspace } from "@/components/support-workspace";
import { demoTickets } from "@/server/data/demo-tickets";

export default function Home() {
  return <SupportWorkspace initialTickets={demoTickets} />;
}
