import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type OnSelectionChangeParams,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { NODE_KIND_ORDER } from "@repo/contracts";
import { useCallback } from "react";
import { nodeHint, nodeLabel } from "@/entities/node";
import { useWorkflowStore } from "@/entities/workflow";
import { useConnectionValidator } from "@/features/connect-nodes";
import { CANVAS_COLOR_MODE, DELETE_KEY_CODES } from "@/shared/config";
import { Button } from "@/shared/ui";
import { nodeTypes } from "../nodes/node-types";
import { spawnPosition } from "./canvas.helpers";

export function Canvas() {
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const onNodesChange = useWorkflowStore((state) => state.onNodesChange);
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange);
  const connect = useWorkflowStore((state) => state.connect);
  const addNode = useWorkflowStore((state) => state.addNode);
  const removeSelected = useWorkflowStore((state) => state.removeSelected);
  const select = useWorkflowStore((state) => state.select);

  const isValidConnection = useConnectionValidator();

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => select(selectedNodes[0]?.id ?? null),
    [select],
  );

  return (
    <div className="canvas">
      <div className="palette">
        {NODE_KIND_ORDER.map((kind) => (
          <Button key={kind} title={nodeHint(kind)} onClick={() => addNode(kind, spawnPosition())}>
            + {nodeLabel(kind)}
          </Button>
        ))}
        <Button variant="danger" onClick={removeSelected}>
          Delete selected
        </Button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={connect}
        onSelectionChange={handleSelectionChange}
        isValidConnection={isValidConnection}
        deleteKeyCode={DELETE_KEY_CODES}
        colorMode={CANVAS_COLOR_MODE}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  );
}
