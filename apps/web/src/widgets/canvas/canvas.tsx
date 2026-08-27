import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type Edge,
  type OnSelectionChangeParams,
  type XYPosition,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback } from "react";
import { NODE_ORDER, nodeHint, nodeLabel } from "@/entities/node";
import { useWorkflowStore } from "@/entities/workflow";
import { isValidConnection } from "@/features/connect-nodes";
import { Button } from "@/shared/ui";
import { nodeTypes } from "./nodes";

const DELETE_KEYS = ["Backspace", "Delete"];

export function Canvas() {
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const onNodesChange = useWorkflowStore((state) => state.onNodesChange);
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange);
  const connect = useWorkflowStore((state) => state.connect);
  const addNode = useWorkflowStore((state) => state.addNode);
  const removeSelected = useWorkflowStore((state) => state.removeSelected);
  const select = useWorkflowStore((state) => state.select);

  const validateConnection = useCallback(
    (connection: Connection | Edge) =>
      isValidConnection(connection, useWorkflowStore.getState().nodes),
    [],
  );

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => select(selectedNodes[0]?.id ?? null),
    [select],
  );

  return (
    <div className="canvas">
      <div className="palette">
        {NODE_ORDER.map((kind) => (
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
        isValidConnection={validateConnection}
        deleteKeyCode={DELETE_KEYS}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  );
}

function spawnPosition(): XYPosition {
  return { x: 120 + Math.random() * 260, y: 80 + Math.random() * 300 };
}
