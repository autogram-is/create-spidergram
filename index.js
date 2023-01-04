
import { join } from 'node:path';

const args = process.argv.slice(2);
const template = args[0];

const workingDirectory = process.cwd();
const templateDirectory = join(__dirname, 'projects');

console.log(template);
console.log(workingDirectory);
console.log(templateDirectory);
