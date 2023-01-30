import process from 'node:process';
import { Project } from 'spidergram';
import * as gather from './crawl.js';
import * as extract from './extract.js';
import * as enrich from './enrich.js';
import * as analyze from './analyze.js';
import * as report from './report.js';

await Project.config();

let urls :string[] = [];
if (process.argv.slice(2).length == 0) {
  console.log('One or more target URLs required.');
  process.exit(1);
} else {
  urls = process.argv.slice(2);
}

// Hand off the URLs we were given; runCrawl() sets up a new instance
// of the Spider class and kicks off a crawl. This populates the 
// UniqueUrl, RespondsWith, Resource, and LinksTo collections.
await gather.runCrawl(urls);

// Once the crawl is complete, loop over the pages that were found and
// parse out structured data in the form of meta tags, Schema.org data,
// and so on. This populates the 'data' property of each Resource.
await extract.parsePageData(true);

// With the standard data extracted, run a second round of parsing and
// extracting methods to identify meaningful pieces of each Resource.
// This populates the 'content' property with a plaintext version of
// the page, readability scoring, and common metadata like the publication
// date and author's name if they exist in the structured data.
await enrich.findPageContent(true);

// Print out a summary of the pages that were identified; this will indicate
// how effective the 'enrich' phase was at populating the content properties.
await analyze.displayOverview();

// Save a set of reports that provides more detail about each page, and
// the overall structure of the site. 
const output = await report.generateReports();
console.log(output);