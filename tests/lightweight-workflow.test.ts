import { existsSync, mkdtempSync, mkdirSync, readFileSync } from "node:fs";
import { cpSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");
const cliFile = path.join(repoRoot, "scripts", "lightweight-workflow.cjs");
const require = createRequire(import.meta.url);
const { finish, peek, scaffoldRun } = require(cliFile) as {
  finish: (
    root: string,
    project: string,
    runId: string,
    stepId: string | undefined,
    output: Record<string, unknown>
  ) => { status: string; currentStage: string | null; stepId: string; outputFile: string };
  peek: (root: string, project: string, runId: string, stage?: string) => { status: string };
  scaffoldRun: (
    root: string,
    project: string,
    backlogId: string,
    runId: string,
    repoCwd?: string
  ) => unknown;
};

function readJson(file: string) {
  return JSON.parse(readFileSync(file, "utf8"));
}

describe("lightweight workflow scaffold", () => {
  it("scaffolds the Greenroom core run with contracts and HAS_WORK peek output", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "greenroom-workflow-"));
    mkdirSync(path.join(root, "workflow-state", "projects", "greenroom", "backlog"), { recursive: true });

    cpSync(path.join(repoRoot, "workflow-roles.json"), path.join(root, "workflow-roles.json"));
    cpSync(
      path.join(repoRoot, "workflow-state", "projects", "greenroom", "backlog", "B-GREENROOM-CORE-001.json"),
      path.join(root, "workflow-state", "projects", "greenroom", "backlog", "B-GREENROOM-CORE-001.json")
    );

    scaffoldRun(root, "greenroom", "B-GREENROOM-CORE-001", "greenroom-backstage-core-001", repoRoot);

    const runDir = path.join(root, "workflow-state", "projects", "greenroom", "runs", "greenroom-backstage-core-001");
    const run = readJson(path.join(runDir, "run.json"));
    const state = readJson(path.join(runDir, "state.json"));
    const planContract = readJson(path.join(runDir, "contracts", "plan.json"));
    const nextStepContract = readJson(path.join(runDir, "contracts", "implement-next-step.json"));

    expect(run.project).toBe("greenroom");
    expect(run.sourceBacklogItem).toBe("B-GREENROOM-CORE-001");
    expect(state.steps.map((step: { id: string; status: string }) => [step.id, step.status])).toEqual([
      ["plan", "pending"],
      ["setup", "pending"],
      ["implement-next-step", "pending"],
      ["verify", "pending"]
    ]);
    expect(planContract).toMatchObject({
      stage: "plan",
      project: "greenroom",
      backlogId: "B-GREENROOM-CORE-001"
    });
    expect(nextStepContract).toMatchObject({
      stage: "implement",
      project: "greenroom",
      backlogId: "B-GREENROOM-CORE-001"
    });

    expect(peek(root, "greenroom", "greenroom-backstage-core-001")).toEqual({ status: "HAS_WORK" });
    expect(peek(root, "greenroom", "greenroom-backstage-core-001", "plan")).toEqual({ status: "HAS_WORK" });
    expect(peek(root, "greenroom", "greenroom-backstage-core-001", "implement")).toEqual({ status: "NO_WORK" });
  });

  it("records structured step output and advances stage-specific peek state on finish", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "greenroom-workflow-"));
    mkdirSync(path.join(root, "workflow-state", "projects", "greenroom", "backlog"), { recursive: true });

    cpSync(path.join(repoRoot, "workflow-roles.json"), path.join(root, "workflow-roles.json"));
    cpSync(
      path.join(repoRoot, "workflow-state", "projects", "greenroom", "backlog", "B-GREENROOM-CORE-001.json"),
      path.join(root, "workflow-state", "projects", "greenroom", "backlog", "B-GREENROOM-CORE-001.json")
    );

    scaffoldRun(root, "greenroom", "B-GREENROOM-CORE-001", "greenroom-backstage-core-001", repoRoot);

    expect(peek(root, "greenroom", "greenroom-backstage-core-001", "plan")).toEqual({ status: "HAS_WORK" });

    const result = finish(root, "greenroom", "greenroom-backstage-core-001", "plan", {
      summary: "Created the first story",
      stories: [
        {
          id: "S-GREENROOM-CORE-003",
          title: "Derive Backstage relations and finalize workflow step signaling"
        }
      ]
    });

    const runDir = path.join(root, "workflow-state", "projects", "greenroom", "runs", "greenroom-backstage-core-001");
    const run = readJson(path.join(runDir, "run.json"));
    const state = readJson(path.join(runDir, "state.json"));
    const output = readJson(path.join(runDir, "outputs", "plan.json"));
    const events = readFileSync(path.join(runDir, "events.jsonl"), "utf8").trim().split("\n").map((line) => JSON.parse(line));

    expect(result).toMatchObject({
      status: "running",
      currentStage: "setup",
      stepId: "plan",
      outputFile: "outputs/plan.json"
    });
    expect(run.currentStage).toBe("setup");
    expect(run.status).toBe("running");
    expect(state.steps.find((step: { id: string; status: string }) => step.id === "plan")).toMatchObject({
      id: "plan",
      status: "done",
      outputFile: "outputs/plan.json"
    });
    expect(state.finishedSteps).toContainEqual(
      expect.objectContaining({
        stepId: "plan",
        stage: "plan",
        outputFile: "outputs/plan.json",
        output: {
          summary: "Created the first story",
          stories: [
            {
              id: "S-GREENROOM-CORE-003",
              title: "Derive Backstage relations and finalize workflow step signaling"
            }
          ]
        }
      })
    );
    expect(output).toEqual({
      summary: "Created the first story",
      stories: [
        {
          id: "S-GREENROOM-CORE-003",
          title: "Derive Backstage relations and finalize workflow step signaling"
        }
      ]
    });
    expect(events.at(-1)).toMatchObject({
      event: "step.finished",
      stepId: "plan",
      stage: "plan",
      outputFile: "outputs/plan.json"
    });
    expect(existsSync(path.join(runDir, "claims", "active.json"))).toBe(false);

    expect(peek(root, "greenroom", "greenroom-backstage-core-001", "plan")).toEqual({ status: "NO_WORK" });
    expect(peek(root, "greenroom", "greenroom-backstage-core-001", "setup")).toEqual({ status: "HAS_WORK" });
  });
});
