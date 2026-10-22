// Builds the site for GitHub Pages and publishes dist/ to the gh-pages branch.
// Usage: npm run deploy   (needs push access to the repository's origin remote)
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });
const repoName = process.env.PAGES_REPO ?? 'buildwithai';
const remote = execSync('git remote get-url origin').toString().trim();
const commit = execSync('git rev-parse --short HEAD').toString().trim();

run('npm run build', { env: { ...process.env, BASE: `/${repoName}/` } });

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tipoff-pages-'));
fs.cpSync('dist', tmp, { recursive: true });
fs.writeFileSync(path.join(tmp, '.nojekyll'), '');
// Source maps are useful for reviewers reading the code but not needed by the page.
const git = (cmd) => run(`git ${cmd}`, { cwd: tmp });
git('init -q -b gh-pages');
git('add -A');
git(`-c user.name="Tipoff deploy" -c user.email="noreply@users.noreply.github.com" commit -q -m "Deploy ${commit}"`);
git(`push -f ${remote} gh-pages`);
console.log(`Published ${commit} to gh-pages. Site: https://<owner>.github.io/${repoName}/`);
