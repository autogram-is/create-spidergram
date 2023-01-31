import { crawl } from './crawl.js';
import { findContent } from './parse.js';
import { generateReports } from './report.js';

const args = process.argv.slice(2);
if (args.length == 0) {
  console.log('One or more target URLs must be entered.');
  console.log('For example: npm run crawl https://example.com');
  process.exit(1);
}

console.log('Crawling pages…')
console.log(await crawl(args));

console.log('Parsing page content…')
console.log(await findContent(true));

console.log('Generating reports…')
console.log(await generateReports());