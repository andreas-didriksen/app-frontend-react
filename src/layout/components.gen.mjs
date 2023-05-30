import fs from 'node:fs';
import path from 'node:path';

const components = {};

fs.readdirSync('src/layout').forEach((item) => {
  try {
    const stat = fs.statSync(path.join('src/layout', item));
    if (stat.isDirectory()) {
      if (item === 'Address') {
        // Address is a special case, because we once named it 'AddressComponent', without any over the other components
        // having that suffix. We need to keep this for backwards compatibility, but our folder structure uses the name
        // without the suffix.
        components[item] = 'AddressComponent';
        return;
      }

      components[item] = item;
    }
  } catch (e) {}
});

const lines = [
  '// This file is generated by running src/layout/components.gen.ts',
  '',
  ...Object.keys(components).map((key) => `import { Config as ${key}Config } from 'src/layout/${key}/index';`),
  ...Object.keys(components).map((key) => `import type { TypeConfig as ${key}TypeConfig } from 'src/layout/${key}/index';`),
  '',
  `export const ComponentConfigs = {`,
  ...Object.keys(components).map((key) => `  ${components[key]}: ${key}Config,`),
  `};`,
  '',
  `export type ComponentTypeConfigs = {`,
  ...Object.keys(components).map((key) => `  ${components[key]}: ${key}TypeConfig;`),
  `};`,
  '',
];

try {
  const fd = fs.openSync('src/layout/components.ts', 'r+');
  const content = fs.readFileSync(fd, 'utf-8').toString();
  if (content !== lines.join('\n')) {
    console.log('Regenerated src/layout/components.ts');
    fs.ftruncateSync(fd, 0);
    fs.writeSync(fd, lines.join('\n'), 0, 'utf-8');
  }
} catch (e) {
  // File does not exist
  const fd = fs.openSync('src/layout/components.ts', 'w');
  console.log('Created src/layout/components.ts');
  fs.writeFileSync(fd, lines.join('\n'));
}