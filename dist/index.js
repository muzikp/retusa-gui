
const locale = "cs-CZ";
let matrix;

$(function(){
    // #region Matrix extensions
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
                custom: "typeo"
            })
        }
        return t;   
    }
    Matrix.prototype.readData = function() {
        return this.toTable();
    }
    // #endregion
    matrix = new Matrix(StringVector.generate({total: 50, list: 5}).name("groups"), NumericVector.generate({total: 50, min: 200, max: 500}).name("score"));
    loadMatrixToTable(matrix);   
})

// #region Table rendering

function loadMatrixToTable(matrix, selector = "#table") {
    $(selector).bootstrapTable(matrix.readConfig());
    $(selector).bootstrapTable("load", matrix.readData());
    $(selector).bootstrapTable("refreshOptions", {
        locale: locale
    });
    for(let c of matrix) {
        $(selector).find(`[data-field="${c.name()}"]`).attr("data-vector-type", c.type())
        $(selector).find(`[data-field="${c.name()}"]`).append(createVectorMenu(c));
    }
}

function createVectorMenu(vector) {
    var $m = $(`<div><span class="bt-header-btn-panel"><button class="btn bt-header-icon">⚙️</button><div class="dropdown"><button data-toggle="tooltip" title="Kliknutím otevřete nabídku analyticých nástrojů pro tuto proměnnou." class="btn bt-header-icon dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">🩼</button><ul class="dropdown-menu"></ul></div></span></div>`);
    for(let m of Object.keys(vectorModels)) {
        var _m = vectorModels[m];
        if((_m.wiki.applies.find(_ => _.type == vector.type())?.apply)) $m.find("ul").append(`<li><button data-vector-analysis-trigger class="dropdown-item" type="button" data-model = "${_m.name}" data-model-has-args = ${!!_m.model.args}>${_m.wiki.title}</button></li>`)
    }
    return $m.html();
}

// #endregion

// #region Vector analysis results rendering

function renderSingleVectorAnalysisItem(result, vector, model, args) {
    var $c = $(createResultCard());
    var content = renderVectorAnalysisResult(result, vector, model);
    $c.find(".title").html(`<h5>${vector.name()}: <code>${model.wiki.title}</code></h5>`)
    $c.find(".parameters").html(args);
    $c.find(".content").append($(content));
    $("#output-container").append($c);
    $("#wsCollapseOutput").collapse("toggle");
}

// autoscrolls the the bottom of the page when a new result card is added
$(document).on('shown.bs.collapse', "#wsCollapseOutput", function () {
    $(document).scrollTop($(document).height());
});

// renders Vector form for methods with arguments
function renderVectorFormSchema(schema, vector, methodName) {
    var $f = `<form data-vector-form action = "javascript:void(0)" data-vector = "${vector.name()}" data-method = "${methodName}"><table class="table"><tbody>`;
    for(let a of schema) {
        $f += `<tr><td class = "${a.required ? "form-control-required" : ""} ${a.description ? "form-control-tooltip" : ""}" title="${a.description || ""}">${a.title}</td>`;
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
    var vector = matrix.item($(this).closest("[data-field]").attr("data-field"))        
    if($(this).attr("data-model-has-args") == "true") {
        renderVectorFormSchema(vectorModels[method].schema.form, vector, method);
    } else {
        var result = vector[method]();
        renderSingleVectorAnalysisItem(result, vector, vectorModels[method]);
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
    var vector = matrix.item($(this).attr("data-vector"));
    var method = vectorModels[$(this).attr("data-method")];
    try {
        var result = vector[method.name](...args.map(_ => _.value));
        var argsText = argsToTextPreview(args, method.schema.form);
        renderSingleVectorAnalysisItem(result,vector,method, argsText);
        $(this).closest(".modal").modal("hide");
    } catch(e) {
        console.dir(e.toString());
        iziToast.error({
            title: `Pozor, budete muset něco opravit`,
            message: e.toString(),
            timeout: 15000
        });
        return;
    }
});

function argsToTextPreview(args, schema) {
    if(!args || args?.length == 0) return "<small><i>bez parametrů</i></small>";
    var t = "<small><u>Parametry</u><ul> "
    for(var i = 0; i < schema.length; i++) {
        value = args.find(a => a.key = schema[i].id)?.value || null;
        if(value === true) value = "✅";
        else if(value === false || value == undefined) value = "❌";
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
            $t += `<tr><td><i>${i}</i></td>`;
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
      <div class="content"></div>
    </div>
  </div>`
    return card
}

$(document).on("click",".close-card-btn", function(){
    $(this).closest(".card").remove();
});

// #region Number formaters 

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

// #endregion