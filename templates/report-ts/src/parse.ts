import {
  Project,
  Query,
  GraphWorker,
  Resource,
  aql,
  HtmlTools
} from "spidergram";

export async function findContent(reset = false) {
  const config = await Project.config();
  const graph = await config.graph();

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
  const worker = new GraphWorker<Resource>({
    // Crawled pages are stored in Spidergram's "resources" collection;
    // ArangoDB query snippets can be used to exclude specific items, like
    // 404 errors and non-HTML pages.
    collection: 'resources',
    filter: aql`FILTER item.code == 200 AND item.mime == 'text/html' AND item.body != null`,
    task: async resource => {

      // getCheerio() is a convenience wrapper around the Cheerio library;
      // it allows jQuery-style DOM queries for simple text and markup extraction.
      const $ = HtmlTools.getCheerio(resource);

      resource.content = {
        // Generate a plaintext version of the page content and calculate its readability
        // score. If no selectors are passed in, 'body' is used as the default.
        ...HtmlTools.getPageContent($, { selector: ['article', 'main', 'div.content', 'body'] }),

        // Custom cheerio selectors are often handy here, too.
        headline: $('h1').first().text().trim(),

        // Populate other content properties with structured data parsed during the crawl
        title: resource.get('data.meta.og.title') ?? resource.get('data.title') ?? undefined,
        type: resource.get('data.meta.og.type') ?? 'Unknown',
        description: resource.get('data.meta.og.description') ?? resource.get('data.meta.description') ?? undefined,
        published: resource.get('data.meta.og.article:published_time') ?? undefined,
        author: resource.get('data.meta.og.article.author') ?? undefined,
        tags: resource.get('data.meta.og.article:tags') ?? undefined,
      };

      await graph.push(resource);
    },
  });

  return worker.run();
}