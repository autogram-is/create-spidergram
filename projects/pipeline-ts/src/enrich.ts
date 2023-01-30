import { Project, GraphWorker, Resource, Query, aql, HtmlTools } from "spidergram";

await findPageContent();

export async function findPageContent(reset = false) {
  const config = await Project.config();
  const graph = await config.graph();

  // The Query class allows us to execute arbitrary AQL
  // queries against the Arango database — here, we're just clearing
  // out all of the old content if the 'reset' flag was passed in.
  if (reset) await Query.run(aql`
    FOR r IN resources
    UPDATE r WITH { content: null } IN resources
    OPTIONS { keepNull: false }
  `);

  // GraphWorker allows you to iterate over the items one of the 
  // stored data collections and run a 'worker' function on each one.
  const worker = new GraphWorker<Resource>({
    collection: 'resources',
    filter: aql`FILTER item.code == 200 AND item.mime == 'text/html'`,
    task: async resource => {
      if (resource.body !== undefined) {

        // getCheerio() is a convenience wrapper around the Cheerio library;
        // it allows jQuery-style DOM queries for simple text and markup extraction..
        const $ = HtmlTools.getCheerio(resource);

        resource.content = {
          // Spidergram's built-in getPageContent() function generates a
          // plaintext copy of the page's content, then calculates its
          // readability score. Passing in a configuration object with CSS
          // selectors to zero in on the page's most important content can
          // improve the quality of the readability data.
          ...HtmlTools.getPageContent($),

          // The `resource.get()` method allows deeply nested properties to be
          // retrieved blindly; if they don't exist, the method returns 'undefined.'
          // Here, we use it to pull out select OpenGraph properties if they exist,
          // and fall back to standard HTML tags and metadata when possible.
          title: resource.get('data.meta.og.title') ?? resource.get('data.title') ?? undefined,
          type: resource.get('data.meta.og.type') ?? 'Unknown',
          description: resource.get('data.meta.og.description') ?? resource.get('data.meta.description') ?? undefined,
          published: resource.get('data.meta.og.article:published_time') ?? undefined,
          author: resource.get('data.meta.og.article.author') ?? undefined,
          tags: resource.get('data.meta.og.article:tags') ?? undefined,

          // Custom Cheerio selectors — or third-party tools and frameworks — 
          // can be used to pull data as needed.
          headline: $('h1').first().text(),
        };

        await graph.push(resource);
      }
    },
  });

  return worker.run();
}