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
import type { AssetUploadResponse } from "@repo/contracts";
import type { Response } from "express";
import { CACHE_CONTROL_IMMUTABLE, IMAGE_MIME_PREFIX, UPLOAD_FIELD_NAME } from "../common/constants";
import type { MultipartFile } from "../common/types";
import { AssetsService } from "./assets.service";

@Controller("assets")
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Post()
  @UseInterceptors(FileInterceptor(UPLOAD_FIELD_NAME))
  async upload(@UploadedFile() file: MultipartFile | undefined): Promise<AssetUploadResponse> {
    if (!file) throw new BadRequestException(`${UPLOAD_FIELD_NAME} field is required`);
    if (!file.mimetype.startsWith(IMAGE_MIME_PREFIX)) {
      throw new BadRequestException(`expected an image, received ${file.mimetype}`);
    }

    const id = await this.assets.save(new Uint8Array(file.buffer), file.mimetype, "upload");
    return { id };
  }

  @Get(":id")
  serve(@Param("id") id: string, @Res({ passthrough: true }) res: Response): StreamableFile {
    const asset = this.assets.get(id);
    if (!asset) throw new NotFoundException();

    res.set({ "Content-Type": asset.mime, "Cache-Control": CACHE_CONTROL_IMMUTABLE });
    return new StreamableFile(createReadStream(asset.path));
  }
}
