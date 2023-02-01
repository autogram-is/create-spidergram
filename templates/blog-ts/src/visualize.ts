import {
  Project,
  Query,
  aql,
  HierarchyTools,
  VegaLiteChart
} from "spidergram";

export async function generateVizData() {
  const results: string[] = [];
  const project = await Project.config();

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
      tags: LENGTH(r.content.tags) > 0 ? LENGTH(r.content.tags) : null
    }
  `);

  const hierarchy = new HierarchyTools.UrlHierarchyBuilder({ gaps: 'bridge', subdomains: 'children' }).add(pages);

  // First, we'll grab the primary root URL in the hierarchy and export 
  // a JSON file that includes all of its children. This JSON file can be used
  // by tools like Vega and D3 to generate visualizations and treemaps.
  for (const root of hierarchy.findRoots()) {
    let fileName = `${root.name}.json`;
    const urlData = root.flattened.map(item => {
      return {
        id: item.hierarchyId,
        parent: item.parent?.hierarchyId,
        key: item.name,
        inferred: item.inferred ?? undefined,
        leaf: item.isLeaf,
        ...item.data
      }
    });

    await project.files('output').write(
      fileName,
      Buffer.from(JSON.stringify(urlData, undefined, 0))
    );
    results.push(`Saved ./storage/output/${fileName}`)

    // Now, we'll stick the resulting data into a simple Vega-Lite chart that
    // sums up the number of words published on a year/month bubble chart.
    // https://vega.github.io/editor is a good place to tinker with different
    // visualizations.
    fileName = `${root.name}-wordcount.svg`;
    const chart = new VegaLiteChart({
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "title": `Words published on ${root.name}`,
      "data": { "values": urlData },
      "transform": [
        { "filter": { "field": "published", "valid": true } }
      ],
      "mark": "circle",
      "encoding": {
        "y": { "field": "published", "type": "ordinal", "timeUnit": "month", "title": null },
        "x": { "field": "published", "type": "ordinal", "timeUnit": "year", "title": null },
        "size": { "field": "words", "type": "quantitative", "aggregate": "sum", "title": null }
      }
    });
  
    await project.files('output').write(fileName, await chart.render());
    results.push(`Saved ./storage/output/${fileName}`)
  }

  return Promise.resolve(results);
}
