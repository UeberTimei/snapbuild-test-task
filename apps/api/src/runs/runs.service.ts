import { randomUUID } from "node:crypto";
import { Inject, Injectable, Logger } from "@nestjs/common";
import type { RunDto, RunEvent, WorkflowGraph } from "@repo/contracts";
import { eq } from "drizzle-orm";
import { AssetsService } from "../assets/assets.service";
import { IMAGE_PROVIDER, type ImageProvider } from "../ai/image-provider";
import { PresetsService } from "../presets/presets.service";
import { DB, type Db } from "../db/db.module";
import { jobs as jobsTable, runs as runsTable } from "../db/schema";
import { Executor } from "./executor";
import { RunState } from "./run-state";

@Injectable()
export class RunsService {
  private readonly log = new Logger(RunsService.name);
  private readonly active = new Map<string, RunState>();
  private readonly executor: Executor;

  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(IMAGE_PROVIDER) provider: ImageProvider,
    assets: AssetsService,
    presets: PresetsService,
  ) {
    this.executor = new Executor({ provider, assets, presets });
  }

  /** Creates a run, starts it in the background, returns immediately. */
  create(graph: WorkflowGraph, workflowId?: string): string {
    const run = new RunState(randomUUID(), graph, Date.now());
    this.executor.initJobs(run);
    this.active.set(run.id, run);

    this.db
      .insert(runsTable)
      .values({
        id: run.id,
        workflowId: workflowId ?? null,
        status: run.status,
        graphJson: JSON.stringify(graph),
        createdAt: run.createdAt,
      })
      .run();
    for (const job of run.jobs.values()) {
      this.db.insert(jobsTable).values({ ...job, runId: run.id }).run();
    }
    run.events.on("event", (event: RunEvent) => this.persist(run.id, event));

    void this.executor.run(run).catch((err) => this.log.error(`run ${run.id} crashed`, err));
    return run.id;
  }

  get(runId: string): RunDto | null {
    const live = this.active.get(runId);
    if (live) return live.toDto();

    const row = this.db.select().from(runsTable).where(eq(runsTable.id, runId)).get();
    if (!row) return null;
    const jobRows = this.db.select().from(jobsTable).where(eq(jobsTable.runId, runId)).all();
    return {
      id: row.id,
      status: row.status as RunDto["status"],
      createdAt: new Date(row.createdAt).toISOString(),
      jobs: jobRows.map((j) => ({
        id: j.id,
        nodeId: j.nodeId,
        kind: j.kind,
        status: j.status as RunDto["jobs"][number]["status"],
        attempts: j.attempts,
        error: j.error,
        outputAssetId: j.outputAssetId,
      })),
    };
  }

  /** Live event stream for SSE; the current snapshot is replayed first. */
  subscribe(runId: string, onEvent: (event: RunEvent) => void): () => void {
    const run = this.active.get(runId);
    const snapshot = this.get(runId);
    if (snapshot) onEvent({ type: "run", run: snapshot });
    if (!run) return () => {};

    run.events.on("event", onEvent);
    return () => run.events.off("event", onEvent);
  }

  /** Validates the retry, then re-runs in the background so the request returns immediately. */
  retry(runId: string, jobId: string): void {
    const run = this.active.get(runId);
    if (!run) throw new Error(`run ${runId} is no longer active`);
    this.executor.prepareRetry(run, jobId);
    void this.executor.run(run).catch((err) => this.log.error(`retry of ${runId} crashed`, err));
  }

  private persist(runId: string, event: RunEvent): void {
    if (event.type === "run") {
      this.db.update(runsTable).set({ status: event.run.status }).where(eq(runsTable.id, runId)).run();
      return;
    }
    const { id, status, attempts, error, outputAssetId } = event.job;
    this.db.update(jobsTable).set({ status, attempts, error, outputAssetId }).where(eq(jobsTable.id, id)).run();
  }
}
