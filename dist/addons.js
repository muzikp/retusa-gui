$(function(){

})

const resultAddons = function(analysis, $card, callback) {
    if(!addonLibs[analysis.name]) {
        if(callback) callback();
    }
    else {        
        for(let addon of addonLibs[analysis.name]) {
            if(addon.type == "chart") {
                var chdata = addon.data(analysis);
                createChartContainer($card, function(chid){
                    $(new Chart(document.getElementById(chid), chdata));
                    $(document).ready(() => callback ? callback() : false);
                });
                
            }
            else if(addon.type == "table") {
                var tdata = addon.data(analysis);
                $($card).find(".result-addons").append(tdata);
                $(document).ready(() => callback ? callback() : false);
            }
        }
    }
}

const addonLibs = {
    "frequency": [
        {
            type: "chart",
            data: function(analysis){
                var r = analysis.result;
                return {
                    data: {
                        datasets: [{
                            type: 'bar',
                            label: 'četnost',
                            yAxisID: 'pri',
                            data: r.map(_ => _.frequency)
                        }, {
                            type: 'line',
                            label: 'kumulativní četnost v %',
                            yAxisID: 'sec',
                            data: getCumulation(r.map(_ => _.frequency), true),
                        }],
                        labels: r.map(_ => _.value == null ? "-- prázdné --" : _.value)
                    },
                    options: {
                        plugins: {
                            ...getChartTitle(analysis)
                        },
                        scales: {
                            pri: {
                              type: 'linear',
                              display: true,
                              position: 'left',
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: "četnost"
                              }
                            },
                            sec: {
                              type: 'linear',
                              display: true,
                              position: 'right',
                              grid: {
                                drawOnChartArea: false
                              },
                              beginAtZero: true,
                              ticks: percentTicks,
                              title: {
                                display: true,
                                text: "kumulativní četnost v %"
                              }
                            },
                            sec: {
                              type: 'linear',
                              display: true,
                              position: 'right',
                              grid: {
                                drawOnChartArea: false
                              },
                              beginAtZero: true,
                              ticks: percentTicks,
                              title: {
                                display: true,
                                text: "kumulativní četnost v %"
                              }
                            }
                        }
                    }
                }
            }
        }
    ],
    "histogram": [
        {
            type: "chart",
            data: function(analysis){
                var curve = [];
                var r = analysis.result;
                var step = r[0].to - r[0].from;
                var avg = analysis.vector?.avg();
                var stdev = analysis.vector?.stdev();
                var min = analysis.vector?.min() // avg - 3*stdev;
                var max = analysis.vector?.max() // avg + 3*stdev;
                while (min <= max) {
                    curve.push(utils.distribution.normdist(min, avg, stdev));
                    min += step;
                }
                return {
                    data: {
                        datasets: [{
                            type: 'bar',
                            yAxisID: "pri",
                            label: 'četnost',
                            data: r.map(_ => _.n),
                            barPercentage: 1
                        }, {
                            type: 'line',
                            yAxisID: "sec",
                            label: 'normální rozdělení',
                            data: curve,
                            tension: 0.25
                        },
                        {
                            type: 'line',
                            yAxisID: "tri",
                            label: 'kumulativní četnost v %',
                            data: r.map(_ => _.pc),
                            tension: 0.5
                        }],
                        labels: r.map(_ => N(_.from) + " - " + N(_.to))
                    },
                    options: {
                        scales: {
                            pri: {
                              type: 'linear',
                              display: true,
                              position: 'left',
                              beginAtZero: true,
                              barPercentage: 3,
                              //ticks: percentTicks,
                              title: {
                                display: true,
                                text: "četnost"
                              }
                            },
                            sec: {
                              type: 'linear',
                              display: false,
                              position: 'right',
                              grid: {
                                drawOnChartArea: false
                              },
                              beginAtZero: true,
                              title: {
                                display: false
                              }
                              //ticks: percentTicks
                            },
                            tri: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                grid: {
                                  drawOnChartArea: false
                                },
                                beginAtZero: true,
                                ticks: percentTicks,
                                title: {
                                  display: true,
                                  text: "kumulativní četnost v %"
                                }
                              }
                        },
                        plugins: {
                            ...getChartTitle(analysis)
                        }
                      }
                }
            }
        }
    ],
    "genreg": [
        {
            type: "calculator",
            render: function(analysis) {

            }

        },
        {
            type: "chart",
            data: function(analysis) {
                var maxPointsToDisplay = 200;
                var _data = (analysis.matrix.maxRows() > maxPointsToDisplay ? 
                    analysis.matrix.select(analysis.args[0],analysis.args[1]).sample(maxPointsToDisplay) : 
                    analysis.matrix.select(analysis.args[0],analysis.args[1])
                    ).toArray();
                var cdata = new Array(..._data);
                _data.map(function(e){ 
                    switch(analysis.args[2]) {
                        case 2:
                            e[0] = Math.log(e[0]);
                            break;
                        case 3:
                            e[0] = 1/e[0];
                            break;
                        case 4:
                            e[1] = Math.log(e[1]);
                            break;
                        case 5:
                            e[0] = Math.log(e[0]);
                            e[0] = Math.log(e[1]);
                            break;
                    }
                    
                    return {x: e[0], y: e[1]}}
                    );
                var xmin = cdata.map(_ => _.x).min();
                var xmax = cdata.map(_ => _.x).max();
                var subtitle = analysis.matrix.maxRows() > maxPointsToDisplay ? `zobrazen náhodný výběr ${maxPointsToDisplay} ${_data.length > 2 ? "bodů" : "bodu"}` : null;
                var cvals = [];
                var clabel = [];
                for(var c = xmin; c <= xmax; c += (xmax-xmin)/_data.length) {
                    cvals.push({x: c, y: (analysis.result.beta0 + analysis.result.beta1 * c)});
                    //cvals.push({x: c, y: Math.log(c)})
                }
                return {
                    type: 'scatter',
                    data: {
                        datasets: [
                            {
                                type: "scatter",
                                xAxisID: "x",
                                data: cvals,
                                label: "y = f(x)",
                                borderColor: null,
                                borderWidth: 0,
                                pointRadius: 1,
                                pointHoverRadius: 0,
                                fill: false,
                                tension: 0,
                                showLine: true
                            },
                            {
                                type: "scatter",
                                xAxisID: "x",
                                label: `pozorované případy${subtitle ? " (výběr)" : ""}`,
                                data: _data
                            }
                        ],
                    },
                    options: {
                      scales: {
                        x: {
                          type: 'linear',
                          position: 'bottom'
                        }
                      },
                      plugins: {
                        ...ch_title(`${analysis.wiki.title} (${analysis.schema.form[2].enums.find(e => e.id == analysis.args[2]).title} model)`, subtitle)
                      }
                    }
                }
            }
        }

    ],
    "contingency": [
        {
            type: "table",
            data: function(analysis) {
                var rowLabels = analysis.matrix.item(analysis.args[0]).distinct().asc();
                var columnLabels = analysis.matrix.item(analysis.args[1]).distinct().asc();
                var na = analysis.matrix.select(...analysis.args).toArray();
                //if(rowLabels.length * columnLabels.length > 30) return "<p>pro zobrazení kontingenční tabulky je struktura tabulky příliš velká</p>";
                var $t = `<div class="result-addon-table-container"><div class="table-title">Kontingenční tabulka (abs. četnosti)</div>
                    <div class="table-responsive"><table class="table table-bordered"><tbody><tr><th></th>`;
                for(let cl of columnLabels) {
                    $t += `<th>${cl}</th>`
                };
                $t += "<th>CELKEM</th></tr>";
                for(let r of rowLabels) {
                    $t += `<tr><th>${r}</th>`;
                    var rowTotal = 0;
                    columnLabels.forEach(function(cl){
                        var n = na.filter(o => o[0] == r && o[1] == cl).length;
                        rowTotal += n;
                        $t += `<td>${N(n)}</td>`
                    });            
                    $t += `<th>${N(rowTotal)}</th></tr>`;
                }
                /* bottom summary */            
                $t += "<tr><th>CELKEM</th>";
                columnLabels.forEach(function(cl){
                    var n = na.filter(o => o[1] == cl).length;
                    $t += `<th>${N(n)}</th>`
                });  
                $t += "</tr>";           
                $t += "</tbody></table></div></div>";
                return $t;
            }
        }
    ],
    "anovaow": [
        {
            type: "chart",
            data: function(analysis) {
                var arrays = analysis.args[1] ? new Array(...new Matrix(analysis.matrix.item(analysis.args[1]), analysis.matrix.item(analysis.args[0][0])).pivot(1,0)) : new Array(...analysis.matrix);
                return getBoxPlot(analysis, arrays.map(v => v.name()), getArraysPercentiles(arrays));                
            }
        }
    ],
    "ttestind": [
        {
            type: "chart",
            data: function(analysis) {
                var arrays = (analysis.args[1] ? new Array(...new Matrix(analysis.matrix.item(analysis.args[1]), analysis.matrix.item(analysis.args[0][0])).pivot(1,0)).slice(0,2) : new Array(...analysis.matrix).slice(0,2));
                return getBoxPlot(analysis, arrays.map(v => v.name()), getArraysPercentiles(arrays));                              
            }
        }
    ],
    "ttestpair": [
        {
            type: "chart",
            data: function(analysis) {
                var arrays = new Array(...analysis.matrix);
                return getBoxPlot(analysis, arrays.map(v => v.name()), getArraysPercentiles(arrays));                            
            }
        }
    ],
    "mwu": [
        {
            type: "chart",
            data: function(analysis) {
                var arrays = (analysis.args[1] ? new Array(...new Matrix(analysis.matrix.item(analysis.args[1]), analysis.matrix.item(analysis.args[0][0])).pivot(1,0)).slice(0,2) : new Array(...analysis.matrix).slice(0,2));
                return getBoxPlot(analysis, arrays.map(v => v.name()), getArraysPercentiles(arrays));                              
            }
        }
    ],
};

