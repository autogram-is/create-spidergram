import { Spider } from "spidergram";

export async function crawlPages(urls: string[] = []) {
  const spider = new Spider({
    async pageHandler(context) {
      const {page, saveResource, enqueueUrls} = context;
      await saveResource({ body: await page.content() });
      await enqueueUrls();  
    },
  });

  await spider.run(urls).then(summary => console.log(summary));
}