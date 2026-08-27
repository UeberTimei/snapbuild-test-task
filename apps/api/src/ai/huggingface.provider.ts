import { Injectable, Logger } from "@nestjs/common";
import type { ImageRequest } from "@repo/contracts";
import {
  ImageProviderError,
  type EditRequest,
  type GeneratedImage,
  type ImageProvider,
} from "./image-provider";

const BASE = process.env.HF_BASE_URL ?? "https://router.huggingface.co/hf-inference/models";
const TEXT_TO_IMAGE_MODEL = process.env.HF_T2I_MODEL ?? "black-forest-labs/FLUX.1-schnell";
const IMAGE_TO_IMAGE_MODEL = process.env.HF_I2I_MODEL ?? "timbrooks/instruct-pix2pix";
const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 60_000);

@Injectable()
export class HuggingFaceProvider implements ImageProvider {
  private readonly log = new Logger(HuggingFaceProvider.name);

  private token(): string {
    const token = process.env.HF_TOKEN;
    if (!token) {
      throw new ImageProviderError(
        "HF_TOKEN is not set. Create apps/api/.env with HF_TOKEN=<your huggingface token>.",
      );
    }
    return token;
  }

  generate(req: ImageRequest): Promise<GeneratedImage> {
    return this.post(TEXT_TO_IMAGE_MODEL, {
      inputs: req.prompt,
      parameters: req.negativePrompt ? { negative_prompt: req.negativePrompt } : {},
    });
  }

  /**
   * Image-to-image edit. The HF inference API takes the source image as base64
   * with the instruction as the prompt parameter; capabilities vary by model,
   * see README for the limitations of the default one.
   */
  edit(req: EditRequest): Promise<GeneratedImage> {
    const instruction = [req.prompt, req.instruction].filter(Boolean).join(", ");
    return this.post(IMAGE_TO_IMAGE_MODEL, {
      inputs: Buffer.from(req.image).toString("base64"),
      parameters: {
        prompt: instruction,
        ...(req.negativePrompt ? { negative_prompt: req.negativePrompt } : {}),
      },
    });
  }

  private async post(model: string, body: unknown): Promise<GeneratedImage> {
    const token = this.token();
    const signal = AbortSignal.timeout(TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(`${BASE}/${model}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
    } catch (err) {
      const timedOut = err instanceof Error && err.name === "TimeoutError";
      throw new ImageProviderError(
        timedOut ? `image request timed out after ${TIMEOUT_MS}ms` : "image request failed",
        err,
      );
    }

    if (!res.ok) {
      // Body may carry a useful HF message ("model is loading", rate limit, bad token).
      const detail = await res.text().catch(() => "");
      this.log.warn(`${model} responded ${res.status}: ${detail.slice(0, 300)}`);
      throw new ImageProviderError(`provider responded ${res.status}: ${truncate(detail)}`);
    }

    const mime = res.headers.get("content-type") ?? "image/png";
    if (!mime.startsWith("image/")) {
      const detail = await res.text().catch(() => "");
      throw new ImageProviderError(`provider returned ${mime}: ${truncate(detail)}`);
    }
    return { bytes: new Uint8Array(await res.arrayBuffer()), mime };
  }
}

function truncate(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 200 ? `${clean.slice(0, 200)}…` : clean;
}
