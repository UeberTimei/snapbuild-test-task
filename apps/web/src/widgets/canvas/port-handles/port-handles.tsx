import { Handle } from "@xyflow/react";
import { evenlySpacedPercent } from "@/shared/lib";
import type { PortHandlesProps } from "./port-handles.types";

export function PortHandles({ ports, type, position }: PortHandlesProps) {
  return ports.map((port, index) => (
    <Handle
      key={port.id}
      id={port.id}
      type={type}
      position={position}
      className={`handle handle--${port.type}`}
      style={{ top: evenlySpacedPercent(index, ports.length) }}
    />
  ));
}
