import { Spider, HtmlTools, TextTools } from "spidergram";

export async function crawl(urls: string[] = []) {
  const spider = new Spider({
    async pageHandler(context) {
      const { page, saveResource, enqueueUrls } = context;

      const body = await page.content();
      const bodyAttributes = HtmlTools.getBodyAttributes(body);
      const text = HtmlTools.getPlainText(body);
      const metadata = HtmlTools.getMetadata(body);

      const content = {
        text: text,
        id: bodyAttributes.id,
        classes: bodyAttributes.classes,
        readability: TextTools.calculateReadability(text)
      }
  
      await saveResource({ metadata, body, content });
      await enqueueUrls();
    },
  });

  await spider.run(urls).then(summary => console.log(summary));
}