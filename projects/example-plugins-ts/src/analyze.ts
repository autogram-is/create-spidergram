import { Project, Resource, GraphWorker, GraphWorkerTask, aql, HtmlTools, TextTools } from "spidergram";

export async function analyzeCrawl() {
  const project = await Project.config();
  const graph = await project.graph();

  const analyzer: GraphWorkerTask<Resource> = async (page) => {
    const html = page.body ?? '';
    const text = HtmlTools.getPlainText(html);
    const bodyAttributes = HtmlTools.getBodyAttributes(html);

    page.data = HtmlTools.getMetadata(html);
    page.content = {
      text: text,
      id: bodyAttributes.id,
      classes: bodyAttributes.classes,
      readability: TextTools.calculateReadability(text)
    }
    graph.push(page);
  }

  const worker = new GraphWorker<Resource>({
    collection: 'resources',
    filter: aql`FILTER item.code == 200 && item.mime == "text/html" && item.body != null`,
    task: analyzer,
  });

  console.log(await worker.run());
}