const conventionalTitle = /^(feat|fix|perf|docs|refactor|test|build|ci|chore|style|revert)(\([a-z0-9._/-]+\))?(!)?: .+/;

export function isConventionalTitle(title) {
  return conventionalTitle.test(title.trim());
}

export function bumpForTitle(title) {
  const match = title.trim().match(conventionalTitle);
  if (!match) throw new Error(`Not a Conventional Commit title: ${title}`);
  if (match[3]) return "major";
  if (match[1] === "feat") return "minor";
  return "patch";
}

export function nextVersion(version, bump) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) throw new Error(`Invalid semantic version: ${version}`);
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [title, version] = process.argv.slice(2);
  process.stdout.write(nextVersion(version, bumpForTitle(title)));
}
