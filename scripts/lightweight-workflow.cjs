#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const IMPLEMENT_STEP_ID = "implement-next-step";
const DEFAULT_ROOT = process.cwd();

function now() {
  return new Date().toISOString();
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function slugify(value) {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function appendJsonl(file, value) {
  ensureDir(path.dirname(file));
  fs.appendFileSync(file, `${JSON.stringify(value)}\n`);
}

function projectDir(root, project) {
  return path.join(root, "workflow-state", "projects", slugify(project));
}

function backlogFile(root, project, backlogId) {
  return path.join(projectDir(root, project), "backlog", `${backlogId}.json`);
}

function runDir(root, project, runId) {
  return path.join(projectDir(root, project), "runs", runId);
}

function runFile(root, project, runId) {
  return path.join(runDir(root, project, runId), "run.json");
}

function stateFile(root, project, runId) {
  return path.join(runDir(root, project, runId), "state.json");
}

function contractFile(root, project, runId, contractRef) {
  const relativeRef = String(contractRef).includes(path.sep)
    ? contractRef
    : path.join("contracts", `${contractRef}.json`);
  return path.join(runDir(root, project, runId), relativeRef);
}

function eventsFile(root, project, runId) {
  return path.join(runDir(root, project, runId), "events.jsonl");
}

function activeClaimFile(root, project, runId) {
  return path.join(runDir(root, project, runId), "claims", "active.json");
}

function loadRoles(root) {
  return readJson(path.join(root, "workflow-roles.json"));
}

function loadRun(root, project, runId) {
  return readJson(runFile(root, project, runId));
}

function loadState(root, project, runId) {
  return readJson(stateFile(root, project, runId));
}

function nextStep(state) {
  return state.steps.find((step) => step.status !== "done") || null;
}

function currentStep(run, state) {
  const stageStep = state.steps.find(
    (step) => step.stage === run.currentStage && step.status !== "done"
  );
  return stageStep || nextStep(state);
}

function loadContract(root, project, runId, step) {
  return readJson(contractFile(root, project, runId, step.contractFile));
}

function outputFile(root, project, runId, stepId) {
  return path.join(runDir(root, project, runId), "outputs", `${stepId}.json`);
}

function validateFinishOutput(contract, output) {
  assert(output && typeof output === "object" && !Array.isArray(output), "finish output must be an object");

  for (const field of contract.requiredFields || []) {
    assert(Object.prototype.hasOwnProperty.call(output, field), `missing required output field: ${field}`);
  }

  if (contract.allowedResult) {
    assert(
      contract.allowedResult.includes(output.result),
      `output.result must be one of: ${contract.allowedResult.join(", ")}`
    );
  }
}

function peek(root, project, runId, stage) {
  const run = loadRun(root, project, runId);
  const state = loadState(root, project, runId);
  if (run.status !== "running") {
    return { status: "NO_WORK" };
  }

  const activeClaim = fs.existsSync(activeClaimFile(root, project, runId))
    ? readJson(activeClaimFile(root, project, runId))
    : null;
  if (activeClaim) {
    if (!stage || activeClaim.stage === stage) {
      return { status: "HAS_WORK" };
    }
    return { status: "NO_WORK" };
  }

  const step = currentStep(run, state);
  if (!step) {
    return { status: "NO_WORK" };
  }

  if (stage && step.stage !== stage) {
    return { status: "NO_WORK" };
  }

  return { status: "HAS_WORK" };
}

function finish(root, project, runId, stepId, output) {
  const run = loadRun(root, project, runId);
  const state = loadState(root, project, runId);
  assert(run.status === "running", `run is not running: ${run.status}`);

  const step = stepId
    ? state.steps.find((entry) => entry.id === stepId)
    : currentStep(run, state);
  assert(step, `unknown step: ${stepId}`);
  assert(step.status !== "done", `step already finished: ${step.id}`);

  const active = currentStep(run, state);
  assert(active && active.id === step.id, `step is not current: ${step.id}`);

  const contract = loadContract(root, project, runId, step);
  validateFinishOutput(contract, output);

  const finishedAt = now();
  const outputPath = outputFile(root, project, runId, step.id);
  const relativeOutputPath = path.relative(runDir(root, project, runId), outputPath);

  writeJson(outputPath, output);

  step.status = "done";
  step.finishedAt = finishedAt;
  step.outputFile = relativeOutputPath;
  state.finishedSteps.push({
    stepId: step.id,
    stage: step.stage,
    finishedAt,
    outputFile: relativeOutputPath,
    output
  });

  const next = nextStep(state);
  run.currentStage = next ? next.stage : null;
  run.status = next ? "running" : "completed";
  run.updatedAt = finishedAt;

  const claimPath = activeClaimFile(root, project, runId);
  if (fs.existsSync(claimPath)) {
    fs.unlinkSync(claimPath);
  }

  writeJson(stateFile(root, project, runId), state);
  writeJson(runFile(root, project, runId), run);
  appendJsonl(eventsFile(root, project, runId), {
    ts: finishedAt,
    event: "step.finished",
    runId,
    stepId: step.id,
    stage: step.stage,
    outputFile: relativeOutputPath
  });

  return {
    status: run.status,
    currentStage: run.currentStage,
    stepId: step.id,
    outputFile: relativeOutputPath
  };
}

function scaffoldRun(root, project, backlogId, runId, repoCwd) {
  const projectSlug = slugify(project);
  const backlog = readJson(backlogFile(root, projectSlug, backlogId));
  const roles = loadRoles(root);
  const dir = runDir(root, projectSlug, runId);
  assert(!fs.existsSync(dir), `Run already exists: ${runId}`);

  const steps = [
    {
      id: "plan",
      stage: "plan",
      actorRole: "planner",
      title: "Turn backlog item into concrete stories",
      status: "pending",
      contractFile: "contracts/plan.json"
    },
    {
      id: "setup",
      stage: "setup",
      actorRole: "setup",
      title: "Capture repo path and execution commands",
      status: "pending",
      contractFile: "contracts/setup.json"
    },
    {
      id: IMPLEMENT_STEP_ID,
      stage: "implement",
      actorRole: "developer",
      title: backlog.nextStep,
      status: "pending",
      contractFile: `contracts/${IMPLEMENT_STEP_ID}.json`
    },
    {
      id: "verify",
      stage: "verify",
      actorRole: "verifier",
      title: "Confirm the next step is complete enough to continue dogfooding",
      status: "pending",
      contractFile: "contracts/verify.json"
    }
  ];

  ensureDir(path.join(dir, "claims"));
  writeJson(runFile(root, projectSlug, runId), {
    id: runId,
    project: projectSlug,
    sourceBacklogItem: backlogId,
    workflow: "lightweight-workflow-skeleton",
    rolesFile: path.relative(dir, path.join(root, "workflow-roles.json")),
    rolesVersion: roles.version,
    repoCwd: path.resolve(repoCwd || root),
    status: "running",
    currentStage: "plan",
    createdAt: now(),
    updatedAt: now()
  });

  writeJson(stateFile(root, projectSlug, runId), {
    version: 2,
    mode: "manual",
    storyMode: "single-step",
    roles: roles.roles.map((role) => ({ id: role.id, stages: role.stages })),
    steps,
    stories: [],
    finishedSteps: [],
    failures: [],
    createdFromBacklog: backlogId
  });

  const contracts = {
    plan: {
      stage: "plan",
      actorRole: "planner",
      project: projectSlug,
      backlogId,
      requiredFields: ["summary", "stories"],
      notes: "Use planner-create-stories to materialize the story files before finishing plan."
    },
    setup: {
      stage: "setup",
      actorRole: "setup",
      project: projectSlug,
      backlogId,
      requiredFields: ["summary", "repo", "commands"],
      notes: "Record repo path and the commands the next worker should run."
    },
    [IMPLEMENT_STEP_ID]: {
      stage: "implement",
      actorRole: "developer",
      project: projectSlug,
      backlogId,
      requiredFields: ["summary", "changedFiles", "tests"],
      notes: backlog.nextStep
    },
    verify: {
      stage: "verify",
      actorRole: "verifier",
      project: projectSlug,
      backlogId,
      requiredFields: ["summary", "result"],
      allowedResult: ["pass"]
    }
  };

  for (const step of steps) {
    writeJson(contractFile(root, projectSlug, runId, step.id), contracts[step.id]);
  }

  appendJsonl(eventsFile(root, projectSlug, runId), {
    ts: now(),
    event: "run.created",
    runId,
    backlogId
  });

  return {
    runDir: dir,
    run: loadRun(root, projectSlug, runId),
    state: loadState(root, projectSlug, runId)
  };
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith("--")) {
      throw new Error(`unexpected arg: ${token}`);
    }
    const key = token.slice(2);
    const value = rest[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`missing value for --${key}`);
    }
    options[key] = value;
    index += 1;
  }
  return { command, options };
}

function requireOption(options, key) {
  const value = options[key];
  if (!value) {
    throw new Error(`missing --${key}`);
  }
  return value;
}

function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  const root = path.resolve(options.root || DEFAULT_ROOT);

  if (command === "scaffold-run") {
    const result = scaffoldRun(
      root,
      requireOption(options, "project"),
      requireOption(options, "backlog-id"),
      requireOption(options, "run-id"),
      options.cwd || root
    );
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  if (command === "peek") {
    const result = peek(root, requireOption(options, "project"), requireOption(options, "run-id"), options.stage);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  if (command === "finish") {
    const output = options["output-file"]
      ? readJson(path.resolve(root, options["output-file"]))
      : JSON.parse(requireOption(options, "output-json"));
    const result = finish(
      root,
      requireOption(options, "project"),
      requireOption(options, "run-id"),
      options["step-id"],
      output
    );
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  throw new Error("usage: scaffold-run|peek|finish");
}

module.exports = {
  finish,
  peek,
  scaffoldRun
};

try {
  if (require.main === module) {
    main();
  }
} catch (error) {
  if (require.main === module) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
  throw error;
}
