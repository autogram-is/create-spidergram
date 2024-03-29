import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import inquirer from 'inquirer';
import { readJsonSync, writeJsonSync, copySync, removeSync } from 'fs-extra/esm';
import { readdir } from 'node:fs';

var template;
var skipPrompts;
var projectName;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--template')) template = arg.split('=')[1];
  if (arg.startsWith('-y')) skipPrompts = true;
  else projectName = arg;
}

template ??= 'boilerplate-ts';
projectName ??= 'my-spider';

try {
  if (skipPrompts) {
    clone(projectName, template)
  } else {
    const answers = await setup();
    clone(answers.name, answers.template);
  }
} catch(err) {
  console.log(`ERROR: ${err.message}`);
}

async function setup() {
  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Project name',
      default: projectName
    },
    {
      type: 'list',
      name: 'template',
      message: 'Project template',
      choices: [
        { name: 'Boilerplate project' , value: 'boilerplate-js' },
        { name: 'Boilerplate project (Typescript)' , value: 'boilerplate-ts' },
        { name: 'Crawl with report (Typescript)' , value: 'report-ts' },
        { name: 'JSON config', value: 'config-json' },
        { name: 'YAML config', value: 'config-yaml' },
      ],
      default: template
    }
  ];
  
  return inquirer.prompt(questions);
}

function clone(name, template) {
  // Can't be too safe.
  const ignore = ['.DS_Store', 'storage', 'node_modules', 'dist'];
  const templateDir = path.join(__dirname, 'templates', template);
  const targetDir = process.cwd();

  readdir(targetDir, (err, files) => {
    if (err || files.length > 0) {
      console.log(files);
      throw new Error('Directory is not empty!');
    }
    copySync(templateDir, targetDir, { overwrite: true });
    const pkg = readJsonSync(path.join(targetDir, 'package.json'));
    pkg.name = name;
    writeJsonSync(path.join(targetDir, 'package.json'), pkg, { spaces: 2 });
    for (const file of ignore) {
      removeSync(path.join(targetDir, file));
    }
  });
}