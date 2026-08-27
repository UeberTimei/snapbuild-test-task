import { Injectable, Logger } from "@nestjs/common";
import type { ImageRequest } from "@repo/contracts";
import {
  ImageProviderError,
  MissingApiKeyError,
  type EditRequest,
  type GeneratedImage,
  type ImageProvider,
} from "./image-provider";

const BASE_URL = process.env.HF_BASE_URL ?? "https://router.huggingface.co/hf-inference/models";
const TEXT_TO_IMAGE_MODEL = process.env.HF_T2I_MODEL ?? "black-forest-labs/FLUX.1-schnell";
const IMAGE_TO_IMAGE_MODEL = process.env.HF_I2I_MODEL ?? "timbrooks/instruct-pix2pix";
const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 60_000);
const MAX_ERROR_DETAIL = 200;

interface InferencePayload {
  inputs: string;
  parameters: Record<string, string>;
}

@Injectable()
export class HuggingFaceProvider implements ImageProvider {
  private readonly log = new Logger(HuggingFaceProvider.name);

  generate(request: ImageRequest): Promise<GeneratedImage> {
    return this.infer(TEXT_TO_IMAGE_MODEL, {
      inputs: request.prompt,
      parameters: negativePromptParam(request.negativePrompt),
    });
  }

  edit(request: EditRequest): Promise<GeneratedImage> {
    const prompt = [request.prompt, request.instruction].filter(Boolean).join(", ");
    return this.infer(IMAGE_TO_IMAGE_MODEL, {
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

    const mime = response.headers.get("content-type") ?? "image/png";
    if (!mime.startsWith("image/")) {
      throw new ImageProviderError(`provider returned ${mime}: ${await readDetail(response)}`);
    }

    return { bytes: new Uint8Array(await response.arrayBuffer()), mime };
  }

  private async send(model: string, payload: InferencePayload): Promise<Response> {
    const token = requireToken();
    try {
      return await fetch(`${BASE_URL}/${model}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      throw new ImageProviderError(
        isTimeout(error) ? `image request timed out after ${TIMEOUT_MS}ms` : "image request failed",
        error,
      );
    }
  }
}

function requireToken(): string {
  const token = process.env.HF_TOKEN;
  if (!token) {
    throw new MissingApiKeyError(
      "HF_TOKEN is not set. Create apps/api/.env with HF_TOKEN=<your huggingface token>.",
    );
  }
  return token;
}

function negativePromptParam(negativePrompt: string | undefined): Record<string, string> {
  return negativePrompt ? { negative_prompt: negativePrompt } : {};
}

function isTimeout(error: unknown): boolean {
  return error instanceof Error && error.name === "TimeoutError";
}

async function readDetail(response: Response): Promise<string> {
  const body = await response.text().catch(() => "");
  const collapsed = body.replace(/\s+/g, " ").trim();
  return collapsed.length > MAX_ERROR_DETAIL
    ? `${collapsed.slice(0, MAX_ERROR_DETAIL)}…`
    : collapsed;
}
