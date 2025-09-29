#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ELECTRON_DIR = path.join(__dirname, '../src/electron');
const PRELOADS_DIR = path.join(ELECTRON_DIR, 'preloads');
const PRELOAD_TEMPLATE = path.join(ELECTRON_DIR, 'preload.template.ts');
const PRELOAD_OUTPUT = path.join(ELECTRON_DIR, 'preload.ts');

// Find all preload API files in the preloads directory
const apiFiles = fs.existsSync(PRELOADS_DIR)
  ? fs.readdirSync(PRELOADS_DIR)
      .filter(file =>
        file.startsWith('preload.') &&
        file.endsWith('.ts') &&
        !file.includes('.test.') &&
        !file.includes('.spec.')
      )
      .map(file => path.join(PRELOADS_DIR, file))
  : [];

console.log('Found API files:', apiFiles.map(f => path.basename(f)));

// Extract exports from each API file
let combinedTypes = '';
let combinedApis = '';
let apiSpreads = [];

apiFiles.forEach(apiFile => {
  const content = fs.readFileSync(apiFile, 'utf8');

  // Extract interfaces and types (everything before the export const)
  const typeMatch = content.match(/^(.*?)(?=export const)/s);
  if (typeMatch) {
    combinedTypes += typeMatch[1].replace(/^import.*?;\s*/gm, '') + '\n';
  }

  // Extract the API object name
  const apiMatch = content.match(/export const (\w+) = \{/);
  if (apiMatch) {
    const apiName = apiMatch[1];

    // Extract the full API object definition
    const apiObjMatch = content.match(new RegExp(`export const ${apiName} = (\\{[\\s\\S]*?\\});`, 'm'));
    if (apiObjMatch) {
      combinedApis += `const ${apiName} = ${apiObjMatch[1]};\n\n`;
      apiSpreads.push(`...${apiName}`);
    }
  }
});

// Read the template file
const template = fs.readFileSync(PRELOAD_TEMPLATE, 'utf8');

// Replace placeholders in template
const output = template
  .replace('// {{GENERATED_TYPES}}', combinedTypes.trim())
  .replace('// {{GENERATED_APIS}}', combinedApis.trim())
  .replace('{{API_SPREADS}}', apiSpreads.join(',\n  '));

// Write the generated preload.ts
fs.writeFileSync(PRELOAD_OUTPUT, output);

console.log(`Generated ${PRELOAD_OUTPUT} with ${apiFiles.length} API modules`);