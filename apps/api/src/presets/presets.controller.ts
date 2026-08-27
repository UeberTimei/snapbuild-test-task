import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import type { Preset } from "@repo/contracts";
import { PresetsService } from "./presets.service";

@Controller("presets")
export class PresetsController {
  constructor(private readonly presets: PresetsService) {}

  @Get()
  list(): Preset[] {
    return this.presets.list();
  }

  @Get(":id")
  get(@Param("id") id: string): Preset {
    const preset = this.presets.get(id);
    if (!preset) throw new NotFoundException();
    return preset;
  }
}
