import { Project } from 'spidergram';
import { crawl } from './crawl.js';
import { findContent } from './content.js';
import { generateReports } from './report.js';
import { generateVizData } from './visualize.js';

// Load the global configuration, including default URL normalizer
// and database connection credentials, from a `./spidergram.json`
// file if it exists.
await Project.config();

const urls = ['https://ethanmarcotte.com'];

console.log('Crawling pages…')
console.log(await crawl(urls));

console.log('Parsing page content…')
console.log(await findContent(true));

console.log('Generating reports…')
console.log(await generateReports());

console.log('Generating visualization data…')
console.log(await generateVizData());