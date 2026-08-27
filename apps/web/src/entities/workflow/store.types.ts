import type { NodeKind, WorkflowGraph } from "@repo/contracts";
import type { Connection, EdgeChange, NodeChange, XYPosition } from "@xyflow/react";
import type { FlowEdge, FlowNode } from "./flow-node.types";

export interface WorkflowStore {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNodeId: string | null;

  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
  connect: (connection: Connection) => void;
  addNode: (kind: NodeKind, position: XYPosition) => void;
  removeSelected: () => void;
  select: (nodeId: string | null) => void;
  replaceGraph: (graph: WorkflowGraph) => void;
  toGraph: () => WorkflowGraph;

  setPromptText: (nodeId: string, text: string) => void;
  setSourceAsset: (nodeId: string, assetId: string) => void;
  setPreset: (nodeId: string, presetId: string | null) => void;
  setEditInstruction: (nodeId: string, instruction: string) => void;
}
