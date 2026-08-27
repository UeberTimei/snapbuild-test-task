import { createReadStream } from "node:fs";
import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { AssetsService } from "./assets.service";

/** Structural shape of what FileInterceptor hands us — avoids the Express.Multer global. */
interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
}

@Controller("assets")
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  async upload(@UploadedFile() file: UploadedImage): Promise<{ id: string }> {
    if (!file) throw new BadRequestException("file field is required");
    const id = await this.assets.save(new Uint8Array(file.buffer), file.mimetype, "upload");
    return { id };
  }

  @Get(":id")
  serve(@Param("id") id: string, @Res({ passthrough: true }) res: Response): StreamableFile {
    const asset = this.assets.get(id);
    if (!asset) throw new NotFoundException();
    res.set({ "Content-Type": asset.mime, "Cache-Control": "public, max-age=31536000, immutable" });
    return new StreamableFile(createReadStream(asset.path));
  }
}
