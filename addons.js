$(function(){
    Argument.prototype.html = function(asHtml = true){
        var T = this.tag;
        var $h;
        if(T.control == "select") {
            $h = $(`<select class="form-select" name="${this.name}"></select>"`);
            if(this.required) $h.attr("required", true);
            if(T.multiple) $h.attr("multiple", true);
            if(this.isVector) {
                $h.attr("arg-type", "vector");
                $h.append($(`<option value="" disabled selected>-- ${locale.call("xnii")} --</option>`));
                var i = 0;
                for(let v of collectVectorConfigsForMatrixForm().filter(v => (T.type || [1, 2, 3]).indexOf(v.type) > -1))
                {
                    $h.append(`<option value=${v.name ? "\"" + v.name + "\"" : i}>${v.name || "#" + i}</option>`);
                    i++;
                }                
            } 
            else if(this.isEnum) {
                $h.attr("arg-type", "enum");
                for(let e of this.enums) {
                    $h.append(`<option value=${e.value} ${this.default === e.value ? "selected" : ""}>${e.title}</option>`);
                }
            }
        } 
        else if(T.control == "input") 
        {
            $h = $(`<input class="form-control" name = "${this.name}" type="${T.type}">`);
            if(T.required) $h.attr("required", true);
            if(T.type == "number") {
                $h.attr("data-type", "number");
                if(T.min !== undefined && T.min >= -Number.MAX_SAFE_INTEGER) $h.attr("min", T.min);
                if(T.max !== undefined && T.min <= Number.MAX_SAFE_INTEGER) $h.attr("max", T.max);
                if(T.step !== undefined) $h.attr("step", T.step || 1/Math.pow(10,10));
            }
        } 
        else if(T.control == "boolean") {
            $h = $(`<div class="form-check form-switch"></div>`);
            $h.attr("data-type", "boolen");
            var $i = $(`<input name = "${this.name}" class="form-check-input" type="checkbox" role="switch">`);
            if(this.required) $i.attr("required", true);
            $h.append($i);
        } else {
            throw new Error("Unrecognized control type: " + T.control);
        }
        if(asHtml) return $("<div></div>").append($h).html();
        else return $h;
    }
    MatrixAnalysis.prototype.paramOutputHtml = outputArgsOverviewHtml;
    VectorAnalysis.prototype.paramOutputHtml = outputArgsOverviewHtml;
    MatrixAnalysis.prototype.sampleOutputHtml = outputSampleOverviewHtml;
    VectorAnalysis.prototype.sampleOutputHtml = outputSampleOverviewHtml;
    Output.html = function(analysis) {
        var $h = `<table class="table main-result table-sm"><tbody>` + props(Output.fromAnalysis(analysis)) + `</tbody></table>`;
        return $h;
        function props(node, level = 0) {
            var m = "";
            if(node.type == "object")
            {
                if(level > 0) m += getOutputNodeLabels(node);
                m += `<td><table class="table _table-borderless table-sm"><tbody>`;
                level++;
                for(let k of Object.keys(node.properties)) {
                    m += props(node.properties[k], level);
                }
                m += `</tbody></table></td>`;
            } 
            else if(node.type == "array") {
                var types = {}, formats = {}, ranks = {};
                Object.keys(node.properties).forEach(function(p,i) {                    
                    types[p] = node.properties[p].type;
                    formats[p] = node.properties[p].format;
                    ranks[p] = i;
                });
                var m = "<tr>" + Object.entries(node.properties).map(e => e[1]).map(e => getOutputNodeLabels(e)).join("") + "</tr>";
                node.value.forEach(function(row) {
                    m += `<tr>` + Object.entries(node.properties).map(function(p) {
                        let f = p[1], k = p[0];                        
                        var v = row[k];
                        if(v === undefined) return `<td></td>`;
                        else return `<td class="${nodeClass(formats[k], v)}" data-value-type="${f.type}" __value=${v}>${FV(v, f.type)}</td>`}
                    ).join("") + "</tr>"
                })
                m += `</tbody></table>`;

            }
            else 
            {
                if(typeof analysis.result != "object" && level === 0) return `<div class="single-value-result" __value=${node.value} data-value-type="${node.type}">${FV(node.value, node.type)}</div>`;
                else m += `<tr>${getOutputNodeLabels(node)}<td class="${nodeClass(node.format, node.value)}" __value=${node.value} data-value-type="${node.type}">${FV(node.value, node.type)}</td>`
            }
            return m + `</tr>`;
        }
        function nodeClass(format, value) {
            if(format) {
                if(format == "sig") return value <= 0.001 ? "td-format-sig-3" : value <= 0.01 ? "td-format-sig-2" : value <= 0.05 ? "td-format-sig-1" : "td-format-sig-0";
                else if(format == "correl") return "td-format-correl-high"
                else return "";
            }   
            else return "";
        }
    }
    function outputArgsOverviewHtml() {
        var $p = $(`<div><table class="table implicit table-borderless table-sm"><tbody></tbody></table></div>`);
        for(let a of this.parameters()) {
            if(a.value === undefined) a.value === a.default;
            if(a.value === undefined) break;
            var l = `<td __text="${a.title.key}">${a.title.value}</td>`;
            var v = "";
            if(a.isVector) 
            {
                var vs = [];
                if(!a.multiple) {
                    vs = [a.value ? a.value.name() : null];
                }
                else {
                    vs = a.value.smap(v => v.name());
                }
                v = vs.map(v => `<code ${!v ? "__text = 'o1YS'" : ""}>${v || locale.call("o1YS")}</code>`).join(", ");
            } 
            else if(a.isEnum) {
                var en = a.enums.find(e => e.value == a.value);
                v = `<div __text="${en.key}">${en.title}</div>`
            }
            else if(a.tag.control == "boolean") {
                v = `<div>${a.value === true ? "✅" : a.value === false ? "❌" : "-"}</div>`
            }
            else if(a.tag.type == "number")
            {
                v = `<div __value=${a.value}>${N(a.value)}</div>`;
            }
            else 
            {
                v = `<div>${a.value}</div>`;
            }
            $p.find("tbody").append(`<tr>${l}<td>${v}</td></tr>`);
            
        }
        return $p.html();
    }
    function outputSampleOverviewHtml() {
        var $t = $(`<div><table class="table implicit table-borderless table-sm"><tbody></tbody></table></div>`);
        if(this.sample.raw !== undefined) $t.find("tbody").append(`<tr><td __text="FJ0J">${locale.call("FJ0J")}</td><td __value=${this.sample.raw}>${N(this.sample.raw)}</td></tr>`);
        if(this.sample.net !== undefined) $t.find("tbody").append(`<tr><td __text="NA7d">${locale.call("NA7d")}</td><td __value=${this.sample.net}>${N(this.sample.net)}</td></tr>`);
        if(this.sample.net !== undefined && this.sample.raw !== undefined) $t.find("tbody").append(`<tr><td __text="gTvq">${locale.call("gTvq")}</td><td __value=${this.sample.raw - this.sample.net}>${N(this.sample.raw - this.sample.net)}</td></tr>`);
        if(this.preprocessor?.key && userConfig.showOutputPreprocessor) $t.find("tbody").append(`<tr><td __text="jrdS">${locale.call("jrdS")}</td><td __text="${this.preprocessor.key}">${this.preprocessor.value}</td></tr>`);
        return $t.html();
    }
    function FV(value, type) {
        if(type == "number" || type == "zeroToOneInc") return N(value);
        else if(type == "integer" || type == "uint") return N(value);
        else if(type == "percent") return N(value, {style: "percent"});
        else return value;
    }
    function getOutputNodeLabels(node){
        if(userConfig.showOutputNodeTitle) {
            return `<td><div class="flex"><div class="node-name">${node.name}</div><div class="node-title" __text="${node.title.key}">${node.title.value}</div></div></td>`;
        } else {
            return `<td><div class="node-name" title="${node.title.value}" __title="${node.title.key}">${node.name}</div></td>`;
        }
    }
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
            else if(addon.type == "calculator") {
                createGeneralContainer($card, function(id){
                    $(`#${id}`).append(addon.render(analysis));
                });
            }
            else if(addon.type == "humanizer") {
                createGeneralContainer($card, function(id){
                    $(`#${id}`).append(`<div class="humanizer-container"><div class="humanizer-logo"><i class="fa-solid fa-hat-wizard"></i></div><div class="humanizer-text">${addon.fn(analysis)}</div></div>`);
                });
            }
         }
         $(document).ready(() => callback ? callback() : false);
    }
}

