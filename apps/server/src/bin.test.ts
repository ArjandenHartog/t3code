// @effect-diagnostics nodeBuiltinImport:off - exercise CLI startup in a real subprocess.
import * as NodeChildProcess from "node:child_process";
import * as NodeFS from "node:fs";
import * as NodeOS from "node:os";
import * as NodePath from "node:path";
import * as NodeURL from "node:url";

import { afterEach, describe, expect, it } from "vite-plus/test";

const fixtures: Array<string> = [];

afterEach(() => {
  for (const fixture of fixtures.splice(0)) {
    NodeFS.rmSync(fixture, { recursive: true, force: true });
  }
});

const createCli = () => {
  const root = NodeFS.mkdtempSync(NodePath.join(NodeOS.tmpdir(), "t3-bin-test-"));
  fixtures.push(root);
  const src = NodePath.join(root, "src");
  NodeFS.mkdirSync(NodePath.join(src, "cli"), { recursive: true });
  for (const file of ["bin.ts", "entrypoint.ts"]) {
    NodeFS.copyFileSync(new URL(file, import.meta.url), NodePath.join(src, file));
  }
  NodeFS.writeFileSync(
    NodePath.join(root, "package.json"),
    JSON.stringify({ type: "module", version: "9.8.7-nightly.test" }),
  );
  NodeFS.writeFileSync(
    NodePath.join(src, "cli/consoleStdin.ts"),
    "export function attachConsoleStdin() {}\n",
  );
  NodeFS.writeFileSync(NodePath.join(src, "binCli.ts"), 'throw new Error("full CLI loaded");\n');
  return NodePath.join(src, "bin.ts");
};

describe("CLI entrypoint", () => {
  it("prints the package version without loading the server or requiring its dependencies", () => {
    const result = NodeChildProcess.spawnSync(process.execPath, [createCli(), "--version"], {
      encoding: "utf8",
      timeout: 10_000,
    });

    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toBe("t3 v9.8.7-nightly.test\n");
    expect(result.stderr).toBe("");
  });

  it.each([["--help"], ["--version", "--help"]])("loads the full CLI for %j", (...args) => {
    const result = NodeChildProcess.spawnSync(process.execPath, [createCli(), ...args], {
      encoding: "utf8",
      timeout: 10_000,
    });

    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("full CLI loaded");
  });

  it("does not print a version when imported by another module", () => {
    const entryUrl = NodeURL.pathToFileURL(createCli()).href;
    const result = NodeChildProcess.spawnSync(
      process.execPath,
      ["--input-type=module", "-e", `await import(${JSON.stringify(entryUrl)})`, "--", "--version"],
      { encoding: "utf8", timeout: 10_000 },
    );

    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("");
  });
});
