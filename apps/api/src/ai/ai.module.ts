import { Module } from "@nestjs/common";
import { HuggingFaceProvider } from "./huggingface.provider";
import { IMAGE_PROVIDER } from "./image-provider";

@Module({
  providers: [{ provide: IMAGE_PROVIDER, useClass: HuggingFaceProvider }],
  exports: [IMAGE_PROVIDER],
})
export class AiModule {}
