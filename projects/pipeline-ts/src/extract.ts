import { GraphWorker, aql, HtmlTools, Resource, Project, Query } from "spidergram";

await parsePageData();

export async function parsePageData(reset = false) {
  const config = await Project.config();
  const graph = await config.graph();

  // The Query class allows us to execute arbitrary AQL
  // queries against the Arango database — here, we're just clearing
  // out all of the old data if the 'reset' flag was passed in.
  if (reset) await Query.run(aql`
    FOR r IN resources
    UPDATE r WITH { data: null } IN resources
    OPTIONS { keepNull: false }
  `);

  // GraphWorker allows you to iterate over the items in one of the 
  // stored data collections and run a 'worker' function on each item.
  // It handles the grunt work of managing Arango's cursors and batched
  // queries to avoid timeouts when running on large pools of items.
  const worker = new GraphWorker<Resource>({
    collection: 'resources',
    filter: aql`FILTER item.code == 200 AND item.mime == 'text/html'`,

    task: async resource => {
      if (resource.body !== undefined) {
        // All we're doing right now is calling the 'getPageData()' function to
        // parse and extract standard meta tags, OpenGraph data, and so on.
        const data = HtmlTools.getPageData(resource);

        // It's up to us to save the results, generate new output files,
        // or whatever else we need to accomplish.
        if (data) {
          resource.data = data;
          await graph.push(resource);
        }
      }
    },
  });

  return worker.run();
}
