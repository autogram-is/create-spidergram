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

  // The Query class can execute raw queries against the ArangoDB
  // database that stores crawl results. This just bundles up the URL
  // of every crawled page that returned a successful response.
  const urls = await Query.run<string>(aql`
    FOR r IN resources
    FILTER r.code == 200
    return r.url
  `);

  // UrlHierarchyBuilder takes an array of URLs and builds a hierarchical
  // tree from the path structure.
  //
  // The output can be customized by passing configuration options into
  // the UrlHierarchyBuilder constructor, or the UrlHierarchyItem.render()
  // function.
  const hierarchy = new HierarchyTools.UrlHierarchyBuilder({
    gaps: 'bridge',
    subdomains: 'children'
  }).add(urls);

  for (const root of hierarchy.findRoots()) {
    const fileName = `${root.name}-structure.txt`;
    await project.files('output').write(
      fileName,
      Buffer.from(root.render({ preset: 'expand' }))
    );
    results.push(`Saved ./storage/output/${fileName}`)
  }

  // We'll use the Query class again, with the getPropertySummary helper
  // function — it builds an ArangoDB query grouped by the properties we
  // pass in, and can summarize other properties like 'average size' and
  // 'largest page' and 'average number of words.  
  const summary = await Query.run<Record<string, string | number>>(getPropertySummary('resources', {
    properties: [
      { label: 'AvgSize', property: 'size', function: AggregateFunction.avg, numeric: true },
      { label: 'AvgWords', property: 'content.readability.words', function: AggregateFunction.avg, numeric: true },
    ],
    groupBy: [
      { label: 'Host', property: 'parsed.hostname' },
      'code',
      'mime'
    ],
    includeTotal: true
  }));

  // A second query that pulls up bits of information 
  const pages = await Query.run<Record<string, string | number>>(aql`
  FOR r IN resources
  RETURN {
    url: r.url,
    status: r.code,
    message: r.message,
    mime: r.mime,
    size: r.size,
    type: r.content.type,
    title: r.content.title,
    headline: r.content.headline,
    published: r.content.published,
    author: r.content.author,
    description: r.content.description,
    words: r.content.readability.words,
    sentences: r.content.readability.sentences,
    readability: r.content.readability.score,
    author: r.content.author,
  }`);

  const report = new Spreadsheet();
  report.addSheet(summary, 'Overview');
  report.addSheet(pages, 'Pages');
  await project.files('output').write('report.xlsx', report.toBuffer());

  results.push('Saved ./storage/output/report.xlsx');

  return Promise.resolve(results);
}