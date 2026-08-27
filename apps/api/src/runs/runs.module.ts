import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { AssetsModule } from "../assets/assets.module";
import { PresetsModule } from "../presets/presets.module";
import { WorkflowsModule } from "../workflows/workflows.module";
import { RunsController } from "./runs.controller";
import { RunsService } from "./runs.service";

@Module({
  imports: [AiModule, AssetsModule, PresetsModule, WorkflowsModule],
  controllers: [RunsController],
  providers: [RunsService],
})
export class RunsModule {}
