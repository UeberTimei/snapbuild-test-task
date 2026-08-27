import { z } from "zod";
import { CYCLE_ERROR } from "./constants";
import { edgeErrors, hasCycle, missingRequiredInputErrors } from "./graph.helpers";
import type { GraphValidation } from "./graph.types";
import type { NodeKind } from "./ports";

const Position = z.object({ x: z.number(), y: z.number() });

export const PromptData = z.object({ text: z.string() });
export const ImageInputData = z.object({ assetId: z.string().nullable() });
export const GenerateImageData = z.object({ presetId: z.string().nullable() });
export const EditImageData = z.object({
  presetId: z.string().nullable(),
  instruction: z.string(),
});
export const ResultData = z.object({});

export const NODE_DATA_SCHEMAS = {
  prompt: PromptData,
  imageInput: ImageInputData,
  generateImage: GenerateImageData,
  editImage: EditImageData,
  result: ResultData,
} satisfies Record<NodeKind, z.ZodType>;

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

export function validateGraph(input: unknown): GraphValidation {
  const parsed = WorkflowGraph.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    };
  }

  const graph = parsed.data;
  const errors = [
    ...edgeErrors(graph),
    ...missingRequiredInputErrors(graph),
    ...(hasCycle(graph) ? [CYCLE_ERROR] : []),
  ];
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
