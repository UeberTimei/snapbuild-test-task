import type { RunEvent } from "@repo/contracts";

export type NodeOutput = { type: "text"; value: string } | { type: "image"; assetId: string };

export type RunEventListener = (event: RunEvent) => void;

export type Unsubscribe = () => void;
