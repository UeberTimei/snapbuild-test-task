import { Module } from "@nestjs/common";
import { DbModule } from "./db/db.module";
import { AssetsModule } from "./assets/assets.module";
import { PresetsModule } from "./presets/presets.module";
import { WorkflowsModule } from "./workflows/workflows.module";
import { AiModule } from "./ai/ai.module";
import { RunsModule } from "./runs/runs.module";

@Module({
  imports: [DbModule, AssetsModule, PresetsModule, WorkflowsModule, AiModule, RunsModule],
})
export class AppModule {}
