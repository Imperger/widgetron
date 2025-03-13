import * as fs from 'fs/promises';
import * as path from 'path';

type ManifestV3 = chrome.runtime.ManifestV3;

interface ContentScriptEntries {
  css: string[];
  js: string[];
}

async function Clear() {
  if (path.basename(import.meta.dirname) !== 'dist') {
    throw new Error('Packer script located not in a dist folder');
  }

  for (const basename of await fs.readdir(import.meta.dirname)) {
    const fullPath = path.join(import.meta.dirname, basename);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      await fs.rm(fullPath, { recursive: true, force: true });
    } else if (stat.isFile() && basename !== path.basename(import.meta.filename)) {
      await fs.rm(fullPath, { force: true });
    }
  }
}

async function CopyClientContent() {
  await fs.cp('../dist-client', 'client', { recursive: true });
}

async function FindContentScriptEntries(): Promise<ContentScriptEntries> {
  const result: ContentScriptEntries = { js: [], css: [] };

  const assetRelative = 'client/assets';
  for (const basename of await fs.readdir(assetRelative)) {
    const fullPath = path.join(import.meta.dirname, assetRelative, basename);
    const stat = await fs.stat(fullPath);

    if (!stat.isFile()) {
      continue;
    }

    const relativePath = path.relative(import.meta.dirname, fullPath);
    switch (path.extname(basename)) {
      case '.js':
        result.js.push(relativePath);
        break;
      case '.css':
        result.css.push(relativePath);
        break;
    }
  }

  return result;
}

async function GenerateManifest(entries: ContentScriptEntries) {
  const filename = 'manifest.json';
  const template: ManifestV3 = JSON.parse(
    await fs.readFile(path.join('..', filename), { encoding: 'utf8' }),
  );

  if (!template.content_scripts || template.content_scripts?.length === 0) {
    throw new Error('At least one content script entry is required');
  }

  if (entries.js.length > 0) {
    const contentScript = template.content_scripts[0];
    if (contentScript.js === undefined) {
      contentScript.js = [];
    }

    entries.js.forEach((x) => contentScript.js?.push(x));
  }

  if (entries.css.length > 0) {
    const contentScript = template.content_scripts[0];
    if (contentScript.css === undefined) {
      contentScript.css = [];
    }

    entries.css.forEach((x) => contentScript.css?.push(x));
  }

  fs.writeFile(filename, JSON.stringify(template));
}

(async function Main() {
  await Clear();
  await CopyClientContent();
  const entries = await FindContentScriptEntries();
  await GenerateManifest(entries);
})().catch((e) => console.error(e));
