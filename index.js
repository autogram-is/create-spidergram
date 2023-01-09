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
        { name: 'Simple crawler' , value: 'boilerplate' },
        { name: 'Simple crawler (Typescript)' , value: 'boilerplate-ts' },
        { name: 'Custom report example (Typescript)' , value: 'report-ts' }
      ],
      default: template
    }
  ];
  
  return inquirer.prompt(questions);
}

function clone(name, template) {
  const ignore = ['./DS_Store', 'node_modules', 'dist'];
  const templateDir = path.join(__dirname, 'projects', template);
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