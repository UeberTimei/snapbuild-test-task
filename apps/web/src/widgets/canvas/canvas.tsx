import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type Edge,
  type OnSelectionChangeParams,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback } from "react";
import { NODE_ORDER, nodeMeta } from "@/entities/node";
import { useWorkflowStore } from "@/entities/workflow";
import { isValidConnection } from "@/features/connect-nodes";
import { Button } from "@/shared/ui";
import { nodeTypes } from "./nodes";

export function Canvas() {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const onNodesChange = useWorkflowStore((s) => s.onNodesChange);
  const onEdgesChange = useWorkflowStore((s) => s.onEdgesChange);
  const connect = useWorkflowStore((s) => s.connect);
  const addNode = useWorkflowStore((s) => s.addNode);
  const removeSelected = useWorkflowStore((s) => s.removeSelected);
  const select = useWorkflowStore((s) => s.select);

  const validate = useCallback(
    (connection: Connection | Edge) =>
      isValidConnection(connection, useWorkflowStore.getState().nodes),
    [],
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => select(selectedNodes[0]?.id ?? null),
    [select],
  );

  return (
    <div className="canvas">
      <div className="palette">
        {NODE_ORDER.map((kind) => (
          <Button
            key={kind}
            onClick={() => addNode(kind, randomSpot())}
            title={nodeMeta(kind).hint}
          >
            + {nodeMeta(kind).label}
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
        onSelectionChange={onSelectionChange}
        isValidConnection={validate}
        deleteKeyCode={["Backspace", "Delete"]}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  );
}

/** Drop new nodes somewhere visible without stacking them exactly on top of each other. */
function randomSpot() {
  return { x: 120 + Math.random() * 260, y: 80 + Math.random() * 300 };
}
