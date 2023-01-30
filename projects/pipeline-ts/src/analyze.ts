import { Query, getPropertySummary, AggregateFunction } from "spidergram";

await displayOverview();

export async function displayOverview() {
  const query = getPropertySummary('resources', {
    properties: [
      { label: 'title', property: 'content.title' },
      { label: 'published', property: 'content.published' },
      { label: 'author', property: 'content.author' },
      { label: 'readability', property: 'content.readability.score', function: AggregateFunction.avg }
    ],
    groupBy: ['code', 'mime', 'content.type'],
    includeTotal: true,
  });
  const summary = await Query.run<Record<string, string | number>>(query);
  console.log(summary);
  return Promise.resolve();
}