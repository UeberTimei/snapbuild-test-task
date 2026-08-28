import { nodeLabel } from "@/entities/node";
import { selectSelectedNode, useWorkflowStore } from "@/entities/workflow";
import { Empty, Panel } from "@/shared/ui";
import { NodeFields } from "../node-fields/node-fields";

export function NodeInspector() {
  const node = useWorkflowStore(selectSelectedNode);

  if (!node) {
    return (
      <Panel title="Inspector">
        <Empty>Select a node to edit it.</Empty>
      </Panel>
    );
  }

  return (
    <Panel title={`${nodeLabel(node.type)} settings`}>
      <NodeFields node={node} />
    </Panel>
  );
}
