const locale = "cs-CZ";
let matrix;
const selector = "#table";

$(function(){
    init();
    matrix = new Matrix(StringVector.generate({total: 5000, list: 5, nullprob: 0.2}).name("groups"), NumericVector.generate({total: 5000, min: 200, max: 500, nullprob: 0.2}).name("score"));
    loadMatrixToTable(matrix);
})


// #region Retusa extensions

function init(){
    Matrix.prototype.readConfig = function(){
        var t = {
            pagination: true,
            search: true,
            columns: []
        };
        for(let c of this) {
            t.columns.push({
                field: c.name(),
                title: c.name(),
                sortable: true,
                filterControl: c.type() == 1? "input" : "select",
                formatter: nullFormatter
            })
        }
        return t;   
    }
    Matrix.prototype.readData = function() {
        return this.toTable();
    }
// #region Cell editor

    /* render input control on cell doubleclick */
    $(document).one("click-cell.bs.table.bs.table", function(event, field, value, row, $e){onClickCellBs(...arguments)}).on("mouseleave", function(){});
    function onClickCellBs(event, field, value, row, $e) {
        var index = Number($e.closest("tr").attr("data-index"));
        var $i = $(`<input bootstrap-table-cell-input data-index = ${index} data-field = "${field}"  data-value = "${value}" style="z-index: 100;" class="form-control" ${nullify(value) ? 'value = "' + nullify(value) + '"' : ""}>`);
        $e.html($i).find("input").focus().select();
    }
    /* update or leave cell on keydown */
    $(document).on("keydown","[bootstrap-table-cell-input]",function(event){onCellInputKeyDown(this, event)});
    function onCellInputKeyDown($e, event){
        if(event.key == "Escape") $(this).closest("td").empty().text($(this).attr("data-value"));
        /* renders the select control with distinct values */
        else if(event.key == "Control" || event.key == "Alt") {
            var index = Number($($e).attr("data-index"));
            var field = $($e).attr("data-field");
            var value = $($e).attr("data-value");
            var values = $(selector).bootstrapTable("getData").map(r => r[field]).distinct().sort((a,b) => a > b ? 1 : -1).filter(_ => (_ !== null && _ !== undefined));
            var $s = `<select bootstrap-table-cell-select class="form-select" data-index = ${index} data-field="${field}" data-value = "${$($e).attr("data-value")}">`;
            for(var v of values) {$s += `<option ${v == value ? "selected" : ""}>${v}</option>`};
            $s += "</select>";
            $($e).closest("td").empty().html($s).focus().click(function(){$("option").slideDown()});
        }
        else if(event.key == "Enter") {
            var field = $($e).attr("data-field");
            var index = Number($($e).attr("data-index"));
            var value = nullify($($e).val());
            try {
                var value = matrix.item(field).parse(value);
                $(this).closest("td").empty().text(value);      
                $("#table").bootstrapTable('updateCell', {
                    index: index,
                    field: field,
                    value: value,
                    reinit: false
                });
            }
            catch (e) {
                iziToast.error({
                    title: "Nepovolená hodnota",
                    message: e.toString(),
                    timeout: 5000
                });
            }
        }  
    }
    /* on input edit mouse leave */
    $(document).on("mouseleave","[bootstrap-table-cell-input]",function(e){
        $(this).closest("td").empty().text($(this).attr("data-value"));
    });
    /* reinitializes the mouseenter event only after the mouse has left the last cell */
    $(document).on("mouseleave", "td", function(){
        $(document).one("click-cell.bs.table.bs.table", function(event, field, value, row, $e){onClickCellBs(...arguments)}).on("mouseleave", function(){});
    });
    /* on select control changed/option selected */
    $(document).on("change", "[bootstrap-table-cell-select]", function(){
        var field = $(this).attr("data-field");
        var index = Number($(this).attr("data-index"));
        var value = nullify($(this).val());
        try {
            var value = matrix.item(field).parse(value);
            $(this).closest("td").empty().text(value);      
            $("#table").bootstrapTable('updateCell', {
                index: index,
                field: field,
                value: value,
                reinit: false
            });
        }
        catch (e) {
            iziToast.error({
                title: "Nepovolená hodnota",
                message: e.toString(),
                timeout: 5000
            });
        }
    });
    $(document).on("mouseleave", "[bootstrap-table-cell-select]", function(){
        var v = nullify($(this).attr("data-value"));
        if(v !== null) $(this).closest("td").empty().text(v);
        else $(this).closest("td").empty();
    })
    function nullify(v) {
        if(v === undefined || v === "undefined") return null;
        else if(v === 0 || v == "0") return 0;
        else if(v === false || v === "false") return false;
        else if(v) return v;
        else return null;
    }
    // #endregion
}

