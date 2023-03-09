import {
  Spidergram,
  Query,
  HierarchyTools,
  FileTools,
} from "spidergram";

export async function generateReports() {
  const results: string[] = [];
  const sg = await Spidergram.load();

  // The Query class can execute raw queries against the ArangoDB
  // database, or build them dynamically.
  const urls = await new Query('resources')
    .filterBy('code', 200)
    .return('url')
    .run<string>();

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
    await sg.files().write(
      fileName,
      Buffer.from(root.render({ preset: 'expand' }))
    );
    results.push(`Saved ${fileName}`)
  }

  // We'll use the Query class again, with the getPropertySummary helper
  // function — it builds an ArangoDB query grouped by the properties we
  // pass in, and can summarize other properties like 'average size' and
  // 'largest page' and 'average number of words.  
  const summary = await new Query('resources')
    .aggregate('AvgSize', 'average', 'size')
    .aggregate('AvgWords', 'average', 'content.readability.words')
    .groupBy('Host', 'parsed.hostname')
    .groupBy('Status', 'code')
    .groupBy('Mime', 'mime')
    .run<Record<string, string | number>>();

  const pages = await new Query('resources')
    .return('url')
    .return('status', 'code')
    .return('message')
    .return('mime')
    .return('size')
    .return('type', 'content.type')
    .return('title', 'content.title')
    .return('headline', 'content.headline')
    .return('published', 'content.published')
    .return('author', 'content.author')
    .return('description', 'content.description')
    .return('words', 'content.readability.words')
    .return('sentences', 'content.readability.sentences')
    .return('readability', 'content.readability.score')
    .run<Record<string, string | number>>();

  const report = new FileTools.Spreadsheet();
  report.addSheet(summary, 'Overview');
  report.addSheet(pages, 'Pages');
  await sg.files().write('report.xlsx', report.toBuffer());

  results.push('Saved report.xlsx');

  return Promise.resolve(results);
}