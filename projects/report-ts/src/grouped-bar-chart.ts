import { VegaLiteChart, VegaLiteSpec } from 'spidergram';

export class GroupedBarChart extends VegaLiteChart {
  constructor(data: Record<string, unknown>[], value = 'value', title = 'Categories', categories = ['category']) {
    const spec: VegaLiteSpec = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "data": {
        "values": data
      },
      "repeat": {"layer": categories},
      "spec": {
        "mark": "bar",
        "encoding": {
          "x": {
            "field": value,
            "type": "nominal",
          },
          "y": {
            "aggregate": "sum",
            "field": {"repeat": "layer"},
            "type": "quantitative",
            "title": title
          },
          "color": {"datum": {"repeat": "layer"}, "title": title},
          "xOffset": {"datum": {"repeat": "layer"}}
        }
      },
      "config": {
        "mark": {"invalid": null}
      }
    };

    super(spec);
  }
}