// #endregion

// #region Table rendering

function loadMatrixToTable(matrix) {
    $(selector).bootstrapTable(matrix.readConfig());
    $(selector).bootstrapTable("load", matrix.readData());
    $(selector).bootstrapTable("refreshOptions", {
        locale: locale,
        smartDisplay: true
    });
    for(let c of matrix) {
        $(selector).find(`[data-field="${c.name()}"]`).attr("data-vector-type", c.type())
        $(selector).find(`[data-field="${c.name()}"]`).append(createVectorMenu(c));
    }
}

function createVectorMenu(vector) {
    var $m = $(`<div><span class="bt-header-btn-panel"><button class="btn bt-header-icon bt-header-config">⚙️</button><div class="dropdown"><button data-toggle="tooltip" title="Kliknutím otevřete nabídku analyticých nástrojů pro tuto proměnnou." class="btn bt-header-icon dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">🩼</button><ul class="dropdown-menu"></ul></div></span></div>`);
    for(let m of Object.keys(vectorModels)) {
        var _m = vectorModels[m];
        if((_m.wiki.applies.find(_ => _.type == vector.type())?.apply)) $m.find("ul").append(`<li><button data-vector-analysis-trigger class="dropdown-item" type="button" data-model = "${_m.name}" data-model-has-args = ${!!_m.model.args}>${_m.wiki.title}</button></li>`)
    }
    return $m.html();
}

function createResultCard() {
    var card = `
    <div class="card" style="padding-top: 1rem;">
    <div class="card-body">
      <div class="card-header">
        <span class="close-card"> 
            <div class="title"></div>
            <button class="btn close-card-btn" style="display: flex;flex-direction: row-reverse;">🗑️</button>
          </span></div>
      <div class="parameters"></div><br>
      <div class="sample"></div><br>
      <div class="content"></div>
    </div>
  </div>`
    return card
}

function renderParameters(args) {

}

function renderSampleSize(data) {
    var $t = `<div class="sample-info">`;
    $t += `<div class="sample-info-item">počet případů: ${N(data.net,{d:0})}</>`;
    $t += `<div class="sample-info-item">vstupní soubor: ${N(data.raw,{d:0})}</>`;
    $t += `<div class="sample-info-item">% vyřazených případů: ${N(data.net/data.raw,{style: "percent"})}</>`;
    $t += `<div class="sample-info-item">aplikovaný filtr: ${data.filter}</>`;
    return $t;
}

// #endregion

// #region Vector analysis results rendering

function renderSingleVectorAnalysisItem(result, vector, model, meta) {
    var $c = $(createResultCard());
    var content = renderVectorAnalysisResult(result, vector, model);
    $c.find(".title").html(`<h5>${vector.name()}: <code>${model.wiki.title}</code></h5>`)
    $c.find(".parameters").html(meta.args);
    $c.find(".sample").html(`<p>Původní velikost vzorku: ${meta.raw}</p><p>Konečná velikost vzorku: ${meta.net}</p><p>Aplikovaný filtr: ${meta.filter}</p>`);
    $c.find(".content").append($(content));
    $("#output-container").append($c);
    $("#wsCollapseOutput").collapse("toggle");
}

