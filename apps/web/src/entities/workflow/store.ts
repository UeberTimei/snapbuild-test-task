import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from "@xyflow/react";
import type { NodeKind, WorkflowGraph } from "@repo/contracts";
import { create } from "zustand";
import { defaultDataFor } from "@/entities/node";
import { toFlowNode, toWorkflowNode, type FlowEdge, type FlowNode } from "./flow-node";

interface WorkflowStore {
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

let nodeCounter = 0;

function createFlowNode(kind: NodeKind, position: XYPosition): FlowNode {
  nodeCounter += 1;
  const id = `${kind}-${nodeCounter}`;

  switch (kind) {
    case "prompt":
      return { id, position, type: kind, data: defaultDataFor(kind) };
    case "imageInput":
      return { id, position, type: kind, data: defaultDataFor(kind) };
    case "generateImage":
      return { id, position, type: kind, data: defaultDataFor(kind) };
    case "editImage":
      return { id, position, type: kind, data: defaultDataFor(kind) };
    case "result":
      return { id, position, type: kind, data: defaultDataFor(kind) };
  }
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  onNodesChange: (changes) => set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),
  onEdgesChange: (changes) => set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),

  connect: (connection) =>
    set((state) => ({
      edges: addEdge(connection, state.edges.filter(feedsAnotherPort(connection))),
    })),

  addNode: (kind, position) =>
    set((state) => {
      const node = createFlowNode(kind, position);
      return { nodes: [...state.nodes, node], selectedNodeId: node.id };
    }),

  removeSelected: () =>
    set((state) => {
      const removedIds = new Set(
        state.nodes.filter((node) => node.selected).map((node) => node.id),
      );
      return {
        nodes: state.nodes.filter((node) => !removedIds.has(node.id)),
        edges: state.edges.filter(
          (edge) => !edge.selected && !removedIds.has(edge.source) && !removedIds.has(edge.target),
        ),
        selectedNodeId: removedIds.has(state.selectedNodeId ?? "") ? null : state.selectedNodeId,
      };
    }),

  select: (selectedNodeId) => set({ selectedNodeId }),

  replaceGraph: (graph) =>
    set({
      nodes: graph.nodes.map(toFlowNode),
      edges: graph.edges.map((edge) => ({ ...edge })),
      selectedNodeId: null,
    }),

  toGraph: () => ({
    nodes: get().nodes.map(toWorkflowNode),
    edges: get().edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      sourceHandle: edge.sourceHandle ?? null,
      target: edge.target,
      targetHandle: edge.targetHandle ?? null,
    })),
  }),

  setPromptText: (nodeId, text) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId && node.type === "prompt"
          ? { ...node, data: { ...node.data, text } }
          : node,
      ),
    })),

  setSourceAsset: (nodeId, assetId) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId && node.type === "imageInput"
          ? { ...node, data: { ...node.data, assetId } }
          : node,
      ),
    })),

  setPreset: (nodeId, presetId) =>
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        if (node.type === "generateImage") return { ...node, data: { ...node.data, presetId } };
        if (node.type === "editImage") return { ...node, data: { ...node.data, presetId } };
        return node;
      }),
    })),

  setEditInstruction: (nodeId, instruction) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId && node.type === "editImage"
          ? { ...node, data: { ...node.data, instruction } }
          : node,
      ),
    })),
}));

function feedsAnotherPort(connection: Connection): (edge: FlowEdge) => boolean {
  return (edge) =>
    edge.target !== connection.target || edge.targetHandle !== connection.targetHandle;
}

export const selectSelectedNode = (state: WorkflowStore): FlowNode | undefined =>
  state.nodes.find((node) => node.id === state.selectedNodeId);

export const selectUpstreamNodeId =
  (nodeId: string, handle: string) =>
  (state: WorkflowStore): string | undefined =>
    state.edges.find((edge) => edge.target === nodeId && (edge.targetHandle ?? handle) === handle)
      ?.source;
