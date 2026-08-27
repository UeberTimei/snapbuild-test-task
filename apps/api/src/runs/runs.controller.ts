import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Sse,
} from "@nestjs/common";
import { CreateRunRequest, type CreateRunResponse, type RunDto, type RunEvent } from "@repo/contracts";
import { Observable } from "rxjs";
import { WorkflowsService } from "../workflows/workflows.service";
import { RunsService } from "./runs.service";

@Controller("runs")
export class RunsController {
  constructor(
    private readonly runs: RunsService,
    private readonly workflows: WorkflowsService,
  ) {}

  @Post()
  create(@Body() body: unknown): CreateRunResponse {
    const parsed = CreateRunRequest.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "validation failed",
        issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      });
    }
    try {
      const graph = this.workflows.resolveGraph(parsed.data);
      return { runId: this.runs.create(graph, parsed.data.workflowId) };
    } catch (err) {
      throw new BadRequestException(err instanceof Error ? err.message : "could not start run");
    }
  }

  @Get(":id")
  get(@Param("id") id: string): RunDto {
    const run = this.runs.get(id);
    if (!run) throw new NotFoundException();
    return run;
  }

  @Sse(":id/events")
  events(@Param("id") id: string): Observable<{ data: RunEvent }> {
    if (!this.runs.get(id)) throw new NotFoundException();
    return new Observable((subscriber) => {
      const unsubscribe = this.runs.subscribe(id, (event) => {
        subscriber.next({ data: event });
        // A failed run stays open so a retry keeps streaming; the client closes it.
        if (event.type === "run" && event.run.status === "completed") subscriber.complete();
      });
      return unsubscribe;
    });
  }

  @Post(":id/jobs/:jobId/retry")
  retry(@Param("id") id: string, @Param("jobId") jobId: string): { ok: true } {
    try {
      this.runs.retry(id, jobId);
      return { ok: true };
    } catch (err) {
      throw new BadRequestException(err instanceof Error ? err.message : "retry failed");
    }
  }
}
