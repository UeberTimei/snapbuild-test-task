import { api } from "@/shared/api";
import { Empty } from "@/shared/ui";
import { NodeShell } from "../../node-shell/node-shell";
import type { NodeComponentProps } from "../node.types";
import { useUpstreamResult } from "./result-node.model";

export function ResultNode({ id, selected }: NodeComponentProps<"result">) {
  const { assetId, generating } = useUpstreamResult(id);

  return (
    <NodeShell id={id} kind="result" selected={selected}>
      {assetId === null ? (
        <Empty>{generating ? "generating…" : "no result yet"}</Empty>
      ) : (
        <img className="node__image" src={api.assetUrl(assetId)} alt="result" />
      )}
    </NodeShell>
  );
}
