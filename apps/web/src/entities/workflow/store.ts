import { addEdge, applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import { create } from "zustand";
import { toFlowNode, toWorkflowEdge, toWorkflowNode } from "./flow-node.helpers";
import type { FlowNode } from "./flow-node.types";
import { createFlowNode, feedsAnotherPort, selectedNodeIds } from "./store.helpers";
import type { WorkflowStore } from "./store.types";

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
      const removedIds = selectedNodeIds(state.nodes);
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
    edges: get().edges.map(toWorkflowEdge),
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

export const selectSelectedNode = (state: WorkflowStore): FlowNode | undefined =>
  state.nodes.find((node) => node.id === state.selectedNodeId);

export const selectUpstreamNodeId =
  (nodeId: string, handle: string) =>
  (state: WorkflowStore): string | undefined =>
    state.edges.find((edge) => edge.target === nodeId && (edge.targetHandle ?? handle) === handle)
      ?.source;
