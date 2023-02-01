import {
  Project,
  Query,
  aql,
  getPropertySummary,
  HierarchyTools,
  Spreadsheet,
  AggregateFunction
} from "spidergram";

export async function generateReports() {
  const results: string[] = [];
  const project = await Project.config();

  // First, we use the 'getPropertySummary' helper function to generate an ArangoDB
  // query summarizing the pages we crawled. We can pass the resulting query definition
  // to the Query class to get back a simple row/column result set. We'll use this
  // summary later when we export a spreadsheet.
  const query = getPropertySummary('resources', {
    groupBy: [
      'code',
      'mime',
      { label: 'template', property: 'content.template' },
    ],
    properties: [
      { label: 'avgScore', property: 'content.readability.score', function: AggregateFunction.avg, numeric: true },
      { label: 'avgWords', property: 'content.readability.words', function: AggregateFunction.avg, numeric: true },
    ],
    includeTotal: true
  });
  const summary = await Query.run<Record<string, string | number>>(query);

  // Next we'll write an ArangoDB query from scratch to gather full information
  // on each page. In the future we'll be able to use syntax similar to the 
  // summary query, but for now it requires hand-writing the query.
  type pageData = Record<string, string | number> & { url: string };
  const pages = await Query.run<pageData>(aql`
    FOR r IN resources
    RETURN {
      url: r.url,
      status: r.code,
      message: r.message,
      mime: r.mime,
      size: r.size,
      template: r.content.template,
      section: r.content.section,
      title: r.content.title,
      description: r.content.description,
      published: r.content.published,
      words: r.content.readability.words,
      sentences: r.content.readability.sentences,
      readability: r.content.readability.score,
      tags: r.content.tags ? LENGTH(r.content.tags) : null,
      posts: r.content.tagged ? LENGTH(r.content.tagged) : null,
    }
  `);

  // Now we'll generate a spreadsheet from the results of the two queries
  // and write it out to the 'output' storage bin.
  const report = new Spreadsheet();
  report.addSheet(summary, 'Overview');
  report.addSheet(pages, 'Pages');
  await project.files('output').write('report.xlsx', report.toBuffer());

  results.push('Saved ./storage/output/report.xlsx');

  // UrlHierarchyBuilder takes an array of URLs — or an array of objects
  // with 'url' properties — and builds a hierarchical tree from their paths.
  //
  // We'll reuse the list of pages generated from our query above, since every
  // one has a URL, then output a nicely formatted tree view of the site.
  const hierarchy = new HierarchyTools.UrlHierarchyBuilder({ gaps: 'bridge', subdomains: 'children' }).add(pages);

  // Finally, we'll loop over all of the root URLs found in the hierarchy and
  // save tree outlines to text files for each one.
  for (const root of hierarchy.findRoots()) {
    const fileName = `${root.name}-treeview.txt`;
    await project.files('output').write(
      fileName,
      Buffer.from(root.render({ preset: 'expand' }))
    );
    results.push(`Saved ./storage/output/${fileName}`)
  }

  // Return the list of files that were saved, and call it a day.
  return Promise.resolve(results);
}