function createChartContainer($card, callback) {
    /* adds and returns a unique ID of the .chart-container element for hosting the ChartJS object */
    var chid = srnd();
    $($card).find(".result-addons").append(`<canvas data-exportable id = "${chid}"></canvas>`).ready(function(){
        callback(chid);
    });
}

function createTableContainer($card, callback) {
    var t = srnd();
    $($card).find(".result-addons").append(`<canvas data-exportable id = "${chid}"></canvas>`).ready(function(){
        callback(chid);
    });
}

function ch_title(title, subtitle) {
    var t = {};
    if(title) {
        t.title = {
            display: true,
            text: title,
            font: {
                size: 24
            }
        }
    }
    if(subtitle) {
        t.subtitle = {
            display: true,
            text: subtitle,
            font: {
                size: 18
            }
        }
    }
    return t;
}

function getChartTitle(analysis) {
    return {
        subtitle: {
            display: !!analysis.wiki.title,
            text: analysis.wiki.title,
            font: {
                size: 18
            }
        },
        title: {
            display: !!analysis.parent?.name(),
            text: analysis.parent?.name(),
            font: {
                size: 24
            }
        }
    };    
}

function getCumulation(arr, percent = false) {

    var _arr = arr.map(function(e, index) {
        if(index > 0) return arr.slice(0, index+1).reduce((a,b) => a + b);
        else return e;
    });
    if(percent) {
        var sum = arr.reduce((a,b) => a + b);
        return _arr.map(_ => _/sum);
    } else return _arr;
}

