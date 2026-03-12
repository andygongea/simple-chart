# Neo Charts

Lightweight HTML/CSS chart library with zero dependencies. No SVG, no Canvas — pure DOM elements styled with CSS.

## Installation

Download `neo-charts.js` and `neo-charts.css`, then include them in your HTML:

```html
<link rel="stylesheet" href="neo-charts.css">
<script src="neo-charts.js"></script>
```

Or install via npm:

```bash
npm install neo-charts
```

## Usage

Create a container element and call `neoCharts()` with a CSS selector (or DOM element) and an options object:

```html
<div class="my-chart"></div>

<script>
var chart = neoCharts('.my-chart', {
    title: { text: 'Revenue', align: 'center' },
    type: 'column',
    layout: { width: '100%', height: '250px' },
    data: {
        series: [{
            title: 'Quarterly',
            values: [100, 200, 150, 300],
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            color: ['#00e5ff'],
            prefix: '$',
            suffix: 'K'
        }]
    }
});
</script>
```

The function returns an API object with `update()` and `destroy()` methods:

```js
// Update chart with new data (merges with original options)
chart.update({
    data: {
        series: [{
            values: [400, 500, 600, 700]
        }]
    }
});

// Remove chart and clean up listeners
chart.destroy();
```

## Chart Types

### Column

![Column Chart](demo/screenshots/column-chart.png)

Vertical bar chart. Supports stacked mode for multiple series.

```js
neoCharts('.chart', {
    type: 'column',
    layout: { width: '100%', height: '250px' },
    data: {
        render: { margin: 0.2 },
        series: [{
            title: 'Sales',
            values: [120, 450, 320, 780, 560],
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            color: ['#00e5ff'],
            prefix: '$'
        }]
    }
});
```

### Bar

![Bar Chart](demo/screenshots/bar-chart.png)

Horizontal bar chart. Supports stacked mode. Set `layout.height` to `'auto'` to size based on content.

```js
neoCharts('.chart', {
    type: 'bar',
    layout: { width: '100%', height: 'auto' },
    data: {
        series: [{
            title: 'Revenue',
            values: [2787, 2186, 2068, 1670, 1518],
            labels: ['Avatar', 'Titanic', 'Star Wars', 'Jurassic World', 'The Avengers'],
            color: ['#00e5ff', '#00e676', '#ffea00', '#d500f9', '#ff6e40'],
            prefix: '$',
            suffix: 'M'
        }]
    }
});
```

### Line

![Line Chart](demo/screenshots/line-chart.png)

Line chart with interactive dots and tooltips.

```js
neoCharts('.chart', {
    type: 'line',
    highlight: true,
    layout: { width: '100%', height: '250px' },
    data: {
        series: [{
            title: 'Revenue',
            values: [120, 450, 320, 780, 560, 920],
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            color: ['#00e5ff'],
            prefix: '$',
            suffix: ' K'
        }]
    }
});
```

### Area

![Area Chart](demo/screenshots/area-chart.png)

Same as line chart but with a filled region below the line.

```js
neoCharts('.chart', {
    type: 'area',
    layout: { width: '100%', height: '250px' },
    data: {
        series: [{
            title: 'Users',
            values: [100, 300, 250, 600, 450, 800],
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            color: ['#d500f9']
        }]
    }
});
```

### Progress

![Progress Chart](demo/screenshots/progress-chart.png)

Horizontal stacked bar showing proportions of a whole.

```js
neoCharts('.chart', {
    type: 'progress',
    layout: { width: '100%', height: '250px' },
    data: {
        series: [{
            title: 'Budget',
            values: [45, 30, 15, 10],
            labels: ['Engineering', 'Marketing', 'Sales', 'Other'],
            color: ['#00e5ff', '#00e676', '#ffea00', '#d500f9'],
            suffix: '%'
        }]
    }
});
```

### Waterfall

![Waterfall Chart](demo/screenshots/waterfall-chart.png)

Horizontal bars with cumulative offset, useful for showing sequential contributions.

```js
neoCharts('.chart', {
    type: 'waterfall',
    layout: { width: '100%' },
    data: {
        series: [{
            title: 'Impact',
            values: [500, 300, 200, 150, 100],
            labels: ['Base', 'Feature A', 'Feature B', 'Feature C', 'Feature D'],
            color: ['#00e5ff', '#00e676', '#ffea00', '#d500f9', '#ff6e40']
        }]
    }
});
```

### Heatmap

![Heatmap Chart](demo/screenshots/heatmap-chart.png)

Grid-based chart where cell color intensity represents the value. Each series becomes a row, and labels become columns.

