import { Query, aql } from "spidergram";

type summaryRecord = {
  site: string,
  pages: number,
  downloads: number,
  errors: number
}

export async function getCrawlSummary() {
  return Query.run<summaryRecord>(aql`
    for r in resources

    LET isPage = ((r.code == 200) && r.mime == 'text/html') ? 1 : 0
    LET isDownload = ((r.code == 200) && r.mime != 'text/html') ? 1 : 0
    LET isError = (r.code != 200) ? 1 : 0

    COLLECT site = r.parsed.hostname into sites

    return {
      site: site,
      pages: SUM(sites[*].isPage),
      downloads: SUM(sites[*].isDownload),
      errors: SUM(sites[*].isError),
    }
  `);
}