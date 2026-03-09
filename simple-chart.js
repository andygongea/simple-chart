(function (root) {
    'use strict';

    var seriesDefaults = {
        title: '',
        values: [],
        labels: [],
        outputValues: [],
        color: [],
        prefix: '',
        suffix: '',
        decimals: 3
    };

    var defaults = {
        type: 'column', /* progress, bar, waterfall, column, gauge, line, area, heatmap, treemap */
        cssClass: '',
        title: {
            text: 'Simple Chart',
            align: 'right'
        },
        layout: {
            width: '100%',
            height: '300px',
            lines: {
                number: 4,
                align: 'right'
            }
        },
        highlight: false,
        animate: true,
        legend: true,
        data: {
            render: {
                empty: 'No data available.',
                stacked: false,
                margin: 0,
                threshold: []
            },
            series: []
        }
    };

    function deepMerge(target, source) {
        var result = {};
        var key;
        for (key in target) {
            if (target.hasOwnProperty(key)) {
                result[key] = target[key];
            }
        }
        for (key in source) {
            if (source.hasOwnProperty(key)) {
                if (
                    source[key] && typeof source[key] === 'object' &&
                    !Array.isArray(source[key]) &&
                    target[key] && typeof target[key] === 'object' &&
                    !Array.isArray(target[key])
                ) {
                    result[key] = deepMerge(target[key], source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        return result;
    }

    function normalizeSeries(seriesArray) {
        return seriesArray.map(function (serie) {
            return deepMerge(seriesDefaults, serie);
        });
    }

    function fix(n) {
        return n.toFixed(3);
    }

    function getColor(colorArray, i) {
        if (colorArray.length === 0) return '';
        var c = colorArray.length === 1 ? colorArray[0] : (colorArray[i] || colorArray[colorArray.length - 1]);
        return 'background-color:' + c + ';';
    }

    function getColorValue(colorArray, i) {
        if (colorArray.length === 0) return '#00aeef';
        return colorArray.length === 1 ? colorArray[0] : (colorArray[i] || '#00aeef');
    }

    function simpleChart(element, options) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (!element) return;

        var config = deepMerge(defaults, options || {});
        config.data.series = normalizeSeries(config.data.series);

        var series = config.data.series;
        var render = config.data.render;
        var type = config.type;
        var margin = render.margin;
        var maxValue = 0;
        var maxStacked = 0;

        // Compute max values
        series.forEach(function (serie) {
            var m = Math.max.apply(null, serie.values);
            if (maxValue < m) maxValue = m;
        });

        function getMaxSum() {
            var sums = [];
            for (var i = 0; i < series.length; i++) {
                for (var j = 0; j < series[i].values.length; j++) {
                    sums[j] = (sums[j] || 0) + series[i].values[j];
                    if (maxStacked < sums[j]) maxStacked = sums[j];
                }
            }
        }

        function sizeArray(arr, useTotal) {
            var denom = useTotal ? arraySum(arr) : maxValue;
            if (!denom) return arr.map(function () { return 0; });
            var sizes = [];
            for (var j = 0; j < arr.length; j++) {
                sizes.push(Math.max(0, arr[j] * 100 / denom));
            }
            return sizes;
        }

        function arraySum(arr) {
            var sum = 0;
            for (var i = 0; i < arr.length; i++) sum += arr[i];
            return sum;
        }

        function delay(i) {
            return 'animation-delay:' + (i * 0.05) + 's;';
        }

        function renderEmpty() {
            return '<h2 class="sc-empty">' + render.empty + '</h2>';
        }

        function renderGuidelines(number, align) {
            if (!number) return '';

            var dimension, lineType;
            if (type === 'column' || type === 'line' || type === 'area') {
                dimension = 'height:';
                lineType = 'is-horizontal';
            } else {
                dimension = 'width:';
                lineType = 'is-vertical';
                number--;
            }

            var stepPos = 100 / (number || 1);
            var scaleMax = render.stacked ? maxStacked : maxValue;
            var pre = series.length > 0 ? (series[0].prefix || '') : '';
            var suf = series.length > 0 ? (series[0].suffix || '') : '';

            var html = '<div class="sc-guidelines">';
            for (var i = 0; i <= number; i++) {
                var pct = 100 - stepPos * i;
                var label;
                if (scaleMax > 0) {
                    var raw = scaleMax * pct / 100;
                    label = pre + (raw >= 1000 ? Math.round(raw).toLocaleString() : parseFloat(fix(raw))) + suf;
                } else {
                    label = fix(pct) + '%';
                }
                html += '<div class="sc-guideline ' + lineType + '" style="' + dimension + fix(stepPos) + '%">';
                html += '<span class="sc-label is-' + align + '-aligned">' + label + '</span>';
                html += '</div>';
            }
            html += '</div>';
            return html;
        }

        function renderTooltip(serieIdx, i) {
            var serie = series[serieIdx];
            var pre = serie.prefix || '';
            var suf = serie.suffix || '';
            var val = serie.outputValues.length > 0
                ? (pre + serie.outputValues[i] + suf)
                : (pre + serie.values[i].toFixed(serie.decimals) + suf);
            var color = getColorValue(serie.color, i);

            return '<div class="sc-tooltip">'
                + '<div class="sc-tooltip-header">' + serie.labels[i] + '</div>'
                + '<div class="sc-tooltip-row">'
                + '<span class="sc-tooltip-dot" style="background-color:' + color + '"></span>'
                + '<span class="sc-tooltip-series">' + serie.title + '</span>'
                + '<span class="sc-tooltip-value">' + val + '</span>'
                + '</div>'
                + '<div class="sc-tooltip-arrow"></div>'
                + '</div>';
        }

        function renderItemContent(serieIdx, i) {
            var serie = series[serieIdx];
            var val = serie.outputValues.length > 0 ? serie.outputValues[i] : serie.values[i];
            var pre = serie.prefix || '';
            var suf = serie.suffix || '';

            return '<span class="sc-main">'
                + '<span class="sc-label">' + serie.labels[i] + '</span>'
                + '<span class="sc-value">' + pre + val + suf + '</span>'
                + '</span>';
        }

        function renderThreshold() {
            var html = '';
            render.threshold.forEach(function (threshold) {
                var val;
                if (typeof threshold === 'string') {
                    val = parseInt(threshold.substring(0, threshold.length - 1), 10);
                } else {
                    val = maxValue > 0 ? fix(threshold * 100 / maxValue) : 0;
                }
                html += '<div class="sc-threshold" style="height:' + val + '%"></div>';
            });
            return html;
        }

        function renderColumn() {
            var html = '';
            var count = series.length;
            if (!count) return html;

            series.forEach(function (serie, idx) {
                var heights = sizeArray(serie.values);
                var len = serie.values.length;
                var w = (100 - margin * (len * count + 1)) / len / count;
                for (var i = 0; i < len; i++) {
                    html += '<div class="sc-item" style="left:' + fix((w + margin) * (i * count + idx) + margin) + '%;width:' + fix(w) + '%;height:' + fix(heights[i]) + '%;' + getColor(serie.color, i) + delay(i) + '">';
                    html += renderItemContent(idx, i);
                    html += renderTooltip(idx, i);
                    html += '</div>';
                }
            });
            return html;
        }

        function renderStackedColumn() {
            var html = '';
            getMaxSum();
            var len = series[0].values.length;

            for (var i = 0; i < len; i++) {
                var items = '';
                var tooltip = '<div class="sc-tooltip">';
                tooltip += '<div class="sc-tooltip-header">' + series[0].labels[i] + '</div>';
                var w = (100 - margin * (len + 1)) / len;
                var bottom = 0;

                for (var s = 0; s < series.length; s++) {
                    var serie = series[s];
                    var h = serie.values[i] * 100 / maxStacked;
                    var color = getColorValue(serie.color, i);
                    var val = serie.outputValues && serie.outputValues.length > 0
                        ? serie.outputValues[i]
                        : (serie.prefix + serie.values[i].toFixed(serie.decimals) + serie.suffix);

                    tooltip += '<div class="sc-tooltip-row">'
                        + '<span class="sc-tooltip-dot" style="background-color:' + color + '"></span>'
                        + '<span class="sc-tooltip-series">' + serie.title + '</span>'
                        + '<span class="sc-tooltip-value">' + val + '</span>'
                        + '</div>';

                    items += '<div class="sc-item" style="left:' + fix((w + margin) * i + margin) + '%;bottom:' + fix(bottom) + '%;width:' + fix(w) + '%;height:' + fix(h) + '%;' + getColor(serie.color, i) + '">';
                    items += renderItemContent(s, i);
                    items += '</div>';
                    bottom += h;
                }

                tooltip += '<div class="sc-tooltip-arrow"></div></div>';
                html += '<div class="sc-stack">' + tooltip + items + '</div>';
            }
            return html;
        }

        function renderBar() {
            var html = '';
            var count = series.length;
            if (!count) return html;

            series.forEach(function (serie, idx) {
                var widths = sizeArray(serie.values);
                var len = serie.values.length;
                var h = (100 - margin * (len * count + 1)) / len / count;
                var isAuto = config.layout.height === 'auto';

                for (var i = 0; i < len; i++) {
                    var top = isAuto ? 'top:auto;' : 'top:' + fix((h + margin) * (i * count + idx) + margin) + '%;';
                    var height = isAuto ? '' : 'height:' + fix(h) + '%;';
                    html += '<div class="sc-item" style="left:0;' + top + 'width:' + fix(widths[i]) + '%;' + height + getColor(serie.color, i) + delay(i) + '">';
                    html += renderItemContent(idx, i);
                    html += renderTooltip(idx, i);
                    html += '</div>';
                }
            });
            return html;
        }

        function renderStackedBar() {
            var html = '';
            getMaxSum();
            var leftPos = [];

            for (var s = 0; s < series.length; s++) {
                var serie = series[s];
                var len = serie.values.length;
                var h = (100 - margin * (len + 1)) / len;

                for (var i = 0; i < len; i++) {
                    var w = serie.values[i] * 100 / maxStacked;
                    if (s === 0) { leftPos[i] = 0; } else { leftPos[i] += series[s - 1].values[i] * 100 / maxStacked; }

                    html += '<div class="sc-item" style="top:' + fix((h + margin) * i + margin) + '%;width:' + fix(w) + '%;height:' + fix(h) + '%;' + getColor(serie.color, i) + 'left:' + fix(leftPos[i]) + '%">';
                    html += renderItemContent(s, i);
                    html += renderTooltip(s, i);
                    html += '</div>';
                }
            }
            return html;
        }

        function renderHorizontalStacked(includeOffset) {
            var html = '';
            if (!series.length) return html;

            series.forEach(function (serie, idx) {
                var widths = sizeArray(serie.values, true);
                var len = serie.values.length;
                var left = 0;

                for (var i = 0; i < len; i++) {
                    var style = 'left:' + fix(left) + '%;width:' + fix(widths[i]) + '%;' + getColor(serie.color, i);
                    if (!includeOffset) {
                        style += 'z-index:' + (len - i) + ';';
                    }
                    style += delay(i);
                    html += '<div class="sc-item" style="' + style + '">';
                    html += renderItemContent(idx, i);
                    html += renderTooltip(idx, i);
                    html += '</div>';
                    left += widths[i];
                }
            });
            return html;
        }

        function renderLineArea() {
            var isArea = type === 'area';
            var html = '';

            series.forEach(function (serie, idx) {
                var len = serie.values.length;
                if (len < 2) return;

                var color = serie.color.length > 0 ? serie.color[0] : '#00aeef';

                if (isArea) {
                    var poly = [];
                    for (var i = 0; i < len; i++) {
                        poly.push(fix(i / (len - 1) * 100) + '% ' + fix(100 - (maxValue > 0 ? serie.values[i] / maxValue * 100 : 0)) + '%');
                    }
                    poly.push('100% 100%', '0% 100%');
                    html += '<div class="sc-area-fill" style="clip-path:polygon(' + poly.join(',') + ');background-color:' + color + '"></div>';
                }

                for (var i = 0; i < len - 1; i++) {
                    html += '<div class="sc-line-segment" data-series="' + idx + '" data-seg="' + i + '" style="background-color:' + color + ';' + delay(i) + '"></div>';
                }

                for (var i = 0; i < len; i++) {
                    var x = fix(i / (len - 1) * 100);
                    var y = fix(maxValue > 0 ? serie.values[i] / maxValue * 100 : 0);
                    html += '<div class="sc-dot" style="left:' + x + '%;bottom:' + y + '%;border-color:' + color + ';' + delay(i) + '">';
                    html += renderTooltip(idx, i);
                    html += '</div>';
                }
            });
            return html;
        }

        function parseHexColor(hex) {
            hex = hex.replace('#', '');
            if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
            return {
                r: parseInt(hex.substring(0, 2), 16),
                g: parseInt(hex.substring(2, 4), 16),
                b: parseInt(hex.substring(4, 6), 16)
            };
        }

        function interpolateColor(lowRgb, highRgb, t) {
            var r = Math.round(lowRgb.r + (highRgb.r - lowRgb.r) * t);
            var g = Math.round(lowRgb.g + (highRgb.g - lowRgb.g) * t);
            var b = Math.round(lowRgb.b + (highRgb.b - lowRgb.b) * t);
            return 'rgb(' + r + ',' + g + ',' + b + ')';
        }

        function renderHeatmap() {
            var html = '';
            if (!series.length) return html;

            var allValues = [];
            series.forEach(function (serie) {
                for (var i = 0; i < serie.values.length; i++) {
                    allValues.push(serie.values[i]);
                }
            });
            var heatMin = Math.min.apply(null, allValues);
            var heatMax = Math.max.apply(null, allValues);
            var heatRange = heatMax - heatMin;

            // Low color: dark muted version of the background
            var lowRgb = { r: 26, g: 26, b: 46 };

            var cols = series[0].labels.length;
            var rows = series.length;

            // Column labels
            html += '<div class="sc-heatmap-col-labels" style="grid-template-columns:repeat(' + cols + ',1fr)">';
            for (var c = 0; c < cols; c++) {
                html += '<span class="sc-heatmap-col-label">' + series[0].labels[c] + '</span>';
            }
            html += '</div>';

            // Grid
            html += '<div class="sc-heatmap-grid" style="grid-template-columns:repeat(' + cols + ',1fr);grid-template-rows:repeat(' + rows + ',1fr)">';
            for (var s = 0; s < rows; s++) {
                var serie = series[s];
                var highRgb = parseHexColor(getColorValue(serie.color, 0));
                for (var i = 0; i < serie.values.length; i++) {
                    var intensity = heatRange > 0 ? (serie.values[i] - heatMin) / heatRange : 0.5;
                    var cellColor = interpolateColor(lowRgb, highRgb, intensity);
                    var pre = serie.prefix || '';
                    var suf = serie.suffix || '';
                    var val = serie.outputValues.length > 0 ? serie.outputValues[i] : serie.values[i];

                    html += '<div class="sc-heatmap-cell" style="background-color:' + cellColor + '" title="' + serie.title + ': ' + pre + val + suf + '">';
                    html += '<span class="sc-heatmap-value">' + pre + val + suf + '</span>';
                    html += renderTooltip(s, i);
                    html += '</div>';
                }
            }
            html += '</div>';

            // Row labels
            html += '<div class="sc-heatmap-row-labels" style="grid-template-rows:repeat(' + rows + ',1fr)">';
            for (var s = 0; s < rows; s++) {
                html += '<span class="sc-heatmap-row-label">' + series[s].title + '</span>';
            }
            html += '</div>';

            return html;
        }

        function renderTreemap() {
            var html = '';
            if (!series.length) return html;

            // Collect all items from all series into a flat list
            var items = [];
            series.forEach(function (serie, sIdx) {
                for (var i = 0; i < serie.values.length; i++) {
                    items.push({
                        value: serie.values[i],
                        label: serie.labels[i],
                        color: getColorValue(serie.color, i),
                        serieIdx: sIdx,
                        itemIdx: i
                    });
                }
            });

            // Sort descending by value for better layout
            items.sort(function (a, b) { return b.value - a.value; });

            var total = 0;
            for (var i = 0; i < items.length; i++) total += items[i].value;
            if (!total) return renderEmpty();

            // Squarified treemap layout using slice-and-dice with aspect ratio optimization
            function layoutRects(items, x, y, w, h) {
                if (items.length === 0) return [];
                if (items.length === 1) {
                    return [{ item: items[0], x: x, y: y, w: w, h: h }];
                }

                var sum = 0;
                for (var i = 0; i < items.length; i++) sum += items[i].value;

                // Try splitting at each point and pick the best aspect ratio
                var isHorizontal = w >= h;
                var bestSplit = 1;
                var bestWorst = Infinity;

                var runSum = 0;
                for (var i = 0; i < items.length - 1; i++) {
                    runSum += items[i].value;
                    var frac = runSum / sum;

                    // Compute worst aspect ratio for left partition
                    var lw, lh;
                    if (isHorizontal) {
                        lw = w * frac; lh = h;
                    } else {
                        lw = w; lh = h * frac;
                    }

                    // Worst aspect ratio of individual items in left partition
                    var worstAR = 0;
                    var leftSum = runSum;
                    for (var j = 0; j <= i; j++) {
                        var itemFrac = items[j].value / leftSum;
                        var iw, ih;
                        if (isHorizontal) {
                            iw = lw; ih = lh * itemFrac;
                        } else {
                            iw = lw * itemFrac; ih = lh;
                        }
                        var ar = iw > ih ? iw / (ih || 1) : ih / (iw || 1);
                        if (ar > worstAR) worstAR = ar;
                    }

                    if (worstAR < bestWorst) {
                        bestWorst = worstAR;
                        bestSplit = i + 1;
                    }
                }

                var left = items.slice(0, bestSplit);
                var right = items.slice(bestSplit);
                var leftSum = 0;
                for (var i = 0; i < left.length; i++) leftSum += left[i].value;
                var leftFrac = leftSum / sum;

                var rects = [];
                if (isHorizontal) {
                    var lw = w * leftFrac;
                    rects = rects.concat(layoutRects(left, x, y, lw, h));
                    rects = rects.concat(layoutRects(right, x + lw, y, w - lw, h));
                } else {
                    var lh = h * leftFrac;
                    rects = rects.concat(layoutRects(left, x, y, w, lh));
                    rects = rects.concat(layoutRects(right, x, y + lh, w, h - lh));
                }
                return rects;
            }

            var rects = layoutRects(items, 0, 0, 100, 100);

            for (var i = 0; i < rects.length; i++) {
                var r = rects[i];
                var item = r.item;
                var serie = series[item.serieIdx];
                var pre = serie.prefix || '';
                var suf = serie.suffix || '';
                var val = serie.outputValues.length > 0 ? serie.outputValues[item.itemIdx] : item.value;

                html += '<div class="sc-treemap-cell" style="'
                    + 'left:' + fix(r.x) + '%;top:' + fix(r.y) + '%;'
                    + 'width:' + fix(r.w) + '%;height:' + fix(r.h) + '%;'
                    + 'background-color:' + item.color + ';'
                    + delay(i) + '">';
                html += '<span class="sc-treemap-label">' + item.label + '</span>';
                html += '<span class="sc-treemap-value">' + pre + val + suf + '</span>';
                html += renderTooltip(item.serieIdx, item.itemIdx);
                html += '</div>';
            }

            return html;
        }

        function renderGauge() {
            var serie = series[0];
            var current = serie.values[0] || 0;
            var min = serie.values[1] || 0;
            var max = serie.values[2] || 100;
            var value = serie.outputValues.length > 0 ? serie.outputValues[0] : current;
            var range = max - min;
            var pct = range > 0 ? ((current - min) / range) : 0;
            var color = serie.color.length > 0 ? serie.color[0] : '#00aeef';
            var trackColor = 'rgba(255,255,255,.1)';
            var gapDeg = 30;
            var startDeg = 180 + gapDeg;
            var arcDeg = 360 - gapDeg * 2;

            var displayStr = String(value);
            var numMatch = displayStr.match(/^([^0-9]*?)([\d.]+)(.*)$/);
            var valueSuffix = numMatch ? numMatch[3] : '';

            return '<div class="sc-ring" style="background:conic-gradient(from ' + startDeg + 'deg, ' + trackColor + ' 0deg, ' + trackColor + ' ' + arcDeg + 'deg, transparent ' + arcDeg + 'deg);--gauge-color:' + color + '"'
                + ' data-start="' + startDeg + '" data-arc="' + arcDeg + '" data-pct="' + pct + '"'
                + ' data-color="' + color + '" data-track="' + trackColor + '"'
                + ' data-value-num="' + (numMatch ? parseFloat(numMatch[2]) : current) + '"'
                + ' data-value-prefix="' + (numMatch ? numMatch[1] : '') + '"'
                + ' data-value-suffix="' + valueSuffix + '"'
                + ' data-value-decimals="' + (numMatch && numMatch[2].indexOf('.') !== -1 ? numMatch[2].split('.')[1].length : 0) + '">'
                + '<div class="sc-ring-inner"></div>'
                + '<div class="sc-ring-content">'
                + '<span class="sc-label">' + serie.title + '</span>'
                + '<span class="sc-value">0' + valueSuffix + '</span>'
                + '</div></div>';
        }

        function renderLegend() {
            if (!config.legend || type === 'gauge') return '';
            if (series.length < 2 && !render.stacked) return '';

            var html = '<div class="sc-legend">';
            series.forEach(function (serie) {
                var color = serie.color.length > 0 ? serie.color[0] : '#00aeef';
                html += '<div class="sc-legend-item">'
                    + '<span class="sc-legend-dot" style="background-color:' + color + '"></span>'
                    + '<span class="sc-legend-label">' + serie.title + '</span>'
                    + '</div>';
            });
            return html + '</div>';
        }

        // Build classes
        var classes = ['sc-chart'];
        classes.push(type === 'line' ? 'sc-linechart' : 'sc-' + type);
        if (render.stacked) classes.push('is-stacked');
        if (config.cssClass) classes.push(config.cssClass);
        if (config.layout.height === 'auto') classes.push('has-height-auto');
        if (config.highlight) classes.push('has-highlight');
        if (config.animate) classes.push('sc-animate');

        var chartTemplate = '<div class="' + classes.join(' ') + '" style="width:' + config.layout.width + ';height:' + config.layout.height + '">';
        if (config.title.text) {
            chartTemplate += '<div class="sc-title" style="text-align:' + config.title.align + '">' + config.title.text + '</div>';
        }
        chartTemplate += '<div class="sc-canvas">';

        if (type !== 'gauge' && type !== 'heatmap' && type !== 'treemap') {
            if (render.threshold && render.threshold.length) {
                chartTemplate += renderThreshold();
            }
            chartTemplate += renderGuidelines(config.layout.lines.number, config.layout.lines.align);
        }

        if (series.length > 0 && series[0].values.length > 0 && series[0].labels.length > 0) {
            switch (type) {
                case 'column':
                    chartTemplate += render.stacked ? renderStackedColumn() : renderColumn();
                    break;
                case 'bar':
                    chartTemplate += render.stacked ? renderStackedBar() : renderBar();
                    break;
                case 'progress':
                    chartTemplate += renderHorizontalStacked(false);
                    break;
                case 'waterfall':
                    chartTemplate += renderHorizontalStacked(true);
                    break;
                case 'line':
                case 'area':
                    chartTemplate += renderLineArea();
                    break;
                case 'heatmap':
                    chartTemplate += renderHeatmap();
                    break;
                case 'treemap':
                    chartTemplate += renderTreemap();
                    break;
                case 'gauge':
                    chartTemplate += renderGauge();
                    break;
                default:
                    chartTemplate += renderBar();
                    break;
            }
        } else {
            chartTemplate += renderEmpty();
        }

        chartTemplate += '</div>';
        chartTemplate += renderLegend();
        chartTemplate += '</div>';

        // Clean up previous instance
        if (element._scDestroy) {
            element._scDestroy();
        }

        element.innerHTML = chartTemplate;

        // Post-render: position line segments
        var resizeHandler = null;
        var gaugeAnimId = null;

        function positionSegments(dots, segs, offsets) {
            segs.forEach(function (seg) {
                var si = parseInt(seg.dataset.series, 10);
                var gi = parseInt(seg.dataset.seg, 10);
                var o = offsets[si];
                var a = dots[o + gi];
                var b = dots[o + gi + 1];
                var dx = b.offsetLeft - a.offsetLeft;
                var dy = b.offsetTop - a.offsetTop;
                var dist = Math.sqrt(dx * dx + dy * dy);
                var angle = Math.atan2(dy, dx) * 180 / Math.PI;

                seg.style.width = fix(dist) + 'px';
                seg.style.left = a.offsetLeft + 'px';
                seg.style.top = a.offsetTop + 'px';
                seg.style.transform = 'rotate(' + fix(angle) + 'deg)';
            });
        }

        var resizeObserver = null;

        if (type === 'line' || type === 'area') {
            var canvas = element.querySelector('.sc-canvas');
            var dots = canvas.querySelectorAll('.sc-dot');
            var segs = canvas.querySelectorAll('.sc-line-segment');

            var offsets = [];
            var offset = 0;
            for (var s = 0; s < series.length; s++) {
                offsets.push(offset);
                offset += series[s].values.length;
            }

            positionSegments(dots, segs, offsets);

            var resizeTimer;
            var onResize = function () {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function () {
                    positionSegments(dots, segs, offsets);
                }, 50);
            };

            if (typeof ResizeObserver !== 'undefined') {
                resizeObserver = new ResizeObserver(onResize);
                resizeObserver.observe(element);
            } else {
                resizeHandler = onResize;
                window.addEventListener('resize', resizeHandler);
            }
        }

        if (type === 'gauge') {
            var ring = element.querySelector('.sc-ring');
            if (ring) {
                var gStart = parseFloat(ring.dataset.start);
                var gArc = parseFloat(ring.dataset.arc);
                var gPct = parseFloat(ring.dataset.pct);
                var gColor = ring.dataset.color;
                var gTrack = ring.dataset.track;
                var gNum = parseFloat(ring.dataset.valueNum);
                var gPre = ring.dataset.valuePrefix;
                var gSuf = ring.dataset.valueSuffix;
                var gDec = parseInt(ring.dataset.valueDecimals, 10);
                var gValEl = ring.querySelector('.sc-value');
                var gDuration = 1000;
                var gStartTime = null;

                function easeOut(t) {
                    return 1 - Math.pow(1 - t, 3);
                }

                function animateGauge(timestamp) {
                    if (!gStartTime) gStartTime = timestamp;
                    var progress = Math.min((timestamp - gStartTime) / gDuration, 1);
                    var eased = easeOut(progress);
                    var fill = (eased * gPct * gArc).toFixed(1);

                    ring.style.background = 'conic-gradient(from ' + gStart + 'deg, '
                        + gColor + ' 0deg, ' + gColor + ' ' + fill + 'deg, '
                        + gTrack + ' ' + fill + 'deg, ' + gTrack + ' ' + gArc + 'deg, '
                        + 'transparent ' + gArc + 'deg)';

                    gValEl.textContent = gPre + (eased * gNum).toFixed(gDec) + gSuf;

                    if (progress < 1) {
                        gaugeAnimId = requestAnimationFrame(animateGauge);
                    }
                }

                gaugeAnimId = requestAnimationFrame(animateGauge);
            }
        }

        function destroy() {
            if (resizeHandler) window.removeEventListener('resize', resizeHandler);
            if (resizeObserver) resizeObserver.disconnect();
            if (gaugeAnimId) cancelAnimationFrame(gaugeAnimId);
            element.innerHTML = '';
            delete element._scDestroy;
        }

        element._scDestroy = destroy;

        return {
            element: element,
            destroy: destroy,
            update: function (newOptions) {
                destroy();
                return simpleChart(element, deepMerge(options || {}, newOptions || {}));
            }
        };
    }

    root.simpleChart = simpleChart;

})(window);
