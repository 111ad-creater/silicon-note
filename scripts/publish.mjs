import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LOG_PATH = path.join(ROOT, '.publish-log.txt');

function runCapture(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function runInherit(cmd, args, useShell = false) {
  const res = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: useShell });
  return res.status ?? 1;
}

function askYesNo(promptText) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(promptText, (ans) => {
      rl.close();
      resolve(ans.trim().toLowerCase() === 'y');
    });
  });
}

function formatNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const dryRun = rawArgs.includes('--dry-run');
  const msgArg = rawArgs.filter((a) => a !== '--dry-run').join(' ').trim();
  const commitMsg = msgArg || 'chore: 更新站点内容';

  console.log('');
  console.log('===== SiliconNote 一键发布 =====');
  console.log(`  提交信息: ${commitMsg}`);
  console.log('');

  const now = formatNow();
  const month = now.slice(0, 7);
  let monthCount = 0;
  if (fs.existsSync(LOG_PATH)) {
    const lines = fs.readFileSync(LOG_PATH, 'utf8').split(/\r?\n/);
    monthCount = lines.filter((l) => l.startsWith(month)).length;
  }

  const porcelain = runCapture('git status --porcelain');
  const hasChanges = porcelain.length > 0;

  let aheadCount = 0;
  try {
    aheadCount = Number.parseInt(runCapture('git rev-list --count origin/main..HEAD'), 10) || 0;
  } catch {
    aheadCount = 0;
  }

  let unpushedNonDataCommits = 0;
  try {
    const lastNetlifySha = runCapture('git log -n 1 --grep="\\[skip netlify\\]" --invert-grep --format=%H');
    if (lastNetlifySha) {
      const changedSinceDeploy = runCapture(`git diff --name-only ${lastNetlifySha}..HEAD -- ":!public/data/"`);
      if (changedSinceDeploy.length > 0) {
        unpushedNonDataCommits = Number.parseInt(runCapture(`git rev-list --count ${lastNetlifySha}..HEAD`), 10) || 0;
      }
    }
  } catch {
    unpushedNonDataCommits = 0;
  }

  const willDeploy = hasChanges || aheadCount > 0;

  if (!willDeploy && unpushedNonDataCommits === 0) {
    console.log('  [护栏] 没有未提交改动，也没有待推送的代码提交，本次不会产生部署（不消耗额度）。');
    console.log('         只想本地看效果的话：npm run preview');
    console.log('');
    return;
  }

  const nextNo = monthCount + 1;
  console.log(`  [护栏] ${month} 已发布 ${monthCount} 次，本次是第 ${nextNo} 次。`);
  console.log('         每次推送 = 一次生产部署 = 15 信用点（免费额度 300 点/月）。');
  console.log('         建议每月不超过 10 次，攒批发布最省。');
  console.log('');

  if (!willDeploy && unpushedNonDataCommits > 0) {
    console.log(`  [提示] 检测到 GitHub 远端已有 ${unpushedNonDataCommits} 个带 [skip netlify] 的代码提交尚未部署到 Netlify 线上。`);
    const goDeploy = await askYesNo('         是否创建一次触发提交以更新线上站点 https://silicon-note.netlify.app ？(y/N) ');
    if (!goDeploy) {
      console.log('\n[已取消] 未触发部署，线上与额度均无变化。\n');
      return;
    }
    const emptyCode = runInherit('git', ['commit', '--allow-empty', '-m', commitMsg]);
    if (emptyCode !== 0) {
      console.error('\n[错误] 创建触发提交失败。');
      process.exit(1);
    }
  } else if (nextNo >= 11) {
    const ok = await askYesNo('          本月已超过建议次数（10 次），仍要发布吗？(y/N) ');
    if (!ok) {
      console.log('\n[已取消] 未推送，线上和额度均无变化。\n');
      return;
    }
    console.log('');
  }

  if (dryRun) {
    console.log(`[dry-run] 校验通过：hasChanges=${hasChanges}, ahead=${aheadCount}, undeployedSkipCommits=${unpushedNonDataCommits}`);
    return;
  }

  if (hasChanges) {
    console.log('[1/4] 发现改动，开始构建 ...');
    const npmCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
    const buildCode = fs.existsSync(npmCli)
      ? runInherit(process.execPath, [npmCli, 'run', 'build'])
      : runInherit(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], process.platform === 'win32');
    if (buildCode !== 0) {
      console.error('\n[错误] 构建失败，已中止发布。网站会保持上一个正常版本。\n');
      process.exit(1);
    }

    console.log('[2/4] 提交改动 ...');
    if (runInherit('git', ['add', '-A']) !== 0 || runInherit('git', ['commit', '-m', commitMsg]) !== 0) {
      console.error('\n[错误] git 提交失败。\n');
      process.exit(1);
    }
  } else if (willDeploy) {
    console.log('[1/4] 没有未提交改动，跳过构建和提交。');
  }

  console.log('[3/4] 推送到 GitHub ...');
  if (runInherit('git', ['push', 'origin', 'main']) !== 0) {
    console.error('\n[错误] 推送失败，请检查网络或凭据。\n');
    process.exit(1);
  }

  fs.appendFileSync(LOG_PATH, `${now}  ${commitMsg}\n`, 'utf8');

  console.log(`[4/4] 完成。本月第 ${nextNo} 次发布。\n`);
  console.log('  网站约 30 秒后自动更新：');
  console.log('  https://silicon-note.netlify.app\n');
  console.log('  部署进度：');
  console.log('  https://github.com/111ad-creater/silicon-note/actions\n');
  console.log('  提示：本月建议不超过 10 次，下次要发前先看看还有没有别的改动可以一起带上。\n');
}

main().catch((err) => {
  console.error('[错误]', err?.message || err);
  process.exit(1);
});
