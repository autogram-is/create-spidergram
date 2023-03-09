import {
  Spidergram,
  Query,
  WorkerQuery,
  Resource,
  aql,
  HtmlTools
} from "spidergram";

export async function findContent(reset = false) {
  const sg = await Spidergram.load();

  // The Query class allows us to execute arbitrary queries against
  // the database — here, we're just clearing any previously extracted
  // content if the 'reset' flag was passed in.
  if (reset) await Query.run(aql`
    FOR r IN resources
    UPDATE r WITH { content: null } IN resources
    OPTIONS { keepNull: false }
  `);

  // GraphWorker allows us to iterate over the items in one of the 
  // stored data collections, run a 'worker' function on each item.
  const worker = new WorkerQuery<Resource>('resources')
    .filterBy('code', 200)
    .filterBy('mime', 'text/html')
    .filterBy('body');
  
  worker.on('progress', status => sg.cli.progress(status) );
  worker.on('end', status => {
    sg.cli.done();
    console.log(sg.cli.summarizeStatus(status));
  });
  
  return worker.run(async resource => {
    // getCheerio() is a convenience wrapper around the Cheerio library;
    // it allows jQuery-style DOM queries for simple text and markup extraction.
    const $ = HtmlTools.getCheerio(resource);

    resource.content = {
      // Generate a plaintext version of the page content and calculate its readability
      // score. If no selectors are passed in, 'body' is used as the default.
      ...await HtmlTools.getPageContent($, { selector: ['article', 'main', 'div.content', 'body'] }),

      // Custom cheerio selectors are often handy here, too.
      headline: $('h1').first().text().trim(),

      // Populate other content properties with structured data parsed during the crawl
      title: resource.get('data.meta.og.title') ?? resource.get('data.title'),
      type: resource.get('data.meta.og.type', 'unknown'),
      description: resource.get('data.meta.og.description') ?? resource.get('data.meta.description'),
      published: resource.get('data.meta.og.article.published_time'),
      author: resource.get('data.meta.og.article.author'),
      tags: resource.get('data.meta.og.article:tags'),
    };

    await sg.arango.push(resource);
    return Promise.resolve();
  });
}