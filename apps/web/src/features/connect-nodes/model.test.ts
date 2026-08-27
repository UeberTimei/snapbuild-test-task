import { describe, expect, test } from "vitest";
import { isValidConnection } from "./model";

const nodes = [
  { id: "p", type: "prompt" },
  { id: "gen", type: "generateImage" },
  { id: "res", type: "result" },
  { id: "img", type: "imageInput" },
];

describe("typed port rule", () => {
  test("text output into a text input is allowed", () => {
    expect(
      isValidConnection({ source: "p", sourceHandle: "out", target: "gen", targetHandle: "prompt" }, nodes),
    ).toBe(true);
  });

  test("image output into an image input is allowed", () => {
    expect(
      isValidConnection({ source: "gen", sourceHandle: "out", target: "res", targetHandle: "in" }, nodes),
    ).toBe(true);
  });

  test("text output into an image input is blocked", () => {
    expect(
      isValidConnection({ source: "p", sourceHandle: "out", target: "res", targetHandle: "in" }, nodes),
    ).toBe(false);
  });

  test("image output into a text input is blocked", () => {
    expect(
      isValidConnection({ source: "img", sourceHandle: "out", target: "gen", targetHandle: "prompt" }, nodes),
    ).toBe(false);
  });

  test("self connection is blocked", () => {
    expect(
      isValidConnection({ source: "gen", sourceHandle: "out", target: "gen", targetHandle: "prompt" }, nodes),
    ).toBe(false);
  });

  test("unknown node is blocked", () => {
    expect(
      isValidConnection({ source: "nope", sourceHandle: "out", target: "gen", targetHandle: "prompt" }, nodes),
    ).toBe(false);
  });
});
