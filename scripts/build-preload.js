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

    // Extract the full API object definition by counting braces
    const startIndex = content.indexOf(`export const ${apiName} = {`);
    if (startIndex !== -1) {
      let braceCount = 0;
      let inString = false;
      let stringChar = '';
      let i = startIndex + `export const ${apiName} = `.length;

      for (; i < content.length; i++) {
        const char = content[i];
        const prevChar = i > 0 ? content[i - 1] : '';

        // Handle string literals
        if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
          if (!inString) {
            inString = true;
            stringChar = char;
          } else if (char === stringChar) {
            inString = false;
            stringChar = '';
          }
        }

        if (!inString) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
          if (braceCount === 0 && char === '}') {
            const objContent = content.substring(startIndex + `export const ${apiName} = `.length, i + 1);
            combinedApis += `const ${apiName} = ${objContent};\n\n`;
            apiSpreads.push(`...${apiName}`);
            break;
          }
        }
      }
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