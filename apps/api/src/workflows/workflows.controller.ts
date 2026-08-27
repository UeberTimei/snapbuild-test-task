import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { WorkflowGraph } from "@repo/contracts";
import { z } from "zod";
import { WorkflowsService, type WorkflowRecord } from "./workflows.service";

const SaveWorkflow = z.object({ name: z.string().min(1), graph: WorkflowGraph });

@Controller("workflows")
export class WorkflowsController {
  constructor(private readonly workflows: WorkflowsService) {}

  @Get()
  list(): WorkflowRecord[] {
    return this.workflows.list();
  }

  @Get(":id")
  get(@Param("id") id: string): WorkflowRecord {
    const wf = this.workflows.get(id);
    if (!wf) throw new NotFoundException();
    return wf;
  }

  @Post()
  create(@Body() body: unknown): WorkflowRecord {
    const { name, graph } = parse(body);
    return this.workflows.create(name, graph);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: unknown): WorkflowRecord {
    const { name, graph } = parse(body);
    const updated = this.workflows.update(id, name, graph);
    if (!updated) throw new NotFoundException();
    return updated;
  }
}

/** Saving allows an incomplete graph (work in progress); only running requires full validity. */
function parse(body: unknown): { name: string; graph: WorkflowGraph } {
  const parsed = SaveWorkflow.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestException({
      message: "validation failed",
      issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    });
  }
  return parsed.data;
}
