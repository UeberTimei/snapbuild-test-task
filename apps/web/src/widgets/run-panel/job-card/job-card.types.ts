import type { JobDto } from "@repo/contracts";

export interface JobCardProps {
  job: JobDto;
  onRetry: () => void;
}
