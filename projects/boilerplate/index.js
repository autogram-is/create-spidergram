import { Project, Spider } from 'spidergram';

await Project.config();

const args = process.argv.slice(2);

if (args.length == 0) {
  console.log('One or more target URLs must be entered.');
}

await new Spider().run(args);
