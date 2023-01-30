import { Spider } from "spidergram";

if (process.argv.slice(2).length == 0) {
  console.log('No URLs given.');
  process.exit(1);
} else {
  await runCrawl(process.argv.slice(2));
}

export async function runCrawl(urls: string[] = []) {
  const spider = new Spider({
    // These control how many copies of Headless Chrome will be spun up,
    // and how much traffic they should be allowed to generate.
    maxConcurrency: 4,
    maxRequestsPerMinute: 180,

    // Spidergram's default Page Handler saves the page and its body already,
    // but passing in a handler explicitly allows for customization -- taking
    // screenshots, executing custom JS snippets, etc.
    async pageHandler(context) {
      const { page, saveResource, enqueueUrls } = context;

      // saveResource() persists a copy of the page response data, but
      // it's up to us to pass in the other data that we care about.
      // The HtmlTools.getPageData() helper function parses out structured
      // data like meta tags and Schema.org LD-JSON information.
      await saveResource({
        body: await page.content(),
      });
      
      // enqueueUrls() searches for links on the page, normalizes them, saves
      // them to the database, and — if they match the Spider's criteria —
      // enqueues them for crawling. By default, enqueueUrls saves everything
      // but only *enqueues* URLs in the same TLD as the current page.
      await enqueueUrls();
    },
  });

  return(await spider.run(urls));
}
