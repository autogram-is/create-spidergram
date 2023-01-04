import { Project, Spreadsheet } from 'spidergram';
import { crawlPages } from './crawl.js';
import { analyzeCrawl} from './analyze.js';
import { getCrawlSummary } from './crawl-summary-query.js';
import { GroupedBarChart } from './grouped-bar-chart.js';
import process from 'node:process';

const args = process.argv.slice(2);
let urls: string[] = [];

if (args.length == 0) {
  console.log('One or more target URLs must be entered.');
}

// Set up global context to use later
const project = await Project.config();

// Trigger the crawl itself
await crawlPages(urls);

// Pull a summary of HTTP responses we received
const data = await getCrawlSummary();

// Output a spreadsheet with pages, downloads, and errors for each host crawled
const report = new Spreadsheet();
report.addSheet(data, 'Overview');
await project.files('output').write('report.xlsx', report.generate());

// Generate a grouped bar chart showing the same data
const chart = new GroupedBarChart(data, 'site', 'Responses', ['pages', 'downloads', 'errors'])
chart.render().then(svg => project.files('output').write('report.svg', svg));

// Post-process the pages we crawled for more detailed analysis
await analyzeCrawl();

console.log('Complete!');