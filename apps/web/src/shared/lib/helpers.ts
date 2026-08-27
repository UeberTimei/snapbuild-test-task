export function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function randomBetween(min: number, spread: number): number {
  return min + Math.random() * spread;
}

export function evenlySpacedPercent(index: number, total: number): string {
  return `${((index + 1) / (total + 1)) * 100}%`;
}
