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
            text: 'Neo Charts',
            subtitle: '',
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
        gap: 2,
        fit: false,
        highlight: false,
        animate: true,
        legend: true,
        smooth: false,
        theme: 'dark',
        onClick: null,
        onHover: null,
        data: {
            render: {
                empty: 'No data available.',
                stacked: false,
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

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function abbreviate(value) {
        var abs = Math.abs(value);
        if (abs >= 1e9) return (value / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
        if (abs >= 1e6) return (value / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
        if (abs >= 1e4) return (value / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
        if (abs >= 1000) return Math.round(value).toLocaleString();
        return parseFloat(value.toFixed(3)).toString();
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

    function neoCharts(element, options) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (!element) return;

        var config = deepMerge(defaults, options || {});
        config.data.series = normalizeSeries(config.data.series);

        var series = config.data.series;
        var render = config.data.render;
        var type = config.type;

        var maxValue = 0;
        var minValue = 0;
        var maxStacked = 0;

        // Compute max/min values
        series.forEach(function (serie) {
            if (!serie.values.length) return;
            var mx = Math.max.apply(null, serie.values);
            var mn = Math.min.apply(null, serie.values);
            if (maxValue < mx) maxValue = mx;
            if (minValue > mn) minValue = mn;
        });
        var valueRange = maxValue - minValue;

        // Add 10% headroom so value labels don't collide with chart edges
        function niceMax(val) {
            if (val <= 0) return val;
            var padded = val * 1.10;
            var magnitude = Math.pow(10, Math.floor(Math.log10(padded)));
            var step = magnitude / 5;
            return Math.ceil(padded / step) * step;
        }
        if (maxValue > 0 && !render.stacked && type !== 'progress') {
            maxValue = niceMax(maxValue);
            valueRange = maxValue - minValue;
        }

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
            var sum = arraySum(arr);
            var denom = useTotal ? (type === 'waterfall' ? niceMax(sum) : sum) : maxValue;
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
            return 'animation-delay:' + (i * 0.05).toFixed(2) + 's;';
        }

        function dataAttr(serieIdx, itemIdx) {
            return ' data-nc-series="' + serieIdx + '" data-nc-index="' + itemIdx + '"';
        }

        function renderEmpty() {
            return '<h2 class="nc-empty">' + escapeHtml(render.empty) + '</h2>';
        }

        function guidelineData(number) {
            var isHorizontal = (type === 'column' || type === 'line' || type === 'area');
            var hasNeg = minValue < 0;
            var waterfallScale = 0;
            if (type === 'waterfall' && series.length > 0) {
                waterfallScale = niceMax(arraySum(series[0].values));
            }
            var scaleMax = type === 'waterfall' ? waterfallScale : (render.stacked ? maxStacked : maxValue);
            var scaleMin = hasNeg ? minValue : 0;
            var scaleRange = type === 'waterfall' ? waterfallScale : (render.stacked ? maxStacked : (hasNeg ? valueRange : maxValue));
            var pre = series.length > 0 ? escapeHtml(series[0].prefix || '') : '';
            var suf = series.length > 0 ? escapeHtml(series[0].suffix || '') : '';

            var items = [];
            for (var i = 0; i <= number; i++) {
                var frac = i / number;
                var raw, label;

                if (isHorizontal) {
                    raw = scaleMax - frac * scaleRange;
                } else {
                    raw = scaleMin + frac * scaleRange;
                }

                if (scaleRange > 0) {
                    var abbreviated = abbreviate(raw);
                    var usedAbbr = abbreviated !== Math.round(raw).toLocaleString() && abbreviated !== parseFloat(raw.toFixed(3)).toString();
                    label = pre + abbreviated + (usedAbbr ? '' : suf);
                } else {
                    label = fix(isHorizontal ? (100 - frac * 100) : (frac * 100)) + '%';
                }

                items.push({ frac: frac, label: label, isFirst: i === 0, isLast: i === number });
            }
            return { items: items, isHorizontal: isHorizontal };
        }

        function renderGuideLines(number) {
            if (!number) return '';
            var data = guidelineData(number);
            var html = '<div class="nc-guidelines">';
            for (var i = 0; i < data.items.length; i++) {
                var d = data.items[i];
                var pos = data.isHorizontal
                    ? 'top:' + fix(d.frac * 100) + '%;left:0;right:0;'
                    : 'left:' + fix(d.frac * 100) + '%;top:0;bottom:0;';
                var lineType = data.isHorizontal ? 'is-horizontal' : 'is-vertical';
                var edgeClass = d.isFirst ? ' is-first' : (d.isLast ? ' is-last' : '');
                html += '<div class="nc-guideline ' + lineType + edgeClass + '" style="' + pos + '"></div>';
            }
            html += '</div>';
            return html;
        }

        function renderAxisLabels(number, axis) {
            if (!number) return '';
            var data = guidelineData(number);
            var html = '<div class="nc-' + axis + 'axis">';
            for (var i = 0; i < data.items.length; i++) {
                html += '<span class="nc-axis-label">' + data.items[i].label + '</span>';
            }
            html += '</div>';
            return html;
        }

        function renderGuidelines(number, align) {
            if (!number) return '';
            var data = guidelineData(number);
            var html = '<div class="nc-guidelines">';
            for (var i = 0; i < data.items.length; i++) {
                var d = data.items[i];
                var pos = data.isHorizontal
                    ? 'top:' + fix(d.frac * 100) + '%;left:0;right:0;'
                    : 'left:' + fix(d.frac * 100) + '%;top:0;bottom:0;';
                var lineType = data.isHorizontal ? 'is-horizontal' : 'is-vertical';
                var edgeClass = d.isFirst ? ' is-first' : (d.isLast ? ' is-last' : '');
                html += '<div class="nc-guideline ' + lineType + edgeClass + '" style="' + pos + '">';
                html += '<span class="nc-label is-' + align + '-aligned">' + d.label + '</span>';
                html += '</div>';
            }
            html += '</div>';
            return html;
        }

        function renderTooltip(serieIdx, i) {
            var serie = series[serieIdx];
            var hasOutput = serie.outputValues.length > 0;
            var val = hasOutput
                ? escapeHtml(String(serie.outputValues[i]))
                : (escapeHtml(serie.prefix || '') + serie.values[i].toFixed(serie.decimals) + escapeHtml(serie.suffix || ''));
            var color = getColorValue(serie.color, i);

            return '<div class="nc-tooltip">'
                + '<div class="nc-tooltip-header">' + escapeHtml(serie.labels[i]) + '</div>'
                + '<div class="nc-tooltip-row">'
                + '<span class="nc-tooltip-dot" style="background-color:' + color + '"></span>'
                + '<span class="nc-tooltip-series">' + escapeHtml(serie.title) + '</span>'
                + '<span class="nc-tooltip-value">' + val + '</span>'
                + '</div>'
                + '<div class="nc-tooltip-arrow"></div>'
                + '</div>';
        }

        function renderItemContent(serieIdx, i, opts) {
            var serie = series[serieIdx];
            var hasOutput = serie.outputValues.length > 0;
            var val = hasOutput ? escapeHtml(String(serie.outputValues[i])) : serie.values[i];
            var pre = hasOutput ? '' : escapeHtml(serie.prefix || '');
            var suf = hasOutput ? '' : escapeHtml(serie.suffix || '');
            var hideLabel = opts && opts.hideLabel;
            var hideValue = opts && opts.hideValue;

            return '<span class="nc-main">'
                + (hideLabel ? '' : '<span class="nc-label">' + escapeHtml(serie.labels[i]) + '</span>')
                + (hideValue ? '' : '<span class="nc-value">' + pre + val + suf + '</span>')
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
                html += '<div class="nc-threshold" style="height:' + val + '%"></div>';
            });
            return html;
        }

        function renderColumn() {
            var html = '';
            var count = series.length;
            if (!count) return html;

            var hasNeg = minValue < 0;
            var range = hasNeg ? valueRange : maxValue;

            if (hasNeg) {
                html += '<div class="nc-baseline" style="bottom:' + fix((-minValue) / range * 100) + '%"></div>';
            }

            var len = series[0].values.length;
            var isGrouped = count > 1;
            for (var i = 0; i < len; i++) {
                if (isGrouped) html += '<div class="nc-group">';
                for (var idx = 0; idx < count; idx++) {
                    var val = series[idx].values[i];
                    var h = range > 0 ? fix(Math.abs(val) / range * 100) : 0;
                    var style = 'height:' + h + '%;' + getColor(series[idx].color, i) + delay(i);
                    if (hasNeg) {
                        if (val >= 0) {
                            style += 'bottom:' + fix((-minValue) / range * 100) + '%;';
                        } else {
                            style += 'bottom:' + fix((-minValue - Math.abs(val)) / range * 100) + '%;';
                        }
                    }
                    html += '<div class="nc-item"' + dataAttr(idx, i) + ' style="' + style + '">';
                    html += renderItemContent(idx, i, { hideLabel: true });
                    html += renderTooltip(idx, i);
                    html += '</div>';
                }
                if (isGrouped) {
                    html += '</div>';
                }
            }
            return html;
        }

        function renderStackedColumn() {
            var html = '';
            getMaxSum();
            var len = series[0].values.length;

            for (var i = 0; i < len; i++) {
                var items = '';
                var tooltip = '<div class="nc-tooltip">';
                tooltip += '<div class="nc-tooltip-header">' + escapeHtml(series[0].labels[i]) + '</div>';

                for (var s = 0; s < series.length; s++) {
                    var serie = series[s];
                    var h = serie.values[i] * 100 / maxStacked;
                    var color = getColorValue(serie.color, i);
                    var val = serie.outputValues && serie.outputValues.length > 0
                        ? escapeHtml(String(serie.outputValues[i]))
                        : (escapeHtml(serie.prefix) + serie.values[i].toFixed(serie.decimals) + escapeHtml(serie.suffix));

                    tooltip += '<div class="nc-tooltip-row">'
                        + '<span class="nc-tooltip-dot" style="background-color:' + color + '"></span>'
                        + '<span class="nc-tooltip-series">' + escapeHtml(serie.title) + '</span>'
                        + '<span class="nc-tooltip-value">' + val + '</span>'
                        + '</div>';

                    items += '<div class="nc-item"' + dataAttr(s, i) + ' style="height:' + fix(h) + '%;' + getColor(serie.color, i) + '">';
                    items += renderItemContent(s, i, { hideLabel: true, hideValue: true });
                    items += '</div>';
                }

                tooltip += '<div class="nc-tooltip-arrow"></div></div>';
                html += '<div class="nc-stack"' + dataAttr(0, i) + '>' + tooltip + items + '</div>';
            }
            return html;
        }

        function renderBar() {
            var html = '';
            var count = series.length;
            if (!count) return html;

            var isGrouped = count > 1;
            var hasNeg = minValue < 0;
            var range = hasNeg ? valueRange : maxValue;

            var len = series[0].values.length;
            for (var i = 0; i < len; i++) {
                html += isGrouped ? '<div class="nc-group">' : '';
                for (var idx = 0; idx < count; idx++) {
                    var val = series[idx].values[i];
                    var w = range > 0 ? fix(Math.abs(val) / range * 100) : 0;
                    var style = 'width:' + w + '%;' + getColor(series[idx].color, i) + delay(i);
                    if (hasNeg) {
                        if (val >= 0) {
                            style += 'margin-left:' + fix((-minValue) / range * 100) + '%;';
                        } else {
                            style += 'margin-left:' + fix((-minValue - Math.abs(val)) / range * 100) + '%;';
                        }
                    }
                    html += '<div class="nc-item"' + dataAttr(idx, i) + ' style="' + style + '">';
                    html += renderItemContent(idx, i, { hideLabel: true });
                    html += renderTooltip(idx, i);
                    html += '</div>';
                }
                if (isGrouped) {
                    html += '</div>';
                }
            }
            return html;
        }

        function renderStackedBar() {
            var html = '';
            getMaxSum();
            var len = series[0].values.length;

            for (var i = 0; i < len; i++) {
                html += '<div class="nc-stack">';
                for (var s = 0; s < series.length; s++) {
                    var w = series[s].values[i] * 100 / maxStacked;
                    html += '<div class="nc-item"' + dataAttr(s, i) + ' style="width:' + fix(w) + '%;' + getColor(series[s].color, i) + '">';
                    html += renderItemContent(s, i, { hideLabel: true, hideValue: true });
                    html += renderTooltip(s, i);
                    html += '</div>';
                }
                html += '</div>';
            }
            return html;
        }

        function renderHorizontalStacked(useZIndex) {
            var html = '';
            if (!series.length) return html;

            series.forEach(function (serie, idx) {
                var widths = sizeArray(serie.values, true);
                var len = serie.values.length;
                var left = 0;

                for (var i = 0; i < len; i++) {
                    var style = 'left:' + fix(left) + '%;width:' + fix(widths[i]) + '%;' + getColor(serie.color, i);
                    if (useZIndex) {
                        style += 'z-index:' + (len - i) + ';';
                    }
                    style += delay(i);
                    html += '<div class="nc-item"' + dataAttr(idx, i) + ' style="' + style + '">';
                    html += renderItemContent(idx, i, useZIndex ? {} : { hideLabel: true, hideValue: true });
                    html += renderTooltip(idx, i);
                    html += '</div>';
                    left += widths[i];
                }
            });
            return html;
        }

        function interpolatePoints(values, steps) {
            var len = values.length;
            if (len < 2) return values;
            var result = [];
            for (var i = 0; i < len - 1; i++) {
                var p0 = values[Math.max(0, i - 1)];
                var p1 = values[i];
                var p2 = values[Math.min(len - 1, i + 1)];
                var p3 = values[Math.min(len - 1, i + 2)];
                for (var s = 0; s < steps; s++) {
                    var t = s / steps;
                    var t2 = t * t;
                    var t3 = t2 * t;
                    var v = 0.5 * (
                        (2 * p1) +
                        (-p0 + p2) * t +
                        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
                        (-p0 + 3 * p1 - 3 * p2 + p3) * t3
                    );
                    result.push(v);
                }
            }
            result.push(values[len - 1]);
            return result;
        }

        function renderLineArea() {
            var isArea = type === 'area';
            var html = '';
            var isSmooth = config.smooth;

            var smoothSteps = 8;

            series.forEach(function (serie, idx) {
                var len = serie.values.length;
                if (len < 2) return;

                var color = serie.color.length > 0 ? serie.color[0] : '#00aeef';
                var smoothVals = isSmooth ? interpolatePoints(serie.values, smoothSteps) : serie.values;
                var smoothLen = smoothVals.length;

                if (isArea) {
                    html += '<div class="nc-area-fill" data-area-series="' + idx + '" style="background-color:' + color + '"></div>';
                }

                for (var i = 0; i < smoothLen - 1; i++) {
                    html += '<div class="nc-line-segment" data-series="' + idx + '" data-seg="' + i + '" style="background-color:' + color + ';' + delay(isSmooth ? Math.floor(i / smoothSteps) : i) + '"></div>';
                }

                // Dots at original data points (positioned in post-render via positionDots)
                for (var i = 0; i < len; i++) {
                    html += '<div class="nc-dot"' + dataAttr(idx, i) + ' data-dot-series="' + idx + '" data-dot-index="' + i + '" style="border-color:' + color + ';' + delay(i) + '">';
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
            if (!allValues.length) return renderEmpty();
            var heatMin = Math.min.apply(null, allValues);
            var heatMax = Math.max.apply(null, allValues);
            var heatRange = heatMax - heatMin;

            // Low color: dark muted version of the background
            var lowRgb = { r: 26, g: 26, b: 46 };

            var cols = series[0].labels.length;
            var rows = series.length;

            // Column labels
            html += '<div class="nc-heatmap-col-labels" style="grid-template-columns:repeat(' + cols + ',1fr)">';
            for (var c = 0; c < cols; c++) {
                html += '<span class="nc-heatmap-col-label">' + escapeHtml(series[0].labels[c]) + '</span>';
            }
            html += '</div>';

            // Grid
            html += '<div class="nc-heatmap-grid" style="grid-template-columns:repeat(' + cols + ',1fr);grid-template-rows:repeat(' + rows + ',1fr)">';
            for (var s = 0; s < rows; s++) {
                var serie = series[s];
                var highRgb = parseHexColor(getColorValue(serie.color, 0));
                for (var i = 0; i < serie.values.length; i++) {
                    var intensity = heatRange > 0 ? (serie.values[i] - heatMin) / heatRange : 0.5;
                    var cellColor = interpolateColor(lowRgb, highRgb, intensity);
                    var hasOutput = serie.outputValues.length > 0;
                    var val = hasOutput ? escapeHtml(String(serie.outputValues[i])) : (escapeHtml(serie.prefix || '') + serie.values[i] + escapeHtml(serie.suffix || ''));
                    var titleVal = hasOutput ? serie.outputValues[i] : ((serie.prefix || '') + serie.values[i] + (serie.suffix || ''));

                    html += '<div class="nc-heatmap-cell"' + dataAttr(s, i) + ' style="background-color:' + cellColor + '" title="' + escapeHtml(serie.title + ': ' + titleVal) + '">';
                    html += '<span class="nc-heatmap-value">' + val + '</span>';
                    html += renderTooltip(s, i);
                    html += '</div>';
                }
            }
            html += '</div>';

            // Row labels
            html += '<div class="nc-heatmap-row-labels" style="grid-template-rows:repeat(' + rows + ',1fr)">';
            for (var s = 0; s < rows; s++) {
                html += '<span class="nc-heatmap-row-label">' + escapeHtml(series[s].title) + '</span>';
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
                var hasOutput = serie.outputValues.length > 0;
                var val = hasOutput ? escapeHtml(String(serie.outputValues[item.itemIdx])) : (escapeHtml(serie.prefix || '') + item.value + escapeHtml(serie.suffix || ''));

                html += '<div class="nc-treemap-cell"' + dataAttr(item.serieIdx, item.itemIdx) + ' style="'
                    + 'left:' + fix(r.x) + '%;top:' + fix(r.y) + '%;'
                    + 'width:' + fix(r.w) + '%;height:' + fix(r.h) + '%;'
                    + 'background-color:' + item.color + ';'
                    + delay(i) + '">';
                html += '<span class="nc-treemap-label">' + escapeHtml(item.label) + '</span>';
                html += '<span class="nc-treemap-value">' + val + '</span>';
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

            return '<div class="nc-ring" style="background:conic-gradient(from ' + startDeg + 'deg, ' + trackColor + ' 0deg, ' + trackColor + ' ' + arcDeg + 'deg, transparent ' + arcDeg + 'deg);--gauge-color:' + color + '"'
                + ' data-start="' + startDeg + '" data-arc="' + arcDeg + '" data-pct="' + pct + '"'
                + ' data-color="' + color + '" data-track="' + trackColor + '"'
                + ' data-value-num="' + (numMatch ? parseFloat(numMatch[2]) : current) + '"'
                + ' data-value-prefix="' + escapeHtml(numMatch ? numMatch[1] : '') + '"'
                + ' data-value-suffix="' + escapeHtml(valueSuffix) + '"'
                + ' data-value-decimals="' + (numMatch && numMatch[2].indexOf('.') !== -1 ? numMatch[2].split('.')[1].length : 0) + '">'
                + '<div class="nc-ring-inner"></div>'
                + '<div class="nc-ring-content">'
                + '<span class="nc-label">' + escapeHtml(serie.title) + '</span>'
                + '<span class="nc-value">0' + escapeHtml(valueSuffix) + '</span>'
                + '</div></div>';
        }

        function renderLegend() {
            if (!config.legend || type === 'gauge' || type === 'treemap') return '';

            // Single series with multiple colors: item-level legend
            // Skip for chart types that already show labels on each item
            if (series.length === 1 && !render.stacked) {
                var serie = series[0];
                if (serie.color.length <= 1) return '';
                if (type === 'bar' || type === 'column' || type === 'waterfall' || type === 'progress') return '';
                var html = '<div class="nc-legend">';
                for (var i = 0; i < serie.labels.length; i++) {
                    var color = getColorValue(serie.color, i);
                    html += '<div class="nc-legend-item">'
                        + '<span class="nc-legend-dot" style="background-color:' + color + '"></span>'
                        + '<span class="nc-legend-label">' + escapeHtml(serie.labels[i]) + '</span>'
                        + '</div>';
                }
                return html + '</div>';
            }

            // Multi-series: series-level legend
            if (series.length < 2) return '';

            var html = '<div class="nc-legend">';
            series.forEach(function (serie) {
                var color = serie.color.length > 0 ? serie.color[0] : '#00aeef';
                html += '<div class="nc-legend-item">'
                    + '<span class="nc-legend-dot" style="background-color:' + color + '"></span>'
                    + '<span class="nc-legend-label">' + escapeHtml(serie.title) + '</span>'
                    + '</div>';
            });
            return html + '</div>';
        }

        // Build classes
        var classes = ['nc-chart'];
        classes.push(type === 'line' ? 'nc-linechart' : 'nc-' + type);
        if (render.stacked) classes.push('is-stacked');
        if (config.cssClass) classes.push(config.cssClass);
        if (config.layout.height === 'auto') classes.push('has-height-auto');
        if (config.fit) classes.push('is-fit');
        if (config.highlight) classes.push('has-highlight');
        if (config.animate) classes.push('nc-animate');
        if (config.theme === 'light') classes.push('nc-light');

        var heightProp = type === 'gauge' ? 'height' : 'min-height';
        var chartTemplate = '<div class="' + classes.join(' ') + '" style="width:' + config.layout.width + ';' + heightProp + ':' + config.layout.height + '">';
        if (config.title.text) {
            chartTemplate += '<div class="nc-title" style="text-align:' + config.title.align + '">' + escapeHtml(config.title.text);
            if (config.title.subtitle) {
                chartTemplate += '<div class="nc-subtitle">' + escapeHtml(config.title.subtitle) + '</div>';
            }
            chartTemplate += '</div>';
        }
        chartTemplate += '<div class="nc-chart-body">';

        var useGrid = (type === 'line' || type === 'area' || type === 'column' || type === 'bar' || type === 'waterfall');
        var isHorizontalBar = type === 'bar' || type === 'waterfall';
        var skipGuidelines = type === 'gauge' || type === 'heatmap' || type === 'treemap' || type === 'progress' || (type === 'bar' && render.stacked);

        // Bar/waterfall: render y-axis labels (category names) before the plot
        if (isHorizontalBar && series.length > 0 && series[0].labels.length > 0) {
            var isGrouped = series.length > 1 && !render.stacked;
            var yHtml = '<div class="nc-yaxis">';
            var len = series[0].values.length;
            if (isGrouped) {
                for (var yi = 0; yi < len; yi++) {
                    yHtml += '<div class="nc-label-group">';
                    yHtml += '<span class="nc-label-item">' + escapeHtml(series[0].labels[yi]) + '</span>';
                    yHtml += '</div>';
                }
            } else if (render.stacked) {
                for (var yi = 0; yi < len; yi++) {
                    yHtml += '<span class="nc-label-item">' + escapeHtml(series[0].labels[yi]) + '</span>';
                }
            } else {
                for (var yi = 0; yi < len; yi++) {
                    yHtml += '<span class="nc-label-item">' + escapeHtml(series[0].labels[yi]) + '</span>';
                }
            }
            yHtml += '</div>';
            chartTemplate += yHtml;
        }

        chartTemplate += '<div class="nc-canvas nc-plot">';
        if (!skipGuidelines) {
            if (render.threshold && render.threshold.length) {
                chartTemplate += renderThreshold();
            }
            if (useGrid) {
                chartTemplate += renderGuideLines(config.layout.lines.number);
            } else {
                chartTemplate += renderGuidelines(config.layout.lines.number, config.layout.lines.align);
            }
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
                    chartTemplate += renderHorizontalStacked(true);
                    break;
                case 'waterfall':
                    chartTemplate += renderHorizontalStacked(false);
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

        chartTemplate += '</div>'; // close .nc-plot

        // For grid layouts, render axis labels outside .nc-plot but inside .nc-chart-body
        if (useGrid && !skipGuidelines && !isHorizontalBar) {
            // Line/area/column: y-axis = guideline values on the right
            chartTemplate += renderAxisLabels(config.layout.lines.number, 'y');
        }

        // Footer: x-axis + legend — always rendered for consistent height across sibling charts
        chartTemplate += '<div class="nc-footer">';

        if (useGrid && !skipGuidelines) {
            if (isHorizontalBar) {
                // Bar/waterfall: x-axis = guideline values (horizontal axis)
                chartTemplate += renderAxisLabels(config.layout.lines.number, 'x');
            } else if (series.length > 0 && series[0].labels.length > 0) {
                // Line/area/column: x-axis = series labels
                var xHtml = '<div class="nc-xaxis">';
                var lbls = series[0].labels;
                for (var li = 0; li < lbls.length; li++) {
                    xHtml += '<span class="nc-axis-label">' + escapeHtml(lbls[li]) + '</span>';
                }
                xHtml += '</div>';
                chartTemplate += xHtml;
            }
        }

        chartTemplate += renderLegend();
        chartTemplate += '</div>'; // close .nc-footer
        chartTemplate += '</div>'; // close .nc-chart-body
        chartTemplate += '</div>';

        // Clean up previous instance
        if (element._ncDestroy) {
            element._ncDestroy();
        }

        element.innerHTML = chartTemplate;

        // Event callbacks
        var clickHandler = null;
        var hoverHandler = null;

        function getEventData(target) {
            var el = target.closest('[data-nc-series]');
            if (!el) return null;
            var si = parseInt(el.dataset.ncSeries, 10);
            var ii = parseInt(el.dataset.ncIndex, 10);
            var serie = series[si];
            if (!serie) return null;
            return {
                seriesIndex: si,
                index: ii,
                value: serie.values[ii],
                label: serie.labels[ii],
                seriesTitle: serie.title,
                element: el
            };
        }

        if (config.onClick) {
            clickHandler = function (e) {
                var data = getEventData(e.target);
                if (data) config.onClick(data, e);
            };
            element.addEventListener('click', clickHandler);
        }

        if (config.onHover) {
            hoverHandler = function (e) {
                var data = getEventData(e.target);
                if (data) config.onHover(data, e);
            };
            element.addEventListener('mouseover', hoverHandler);
        }

        // Post-render: position line segments
        var resizeHandler = null;
        var gaugeAnimId = null;

        function positionSegments(canvas, segs) {
            var cw = canvas.clientWidth;
            var ch = canvas.clientHeight;
            var hasNeg = minValue < 0;
            var range = hasNeg ? valueRange : maxValue;

            segs.forEach(function (seg) {
                var si = parseInt(seg.dataset.series, 10);
                var gi = parseInt(seg.dataset.seg, 10);
                var serie = series[si];
                var isSmooth = config.smooth;
                var smoothSteps = 8;
                var vals = isSmooth ? interpolatePoints(serie.values, smoothSteps) : serie.values;
                var total = vals.length;

                var v1 = vals[gi];
                var v2 = vals[gi + 1];
                var x1 = (gi / (total - 1)) * cw;
                var y1 = (1 - (range > 0 ? (v1 - minValue) / range : 0)) * ch;
                var x2 = ((gi + 1) / (total - 1)) * cw;
                var y2 = (1 - (range > 0 ? (v2 - minValue) / range : 0)) * ch;

                var dx = x2 - x1;
                var dy = y2 - y1;
                var dist = Math.sqrt(dx * dx + dy * dy);
                var angle = Math.atan2(dy, dx) * 180 / Math.PI;

                seg.style.width = fix(dist) + 'px';
                seg.style.left = x1 + 'px';
                seg.style.top = y1 + 'px';
                seg.style.transform = 'rotate(' + fix(angle) + 'deg)';
            });
        }

        function positionAreaFills(canvas) {
            var hasNeg = minValue < 0;
            var range = hasNeg ? valueRange : maxValue;
            var fills = canvas.querySelectorAll('.nc-area-fill');

            fills.forEach(function (fill) {
                var si = parseInt(fill.dataset.areaSeries, 10);
                var serie = series[si];
                var isSmooth = config.smooth;
                var smoothSteps = 8;
                var vals = isSmooth ? interpolatePoints(serie.values, smoothSteps) : serie.values;
                var total = vals.length;
                var poly = [];

                for (var i = 0; i < total; i++) {
                    var xPct = fix((i / (total - 1)) * 100);
                    var yPct = fix((1 - (range > 0 ? (vals[i] - minValue) / range : 0)) * 100);
                    poly.push(xPct + '% ' + yPct + '%');
                }
                // Close polygon at bottom-right and bottom-left (at y=0 baseline)
                poly.push('100% 100%');
                poly.push('0% 100%');
                fill.style.clipPath = 'polygon(' + poly.join(',') + ')';
            });
        }

        function positionDots(canvas, dots) {
            var cw = canvas.clientWidth;
            var ch = canvas.clientHeight;
            var hasNeg = minValue < 0;
            var range = hasNeg ? valueRange : maxValue;

            dots.forEach(function (dot) {
                var si = parseInt(dot.dataset.dotSeries, 10);
                var di = parseInt(dot.dataset.dotIndex, 10);
                var serie = series[si];
                var val = serie.values[di];
                var len = serie.values.length;
                var x = (di / (len - 1)) * cw;
                var y = (1 - (range > 0 ? (val - minValue) / range : 0)) * ch;
                dot.style.left = x + 'px';
                dot.style.top = y + 'px';
            });
        }

        var resizeObserver = null;
        var gap = config.gap !== undefined ? config.gap : 2;
        var groupGap = Math.max(1, Math.floor(gap / 2));

        function toggleLegend(el) {
            var legend = el.querySelector('.nc-legend');
            if (!legend) return;
            // Show legend temporarily to measure it
            legend.style.display = '';
            var legendH = legend.offsetHeight;
            var chartH = el.clientHeight;
            // Hide if legend takes more than a third of the chart
            legend.style.display = legendH > chartH / 3 ? 'none' : '';
        }

        function sizeColumns(canvas) {
            var children = [];
            for (var c = 0; c < canvas.children.length; c++) {
                var ch = canvas.children[c];
                if (ch.classList.contains('nc-guidelines') || ch.classList.contains('nc-threshold') || ch.classList.contains('nc-baseline')) continue;
                children.push(ch);
            }
            var n = children.length;
            if (!n) return;

            var totalGap = gap * (n - 1);
            var available = canvas.clientWidth - totalGap;
            var baseWidth = Math.floor(available / n);
            var remainder = available - baseWidth * n;
            var left = 0;

            // Get matching x-axis labels from footer
            var xaxis = element.querySelector('.nc-xaxis');
            var xLabels = xaxis ? xaxis.querySelectorAll('.nc-axis-label') : [];

            for (var i = 0; i < n; i++) {
                var w = baseWidth + (i < remainder ? 1 : 0);
                var el = children[i];
                el.style.position = 'absolute';
                if (!el.style.bottom) el.style.bottom = '0';
                el.style.left = left + 'px';
                el.style.width = w + 'px';

                // Size items within groups
                if (el.classList.contains('nc-group') || el.classList.contains('nc-stack')) {
                    var items = el.querySelectorAll('.nc-item');
                    var gn = items.length;
                    if (gn > 0 && el.classList.contains('nc-group')) {
                        var gTotalGap = groupGap * (gn - 1);
                        var gAvail = w - gTotalGap;
                        var gBase = Math.floor(gAvail / gn);
                        var gRem = gAvail - gBase * gn;
                        var gLeft = 0;
                        for (var j = 0; j < gn; j++) {
                            var gw = gBase + (j < gRem ? 1 : 0);
                            items[j].style.position = 'absolute';
                            if (!items[j].style.bottom) items[j].style.bottom = '0';
                            items[j].style.left = gLeft + 'px';
                            items[j].style.width = gw + 'px';
                            gLeft += gw + groupGap;
                        }
                    }
                    el.style.height = '100%';
                }

                // Position matching x-axis label
                if (xLabels[i]) {
                    xLabels[i].style.position = 'absolute';
                    xLabels[i].style.left = left + 'px';
                    xLabels[i].style.width = w + 'px';
                    xLabels[i].style.textAlign = 'center';
                }

                left += w + gap;
            }

            // Set xaxis to relative positioning so absolute labels work
            if (xaxis) {
                xaxis.style.position = 'relative';
                xaxis.style.height = '18px';
            }
        }

        function sizeBars(canvas) {
            var children = [];
            for (var c = 0; c < canvas.children.length; c++) {
                var ch = canvas.children[c];
                if (ch.classList.contains('nc-guidelines') || ch.classList.contains('nc-threshold')) continue;
                children.push(ch);
            }
            var n = children.length;
            if (!n) return;

            var totalGap = gap * (n - 1);
            var available = canvas.clientHeight - totalGap;
            var baseHeight = Math.floor(available / n);
            var remainder = available - baseHeight * n;
            var top = 0;

            var yaxis = element.querySelector('.nc-yaxis');
            var yLabels = [];
            if (yaxis) {
                for (var y = 0; y < yaxis.children.length; y++) {
                    yLabels.push(yaxis.children[y]);
                }
            }

            for (var i = 0; i < n; i++) {
                var h = baseHeight + (i < remainder ? 1 : 0);
                var el = children[i];
                el.style.position = 'absolute';
                el.style.top = top + 'px';
                el.style.height = h + 'px';

                if (el.classList.contains('nc-group') || el.classList.contains('nc-stack')) {
                    el.style.left = '0';
                    el.style.width = '100%';

                    // Size items within groups
                    if (el.classList.contains('nc-group')) {
                        var items = [];
                        for (var gi = 0; gi < el.children.length; gi++) {
                            if (el.children[gi].classList.contains('nc-item')) items.push(el.children[gi]);
                        }
                        var gn = items.length;
                        if (gn > 0) {
                            var gTotalGap = groupGap * (gn - 1);
                            var gAvail = h - gTotalGap;
                            var gBase = Math.floor(gAvail / gn);
                            var gRem = gAvail - gBase * gn;
                            var gTop = 0;
                            for (var j = 0; j < gn; j++) {
                                var gh = gBase + (j < gRem ? 1 : 0);
                                items[j].style.position = 'absolute';
                                items[j].style.left = '0';
                                items[j].style.top = gTop + 'px';
                                items[j].style.height = gh + 'px';
                                gTop += gh + groupGap;
                            }
                        }
                    }
                } else if (type !== 'waterfall') {
                    el.style.left = '0';
                }

                if (yLabels[i]) {
                    yLabels[i].style.flex = 'none';
                    yLabels[i].style.height = h + 'px';
                }

                top += h + gap;
            }

            if (yaxis) {
                yaxis.style.gap = gap + 'px';
            }
        }

        function sizeTreemap(plot) {
            var cells = plot.querySelectorAll('.nc-treemap-cell');
            if (!cells.length) return;

            var pw = plot.clientWidth;
            var ph = plot.clientHeight;
            var halfGap = gap / 2;

            for (var i = 0; i < cells.length; i++) {
                var cell = cells[i];
                // Store original percentages on first call
                if (!cell.dataset.xPct) {
                    cell.dataset.xPct = parseFloat(cell.style.left);
                    cell.dataset.yPct = parseFloat(cell.style.top);
                    cell.dataset.wPct = parseFloat(cell.style.width);
                    cell.dataset.hPct = parseFloat(cell.style.height);
                }

                var xPct = parseFloat(cell.dataset.xPct) / 100;
                var yPct = parseFloat(cell.dataset.yPct) / 100;
                var wPct = parseFloat(cell.dataset.wPct) / 100;
                var hPct = parseFloat(cell.dataset.hPct) / 100;

                var x = Math.round(xPct * pw + halfGap);
                var y = Math.round(yPct * ph + halfGap);
                var x2 = Math.round((xPct + wPct) * pw - halfGap);
                var y2 = Math.round((yPct + hPct) * ph - halfGap);

                cell.style.left = x + 'px';
                cell.style.top = y + 'px';
                cell.style.width = Math.max(0, x2 - x) + 'px';
                cell.style.height = Math.max(0, y2 - y) + 'px';
            }
        }

        if (type === 'column') {
            var colCanvas = element.querySelector('.nc-plot');
            sizeColumns(colCanvas);

            var colResizeRaf;
            var onColResize = function () {
                if (colResizeRaf) cancelAnimationFrame(colResizeRaf);
                colResizeRaf = requestAnimationFrame(function () {
                    var items = colCanvas.querySelectorAll('.nc-item');
                    items.forEach(function (el) { el.style.transition = 'none'; });
                    sizeColumns(colCanvas);
                    toggleLegend(element);
                    colCanvas.offsetHeight;
                    items.forEach(function (el) { el.style.transition = ''; });
                });
            };

            if (typeof ResizeObserver !== 'undefined') {
                resizeObserver = new ResizeObserver(onColResize);
                resizeObserver.observe(element);
            } else {
                resizeHandler = onColResize;
                window.addEventListener('resize', resizeHandler);
            }
        }

        if (type === 'bar' || type === 'waterfall') {
            var barCanvas = element.querySelector('.nc-plot');
            sizeBars(barCanvas);

            var barResizeRaf;
            var onBarResize = function () {
                if (barResizeRaf) cancelAnimationFrame(barResizeRaf);
                barResizeRaf = requestAnimationFrame(function () {
                    sizeBars(barCanvas);
                    toggleLegend(element);
                });
            };

            if (typeof ResizeObserver !== 'undefined') {
                resizeObserver = new ResizeObserver(onBarResize);
                resizeObserver.observe(element);
            } else {
                resizeHandler = onBarResize;
                window.addEventListener('resize', resizeHandler);
            }

            // Sync highlight between plot items and y-axis labels
            if (config.highlight) {
                var hlYaxis = element.querySelector('.nc-yaxis');
                if (hlYaxis) {
                    var hlChildren = [];
                    for (var hi = 0; hi < barCanvas.children.length; hi++) {
                        var hc = barCanvas.children[hi];
                        if (!hc.classList.contains('nc-guidelines') && !hc.classList.contains('nc-threshold')) {
                            hlChildren.push(hc);
                        }
                    }

                    var hlLabels = [];
                    for (var hi = 0; hi < hlYaxis.children.length; hi++) {
                        hlLabels.push(hlYaxis.children[hi]);
                    }

                    function hlFindIndex(target, container, children) {
                        var el = target.closest('.nc-item, .nc-group, .nc-stack');
                        if (!el) return -1;
                        if (el.classList.contains('nc-item') && el.parentElement !== container) {
                            el = el.parentElement;
                        }
                        return children.indexOf(el);
                    }

                    function hlDimLabels(idx) {
                        for (var i = 0; i < hlLabels.length; i++) {
                            hlLabels[i].style.opacity = i === idx ? '1' : '.3';
                            hlLabels[i].style.transition = 'opacity .25s';
                        }
                    }

                    function hlDimItems(idx) {
                        for (var i = 0; i < hlChildren.length; i++) {
                            hlChildren[i].style.opacity = i === idx ? '1' : '.3';
                            hlChildren[i].style.transition = 'opacity .25s';
                        }
                    }

                    function hlClear() {
                        for (var i = 0; i < hlLabels.length; i++) {
                            hlLabels[i].style.opacity = '';
                            hlLabels[i].style.transition = '';
                        }
                        for (var i = 0; i < hlChildren.length; i++) {
                            hlChildren[i].style.opacity = '';
                            hlChildren[i].style.transition = '';
                        }
                    }

                    // Hovering items → dim labels
                    barCanvas.addEventListener('mouseover', function (e) {
                        var idx = hlFindIndex(e.target, barCanvas, hlChildren);
                        if (idx >= 0) hlDimLabels(idx);
                    });
                    barCanvas.addEventListener('mouseleave', hlClear);

                    // Hovering labels → dim items and labels
                    hlYaxis.addEventListener('mouseover', function (e) {
                        var label = e.target.closest('.nc-label-item, .nc-label-group');
                        if (!label) return;
                        // Find index: label-group wraps label-item, so check the direct child
                        var directChild = label.classList.contains('nc-label-group') ? label : label.parentElement;
                        if (directChild.classList.contains('nc-label-group')) {
                            var idx = hlLabels.indexOf(directChild);
                        } else {
                            var idx = hlLabels.indexOf(label);
                        }
                        if (idx >= 0) {
                            hlDimLabels(idx);
                            hlDimItems(idx);
                        }
                    });
                    hlYaxis.addEventListener('mouseleave', hlClear);
                }
            }
        }

        if (type === 'treemap') {
            var treemapPlot = element.querySelector('.nc-plot');
            sizeTreemap(treemapPlot);

            var tmResizeRaf;
            var onTmResize = function () {
                if (tmResizeRaf) cancelAnimationFrame(tmResizeRaf);
                tmResizeRaf = requestAnimationFrame(function () {
                    sizeTreemap(treemapPlot);
                    toggleLegend(element);
                });
            };

            if (typeof ResizeObserver !== 'undefined') {
                resizeObserver = new ResizeObserver(onTmResize);
                resizeObserver.observe(element);
            } else {
                resizeHandler = onTmResize;
                window.addEventListener('resize', resizeHandler);
            }
        }

        if (type === 'line' || type === 'area') {
            var canvas = element.querySelector('.nc-plot');
            var segs = canvas.querySelectorAll('.nc-line-segment');
            var dots = canvas.querySelectorAll('.nc-dot');

            positionSegments(canvas, segs);
            positionDots(canvas, dots);
            positionAreaFills(canvas);

            var resizeRaf;
            var onResize = function () {
                if (resizeRaf) cancelAnimationFrame(resizeRaf);
                resizeRaf = requestAnimationFrame(function () {
                    canvas.style.transition = 'none';
                    segs.forEach(function (s) { s.style.transition = 'none'; });
                    dots.forEach(function (d) { d.style.transition = 'none'; });
                    positionSegments(canvas, segs);
                    positionDots(canvas, dots);
                    positionAreaFills(canvas);
                    toggleLegend(element);
                    canvas.offsetHeight;
                    canvas.style.transition = '';
                    segs.forEach(function (s) { s.style.transition = ''; });
                    dots.forEach(function (d) { d.style.transition = ''; });
                });
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
            var ring = element.querySelector('.nc-ring');
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
                var gValEl = ring.querySelector('.nc-value');
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

        // Toggle legend on initial render and set up observer for chart types without one
        toggleLegend(element);
        if (!resizeObserver && !resizeHandler) {
            var legendRaf;
            var onLegendResize = function () {
                if (legendRaf) cancelAnimationFrame(legendRaf);
                legendRaf = requestAnimationFrame(function () { toggleLegend(element); });
            };
            if (typeof ResizeObserver !== 'undefined') {
                resizeObserver = new ResizeObserver(onLegendResize);
                resizeObserver.observe(element);
            } else {
                resizeHandler = onLegendResize;
                window.addEventListener('resize', resizeHandler);
            }
        }

        function destroy() {
            if (clickHandler) element.removeEventListener('click', clickHandler);
            if (hoverHandler) element.removeEventListener('mouseover', hoverHandler);
            if (resizeHandler) window.removeEventListener('resize', resizeHandler);
            if (resizeObserver) resizeObserver.disconnect();
            if (gaugeAnimId) cancelAnimationFrame(gaugeAnimId);
            element.innerHTML = '';
            delete element._ncDestroy;
        }

        element._ncDestroy = destroy;

        return {
            element: element,
            destroy: destroy,
            update: function (newOptions) {
                destroy();
                return neoCharts(element, deepMerge(options || {}, newOptions || {}));
            }
        };
    }

    root.neoCharts = neoCharts;
    root.simpleChart = neoCharts; // backward compat

})(window);
