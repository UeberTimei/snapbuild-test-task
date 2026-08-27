import { z } from "zod";
import { NODE_KINDS, portType, portsCompatible, type NodeKind } from "./ports";

const Position = z.object({ x: z.number(), y: z.number() });

export const PromptData = z.object({ text: z.string() });
export const ImageInputData = z.object({ assetId: z.string().nullable() });
export const GenerateImageData = z.object({ presetId: z.string().nullable() });
export const EditImageData = z.object({
  presetId: z.string().nullable(),
  instruction: z.string(),
});
export const ResultData = z.object({});

export const WorkflowNode = z.discriminatedUnion("kind", [
  z.object({ id: z.string(), kind: z.literal("prompt"), position: Position, data: PromptData }),
  z.object({
    id: z.string(),
    kind: z.literal("imageInput"),
    position: Position,
    data: ImageInputData,
  }),
  z.object({
    id: z.string(),
    kind: z.literal("generateImage"),
    position: Position,
    data: GenerateImageData,
  }),
  z.object({
    id: z.string(),
    kind: z.literal("editImage"),
    position: Position,
    data: EditImageData,
  }),
  z.object({ id: z.string(), kind: z.literal("result"), position: Position, data: ResultData }),
]);
export type WorkflowNode = z.infer<typeof WorkflowNode>;

export const WorkflowEdge = z.object({
  id: z.string(),
  source: z.string(),
  sourceHandle: z.string().nullable(),
  target: z.string(),
  targetHandle: z.string().nullable(),
});
export type WorkflowEdge = z.infer<typeof WorkflowEdge>;

export const WorkflowGraph = z.object({
  nodes: z.array(WorkflowNode),
  edges: z.array(WorkflowEdge),
});
export type WorkflowGraph = z.infer<typeof WorkflowGraph>;

export type GraphValidation = { ok: true } | { ok: false; errors: string[] };

/** Structural + semantic validation beyond what the zod schema covers. */
export function validateGraph(input: unknown): GraphValidation {
  const parsed = WorkflowGraph.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }
  const graph = parsed.data;
  const errors: string[] = [];
  const nodes = new Map(graph.nodes.map((n) => [n.id, n]));

  // edges reference existing nodes/ports with matching types; one inbound per input port
  const filledInputs = new Set<string>();
  for (const edge of graph.edges) {
    const src = nodes.get(edge.source);
    const dst = nodes.get(edge.target);
    if (!src) {
      errors.push(`edge ${edge.id}: unknown source node ${edge.source}`);
      continue;
    }
    if (!dst) {
      errors.push(`edge ${edge.id}: unknown target node ${edge.target}`);
      continue;
    }
    const srcType = portType(src.kind, "outputs", edge.sourceHandle);
    const dstType = portType(dst.kind, "inputs", edge.targetHandle);
    if (!portsCompatible(srcType, dstType)) {
      errors.push(`edge ${edge.id}: incompatible ports (${srcType ?? "?"} -> ${dstType ?? "?"})`);
      continue;
    }
    const key = `${edge.target}:${edge.targetHandle ?? NODE_KINDS[dst.kind].inputs[0]?.id}`;
    if (filledInputs.has(key))
      errors.push(
        `node ${edge.target}: input port ${edge.targetHandle} has multiple inbound edges`,
      );
    filledInputs.add(key);
  }

  // required inputs connected
  for (const node of graph.nodes) {
    for (const port of NODE_KINDS[node.kind].inputs) {
      if (port.required === false) continue;
      if (!filledInputs.has(`${node.id}:${port.id}`)) {
        errors.push(`node ${node.id} (${node.kind}): required input "${port.id}" is not connected`);
      }
    }
  }

  if (hasCycle(graph)) errors.push("graph contains a cycle");

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

function hasCycle(graph: WorkflowGraph): boolean {
  const adj = new Map<string, string[]>();
  for (const n of graph.nodes) adj.set(n.id, []);
  for (const e of graph.edges) adj.get(e.source)?.push(e.target);

  const state = new Map<string, 0 | 1 | 2>(); // 0=unseen 1=in-stack 2=done
  const visit = (id: string): boolean => {
    if (state.get(id) === 1) return true;
    if (state.get(id) === 2) return false;
    state.set(id, 1);
    for (const next of adj.get(id) ?? []) {
      if (visit(next)) return true;
    }
    state.set(id, 2);
    return false;
  };
  return graph.nodes.some((n) => visit(n.id));
}

/** Node ids in dependency order. Assumes the graph is acyclic. */
export function topoOrder(graph: WorkflowGraph): string[] {
  const indegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const n of graph.nodes) {
    indegree.set(n.id, 0);
    adj.set(n.id, []);
  }
  for (const e of graph.edges) {
    adj.get(e.source)?.push(e.target);
    indegree.set(e.target, (indegree.get(e.target) ?? 0) + 1);
  }
  const queue = [...indegree].filter(([, d]) => d === 0).map(([id]) => id);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const next of adj.get(id) ?? []) {
      const d = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, d);
      if (d === 0) queue.push(next);
    }
  }
  return order;
}

/** Direct upstream node ids for a given node. */
export function dependenciesOf(graph: WorkflowGraph, nodeId: string): string[] {
  return graph.edges.filter((e) => e.target === nodeId).map((e) => e.source);
}

export type KindData = {
  prompt: z.infer<typeof PromptData>;
  imageInput: z.infer<typeof ImageInputData>;
  generateImage: z.infer<typeof GenerateImageData>;
  editImage: z.infer<typeof EditImageData>;
  result: z.infer<typeof ResultData>;
};

export function nodesByKind<K extends NodeKind>(graph: WorkflowGraph, kind: K) {
  return graph.nodes.filter((n): n is Extract<WorkflowNode, { kind: K }> => n.kind === kind);
}