percentTicks = {
    suggestedMax: 1,
    suggestedMin: 0,
    callback: function(val, index) {
      return N(val, {style: "percent"});
    }
}

function getBoxPlot(analysis, labels, data) {
    var ch = {
        type: 'boxplot',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pořadové statistiky',
                ...pluginColors(analysis),
                borderWidth: 1,
                padding: 10,
                itemRadius: 2,
                itemStyle: 'circle',
                itemBackgroundColor: '#000',
                outlierBackgroundColor: '#000',
                data: data,
              }],
        },
        options: {
          responsive: true,
          plugins: {
            ...ch_title(analysis.wiki.title, "min = 0,05p, max = 0,95p"),
            }
        }
    };
    console.log(ch.data.datasets[0].backgroundColor);
    return ch;
}

function getArraysPercentiles(arrays) {
   return arrays.map(function(vector) {
        return {
            min: vector.percentile(0.05),
            q1: vector.percentile(0.25),
            median: vector.percentile(0.5),
            mean: vector.avg(),
            q3: vector.percentile(0.75),
            max: vector.percentile(0.95)
        }
    });
}

function pluginColors(method) {
    if(typeof method == "object") method = method.name;
    return scaleColor(chartColorsByMethod[method] || chartColorsByMethod.default)
}

function scaleColor(o) {
    return {
        backgroundColor: `rgba(${o.r},${o.g},${o.b},0.2)`,
        borderColor: `rgba(${o.r},${o.g},${o.b},1)`,
    }                
}

