const fs = require('fs');
const os = require('os');
const path = require('path');

const { createInstallState, writeInstallState } = require('../../../scripts/lib/install-state');
const { version: repoVersion } = require('../../../package.json');
const { version: manifestVersion } = require('../../../manifests/install-modules.json');

function fixtureHomeEnv(homeDir, inheritedEnv) {
  const configHome = path.join(homeDir, '.config');
  const overrides = {
    HOME: homeDir,
    USERPROFILE: homeDir,
    CLAUDE_CONFIG_DIR: path.join(homeDir, '.claude'),
    XDG_CONFIG_HOME: configHome,
    OPENCODE_CONFIG_DIR: path.join(configHome, 'opencode'),
  };
  if (process.platform !== 'win32') {
    return { ...inheritedEnv, ...overrides };
  }

  // Windows treats differently cased environment keys as the same variable.
  const env = Object.fromEntries(
    Object.entries(inheritedEnv).filter(([key]) => !Object.hasOwn(overrides, key.toUpperCase()))
  );
  return { ...env, ...overrides };
}

function withExternalOpenCodeInstall(check) {
  const configHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-external-config-'));
  const targetRoot = path.join(configHome, 'opencode');
  const installStatePath = path.join(targetRoot, 'ecc-install-state.json');

  try {
    fs.mkdirSync(targetRoot);
    writeInstallState(installStatePath, createInstallState({
      adapter: { id: 'opencode-home', target: 'opencode', kind: 'home' },
      targetRoot,
      installStatePath,
      request: { modules: ['commands-core'] },
      resolution: { selectedModules: ['commands-core'] },
      source: { repoVersion, manifestVersion },
    }));

    check({ OPENCODE_CONFIG_DIR: targetRoot, XDG_CONFIG_HOME: configHome });
    check({ OPENCODE_CONFIG_DIR: '', XDG_CONFIG_HOME: configHome });
  } finally {
    fs.rmSync(configHome, { recursive: true, force: true });
  }
}

module.exports = { fixtureHomeEnv, withExternalOpenCodeInstall };
