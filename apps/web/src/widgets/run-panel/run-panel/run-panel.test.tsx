import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { useRunStore } from "@/entities/run";
import { RunPanel } from "./run-panel";

beforeEach(() => {
  useRunStore.getState().reset();
});

test("shows an empty state before a run", () => {
  render(<RunPanel />);
  expect(screen.getByText(/no jobs yet/i)).toBeTruthy();
});

test("renders job status from the run store", () => {
  useRunStore.getState().start("run-1");
  useRunStore.getState().apply({
    type: "job",
    job: {
      id: "j1",
      nodeId: "generateImage-1",
      kind: "generateImage",
      status: "running",
      attempts: 1,
      error: null,
      outputAssetId: null,
    },
  });

  render(<RunPanel />);
  expect(screen.getByText("Generate Image")).toBeTruthy();
  expect(screen.getByText("running")).toBeTruthy();
});

test("a failed job offers a retry button and shows the error", () => {
  useRunStore.getState().start("run-1");
  useRunStore.getState().apply({
    type: "job",
    job: {
      id: "j1",
      nodeId: "generateImage-1",
      kind: "generateImage",
      status: "error",
      attempts: 1,
      error: "provider responded 503",
      outputAssetId: null,
    },
  });

  render(<RunPanel />);
  expect(screen.getByRole("button", { name: /retry node/i })).toBeTruthy();
  expect(screen.getByText(/provider responded 503/)).toBeTruthy();
});

test("the run button is disabled while a run is in flight", () => {
  useRunStore.getState().start("run-1");
  useRunStore.getState().apply({
    type: "run",
    run: { id: "run-1", status: "running", createdAt: new Date().toISOString(), jobs: [] },
  });

  render(<RunPanel />);
  expect(screen.getByRole("button", { name: /running/i }).hasAttribute("disabled")).toBe(true);
});