chartColorsByMethod = {
    "anovaow": {r:64,g:12,b:15},
    "ttestind": {r:13,g:60,b:59},
    "ttestpair": {r:179,g:200,b:200},
    "mwu": {r: 66, g: 76, b: 86},
    "default": {r:12,g:12,b:12}
}

vectorContextMenuTree = [
    {
        type: "header",
        value: "Nastavení"
    },
    {
        type: "custom",
        id: "config",
        value: "konfigurace",
        function: function(sender){
            var vector = source.item($(sender).attr("data-vector-name"));
            var $f = $("#vector-config");
            $($f).attr("data-field", vector.name());
            $($f).find('[name="name"]').val(vector.name());
            $($f).find(`[data-type=${vector.type()}]`).prop("checked", true);
            $($f).attr("data-vector-name", vector.name());
            $("#modal_vector_config").modal("show");
        }        
    },
    {
        type: "custom",
        id: "filter",
        value: "filtrování dat",
        function: function(sender) {
            var vector = source.item($(sender).attr("data-vector-name"));
            var $f = $("#vector-filter");
            $($f).attr("data-field", vector.name());
            $($f).find('[name="name"]').val(vector.name());
            $f.find(".numeric-filters").attr("hidden", vector.type() > 1);
            $f.find(".selectable-filters").attr("hidden", vector.type() < 2);
            var vf = collectFiltersFromHeaders(vector.name());
            $f.find(`[name="fn"]`).val("")
            if(vf.type == "function") {
                $f.find(`[name="fn"]`).val(vf.filter);
            }
            else if(vector.type() > 1) {
                var $s = $f.find(`[data-filter-type = "select"]`).empty();
                for(var v of vector.distinct().asc()) {
                    var $o = $("<option>").text(v !== null ? v : "- prázdné -").attr("value", v !== null ? v : "");
                    if((vf.filter || []).indexOf(v) > -1) $o.attr("selected", true);
                    $s.append($o);
                }
            } else {
                if(typeof vf.filter == "object" && vf.filter) {
                    if(vf.filter.minv) $f.find(`[name="minv"]`).val(isN(vf.filter.minv) ? Number(vf.filter.minv) : "");
                    if(vf.filter.maxv) $f.find(`[name="maxv"]`).val(isN(vf.filter.maxv) ? Number(vf.filter.maxv) : "");
                    $f.find(`[name="minop"]`).val(vf.filter.minop || 1);
                    $f.find(`[name="maxop"]`).val(vf.filter.maxop || 3);
                } else {
                    $f.find(`[name="minv"]`).val(null);
                    $f.find(`[name="maxv"]`).val(null);
                    $f.find(`[name="minop"]`).val(1);
                    $f.find(`[name="maxop"]`).val(3);
                }
            }
            $(document).ready(function(){
                $("#modal_vector_filter").modal("show");
            });
        }
    },
    {
        type: "divider"      
    },
    {
        type: "header",
        value: "Analýza"
    },
    {
        type: "method",
        value: "count"        
    },
    {
        type: "method",
        value: "sum",        
    },
    {
        type: "parent",
        value: "poloha",
        id: "location",
        children: [
            {
                type: "method",
                value: "avg"        
            },
            {
                type: "method",
                value: "harmean"        
            },
            {
                type: "method",
                value: "geomean"        
            },
            {
                type: "divider"
            },
            {
                type: "method",
                value: "min"        
            },
            {
                type: "method",
                value: "max"        
            },
            {
                type: "method",
                value: "range"        
            },
            {
                type: "divider"
            },
            {
                type: "method",
                value: "median"        
            },
            {
                type: "method",
                value: "percentile"        
            },
            {
                type: "method",
                value: "mode"        
            }
        ]        
    },
    {
        type: "parent",
        value: "rozložení",
        id: "structure",
        children: [
            {
                type: "method",
                value: "stdev"        
            },
            {
                type: "method",
                value: "variance"        
            },
            {
                type: "method",
                value: "varc"        
            },
            {
                type: "method",
                value: "kurtosis"        
            },
            {
                type: "method",
                value: "skewness"        
            }
        ]        
    },
    {
        type: "parent",
        value: "frekvence",
        id: "freq",
        children: [
            {
                type: "method",
                value: "frequency"        
            },
            {
                type: "method",
                value: "histogram"        
            }
        ]        
    },
    {
        type: "parent",
        value: "testy",
        id: "tests",
        children: [
            {
                type: "method",
                value: "ttest"        
            },
            {
                type: "method",
                value: "swtest"        
            },
            {
                type: "method",
                value: "kstest"        
            }
        ]        
    },
    {
        type: "parent",
        value: "chybové testy",
        id: "errors",
        children: [
            {
                type: "method",
                value: "sem"        
            },
            {
                type: "method",
                value: "mci"        
            },
            {
                type: "method",
                value: "pci"        
            }
        ]        
    }
]

