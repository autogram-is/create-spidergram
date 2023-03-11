import {
  Spidergram,
  Spider,
  HtmlTools,
  UrlMatchStrategy,
} from 'spidergram';

export async function crawl(urls: string[]) {
  const sg = await Spidergram.load();

  // The options object passed into the spider can control almost every
  // aspect of the crawl, including the functions that process each found
  // page.
  const spider = new Spider({
    logLevel: 0,
    maxConcurrency: 4,
    maxRequestsPerMinute: 180,
    async pageHandler(context) {

      // The context object contains information about the current
      // page request, and context-aware helper functions for common
      // tasks like saving a record of the current page and finding
      // more links to crawl.
      const { page, saveResource, enqueueUrls } = context;

      // The 'page' object we're using here is a live reference to the
      // headless browser we use for the crawl. We're only grabbing the
      // page content right now, but other tasks — running custom JS,
      // taking screenshots, etc — can all be done here.
      const body = await page.content();
      const data = await HtmlTools.getPageData(body);
      await saveResource({ body, data });
      
      // The enqueueUrls helper function scans the current page for links,
      // saving and enqueueing them according to configurable rules.
      // By default, it saves all found URLs for reference, but only
      // crawls URLs from the same domain as the page they were found on.
      await enqueueUrls({
        save: UrlMatchStrategy.All,
        enqueue: UrlMatchStrategy.SameDomain,
      });

    },
  });

  spider.on('progress', status => sg.cli.progress(status) );
  spider.on('end', status => {
    sg.cli.done();
    console.log(sg.cli.summarizeStatus(status));
  });
  
  return spider.run(urls);
}

