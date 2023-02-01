import {
  Project,
  Query,
  GraphWorker,
  Resource,
  aql,
  HtmlTools,
} from "spidergram";

const textOptions: HtmlTools.HtmlToTextOptions = {
  baseElements: {
    selectors: [
      'div.post-content', // Writing
      'section#content',  // Other pages
    ],
    returnDomByDefault: false,
  },
  limits: { maxBaseElements: 1 },
  wordwrap: false
}

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
        title: $('header h1').first().text().trim(),
        published: $('aside.page-meta time').attr('datetime'),

        // The default data extractor grabs body classes for every page;
        // On many CMS-generated sites, they include useful metadata about
        // the template or content type used to generate the page.
        template: findPrefixedClass(resource.get('data.attributes.classes'), 'tmpl-') ?? ((resource.parsed.path[1] === 'tag') ? 'tag' : undefined),
        section: findPrefixedClass(resource.get('data.attributes.classes'), 'sect-'),

        // Grab the description from previously-parsed OpenGraph metadata
        description: resource.get('data.meta.og.description') ?? resource.get('data.meta.description') ?? undefined,
        
        // Generate a plaintext version of the page content and calculate its readability
        // score. The text conversion options we set up earlier handle the different places
        // primary content can appear on various templates.
        ...HtmlTools.getPageContent($, { htmltotext: textOptions }),

        // Custom Cheerio selectors to grab links to related articles and tagged archives
        related: undefinedIfEmpty($('article.post-related a').toArray().map(element => $(element).attr('href'))),
        tagged: undefinedIfEmpty($('ul.archive-list h2 a').toArray().map(element => $(element).attr('href')))
      };

      await graph.push(resource);
    },
  });

  const results = await worker.run();

  // This is a bit of a sneaky trick. Not the droids you're looking for, etc etc.
  await Query.run(aql`
    FOR r IN resources
    LET tags = (
      FOR tag IN resources
      FILTER r.parsed.pathname IN tag.content.tagged
      RETURN SPLIT(tag.parsed.pathname, '/')[3]
    )
    UPDATE r WITH { content: { tags } } IN resources
  `);

  return Promise.resolve(results);
}

function findPrefixedClass(input: unknown, prefix: string): string | undefined {
  if (Array.isArray(input)) {
    return input.find(cls => cls.startsWith(prefix))?.replace(prefix, '');
  } else {
    return undefined;
  }
}

function undefinedIfEmpty(input: unknown) {
  if (Array.isArray(input)) {
    if (input.length === 0) return undefined;
  }
  return input;
}