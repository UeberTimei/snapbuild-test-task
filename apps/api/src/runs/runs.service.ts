import { randomUUID } from "node:crypto";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { RunStatus, type RunDto, type RunEvent, type WorkflowGraph } from "@repo/contracts";
import { eq } from "drizzle-orm";
import { IMAGE_PROVIDER } from "../ai/image-provider";
import type { ImageProvider } from "../ai/ai.types";
import { AssetsService } from "../assets/assets.service";
import { MAX_ACTIVE_RUNS } from "../common/constants";
import { DB } from "../db/db.module";
import type { Db, RunRow } from "../db/db.types";
import { jobs as jobsTable, runs as runsTable } from "../db/schema";
import { PresetsService } from "../presets/presets.service";
import { Executor } from "./executor";
import { RunState } from "./run-state";
import type { RunEventListener, Unsubscribe } from "./run-state.types";
import { toJobDto } from "./runs.helpers";

export class RunNotActiveError extends Error {}

@Injectable()
export class RunsService {
  private readonly log = new Logger(RunsService.name);
  private readonly activeRuns = new Map<string, RunState>();
  private readonly executor: Executor;

  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(IMAGE_PROVIDER) provider: ImageProvider,
    assets: AssetsService,
    presets: PresetsService,
  ) {
    this.executor = new Executor({ provider, assets, presets });
  }

  create(graph: WorkflowGraph, workflowId?: string): string {
    const run = new RunState(randomUUID(), graph, Date.now());
    this.executor.initJobs(run);
    this.activeRuns.set(run.id, run);
    this.evictOldestRuns();

    this.insertRun(run, workflowId);
    run.onEvent((event) => this.persistEvent(run.id, event));
    this.execute(run);

    return run.id;
  }

  get(runId: string): RunDto | null {
    const active = this.activeRuns.get(runId);
    if (active) return active.toDto();

    const row = this.db.select().from(runsTable).where(eq(runsTable.id, runId)).get();
    return row ? this.toRunDto(row) : null;
  }

  subscribe(runId: string, onEvent: RunEventListener): Unsubscribe {
    const snapshot = this.get(runId);
    if (snapshot) onEvent({ type: "run", run: snapshot });

    const run = this.activeRuns.get(runId);
    return run ? run.onEvent(onEvent) : () => {};
  }

  retry(runId: string, jobId: string): void {
    const run = this.activeRuns.get(runId);
    if (!run) throw new RunNotActiveError(`run ${runId} is no longer active`);

    this.executor.prepareRetry(run, jobId);
    this.execute(run);
  }

  private execute(run: RunState): void {
    void this.executor
      .run(run)
      .catch((error: unknown) => this.log.error(`run ${run.id} crashed`, error));
  }

  private evictOldestRuns(): void {
    for (const runId of this.activeRuns.keys()) {
      if (this.activeRuns.size <= MAX_ACTIVE_RUNS) return;
      this.activeRuns.delete(runId);
    }
  }

  private insertRun(run: RunState, workflowId: string | undefined): void {
    this.db
      .insert(runsTable)
      .values({
        id: run.id,
        workflowId: workflowId ?? null,
        status: run.status,
        graphJson: JSON.stringify(run.graph),
        createdAt: run.createdAt,
      })
      .run();

    for (const job of run.jobs) {
      this.db
        .insert(jobsTable)
        .values({ ...job, runId: run.id })
        .run();
    }
  }

  private persistEvent(runId: string, event: RunEvent): void {
    if (event.type === "run") {
      this.db
        .update(runsTable)
        .set({ status: event.run.status })
        .where(eq(runsTable.id, runId))
        .run();
      return;
    }

    const { id, status, attempts, error, outputAssetId } = event.job;
    this.db
      .update(jobsTable)
      .set({ status, attempts, error, outputAssetId })
      .where(eq(jobsTable.id, id))
      .run();
  }

  private toRunDto(row: RunRow): RunDto {
    const jobRows = this.db.select().from(jobsTable).where(eq(jobsTable.runId, row.id)).all();

    return {
      id: row.id,
      status: RunStatus.parse(row.status),
      createdAt: new Date(row.createdAt).toISOString(),
      jobs: jobRows.map(toJobDto),
    };
  }
}
