import { Body, Controller, Get, NotFoundException, Param, Post, Put } from "@nestjs/common";
import { ZodBody } from "../common/zod-body.decorator";
import { WorkflowsService } from "./workflows.service";
import { SaveWorkflowRequest, type WorkflowRecord } from "./workflows.types";

@Controller("workflows")
export class WorkflowsController {
  constructor(private readonly workflows: WorkflowsService) {}

  @Get()
  list(): WorkflowRecord[] {
    return this.workflows.list();
  }

  @Get(":id")
  get(@Param("id") id: string): WorkflowRecord {
    const workflow = this.workflows.get(id);
    if (!workflow) throw new NotFoundException();
    return workflow;
  }

  @Post()
  create(@Body(ZodBody(SaveWorkflowRequest)) body: SaveWorkflowRequest): WorkflowRecord {
    return this.workflows.create(body.name, body.graph);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body(ZodBody(SaveWorkflowRequest)) body: SaveWorkflowRequest,
  ): WorkflowRecord {
    const updated = this.workflows.update(id, body.name, body.graph);
    if (!updated) throw new NotFoundException();
    return updated;
  }
}