/* linreg calculator x changed event */ 
$(document).on("keyup change", ".linreg-x", function(){
    if($(this).val() == "") {
        $(this).closest(".inline-function").find(".linreg-y").val("");    
        return;
    }
    var beta0 = Number($(this).attr("beta0"));
    var beta1 = Number(Number($(this).attr("beta1")))
    var v = Number($(this).val());
    var est = beta0 + beta1*v;
    $(this).closest(".inline-function").find(".linreg-y").val(N(est));
})

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
                            label: locale.call("XKtF"),
                            yAxisID: 'pri',
                            data: r.map(_ => _.n)
                        }, {
                            type: 'line',
                            label: locale.call("Yntn"),
                            yAxisID: 'sec',
                            data: getCumulation(r.map(_ => _.n), true),
                        }],
                        labels: r.map(_ => _.v == null ? `-- ${locale.call("RICH")} --` : _.v)
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
                                text: locale.call("XKtF")
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
                                text: locale.call("Yntn")
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
                var avg = analysis.parent.avg();
                var stdev = analysis.parent.stdev();
                var min = analysis.parent.min() // avg - 3*stdev;
                var max = analysis.parent.max() // avg + 3*stdev;
                while (min <= max) {
                    curve.push(utils.distribution.normdist(min, avg, stdev));
                    min += step;
                }
                return {
                    data: {
                        datasets: [{
                            type: 'bar',
                            yAxisID: "pri",
                            label: locale.call("XKtF"),
                            data: r.map(_ => _.n),
                            barPercentage: 1
                        }, {
                            type: 'line',
                            yAxisID: "sec",
                            label: locale.call("HL1z"),
                            data: curve,
                            tension: 0.25
                        },
                        {
                            type: 'line',
                            yAxisID: "tri",
                            label: locale.call("Yntn"),
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
                                text: locale.call("XKtF")
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
                                  text: locale.call("Yntn")
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
    "linreg": [
        {
            type: "humanizer",
            fn: function(analysis) {
                var _ = analysis.result;
                var h = [];
                var _h = `Závislost proměnných <i>${analysis.args.x.name()}</i> a <i>${analysis.args.y.name()}</i> je `;
                if(Math.abs(_.r) > 0.2) {                    
                    if(Math.abs(_.r) > 0.9) _h += "<b>mimořádně silná</b>"
                    else if(Math.abs(_.r) > 0.75) _h += "<b>silná</b>"
                    else if(Math.abs(_.r) > 0.5) _h += "středně silná"
                    else if(Math.abs(_.r) > 0.25) _h += "mírná"
                    else _h += "velmi slabá";
                    _h += ` a to tak, že čím vyšší je hodnota <i>${analysis.args.x.name()}</i>, `;
                    if(_.r > 0) _h += `tím vyšší je hodnota`;
                    else _h += `tím menší je hodnota`
                    _h += ` <i>${analysis.args.y.name()}</i> a naopak; jinak řečeno, jejich závislost je <b>${_.r > 0 ? "přímo" : "nepřímo"} úměrná</b>.`;
                } else _h += ` tak malá, že v praktickém životě <u>nemá smysl ji věnovat pozornost</u>.`;
                h.push(_h);
                if(_.p < 0.05) h.push(`${Math.abs(_.r) <= 0.2 ? "Nicméně," : "A navíc,"} tato závislost je <b>statisticky významná</b>, a to s jistotou blížící se ${N(1 - analysis.result.p, {style: "percent"})}.`);
                else h.push(`${Math.abs(_.r) <= 0.2 ? "A navíc, tato závilost není ani statisticky závislá." : "Nicméně, tato závilost není statisticky závislá."}. Příčiny mohou být dvě: buďto v reálném světě spolu tyto veličiny skutečně nesouvisí, nebo já váš vzorek příliš malý na to, aby mu bylo možné věřit.`)
                return h.join(" ");
            }
        },
        {
            type: "calculator",
            render: function(analysis) {
                var $f = $(`
                    <div class="col-12">
                        <div class="inline-function-header" __text="ZhpG">${locale.call("ZhpG")}</div>
                        <div class="inline-function">
                        <div class="input-group mb-3"><span class="input-group-text">${analysis.args.x.name()}</span><input type="number" beta0 = ${analysis.result.beta0} beta1 = ${analysis.result.beta1} class="linreg-x form-control" __placeholder="81ll" placeholder="${locale.call("81ll")}"></div>
                        <div class="input-group mb-3"><span class="input-group-text">${analysis.args.y.name()}</span><input disabled readonly type="text" class="linreg-y form-control" __placeholder="4VPU" placeholder="${locale.call("4VPU")}"></div></div>
                `);
                return $f;               
            }

        },
        {
            type: "chart",
            data: function(analysis) {
                var maxPointsToDisplay = 200;
                var _data = (analysis.args.x.length > maxPointsToDisplay ? new Matrix(analysis.args.x,analysis.args.y).sample(maxPointsToDisplay) : new Matrix(analysis.args.x,analysis.args.y)).toArray();
                var cdata = new Array(..._data);
                _data.map(function(e){ 
                    switch(analysis.args.model) {
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
                var xmin = cdata.map(_ => _[0]).min();
                var xmax = cdata.map(_ => _[0]).max();
                var subtitle = analysis.args.x.length > maxPointsToDisplay ? `${locale.call("GsfY")} ${maxPointsToDisplay} ${_data.length > 2 ? locale.call("rbXL") : locale.call("xwc7")}` : null;
                var cvals = [];
                var clabel = [];
                for(var c = xmin; c <= xmax; c += (xmax-xmin)/_data.length) {
                    cvals.push([c, (analysis.result.beta0 + analysis.result.beta1 * c)]);
                }
                //debugger;
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
                                borderWidth: 1,
                                pointRadius: 1,
                                pointHoverRadius: 0,
                                sfill: false,
                                tension: 0,
                                showLine: true
                            },
                            {
                                type: "scatter",
                                xAxisID: "x",
                                label: `${locale.call("xGrE")}${subtitle ? " ("+ locale.call("eCly") + ")" : ""}`,
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
                        ...ch_title(`${analysis.title.value} (${analysis.parameters(true).model.enums.find(e => e.value == analysis.args.model).title} model)`, subtitle)
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
                var rowLabels = analysis.args.rows.distinct().asc();
                var columnLabels = analysis.args.columns.distinct().asc();
                var matrix = new Matrix(analysis.args.rows, analysis.args.columns, analysis.args.n?.isVector ? analysis.args.n : NumericVector.generate({total: analysis.args.length, min: 1, max: 1}).name("n"))//.toArray();
                var $t = `<div class="result-addon-table-container"><div class="table-title" __text="TnI4">${locale.call("TnI4")}</div>
                    <div class="table-responsive"><table class="table table-bordered"><tbody><tr><th></th>`;
                for(let cl of columnLabels) {
                    $t += `<th>${cl}</th>`
                };
                $t += `<th __text="j7ZA">${locale.call("j7ZA")}</th></tr>`;
                var clSum = [];
                for(let r of rowLabels) {
                    $t += `<tr><th>${r}</th>`;
                    var rowTotal = 0;
                    var c = 0;
                    columnLabels.forEach(function(cl){
                        var n = Array.prototype.sum.call(matrix.filter(0, (v) => v == r, 1, (v) => v == cl)[2]);
                        rowTotal += n;
                        clSum[c] = (clSum[c] || 0) + n;
                        $t += `<td data-value-type = "number" __value=${n}>${N(n)}</td>`;
                        c++;
                    });            
                    $t += `<th data-value-type = "number" __value=${rowTotal}>${N(rowTotal)}</th></tr>`;
                }
                /* bottom summary */            
                $t += `<tr><th __text="j7ZA">${locale.call("j7ZA")}</th>`;
                clSum.push(clSum.sum());
                clSum.forEach(function(c){
                    $t += `<th data-value-type = "number" __value=${c}>${N(c)}</th>`
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
                var arrays = [...analysis.args.vectors];
                return getBoxPlot(analysis, arrays.map(v => v.name()), getArraysPercentiles(arrays));                
            }
        }
    ],
    "anovaowrm": [
        /** adds dynamic text keys to the otherwise static table */
        {
            type: "after",
            data: function(analysis, elementId, callback) {
                $(function(){
                    var t = $(`#${elementId}`).find(".main-result");
                    t.find("tr:nth-child(2) > td:nth-child(1)").attr("__text", "K3ls");
                    t.find("tr:nth-child(3) > td:nth-child(1)").attr("__text", "wGQw");
                    t.find("tr:nth-child(4) > td:nth-child(1)").attr("__text", "IGv4");
                    t.find("tr:nth-child(5) > td:nth-child(1)").attr("__text", "aKUo");
                    if(callback) $(function(){callback()})
                });
            }
        },        
        {
            type: "chart",
            data: function(analysis) {
                var arrays = [...analysis.args.vectors];
                return getBoxPlot(analysis, arrays.map(v => v.name()), getArraysPercentiles(arrays));                
            }
        }
    ],
    "anovatw": [
        {
            type: "before",
            data: function(analysis, callback) {
                return analysis;
            }
        },
        /** adds dynamic text keys to the otherwise static table */
        {
            type: "after",
            data: function(analysis, elementId, callback) {
                $(function(){
                    var t = $(`#${elementId}`).find(".main-result");
                    t.find("tr:nth-child(2) > td:nth-child(1)").text(analysis.args.f1.name() || $("WGqY")).attr("__text", analysis.args.f1.name() || "WGqY").addClass("code");
                    t.find("tr:nth-child(3) > td:nth-child(1)").text(analysis.args.f2.name() || $("WGqY")).attr("__text", analysis.args.f2.name() || "O6Av").addClass("code");
                    t.find("tr:nth-child(4) > td:nth-child(1)").attr("__text", "whdI");
                    t.find("tr:nth-child(5) > td:nth-child(1)").attr("__text", "IGv4");
                    t.find("tr:nth-child(6) > td:nth-child(1)").attr("__text", "aKUo");
                    if(callback) $(function(){callback()})
                });
            }
        },        
        {
            type: "chart",
            data: function(analysis) {
                var datasets = [];
                var T = new Matrix(analysis.args.f1, analysis.args.f2, analysis.args.v);
                var major = analysis.result[0].F > analysis.result[1].F ? 0 : analysis.result[1].F > analysis.result[0].F ? 1 : 0;
                var minor = Math.abs(major - 1);
                var f1_keys = T[major].distinct();
                var f2_keys = T[minor].distinct();
                f1_keys.forEach(function(k) {
                    var kt = T.filter(major, (v) => v === k);
                    var ds = {
                        label: k,
                        borderWidth: 1,
                        padding: 10,
                        itemRadius: 2,
                        itemStyle: 'circle',
                        data: getArraysPercentiles([...kt.pivot(2,minor)]),
                      };
                      datasets.push(ds);
                })
                var ch = {
                    type: 'boxplot',
                    data: {
                        labels: f2_keys,
                        datasets: datasets,
                    },
                    options: {
                      responsive: true,
                      plugins: {
                        ...ch_title(analysis.title.value, "min = 0,05p, max = 0,95p"),
                        }
                    }
                };
                return ch;
                var arrays = [...analysis.args.vectors];
                return getBoxPlot(analysis, arrays.map(v => v.name()), getArraysPercentiles(arrays));                
            }
        }
    ],
    "ancova": [
        /** adds dynamic text keys to the otherwise static table */
        {
            type: "after",
            data: function(analysis, elementId, callback) {
                $(function(){
                    var t = $(`#${elementId}`).find(".main-result");
                    t.find("tr:nth-child(2) > td:nth-child(1)").text(analysis.args.f.name() || locale.call("dZ4S")).attr("__text", analysis.args.f.name() || "dZ4S").addClass("code").attr("title", locale.call("dZ4S")).attr("__title", locale.call("dZ4S"));
                    t.find("tr:nth-child(3) > td:nth-child(1)").text(analysis.args.c.name() || locale.call("EBON")).attr("__text", analysis.args.c.name() || "EBON").addClass("code").attr("title", locale.call("EBON")).attr("__title", locale.call("EBON"));
                    t.find("tr:nth-child(4) > td:nth-child(1)").attr("__text", "whdI");
                    t.find("tr:nth-child(5) > td:nth-child(1)").attr("__text", "aKUo");
                    if(analysis.result[0].p < 0.05) t.find("tr:nth-child(2").addClass("bg-light-green").css({"font-weight": "600"});
                    if(analysis.result[1].p < 0.05) t.find("tr:nth-child(3").addClass("bg-light-red").css({"font-weight": "600"});
                    if(analysis.result[2].p < 0.05) t.find("tr:nth-child(4").addClass("bg-light-red").css({"font-weight": "600"});
                    if(callback) $(function(){callback()}) 
                });
            }
        },
        {
            type: "chart",
            data: function(analysis) {
                var T = new Matrix(analysis.args.f, analysis.args.y, analysis.args.c);
                var f_keys = T[0].distinct();
                var dsc = {
                    label: T[2].name() || locale.call("EBON"),
                    borderWidth: 1,
                    padding: 10,
                    itemRadius: 2,
                    itemStyle: 'circle',
                    data: getArraysPercentiles([...T.pivot(2,0)]),
                };
                var dsy = {
                    label: T[1].name() || locale.call("lYdI"),
                    borderWidth: 1,
                    padding: 10,
                    itemRadius: 2,
                    itemStyle: 'circle',
                    data: getArraysPercentiles([...T.pivot(1,0)]),
                };
                var ch = {
                    type: 'boxplot',
                    data: {
                        labels: f_keys,
                        datasets: [dsc,dsy],
                    },
                    options: {
                        scales: {
                            x: {
                              title: {
                                display: true,
                                text: T[0].name() || locale.call("dZ4S")
                              }
                            },
                            y: {
                                beginAtZero: false
                            }
                      },
                      responsive: true,
                      plugins: {
                        ...ch_title(analysis.title.value, "min = 0,05p, max = 0,95p"),
                        }
                    }
                };
                return ch;
                var arrays = [...analysis.args.vectors];
                return getBoxPlot(analysis, arrays.map(v => v.name()), getArraysPercentiles(arrays));                
            }
        }
    ],
    "ttestind": [
        {
            type: "chart",
            data: function(analysis) {
                var arrays = [analysis.args.vectors[0],analysis.args.vectors[1]];
                return getBoxPlot(analysis, arrays.map(v => v.name()), getArraysPercentiles(arrays));                                   
            }
        }
    ],
    "welchttest": [
        {
            type: "chart",
            data: function(analysis) {
                var arrays = [analysis.args.vectors[0],analysis.args.vectors[1]];
                return getBoxPlot(analysis, arrays.map(v => v.name()), getArraysPercentiles(arrays));                                   
            }
        }
    ],
    "ttestpair": [
        {
            type: "chart",
            data: function(analysis) {
                var arrays = new Array(analysis.args.x, analysis.args.y);
                return getBoxPlot(analysis, arrays.map(v => v.name()), getArraysPercentiles(arrays));                            
            }
        }
    ],
    "mwu": [
        {
            type: "chart",
            data: function(analysis) {
                var arrays = [analysis.args.vectors[0],analysis.args.vectors[1]];
                return getBoxPlot(analysis, arrays.map(v => v.name()), getArraysPercentiles(arrays));                                          
            }
        }
    ],
    "wcxpaired": [
        {
            type: "chart",
            data: function(analysis) {
                var arrays = new Array(analysis.args.x, analysis.args.y);
                return getBoxPlot(analysis, arrays.map(v => v.name()), getArraysPercentiles(arrays));                            
            }
        }
    ],
    "wcxind": [
        {
            type: "chart",
            data: function(analysis) {
                var arrays = [analysis.args.vectors[0],analysis.args.vectors[1]];
                return getBoxPlot(analysis, arrays.map(v => v.name()), getArraysPercentiles(arrays));                                   
            }
        }
    ],
    "friedman": [
        {
            type: "chart",
            data: function(analysis) {
                var arrays = [...analysis.args.vectors];
                return getBoxPlot(analysis, arrays.map(v => v.name()), getArraysPercentiles(arrays));                
            }
        }
    ],
    "kwanova": [
        {
            type: "chart",
            data: function(analysis) {
                var arrays = [...analysis.args.vectors];
                return getBoxPlot(analysis, arrays.map(v => v.name()), getArraysPercentiles(arrays));                
            }
        }
    ],
    "correlPearson": [
        {
            type: "humanizer",
            fn: function(analysis) {
                var _ = analysis.result;
                var h = [];
                var _h = `Závislost proměnných <i>${analysis.args.x.name()}</i> a <i>${analysis.args.y.name()}</i> je `;
                if(Math.abs(_.r) > 0.2) {                    
                    if(Math.abs(_.r > 0.9)) _h += "<u><b>mimořádně silná</b></u>"
                    else if(Math.abs(_.r > 0.75)) _h += "<b>silná</b>"
                    else if(Math.abs(_.r > 0.5)) _h += "středně silná"
                    else if(Math.abs(_.r > 0.25)) _h += "mírná"
                    else _h += "velmi slabá";
                    _h += ` a to tak, že čím vyšší je hodnota <i>${analysis.args.x.name()}</i>, `;
                    if(_.r > 0) _h += `tím vyšší je hodnota`;
                    else _h =+ `tím menší je hodnota`
                    _h += ` <i>${analysis.args.y.name()}</i> a naopak.`
                } else _h += ` tak malá, že v praktickém životě <u>nemá smysl ji věnovat pozornost</u>.`;
                h.push(_h);
                if(_.p < 0.05) h.push(`${_.r <= 0.2 ? "Nicméně," : "A navíc,"} tato závislost je <b>statisticky významná</b>, a to s jistotou blížící se ${N(1 - analysis.result.p, {style: "percent"})}.`);
                else h.push(`${_.r <= 0.2 ? "A navíc, tato závilost není ani statisticky závislá." : "Nicméně, tato závilost není statisticky závislá."}. Příčiny mohou být dvě: buďto v reálném světě spolu tyto veličiny skutečně nesouvisí, nebo já váš vzorek příliš malý na to, aby mu bylo možné věřit.`)
                return h.join(" ");
            }
        }
    ],
    "correlMatrix": [
        {
            type: "chart",
            data: function(analysis) {
                var axisLabels = analysis.parent.smap((v,i) => v.name() || i).asc();
                var xAxisLabels = analysis.result.map(e => e.x).distinct().asc();
                var yAxisLabels = analysis.result.map(e => e.y).distinct().asc();
                var sm = (50 - (axisLabels.length - 4) * 5) < 20 ? 20 : (50 - (axisLabels.length - 4) * 5); //bubble size modifier
                var methodLabel = `${locale.call("nDx1")}: ${analysis.args.method == 1 ? locale.call("GR2Y") : analysis.args.method == 2 ? locale.call("5BMC") : locale.call("MqE5")}`;
                var r_data_positive = analysis.result.filter(e => e.r >= 0).map(function(e,i) {
                    return {
                        x: e.x, y: e.y, r: e.r * sm
                    }
                });
                var r_data_negative = analysis.result.filter(e => e.r < 0).map(function(e,i) {
                    return {
                        x: e.x, y: e.y, r: Math.abs(e.r) * sm
                    }
                });
                var rings = analysis.result.map(function(e){
                    return {x: e.x, y:e.y, r: sm}
                })
                var ch = {
                    type: 'bubble',
                    data: {
                        //labels: "",
                        datasets: [
                            {
                                label: locale.call("95CQ"),
                                fill: false,
                                lineTension: 0.1,
                                borderCapStyle: 'butt',
                                borderDash: [],
                                borderJoinStyle: 'miter',
                                pointBorderColor: `rgba(1,138,199,0)`,
                                pointBackgroundColor: function(context) {
                                    var e = analysis.result.find((e,i) => context.raw.x == e.x && context.raw.y == e.y);
                                    var p = (0.05 - e.p) > 0 ? (0.05 - e.p) * 20 : 0;
                                    return `rgba(1,138,199,${p})`
                                },
                                pointBorderWidth: 2,
                                pointHoverBorderWidth: 2,
                                pointRadius: 1,
                                pointHitRadius: 1,
                                data:r_data_positive
                            },
                            {
                                label: locale.call("PMze"),
                                fill: false,
                                lineTension: 0.1,
                                borderCapStyle: 'butt',
                                borderDash: [],
                                borderJoinStyle: 'miter',
                                pointBorderColor: `rgb(176,24,24,0)`,
                                pointBackgroundColor: `rgb(176,24,24,0.5)`,
                                pointBorderWidth: 1,
                                pointHoverBorderWidth: 2,
                                pointRadius: 1,
                                pointHitRadius: 1,
                                data: r_data_negative
                            },
                            {
                                label: locale.call("R9Hn"),
                                fill: false,
                                lineTension: 0.1,
                                borderCapStyle: 'butt',
                                borderDash: [],
                                borderJoinStyle: 'miter',
                                pointBorderColor: `rgba(10,10,10,0.1)`,
                                pointBackgroundColor: `transparent`,
                                pointBorderWidth: 1,
                                pointHoverBorderWidth: 2,
                                pointRadius: 1,
                                pointHitRadius: 1,
                                borderDash: [10,5],
                                data: rings
                            }
                        ],
                    },
                    options: {
                      responsive: true,
                      plugins: {
                        ...ch_title(analysis.title.value, methodLabel),
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    if(context.datasetIndex == 2) return locale.call("R9Hn");
                                    var x = context.dataset.data[context.dataIndex].x;
                                    var y = context.dataset.data[context.dataIndex].y;
                                    return [
                                        `${x} x ${y}`, 
                                        `r = ${N(analysis.result.find(e => e.x == x && e.y == y).r)}`,
                                        `p = ${N(analysis.result.find(e => e.x == x && e.y == y).p)}`,
                                        `N = ${N(analysis.result.find(e => e.x == x && e.y == y).n)}`
                                    ];
                                }
                            }
                        }
                          
                        },
                    scales: {
                        x: {
                            // will this create y-axis with days of week?
                            type: 'category',
                            labels: xAxisLabels.desc(),
                              offset: true, // Adjust the offset to position labels/bubbles in between ticks
                            
                        },
                        y: {
                            type: 'category',
                            labels: yAxisLabels,
                            offset: true, // Adjust the offset to position labels/bubbles in between ticks
                        }
                        }
                    }
                };
                return ch;
            }
        }
    ]
};

function createGeneralContainer($card, callback) {
    var id = srnd();
    $($card).find(".result-addons").append(`<div id = "${id}"></div>`).ready(function(){
        callback(id);
    });
}

function createChartContainer($card, callback) {
    /* adds and returns a unique ID of the .chart-container element for hosting the ChartJS object */
    var chid = srnd();
    $($card).find(".result-addons").append(`<canvas id = "${chid}"></canvas>`).ready(function(){
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
            display: !!analysis.title.value,
            text: analysis.title.value,
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
                label: locale.call("zRDj"),
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
            ...ch_title(analysis.title.value, "min = 0,05p, max = 0,95p"),
            }
        }
    };
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

function vectorContextMenuTree() { return [
    {
        type: "header",
        value: locale.call("MYy2")
    },
    {
        type: "custom",
        id: "config",
        value: locale.call("SxsF"),
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
        value: locale.call("77iY"),
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
                    var $o = $("<option>").text(v !== null ? v : `- ${locale.call("RICH")} -`).attr("value", v !== null ? v : "");
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
        value: locale.call("RN28")
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
        value: locale.call("KG9Q"),
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
        value: locale.call("4DdX"),
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
        value: locale.call("h93e"),
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
        value: locale.call("2Goq"),
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
        value: locale.call("Kh3a"),
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
]};

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
            msg.error(locale.call("KHSp"), e.message, 60000);
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
        if($f.find(`[name="fn"]`).val().length > 0) {
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