```js
neoCharts('.chart', {
    type: 'heatmap',
    highlight: true,
    layout: { width: '100%', height: '350px' },
    data: {
        series: [
            { title: 'Mon', values: [2, 5, 12, 18, 8, 3], labels: ['6am', '8am', '10am', '12pm', '2pm', '4pm'], color: ['#00e5ff'] },
            { title: 'Tue', values: [1, 3, 8, 22, 11, 6], labels: ['6am', '8am', '10am', '12pm', '2pm', '4pm'], color: ['#00e5ff'] },
            { title: 'Wed', values: [3, 7, 14, 25, 13, 8], labels: ['6am', '8am', '10am', '12pm', '2pm', '4pm'], color: ['#00e5ff'] }
        ]
    }
});
```

### Treemap

![Treemap Chart](demo/screenshots/treemap-chart.png)

Space-filling chart where rectangle size represents the value. Uses a squarified layout algorithm.

```js
neoCharts('.chart', {
    type: 'treemap',
    highlight: true,
    layout: { width: '100%', height: '350px' },
    data: {
        series: [{
            title: 'Disk Usage',
            values: [450, 320, 280, 180, 150],
            labels: ['Photos', 'Videos', 'Documents', 'Music', 'Apps'],
            outputValues: ['450 GB', '320 GB', '280 GB', '180 GB', '150 GB'],
            color: ['#00e5ff', '#00e676', '#ffea00', '#d500f9', '#ff6e40']
        }]
    }
});
```

### Gauge

![Gauge Chart](demo/screenshots/gauge-chart.png)

Circular gauge with animated fill. Series values are `[current, min, max]`.

```js
neoCharts('.chart', {
    type: 'gauge',
    layout: { width: '280px', height: '280px' },
    data: {
        series: [{
            title: 'Performance',
            values: [86, 0, 100],
            labels: ['Current', 'Min', 'Max'],
            outputValues: ['86%'],
            color: ['#e040fb'],
            suffix: '%'
        }]
    }
});
```

## Options Reference

| Option | Type | Default | Description |
|---|---|---|---|
| `type` | string | `'column'` | Chart type: `column`, `bar`, `progress`, `waterfall`, `line`, `area`, `heatmap`, `treemap`, `gauge` |
| `cssClass` | string | `''` | Additional CSS class on the chart container |
| `highlight` | boolean | `false` | Dim sibling items on hover |
| `animate` | boolean | `true` | Animate items on initial render |
| `legend` | boolean | `true` | Show legend when multiple series exist |
| `title.text` | string | `'Neo Charts'` | Chart title text |
| `title.align` | string | `'right'` | Title alignment: `left`, `center`, `right` |
| `layout.width` | string | `'100%'` | Chart width (CSS value) |
| `layout.height` | string | `'300px'` | Chart height (CSS value or `'auto'`) |
| `layout.lines.number` | number | `4` | Number of guideline lines |
| `layout.lines.align` | string | `'right'` | Guideline label position: `left`, `right` |
| `data.render.margin` | number | `0` | Spacing between items (percentage) |
| `data.render.stacked` | boolean | `false` | Stack multiple series (column/bar) |
| `data.render.threshold` | array | `[]` | Threshold lines |
| `data.series` | array | `[]` | Array of series objects |

### Series Object

| Property | Type | Description |
|---|---|---|
| `title` | string | Series name (shown in legend and tooltips) |
| `values` | number[] | Data values |
| `labels` | string[] | Label for each value |
| `outputValues` | string[] | Custom display values (e.g. `['1.2K', '3.4M']`). Falls back to raw values if empty. |
| `color` | string[] | One color for the whole series, or one per item |
| `prefix` | string | Prepended to displayed values (e.g. `'$'`) |
| `suffix` | string | Appended to displayed values (e.g. `'%'`) |
| `decimals` | number | Decimal places in tooltips (default: `3`) |

## API

`neoCharts(selector, options)` returns:

| Method | Description |
|---|---|
| `chart.update(newOptions)` | Merge new options and re-render the chart. Returns a new API object. |
| `chart.destroy()` | Remove the chart and clean up event listeners. |
| `chart.element` | The DOM element containing the chart. |

## Features

- **Zero dependencies** — no jQuery, no D3, no build step required
- **Pure CSS rendering** — all chart elements are styled DOM nodes, no SVG or Canvas
- **Responsive** — charts resize with their container via ResizeObserver
- **Animated** — entry animations and smooth hover transitions
- **Interactive** — tooltips on hover with highlight mode to dim siblings
- **9 chart types** — column, bar, line, area, progress, waterfall, heatmap, treemap, gauge

## Demo

Open [demo/index.html](demo/index.html) in a browser to see all chart types in action.

## License

MIT
