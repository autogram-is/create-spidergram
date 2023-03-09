import {
  Spidergram,
  Spider,
  HtmlTools
} from 'spidergram';

const args = process.argv.slice(2);

if (args.length == 0) {
  console.log('One or more target URLs must be entered.');
}

const sg = await Spidergram.load();
const spider = new Spider({
  maxConcurrency: 4,
  maxRequestsPerMinute: 180,
  async pageHandler(context) {
    const { page, saveResource, enqueueUrls } = context;

    const body = await page.content();
    const data = HtmlTools.getPageData(body);
    const content = HtmlTools.getPageContent(body);
    await saveResource({ body, data, content });
    
    await enqueueUrls();
  },
});

spider.on('requestComplete', status => sg.cli.progress(status) );
spider.on('crawlComplete', status => {
  sg.cli.done();
  console.log(sg.cli.summarizeStatus(status));
});

await spider.run(args);