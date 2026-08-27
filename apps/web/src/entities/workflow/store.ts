import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import type { NodeKind, WorkflowGraph } from "@repo/contracts";
import { create } from "zustand";
import { defaultDataFor, type NodeData } from "@/entities/node";

export type FlowNode = Node<Record<string, unknown>, NodeKind>;
export type FlowEdge = Edge;

interface WorkflowStore {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNodeId: string | null;

  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
  connect: (connection: Connection) => void;
  addNode: (kind: NodeKind, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, patch: Partial<NodeData>) => void;
  removeSelected: () => void;
  select: (nodeId: string | null) => void;
  replaceGraph: (graph: WorkflowGraph) => void;
  toGraph: () => WorkflowGraph;
}

let seq = 0;
const nextId = (kind: NodeKind) => `${kind}-${++seq}`;

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  onNodesChange: (changes) => set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) })),
  onEdgesChange: (changes) => set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),

  connect: (connection) =>
    set((s) => ({
      // One inbound edge per input port: a new connection replaces the old one.
      edges: addEdge(
        connection,
        s.edges.filter(
          (e) => !(e.target === connection.target && e.targetHandle === connection.targetHandle),
        ),
      ),
    })),

  addNode: (kind, position) =>
    set((s) => {
      const id = nextId(kind);
      const node: FlowNode = {
        id,
        type: kind,
        position,
        data: defaultDataFor(kind) as Record<string, unknown>,
      };
      return { nodes: [...s.nodes, node], selectedNodeId: id };
    }),

  updateNodeData: (nodeId, patch) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n)),
    })),

  removeSelected: () =>
    set((s) => {
      const doomed = new Set(s.nodes.filter((n) => n.selected).map((n) => n.id));
      return {
        nodes: s.nodes.filter((n) => !doomed.has(n.id)),
        edges: s.edges.filter((e) => !e.selected && !doomed.has(e.source) && !doomed.has(e.target)),
        selectedNodeId: doomed.has(s.selectedNodeId ?? "") ? null : s.selectedNodeId,
      };
    }),

  select: (selectedNodeId) => set({ selectedNodeId }),

  replaceGraph: (graph) =>
    set({
      nodes: graph.nodes.map((n) => ({
        id: n.id,
        type: n.kind,
        position: n.position,
        data: n.data as Record<string, unknown>,
      })),
      edges: graph.edges.map((e) => ({
        id: e.id,
        source: e.source,
        sourceHandle: e.sourceHandle,
        target: e.target,
        targetHandle: e.targetHandle,
      })),
      selectedNodeId: null,
    }),

  toGraph: () => {
    const { nodes, edges } = get();
    return {
      nodes: nodes.map((n) => ({
        id: n.id,
        kind: n.type as NodeKind,
        position: n.position,
        data: n.data,
      })) as WorkflowGraph["nodes"],
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        sourceHandle: e.sourceHandle ?? null,
        target: e.target,
        targetHandle: e.targetHandle ?? null,
      })),
    };
  },
}));

export const selectSelectedNode = (s: WorkflowStore): FlowNode | undefined =>
  s.nodes.find((n) => n.id === s.selectedNodeId);

/** The node feeding a given input port, if any. */
export const selectUpstreamNodeId =
  (nodeId: string, handle: string) =>
  (s: WorkflowStore): string | undefined =>
    s.edges.find((e) => e.target === nodeId && (e.targetHandle ?? handle) === handle)?.source;
