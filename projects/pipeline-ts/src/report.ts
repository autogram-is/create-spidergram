import { Query, HierarchyTools, Spreadsheet, Project, aql } from "spidergram";

await generateReports();

export async function generateReports() {
  const promises = [
    saveUrlHierarchy(),
    saveSpreadsheet(),
  ]
  return Promise.all(promises);
}

export async function saveUrlHierarchy() {
  const results: string[] = [];
  const config = await Project.config();

  const urls = await Query.run<string>(aql`
    FOR r IN resources
    FILTER r.code == 200
    return r.url
  `);

  const hierarchy = new HierarchyTools.UrlHierarchyBuilder().add(urls);
  for (const root of hierarchy.findRoots()) {
    const fileName = `${root.name}-structure.md`;
    await config.files('output').write(
      fileName,
      Buffer.from(root.render({ prest: 'expand' }))
    );
    results.push(`./storage/output/${fileName}`);
  }
}

export async function saveSpreadsheet() {
  const config = await Project.config();

  const report = new Spreadsheet();
  const pageReport = await Query.run<Record<string, string | number>>(aql`
    FOR r IN resources
    RETURN {
      url: r.url,
      response: r.code,
      mime: r.mime,
      title: r.content.title,
      type: r.content.type,
      description: r.content.description,
      published: r.content.published,
      author: r.content.author,
      readability: r.content.readability.score
    }
  `);
  report.addSheet(pageReport, 'Overview');
  await config.files('output').write('report.xlsx', report.toBuffer());

  return ['./storage/output/report.xlsx'];
}
