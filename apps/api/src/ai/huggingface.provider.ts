import { Injectable, Logger } from "@nestjs/common";
import type { ImageRequest } from "@repo/contracts";
import {
  AI_TIMEOUT_MS,
  CONTENT_TYPE_JSON,
  DEFAULT_IMAGE_MIME,
  HF_BASE_URL,
  HF_IMAGE_TO_IMAGE_MODEL,
  HF_TEXT_TO_IMAGE_MODEL,
  IMAGE_MIME_PREFIX,
} from "../common/constants";
import { isTimeout, negativePromptParam, readDetail, requireToken } from "./ai.helpers";
import type { EditRequest, GeneratedImage, ImageProvider, InferencePayload } from "./ai.types";
import { ImageProviderError } from "./image-provider";

@Injectable()
export class HuggingFaceProvider implements ImageProvider {
  private readonly log = new Logger(HuggingFaceProvider.name);

  generate(request: ImageRequest): Promise<GeneratedImage> {
    return this.infer(HF_TEXT_TO_IMAGE_MODEL, {
      inputs: request.prompt,
      parameters: negativePromptParam(request.negativePrompt),
    });
  }

  edit(request: EditRequest): Promise<GeneratedImage> {
    const prompt = [request.prompt, request.instruction].filter(Boolean).join(", ");
    return this.infer(HF_IMAGE_TO_IMAGE_MODEL, {
      inputs: Buffer.from(request.image).toString("base64"),
      parameters: { prompt, ...negativePromptParam(request.negativePrompt) },
    });
  }

  private async infer(model: string, payload: InferencePayload): Promise<GeneratedImage> {
    const response = await this.send(model, payload);

    if (!response.ok) {
      const detail = await readDetail(response);
      this.log.warn(`${model} responded ${response.status}: ${detail}`);
      throw new ImageProviderError(`provider responded ${response.status}: ${detail}`);
    }

    const mime = response.headers.get("content-type") ?? DEFAULT_IMAGE_MIME;
    if (!mime.startsWith(IMAGE_MIME_PREFIX)) {
      throw new ImageProviderError(`provider returned ${mime}: ${await readDetail(response)}`);
    }

    return { bytes: new Uint8Array(await response.arrayBuffer()), mime };
  }

  private async send(model: string, payload: InferencePayload): Promise<Response> {
    const token = requireToken();

    try {
      return await fetch(`${HF_BASE_URL}/${model}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": CONTENT_TYPE_JSON },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(AI_TIMEOUT_MS),
      });
    } catch (error) {
      throw new ImageProviderError(
        isTimeout(error)
          ? `image request timed out after ${AI_TIMEOUT_MS}ms`
          : "image request failed",
        error,
      );
    }
  }
}
