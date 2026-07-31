import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const siteDirectory = resolve(scriptDirectory, "..");
const repositoryRoot = resolve(siteDirectory, "..");
const siteRootName = siteDirectory.split(sep).at(-1);
const outputPath = resolve(repositoryRoot, process.argv[2] ?? `${siteRootName}/catalog.json`);

const excludedRoots = new Set([
  ".git",
  ".github",
  "0-杂项",
  "杂项",
  "0-暂不发布",
  "暂不发布",
  "imgs",
  siteRootName,
  "高等数学A",
  "高等数学C",
  "高等数学D",
]);

const nonCourseRoots = new Set([
  "1-大学英语四六级",
  "1-专业培养计划",
]);

const rawFileTree = execFileSync(
  "git",
  ["-c", "core.quotepath=false", "ls-tree", "-r", "-z", "--name-only", "HEAD"],
  { cwd: repositoryRoot },
);

const paths = rawFileTree
  .toString("utf8")
  .split("\0")
  .filter(Boolean)
  .filter((path) => path.includes("/"))
  .filter((path) => !excludedRoots.has(path.split("/", 1)[0]));

const directoryMap = new Map();

for (const path of paths) {
  const parts = path.split("/");
  const directoryName = parts[0];
  const fileName = parts.at(-1);

  if (!directoryMap.has(directoryName)) {
    directoryMap.set(directoryName, []);
  }

  directoryMap.get(directoryName).push({
    name: fileName,
    path,
  });
}

const collator = new Intl.Collator("zh-CN", { numeric: true, sensitivity: "base" });
const directories = [...directoryMap.entries()]
  .map(([name, files]) => ({
    name,
    files: files.sort((left, right) => collator.compare(left.path, right.path)),
  }))
  .sort((left, right) => collator.compare(left.name, right.name));

const catalog = {
  commit: execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  }).trim(),
  courseCount: directories.filter((directory) => !nonCourseRoots.has(directory.name)).length,
  directories,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

const fileCount = directories.reduce((sum, directory) => sum + directory.files.length, 0);
process.stdout.write(`Generated ${directories.length} directories and ${fileCount} files.\n`);
