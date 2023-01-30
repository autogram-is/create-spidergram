import {
  Spider,
  Project,
  HtmlTools,
  Query,
  aql,
  HierarchyTools
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

const urls = await Query.run(aql`
  FOR r IN resources
  FILTER r.code == 200
  RETURN r.url
`);

const hierarchy = new HierarchyTools.UrlHierarchyBuilder().add(urls);
console.log(hierarchy.findLargestRoot()?.render());