$(document).on("submit", "#vector-config", function() {
    var $f = $(this);
    var newName = $f.find(`[name="name"]`).val();
    var newType = $f.find(`[name="type"]:checked`).attr("data-type");
    var vector = source.item($f.attr("data-field"));
    var changes = 0;
    if(Number(newType) !== vector.type()) {
        try {
            source[source.indexOf(vector)] = vector.convert(newType, (v,i,a) => v === "null" ? null : v);
            changes++;
        } catch(e) {
            msg.error("Proměnnou nešlo zkonvertovat", e.message, 60000);
            //$f.one("submit", vectorCustomFns.configure($f));
        }
    }
    if(newName != vector.name()) {
        source[source.indexOf(vector)] = source[source.indexOf(vector)].name(newName);
        changes++;
    }
    if(changes > 0) loadMatrixToTable(source, function(){
        $("#modal_vector_config").modal("hide");
    }) 
    else $("#modal_vector_config").modal("hide");
    return false;
});

$(document).on("submit", "#vector-filter", function(event) {
    var $f = $(this);
    var vector = source.item($f.attr("data-field"));
    if($(event.originalEvent.submitter).attr("data-action") == "confirm") {
        if($f.find(`[name="fn"]`).val()) {
            var filter = $f.find(`[name="fn"]`).val();
            $(tableSelector).find(`th[data-field='${vector.name()}']`).attr("data-filter", filter.toString()).attr("data-filter-type", "function");
        }
        else if(vector.type() > 1) {
            var filter = $f.find(`[data-filter-type = "select"]`).val();
            $(tableSelector).find(`th[data-field='${vector.name()}']`).attr("data-filter",JSON.stringify(filter)).attr("data-filter-type", "array");
        } else {
            var filter = {
                minv: $f.find(`[name="minv"]`).val(),
                minop: Number($f.find(`[name="minop"]`).val()),
                maxv: $f.find(`[name="maxv"]`).val(),
                maxop: Number($f.find(`[name="maxop"]`).val())
            };
            $(tableSelector).find(`th[data-field='${vector.name()}']`).attr("data-filter",JSON.stringify(filter)).attr("data-filter-type", "numrange");
        }
        $(document).ready(function(){
            $(tableSelector).bootstrapTable('refresh');
            $("#modal_vector_filter").modal("hide");
        });
    }
    else if($(event.originalEvent.submitter).attr("data-action") == "clear") {  
        $(tableSelector).find(`th[data-field='${vector.name()}']`).removeAttr("data-filter").removeAttr("data-filter-type");
        $(document).ready(function(){
            $(tableSelector).bootstrapTable('refresh');
            $("#modal_vector_filter").modal("hide");
        });
    } else {
        console.log("Something else...")
    }
    return false;
})