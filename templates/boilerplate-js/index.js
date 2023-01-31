import {
  Spider,
  Project,
  HtmlTools
} from 'spidergram';

await Project.config();

const args = process.argv.slice(2);

if (args.length == 0) {
  console.log('One or more target URLs must be entered.');
}

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

console.log(await spider.run(args));
