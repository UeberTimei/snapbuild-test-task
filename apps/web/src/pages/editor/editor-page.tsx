import { useEffect } from "react";
import { demoGraph, useWorkflowStore } from "@/entities/workflow";
import { Canvas } from "@/widgets/canvas";
import { NodeInspector } from "@/widgets/node-inspector";
import { RunPanel } from "@/widgets/run-panel";

export function EditorPage() {
  const replaceGraph = useWorkflowStore((s) => s.replaceGraph);
  const isEmpty = useWorkflowStore((s) => s.nodes.length === 0);

  useEffect(() => {
    if (isEmpty) replaceGraph(demoGraph);
  }, [isEmpty, replaceGraph]);

  return (
    <div className="editor">
      <header className="editor__head">
        <h1>AI Image Workflow</h1>
        <p className="muted">Connect nodes, run the graph, watch each job resolve.</p>
      </header>
      <main className="editor__main">
        <Canvas />
        <aside className="editor__side">
          <NodeInspector />
          <RunPanel />
        </aside>
      </main>
    </div>
  );
}
