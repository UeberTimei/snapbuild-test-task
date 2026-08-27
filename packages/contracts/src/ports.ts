import { z } from "zod";

export const PortType = z.enum(["text", "image"]);
export type PortType = z.infer<typeof PortType>;

export const NodeKind = z.enum(["prompt", "imageInput", "generateImage", "editImage", "result"]);
export type NodeKind = z.infer<typeof NodeKind>;
