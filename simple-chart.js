(function ($) {
    $.fn.simpleChart = function (options) {

        var config = $.extend(true, {}, $.fn.simpleChart.defaults, options);

        var chartTemplate, leftPosition = [], itemMargin, itemColor, itemWidth, itemHeight, i;
        var maxValue = 0, seriesCount = 0, maxStacked = 0;

        function setItemColor(colorArray, i) {
            var color;

            switch (colorArray.length) {
                case 0:
                    color = '';
                    break;

                case 1:
                    color = 'background-color:' + colorArray[0] + ';';
                    break;

                default:
                    color = 'background-color:' + colorArray[i] + ';';
                    break;
            }

            return color;
        }

        function setItemSize(arr, type) {
            var itemSize = [],
                nominator = 1,
                total;

            total = arraySum(arr);

            if (type) {
                nominator = total;
            } else {
                nominator = maxValue;
            }

            for (i = 0; i < arr.length; i++) {
                itemSize.push(arr[i] * 100 / nominator);
            }

            return itemSize;
        }

        function arraySum(arr) {
            var sum = 0;
            for (var i = 0; i < arr.length; i++) {
                sum += arr[i];
            }
            return sum;
        }

        function iterateSeries() {
            var newValue = 0;
            $.each(config.data.series, function (index, serie) {
                newValue = Math.max.apply(null, serie.values);
                if (maxValue < newValue) maxValue = newValue;
                seriesCount++;
            });
        }

        function getMaxSum() {
            var sumSerie = [];
            for (var i = 0; i < config.data.series.length; i++) {
                for (var j = 0; j < config.data.series[i].values.length; j++) {
                    typeof sumSerie[j] === "undefined" ? sumSerie[j] = config.data.series[i].values[j] : sumSerie[j] += config.data.series[i].values[j];
                    if (maxStacked < sumSerie[j]) {
                        maxStacked = sumSerie[j];
                    }
                }
            }
        }

        function renderEmpty() {
            var template = '';
            template += '<h2 class="sc-empty">' + config.data.render.empty + '</h2>';

            return template;
        }

        function renderGuidelines(number, align) {
            var guides = '', dimmension = '', lineType = '',
                step = Math.floor(maxValue / number),
                stepPos = 100 / number,
                stepArr = [0], stepPosArr = [0];

            if (number) {
                if (config.type === 'column') {
                    dimmension = 'height:';
                    lineType = 'is-horizontal';
                } else {
                    dimmension = 'width:';
                    lineType = 'is-vertical';
                    number--;
                }

                guides += '<div class="sc-guidelines">';
                for (var i = 0; i <= number; i++) {
                    guides += '<div class="sc-line ' + lineType + '" style="' + dimmension + stepPos + '%">';
                    guides += '<span class="sc-label is-' + align + '-aligned">' + (100 - stepPos * i) + '%</span>';
                    guides += '</div>';

                    stepPosArr.push(stepPosArr[i] + stepPos);
                    stepArr.push(stepArr[i] + step);
                }
                guides += '</div>';
            }

            return guides;
        }

        function renderTooltip(index, i) {
            var tooltip = '';
            tooltip += '<div class="sc-tooltip">';
            tooltip += '<span class="sc-value">';
            tooltip += '<span class="sc-type">' + config.data.series[index].title + ': </span>';
            tooltip += config.data.series[index].prefix + config.data.series[index].values[i].toFixed(config.data.series.decimals) + config.data.series[index].suffix;
            tooltip += '</span>';
            tooltip += '<span class="sc-label">' + config.data.series[index].labels[i] + '</span>';
            tooltip += '</div>';

            return tooltip;
        }

        function renderItemContent(index, i) {
            var itemContent = '', itemValue, itemPrefix, itemSuffix;

            config.data.series[index].outputValues.length > 0 ? itemValue = config.data.series[index].outputValues[i] : itemValue = config.data.series[index].values[i];
            config.data.series[index].prefix ? itemPrefix = config.data.series[index].prefix : itemPrefix = "";
            config.data.series[index].suffix ? itemSuffix = config.data.series[index].suffix : itemSuffix = "";

            itemContent += '<span class="sc-main">';
            itemContent += '<span class="sc-label">' + config.data.series[index].labels[i] + '</span>';
            itemContent += '<span class="sc-value">' + itemPrefix + itemValue + itemSuffix + '</span>';
            itemContent += '</span>';

            return itemContent;
        }


        function renderThreshold() {
            var template = '', thresholdValue;
            $.each(config.data.render.threshold, function(index, threshold){
                if (typeof threshold === 'string') {
                    thresholdValue = parseInt(threshold.substring(0, threshold.length - 1));
                } else {
                    thresholdValue = (threshold * 100 / maxValue).toFixed(3);
                }

                template += '<div class="sc-threshold" style="height:'+ thresholdValue +'%"></div>';
            });

            return template;

        }


        itemMargin = config.data.render.margin;

        function renderColumn() {
            var column = '', seriesIndex = 0;
            var seriesCount = config.data.series.length;

            if (seriesCount) {
                $.each(config.data.series, function (index, serie) {
                    var itemHeight = setItemSize(serie.values), serieLength = serie.values.length;
                    itemWidth = (100 - itemMargin * (serieLength * seriesCount + 1)) / serieLength / seriesCount;
                    for (var i = 0; i < serieLength; i++) {
                        itemColor = setItemColor(config.data.series[index].color, i);
                        column += '<div class="sc-item" style="left:' + ((itemWidth + itemMargin) * (i * seriesCount + seriesIndex) + itemMargin).toFixed(3) + '%;width:' + itemWidth.toFixed(3) + '%;height:' + itemHeight[i].toFixed(3) + '%;' + itemColor + '">';
                        column += renderItemContent(index, i);
                        column += renderTooltip(index, i);
                        column += '</div>';
                    }
                    seriesIndex++;
                });
            }

            return column;
        }

        function renderStackedColumn() {
            var stacked = '', seriesCount = 1, bottomPos = [];
            var itemHeight = [];
            getMaxSum();
            for (var s = 0; s < config.data.series.length; s++) {
                for (var i = 0; i < config.data.series[s].values.length; i++) {

                    itemWidth = (100 - itemMargin * (config.data.series[s].values.length + 1)) / config.data.series[s].values.length;
                    itemHeight[i] = config.data.series[s].values[i] * 100 / maxStacked;
                    itemColor = setItemColor(config.data.series[s].color, i);
                    s == 0 ? bottomPos[i] = 0 : bottomPos[i] += config.data.series[s - 1].values[i] * 100 / maxStacked;

                    var widthStyle = 'width:' + itemWidth.toFixed(3) + '%;';
                    var heightStyle = 'height:' + itemHeight[i].toFixed(3) + '%;';
                    var leftStyle = 'left:' + ((itemWidth + itemMargin) * (i * seriesCount) + itemMargin).toFixed(3) + '%;';
                    var bottomStyle = 'bottom:' + bottomPos[i].toFixed(3) + '%;';

                    stacked += '<div class="sc-item" style="' + leftStyle + bottomStyle + widthStyle + heightStyle + itemColor + '">';
                    stacked += renderItemContent(s, i);
                    stacked += renderTooltip(s, i);
                    stacked += '</div>';

                }
            }

            return stacked;
        }

        function renderStackedColumn2() {
            var tooltip, items, bottomPos = [];
            var itemHeight = [];
            var stacked = "";
            getMaxSum();
            for (var i = 0; i < config.data.series[0].values.length; i++) {
                items = '';
                tooltip = '<span class="sc-tooltip">';
                stacked += '<div class="sc-stack">';

                for (var s = 0; s < config.data.series.length; s++) {

                    itemWidth = (100 - itemMargin * (config.data.series[s].values.length + 1)) / config.data.series[s].values.length;
                    itemHeight[i] = config.data.series[s].values[i] * 100 / maxStacked;
                    itemColor = setItemColor(config.data.series[s].color, i);
                    s == 0 ? bottomPos[i] = 0 : bottomPos[i] += config.data.series[s - 1].values[i] * 100 / maxStacked;

                    var widthStyle = 'width:' + itemWidth.toFixed(3) + '%;';
                    var heightStyle = 'height:' + itemHeight[i].toFixed(3) + '%;';
                    var leftStyle = 'left:' + ((itemWidth + itemMargin) * i + itemMargin).toFixed(3) + '%;';
                    var bottomStyle = 'bottom:' + bottomPos[i].toFixed(3) + '%;';

                    tooltip += '<span class="sc-value">' + config.data.series[s].prefix + config.data.series[s].values[i].toFixed(config.data.series.decimals) + config.data.series[s].suffix + '</span>';
                    tooltip += '<span class="sc-label">' + config.data.series[s].labels[i] + '</span>';

                    items += '<div class="sc-item" style="' + leftStyle + bottomStyle + widthStyle + heightStyle + itemColor + '">';
                    items += renderItemContent(s, i);
                    items += '</div>';

                }
                tooltip += '</span>';
                stacked += tooltip;
                stacked += items;
                stacked += '</div>';
            }

            return stacked;
        }


        function renderBar() {
            var bar = '', seriesIndex = 0;
            if (seriesCount) {
                $.each(config.data.series, function (index, serie) {
                    var itemWidth = setItemSize(serie.values), serieLength = serie.values.length;
                    itemHeight = (100 - itemMargin * (serieLength * seriesCount + 1)) / serieLength / seriesCount;
                    for (var i = 0; i < serieLength; i++) {

                        var topStyle = 'top:' + ((itemHeight + itemMargin) * (i * seriesCount + seriesIndex) + itemMargin).toFixed(3) + '%;';
                        var heightStyle = 'height:' + itemHeight.toFixed(3) + '%;';
                        var widthStyle = 'width:' + itemWidth[i].toFixed(3) + '%;';

                        if (config.layout.height == 'auto') {
                            topStyle = 'top:auto;';
                            heightStyle = '';
                        }

                        itemColor = setItemColor(config.data.series[index].color, i);
                        bar += '<div class="sc-item" style="left:0;' + topStyle + widthStyle + heightStyle + itemColor + '">';
                        bar += renderItemContent(index, i);
                        bar += renderTooltip(index, i);
                        bar += '</div>';
                    }
                    seriesIndex++;
                });
            }
            return bar;
        }

        function renderStackedBar() {
            var stacked = '', seriesCount = 1, leftPos = [];
            var itemWidth = [];
            getMaxSum();
            for (var s = 0; s < config.data.series.length; s++) {
                for (var i = 0; i < config.data.series[s].values.length; i++) {
                    itemHeight = (100 - itemMargin * (config.data.series[s].values.length + 1)) / config.data.series[s].values.length;
                    itemWidth[i] = config.data.series[s].values[i] * 100 / maxStacked;
                    itemColor = setItemColor(config.data.series[s].color, i);

                    s === 0 ? leftPos[i] = 0 : leftPos[i] += config.data.series[s - 1].values[i] * 100 / maxStacked;

                    stacked += '<div class="sc-item" style="top:' + ((itemHeight + itemMargin) * (i * seriesCount) + itemMargin).toFixed(3) + '%;width:' + itemWidth[i].toFixed(3) + '%;height:' + itemHeight.toFixed(3) + '%;' + itemColor + 'left:' + leftPos[i] + '%">';
                    stacked += renderItemContent(s, i);
                    stacked += renderTooltip(s, i);
                    stacked += '</div>';
                }
            }
            return stacked;
        }

        function renderProgress() {
            var progress = '';
            if (seriesCount) {
                $.each(config.data.series, function (index, serie) {
                    var itemWidth = setItemSize(serie.values, 'absolute'), serieLength = serie.values.length;
                    for (var i = 0; i < serieLength; i++) {
                        itemColor = setItemColor(config.data.series[index].color, i);
                        (i - 1 >= 0) ? leftPosition[i] = leftPosition[i - 1] + itemWidth[i - 1] : leftPosition[0] = 0;
                        progress += '<div class="sc-item" style="left:' + leftPosition[i].toFixed(3) + '%;width:' + itemWidth[i].toFixed(3) + '%;' + itemColor + 'z-index:' + (serieLength - i) + '">';
                        progress += renderItemContent(index, i);
                        progress += renderTooltip(index, i);
                        progress += '</div>';
                    }
                });
            }
            return progress;
        }

        function renderWaterfall() {
            var waterfall = '';
            if (seriesCount) {
                $.each(config.data.series, function (index, serie) {
                    var itemWidth = setItemSize(serie.values, 'absolute'), serieLength = serie.values.length;
                    for (var i = 0; i < serieLength; i++) {
                        itemColor = setItemColor(config.data.series[index].color, i);
                        (i - 1 >= 0) ? leftPosition[i] = leftPosition[i - 1] + itemWidth[i - 1] : leftPosition[0] = 0;
                        waterfall += '<div class="sc-item" style="left:' + leftPosition[i].toFixed(3) + '%;width:' + itemWidth[i].toFixed(3) + '%;' + itemColor + '">';
                        waterfall += renderItemContent(index, i);
                        waterfall += renderTooltip(index, i);
                        waterfall += '</div>';
                    }
                });
            }
            return waterfall;
        }


        function renderGauge() {
            var gauge = '';
            gauge += '<div class="sc-background">';
            gauge += '<div class="sc-percentage"></div>';
            gauge += '<div class="sc-mask"></div>';
            gauge += '<span class="sc-value" style="transform:rotate(' + setGaugeRotation() + 'deg)">' + config.data.series.value + '</span>';
            gauge += '</div>';
            gauge += '<span class="sc-min">' + config.data.series.min + '</span>';
            gauge += '<span class="sc-max">' + config.data.series.min + '</span>';
            gauge += '</div>';

            return gauge;
        }

        iterateSeries();


        var isStackedClass = '';
        if (config.data.render.stacked) {
            isStackedClass = ' is-stacked'
        }

        if (config.layout.height === 'auto') {
            var autoHeightClass = ' has-height-auto';
        }

        chartTemplate = '<div class="sc-chart sc-' + config.type + isStackedClass + ' ' + config.cssClass + autoHeightClass + '" style="width:' + config.layout.width + ';height:' + config.layout.height + '">';
        chartTemplate += '<div class="sc-title" style="text-align:' + config.title.align + '">' + config.title.text + '</div>';
        chartTemplate += '<div class="sc-canvas">';

        if (config.data.render.threshold) {
            chartTemplate += renderThreshold();
        }

        chartTemplate += renderGuidelines(config.layout.lines.number, config.layout.lines.align);


        if (config.data.series && config.data.series[0].values.length > 0 && config.data.series[0].labels.length > 0) {

            switch (config.type) {
                case 'column':
                    if (config.data.render.stacked) {
                        chartTemplate += renderStackedColumn2();
                    } else {
                        chartTemplate += renderColumn();
                    }
                    break;

                case 'bar':
                    if (config.data.render.stacked) {
                        chartTemplate += renderStackedBar();
                    } else {
                        chartTemplate += renderBar();
                    }
                    break;

                case 'progress':
                    chartTemplate += renderProgress();
                    break;

                case 'waterfall':
                    chartTemplate += renderWaterfall();
                    break;

                case 'gauge':
                    chartTemplate += renderGauge();
                    break;

                case 'bullet':
                    chartTemplate += renderBullet();
                    break;

                default:
                    chartTemplate += renderBar();
                    break;
            }
        } else {
            chartTemplate += renderEmpty();
        }

        chartTemplate += '</div>';
        chartTemplate += '</div>';

        return this.html(chartTemplate);
    };


    $.fn.simpleChart.defaults = {
        type: 'column', /* progress, bar, waterfall, column */
        cssClass: '',
        title: {
            text: 'Simple Chart',
            align: 'right'
        },
        layout: {
            width: '100%', /* String value: in px or percentage */
            height: '300px', /* String value: in px or percentage or 'auto' */
            lines: {
                number: 4, /* Integer value: how many lines will be rendered on the background */
                align: 'right',
                value: 'percentage' // percentage vs nominal
            }
        },
        data: {
            render: {
                empty: "No data available.",
                stacked: false,
                margin: 0,
                threshold: [],
                aggregate: {
                    enabled: false,
                    min: false,
                    average: false,
                    max: false
                }
            },
            series: [
                {
                    title: "",
                    values: [], //Array integer
                    labels: [], // Array string
                    outputValues: [], // Optimized values: instead of 10240 bytes you can output 10kb if you provide the array
                    classes: [], //Css class for each item
                    colors: [], // Array of colors for the chart items
                    prefix: "",
                    suffix: "",
                    decimals: 2
                }
            ]
        },
        marker: null
    };

})(jQuery);
