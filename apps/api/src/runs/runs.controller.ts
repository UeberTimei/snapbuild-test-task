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
import {
  CreateRunRequest,
  type CreateRunResponse,
  type RetryResponse,
  type RunDto,
  type RunEvent,
} from "@repo/contracts";
import { Observable } from "rxjs";
import { ZodBody } from "../common/zod-body.decorator";
import {
  InvalidGraphError,
  WorkflowNotFoundError,
  WorkflowsService,
} from "../workflows/workflows.service";
import { JobNotFoundError, JobNotRetryableError } from "./executor";
import { RunNotActiveError, RunsService } from "./runs.service";

@Controller("runs")
export class RunsController {
  constructor(
    private readonly runs: RunsService,
    private readonly workflows: WorkflowsService,
  ) {}

  @Post()
  create(@Body(ZodBody(CreateRunRequest)) body: CreateRunRequest): CreateRunResponse {
    try {
      const graph = this.workflows.resolveRunnableGraph(body);
      return { runId: this.runs.create(graph, body.workflowId) };
    } catch (error) {
      if (error instanceof InvalidGraphError) throw new BadRequestException(error.message);
      if (error instanceof WorkflowNotFoundError) throw new NotFoundException(error.message);
      throw error;
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

    return new Observable((subscriber) =>
      this.runs.subscribe(id, (event) => {
        subscriber.next({ data: event });
        if (event.type === "run" && event.run.status === "completed") subscriber.complete();
      }),
    );
  }

  @Post(":id/jobs/:jobId/retry")
  retry(@Param("id") id: string, @Param("jobId") jobId: string): RetryResponse {
    try {
      this.runs.retry(id, jobId);
      return { ok: true };
    } catch (error) {
      if (error instanceof RunNotActiveError || error instanceof JobNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof JobNotRetryableError) throw new BadRequestException(error.message);
      throw error;
    }
  }
}