// #region EVENTS

// autoscrolls the the bottom of the page when a new result card is added
$(document).on('shown.bs.collapse', "#wsCollapseOutput", function () {
    $(document).scrollTop($(document).height());
});

// renders Vector form for methods with arguments
function renderVectorFormSchema(schema, vector, methodName) {
    var $f = `<form data-vector-form action = "javascript:void(0)" data-vector-type = "${vector.type()}" data-field = "${vector.name()}" data-method = "${methodName}"><table class="table"><tbody>`;
    for(let a of schema) {
        $f += `<tr><td class = "${a.required ? "form-control-required" : ""} ${a.description ? "form-control-tooltip" : ""}" ${a.description ? "title=" + a.description : ""}">${a.title}</td>`;
        $f += `<td title="${a.description || ""}">`;
        if(a.type == "enum") {
            $f += `<select data-control-type="${a.type}" class = "form-select" name = "${a.id}" value = ${a.default ? a.default : ""} ${a.required ? "required" : ""}>`
            for(let e of a.enums) {
                $f += `<option value = ${e.id} ${e.id == a.default ? "selected" : ""}>${e.title}</option>`
            }
            $f += "</select>"
        }
        else if(a.type == "boolean") {
            $f += `<div class="form-check form-switch"><input data-control-type="${a.type}" checked = ${a.default} ${a.required ? "required" : ""} class="form-check-input" type="checkbox" role="switch" name="${a.id}"></div>`
        }
        else {
            var _type = (a.type == "number" || a.type == "integer" || a.type == "decimal") ? "number" : "text";
            var _step = (a.type == "integer" ? 1 : a.type == "decimal" || a.type == "number" ? 0.001 : null);
            $f += `<input type = "${_type}" data-control-type="${a.type}" ${_step > 0 ? "step=" + _step : null} class="form-control" name = "${a.id}" ${a.default ? "value = " + a.default : ""} ${a.required ? "required" : ""} placeholder = "${a.validatorText}"}>`;
        }
        $f += `</td></tr>`
    }
    $f += `</tbody></table><br><br><button data-vector-form-args-submit type="submit" class="btn btn-primary">Spočítat</button></form>`;
    $("#modal_vector_analysis_form").find(".modal-body").empty().append($($f));
    $("#modal_vector_analysis_form").modal("show");
}

/** vector analysis single method trigger*/
$(document).on("click", "[data-vector-analysis-trigger]", function(){
    var method = $(this).attr("data-model");
    var vector = getVectorFromBT($(this).closest("[data-field]").attr("data-field"),$(this).closest("[data-vector-type]").attr("data-vector-type"));
    var m = vector.model(method);
    var sample = {
        filter: m.wiki.filter,
        raw: vector.length,
        net: vector.filter(m.filter).length
    };
    if($(this).attr("data-model-has-args") == "true") {
        renderVectorFormSchema(vectorModels[method].schema.form, vector, method);
    } else {
        var result = vector[method]();
        renderSingleVectorAnalysisItem(result, vector, vectorModels[method], sample);
    }
})

/** calculates a vector method after form is submitted */
$(document).on("submit", "[data-vector-form]", function(){
    var args = $(this).serialize().split(/\&/g).map(function(e) {return {key: e.split(/\=/g)[0], value: e.split(/\=/g)[1]}});
    for(let a of args) {
        var type = $(this).find(`[name="${a.key}"]`).attr("data-control-type");
        if(type == "boolean") a.value = a.value == "on" ? true : false;
        else if(type == "number") {
            if(a.value !== 0 && !a.value) a.value = null;
            else a.value = Number(a.value)
        }
    }
    var method = vectorModels[$(this).attr("data-method")];
    var vector = getVectorFromBT($(this).closest("[data-field]").attr("data-field"),$(this).closest("[data-vector-type]").attr("data-vector-type"));
    var m = vector.model(method.name);
    var sample = {
        filter: m.wiki.filter,
        raw: vector.length,
        net: vector.filter(m.filter).length,
        args: argsToTextPreview(args, method.schema.form, method.model.args)
    };
    try {
        var result = vector[method.name](...args.map(_ => _.value));
        renderSingleVectorAnalysisItem(result,vector,method, sample);
        $(this).closest(".modal").modal("hide");
    } catch(e) {
        iziToast.error({
            title: e.toString(),
            //message: e.toString(),
            timeout: 15000
        });
        return;
    }
});

