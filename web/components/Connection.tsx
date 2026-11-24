import { useEffect } from "react";
import { useAgent } from "agents/react";
import type { WorkspaceState } from "../../src/agents/workspace";
import type { Workspace } from "./App";

/** Opens the workspace agent's connection once a session exists. Loaded on demand so the agents client stays out of the first paint. */
export default function Connection({ workspaceId, onAgent, onState }: { workspaceId: string; onAgent: (a: Workspace) => void; onState: (s: WorkspaceState) => void }) {
  const agent = useAgent<WorkspaceState>({ agent: "workspace-agent", name: workspaceId, onStateUpdate: onState });
  useEffect(() => {
    onAgent(agent);
    agent.stub.visit().catch(() => undefined);
  }, [agent, onAgent]);
  return null;
}
