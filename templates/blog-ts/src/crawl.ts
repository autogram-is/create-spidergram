import {
  Spider,
  HtmlTools,
} from 'spidergram';

export async function crawl(urls: string[]) {
  // The options object passed into the spider can control almost every
  // aspect of the crawl, including the functions that process each found
  // page.
  const spider = new Spider({
    logLevel: 0,
    maxConcurrency: 4,
    maxRequestsPerMinute: 180,
    async pageHandler(context) {
      const { page, saveResource, enqueueUrls } = context;

      const body = await page.content();
      const data = HtmlTools.getPageData(body);
      await saveResource({ body, data });
      
      // Breaking up the 'enqueueUrls' call with separate selectors allows us
      // to label the links with the section of the page they were found in.
      await enqueueUrls({ selector: 'main a', linkLabel: 'content' });
      await enqueueUrls({ selector: 'header.mast a', linkLabel: 'nav', discardExistingLinks: false });
      await enqueueUrls({ selector: 'footer a', linkLabel: 'footer', discardExistingLinks: false });
      await enqueueUrls({ selector: ':not(footer, main, header.mast) a', linkLabel: 'other', discardExistingLinks: false });
    },
  });

  spider.on('requestComplete', (status, url) => 
    console.log(`[${status.finished} of ${status.total}] - ${url}`)
  );

  return spider.run(urls);
}

