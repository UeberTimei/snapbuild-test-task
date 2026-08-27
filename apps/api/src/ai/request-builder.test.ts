import { expect, test } from "bun:test";
import type { Preset } from "@repo/contracts";
import { buildImageRequest } from "./request-builder";

const preset: Preset = {
  id: "p",
  name: "Premium 3D",
  mainPrompt: "premium minimal 3D visual",
  negativePrompt: "clutter, watermark",
  references: ["/references/ref-1.png"],
};

test("no preset: user prompt passes through", () => {
  expect(buildImageRequest("  a red car ")).toEqual({ prompt: "a red car", references: [] });
});

test("preset composes main prompt, negative prompt and references", () => {
  expect(buildImageRequest("a red car", preset)).toEqual({
    prompt: "premium minimal 3D visual, a red car",
    negativePrompt: "clutter, watermark",
    references: ["/references/ref-1.png"],
  });
});

test("empty user prompt leaves only the preset prompt", () => {
  expect(buildImageRequest("", preset).prompt).toBe("premium minimal 3D visual");
});

test("blank negative prompt is omitted rather than sent empty", () => {
  const req = buildImageRequest("x", { ...preset, negativePrompt: "   " });
  expect(req.negativePrompt).toBeUndefined();
});