$(document).on("click",".close-card-btn", function(){
    $(this).closest(".card").remove();
});

$(document).on("click", ".bt-header-config", function(){
    var field = $(this).closest(`[data-field]`).attr("data-field");
    var type = $(this).closest("[data-vector-type]").attr("data-vector-type");
    var vector = getVectorFromBT(field,type);
    /* show vector setup modal form */
    
});

// #endregion

function getVectorFromBT(field, type){
    var data = $("#table").bootstrapTable("getData", {unfiltered: false}).map(r => r[field]);
    if(type == 1) return new NumericVector(...data).name(field);
    else if(type == 2) return new StringVector(...data).name(field);
    else if(type == 3) return new BooleanVector(...data).name(field);
    else throw new Error("Unknown vector type")
}

function argsToTextPreview(args, schema) {
    if(!args || args?.length == 0) return null;
    var t = "<small><u>Parametry</u><ul>"
    for(var i = 0; i < schema.length; i++) {
        value = args.find(a => a.key = schema[i].id)?.value || null;
        if(schema[i].enums) {
            value = schema[i].enums.find(e => e.id == value)?.title;            
        }
        else if(value === true) value = "✅";
        else if(value === false) value = "❌";
        else if(value !== 0 && !value) {
            value = "dle interního nastavení"
        }
        t += `<li>${schema[i].title}: ${value ? value : "-"}</li>`
    };
    return t + "</ul></small>";
}

function renderVectorAnalysisResult(result, vector, model) {
    if(model.schema.output.isSimple) return `<code>${F(result,model.schema.output)}</code>`;
    else if (model.schema.output.isObject) {
        var $t = `<table class = "table"><tbody><tr><th>ukazatel</th><th>hodnota</th><tr>`;
        for(let p of model.schema.output.properties) {
            $t += `<tr><td>${p.title}</td><td>${F(result[p.id],p)}</td></tr>`
        }
        $t += "</tbody></table>";
        return $t;
    }
    else if(model.schema.output.isArray) {
        var $t = `<table class = "table"><tbody><tr><th>#</th>`;
        for(let h of model.schema.output.items)
        {
            $t += `<th data-field = "${h.id}">${h.title}</th>`;
        }
        $t += "</tr>";
        var i = 0;
        for(let r of result) {
            $t += `<tr><td><small><i>${i+1}</i></small></td>`;
            for(let h of model.schema.output.items) {
                var val = F(r[h.id], h);
                $t += `<td>${val}</td>`;
            }
            $t += "</tr>";
            i++;
        }
        $t += "</tbody></table>";
        return $t;
    }
}

// #region Formaters 

/**
 * 
 * @param {*} v value 
 * @param {*} p schema property
 */
function F(v,p) {
    if(v === undefined) return "❔";
    if(p.type == "boolean") {
        if(!v) return "❌";
        else return "✅"
    }
    else if(p.type == "integer") {
        return Math.round(v).toLocaleString(locale, {style: "decimal"});
    }
    else if(p.type == "percent") {
        return v.toLocaleString(locale, {style: "percent"});
    }
    else if(p.type == "number") {
        return v.toLocaleString(locale, {style: "decimal"})
    }
    else return v;
}

function nullFormatter(v) {
    if(v === null || v === undefined) return `<i style="color: gray" title="prázdná buňka">-</i>`;
    else return v;
}

// #endregion