# Simple Chart

Lightweight HTML/CSS chart library. No dependencies. No SVG or Canvas.

## Usage

Include the CSS and JS files:

```html
<link rel="stylesheet" href="simple-chart.css">
<script src="simple-chart.js"></script>
```

Create a chart by passing a CSS selector (or DOM element) and options. Returns an API object:

```js
var chart = simpleChart('.my-chart', {
    title: {
        text: 'My Chart',
        align: 'center'
    },
    type: 'column',
    layout: {
        width: '100%',
        height: '250px'
    },
    data: {
        render: {
            margin: 0.2
        },
        series: [{
            title: 'Revenue',
            values: [100, 200, 150, 300],
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            outputValues: [],
            color: ['#00aeef'],
            prefix: '$',
            suffix: ''
        }]
    }
});

// Update with new options (merges with original)
chart.update({ data: { series: [{ values: [400, 500, 600, 700] }] } });

// Remove chart and clean up event listeners
chart.destroy();
```

## Chart Types

- `column` - Vertical bar chart (supports stacked)
- `bar` - Horizontal bar chart (supports stacked)
- `progress` - Progress/percentage bar
- `waterfall` - Waterfall chart
- `line` - Line chart with dots
- `area` - Area chart with filled region
- `gauge` - Gauge/ring chart with animated fill

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `type` | string | `'column'` | Chart type: `column`, `bar`, `progress`, `waterfall`, `line`, `area`, `gauge` |
| `cssClass` | string | `''` | Additional CSS class for the chart container |
| `highlight` | boolean | `false` | Dim other items on hover |
| `animate` | boolean | `true` | Animate items on initial render |
| `legend` | boolean | `true` | Show legend when multiple series |
| `title.text` | string | `'Simple Chart'` | Chart title |
| `title.align` | string | `'right'` | Title alignment |
| `layout.width` | string | `'100%'` | Chart width (px or %) |
| `layout.height` | string | `'300px'` | Chart height (px, %, or `'auto'`) |
| `layout.lines.number` | number | `4` | Number of guideline lines |
| `layout.lines.align` | string | `'right'` | Guideline label alignment |
| `data.render.margin` | number | `0` | Margin between chart items |
| `data.render.stacked` | boolean | `false` | Enable stacked mode (column/bar) |
| `data.render.threshold` | array | `[]` | Threshold lines |
| `data.series` | array | `[]` | Array of data series objects |

### Series Object

| Property | Type | Description |
|---|---|---|
| `title` | string | Series name (shown in tooltips) |
| `values` | number[] | Data values |
| `labels` | string[] | Labels for each value |
| `outputValues` | string[] | Display values (e.g. abbreviated numbers) |
| `color` | string[] | Colors for chart items |
| `prefix` | string | Value prefix (e.g. `'$'`) |
| `suffix` | string | Value suffix (e.g. `'%'`) |
| `decimals` | number | Decimal places in tooltips |

## Demo

Open [demo/index.html](demo/index.html) in a browser.

## License

MIT
