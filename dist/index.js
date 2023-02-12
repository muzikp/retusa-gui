const version = "1.0";
const locale = "cs-CZ";
//let matrix;
const tableSelector = "#table";
const log = [];
const env = "development";
const defTableName = "lastTable";
var source;

$(function(){
    init(); /* IMPORTANT!! */
    renderMatrixAnalysisMenu();
    
    source = testTables.anova1();
    calculateMatrixAnalysis(source.analyze("anovaow"), [[0],1]);
    return;
    //return;
    source = testTables.genreg();
    loadMatrixToTable(source);
    calculateMatrixAnalysis(source.analyze("genreg"), [0,1,1]);
    setTimeout(calculateMatrixAnalysis(source.analyze("genreg"), [0,1,3]), 2000)
    setTimeout(calculateMatrixAnalysis(source.analyze("genreg"), [0,1,5]), 000)
    //calculateMatrixAnalysis(source.analyze("genreg"), [0,1,1]);
    return;

    
    //loadMatrixToTable(matrix);

})

// #region Retusa extensions

function init(){
    Matrix.prototype.readConfig = function(){
        var t = {
            pagination: true,
            //search: true,
            columns: []
        };
        for(let c of this) {
            t.columns.push({
                field: c.name(),
                title: c.name(),
                sortable: true,
                filterControl: "select-multiple", //|| c.type() == 1? "input" : "select",
                formatter: nullFormatter
            })
        }
        return t;   
    }
    Matrix.prototype.readData = function(config) {
        return this.toTable(config);
    }
    Matrix.prototype.updateCell = function(index,field,value) {
        try {
            this.item(field)[index] = this.item(field).parse(value);
            return true;
        } catch(e) {
            msg.error("Chybná hodnota", e.message, 3000);
            return false;
        }
    };
    Matrix.prototype.toTable = function(config) {
       var table = [];
       for(var r = config.offset; r <= ((config.offset + config.limit -1) > this.maxRows() ? this.maxRows() : config.offset + config.limit -1); r++) {
           var row = {};
           for(var v = 0; v < this.length; v++) {
               row[this[v].name() || v] = this[v][r];
           }
           table.push(row);
       }
       return table;
    }
    Matrix.prototype.toArray = function() {
        var _ = [];
        for(var i = 0; i < this.maxRows(); i++) {
            var r = [];
            for(var c = 0; c < this.length; c++) {
                r.push(this[c][i])
            }
            _.push(r);
        };
        return _;
   }
   Matrix.prototype.toNamedArray = function() {
    var _ = [];
    for(var i = 0; i < this.maxRows(); i++) {
        var r = {};
        for(var c = 0; c < this.length; c++) {
            r[this[c].name()] = this[c][i];            
        }
        _.push(r);
    };
    return _;
}
   Matrix.prototype.ajax = function(p) {
    //console.log(p);
    var data = [];
    /* collect the data first */
    for(var r = 0; r < this.maxRows(); r++) {
        var row = {};
        for(var v = 0; v < this.length; v++) {
            row[this[v].name() || v] = this[v][r];
        }
        data.push(row);
    }
    /* then filter */
    if(p.data.filter) {

    }
    /* then sort */
    if(p.data.sort) {
        var order = p.data.order == "asc" ? 1 : -1;
        data = data.sort((a,b) => a[p.data.sort] > b[p.data.sort] ? order : -order);
    }
    /* finally limit - offset */
    data = data.slice(p.data.offset, p.data.limit + p.data.offset);
    return {total: source.maxRows(), totalNotFiltered: data.length, rows: data};
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
            var values = $(tableSelector).bootstrapTable("getData").map(r => r[field]).distinct().sort((a,b) => a > b ? 1 : -1).filter(_ => (_ !== null && _ !== undefined));
            var $s = `<select bootstrap-table-cell-select class="form-select" data-index = ${index} data-field="${field}" data-value = "${$($e).attr("data-value")}">`;
            for(var v of values) {$s += `<option ${v == value ? "selected" : ""}>${v}</option>`};
            $s += "</select>";
            $($e).closest("td").empty().html($s).focus().click(function(){$("option").slideDown()});
        }
        else if(event.key == "Enter") {
            var field = $($e).attr("data-field");
            var index = Number($($e).attr("data-index"));
            var value = nullify($($e).val());
            if(source.updateCell(index,field,value)) {
                $(this).closest("td").empty().text(value);      
                $("#table").bootstrapTable('updateCell', {
                    index: index,
                    field: field,
                    value: value,
                    reinit: false
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
        if(source.updateCell(index,field,value)) {
            $(this).closest("td").empty().text(value);      
            $("#table").bootstrapTable('updateCell', {
                index: index,
                field: field,
                value: value,
                reinit: false
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

function matrixAJAX(p){
    //if(!source) p.success({total: 0, totalNotFiltered: 0, rows: []});
    if(!source) p.error();
    var data = source.ajax(p); 
    p.success(data);    
}

/* transfer the matrix to the Bootstrap Table */
function loadMatrixToTable(matrix, callback) {
    source = matrix;
    $(tableSelector).empty().bootstrapTable(source.readConfig());
    //$(tableSelector).bootstrapTable("load", new Array(...matrix.readData()));
    $(tableSelector).bootstrapTable("refreshOptions", {
        locale: locale,
        smartDisplay: true
    });
    for(let c of source) {
        $(tableSelector).find(`[data-field="${c.name()}"]`).attr("data-vector-type", c.type())
        $(tableSelector).find(`[data-field="${c.name()}"]`).append(createVectorMenu(c));
    }
    $("#table-name").val(source.name() || "");
    if(callback) callback($(tableSelector));
}
/*
function createVectorHeaderDropDown(c) {
    <div class="dropdown"><a class="btn btn-secondary dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
    Dropdown link
  </a>

  <ul class="dropdown-menu">
    <li><a class="dropdown-item" href="#">Action</a></li>
    <li><a class="dropdown-item" href="#">Another action</a></li>
    <li><a class="dropdown-item" href="#">Something else here</a></li>
  </ul>
</div>
}
*/

/*
- creates a new matrix from the Bootstrap Table
function _createMatrixFromTable(config = {numeric: false}) {
    var m = (config?.numeric ? new NumericMatrix() : new Matrix());
    m.name($("#table-name").val() || null);
    $(tableSelector).find(`[data-field]`).each(function(){
        m.push(getVectorFromBT($(this).attr("data-field"),$(this).attr("data-vector-type")))
    });
    return m;
}
*/


/* returns a new Vector instance based on the table column; the vector type is specified by the header data-vector-type attribute 
function getVectorFromBT(field, type, config = {unfiltered: false}){
    var data = $("#table").bootstrapTable("getData", {unfiltered: config?.unfiltered}).map(r => r[field]);
    if(type == 1) return new NumericVector(...data).name(field);
    else if(type == 2) return new StringVector(...data).name(field);
    else if(type == 3) return new BooleanVector(...data).name(field);
    else throw new Error("Unknown vector type")
}
*/

function createVectorMenu(vector) {
    var $m = $(`<div><span class="bt-header-btn-panel"><button class="btn bt-header-icon bt-header-config">⚙️</button><div class="dropdown"><button data-toggle="tooltip" title="Kliknutím otevřete nabídku analyticých nástrojů pro tuto proměnnou." class="btn bt-header-icon dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">🩼</button><ul class="dropdown-menu"></ul></div></span></div>`);
    for(let m of Object.keys(vectorModels)) {
        var _m = vectorModels[m];
        if((_m.wiki.applies.find(_ => _.type == vector.type())?.apply)) $m.find("ul").append(`<li><button data-vector-analysis-trigger class="dropdown-item" type="button" data-model = "${_m.name}" data-model-has-args = ${!!_m.model.args}>${_m.wiki.title}</button></li>`)
    }
    return $m.html();
}

/** returns HTML layout for the result card */
function createResultCard(id = srnd()) {
    var card = `
    <div id = "${id}" class="card result-card" style="padding-top: 1rem;">
    <div class="card-body">
      <div class="card-header">
        <div class="title" style="display: flex"></div>
        <span class="close-card"> 
            <span style="display: flex;flex-direction: row-reverse;">
              <button title="Smazat kartu výsledku." class="btn close-card-btn" style="display: flex;flex-direction: row-reverse;">🗑️</button>
              <button title="Vložit výsledek do clipboardu" class="btn copy-canvas-layout-btn" style="display: flex;flex-direction: row-reverse;">🖼️</button>
              <button title="Zpět na data" class="btn back-to-data-btn" style="display: flex;flex-direction: row-reverse;">⏫</button>
            </span>
          </span>
      </div>
      <div class="duration"></div>
      <div class="canvas-layout">
        <div class="row">
            <div class="col-6"><div class="sample"></div><br></div>
            <div class="col-6"><div class="parameters"></div><br></div>
        </div>
        <div class="content"></div>
        <div class="result-addons"></div>
      </div>
    </div>
  </div>`
    return card
}

/* copy the result card as an image to the clipboard */
$(document).on("click",".copy-canvas-layout-btn", function(){
    var target = $(this).closest(".card").find(".canvas-layout").get(0);
    html2canvas(target).then(function(canvas) {
        const img = new Image();
        img.src = canvas.toDataURL();
        const copyContainer = document.createElement("div");
        copyContainer.style.display = "none";
        document.body.appendChild(copyContainer);
        copyContainer.appendChild(img);
        const byteCharacters = atob(img.src.split(',')[1]);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: 'image/png' });
        navigator.clipboard.write([new ClipboardItem({'image/png': blob})]).then(function() {
            msg.ok("Zkopírováno do schránky.", null, 3000);
            copyContainer.remove();
        }).catch(function(error) {
            msg.error("Nepodařilo se zkopírovat.", env == "development" ? e.toString() : "", 3000)
            if(env === "development") console.error(e);
            copyContainer.remove();
        });
    });
})

/* renders the parameter overview for both vector and matrix methods */
function renderAnalysisParameters(bundle) {
    var $t = `<div class="parameter-info"><div class="box-header">Parametry</div>`;
    var schema = bundle.schema.form;
    var args = bundle.args;
    if(!args || args?.length == 0) return null;
    for(var i = 0; i < schema.length; i++) {
        value = args[i];
        if(value?.isVector) {
            value = `<code>${value.name() || "nepojmenovaná proměnná"}</code>`
        }
        else if(value?.isMatrix || Array.isArray(value) ? value.hasOnlyVectorChildren() : false) {
            var _value = "";
            for(let v = 0; v < value.length; v++) {
                _value += `<code>${value[v]?.name() || "nepojmenovaná proměnná"}</code>${v < value.length -1 ? ", " : ""}`
            }
            value= _value;
        }
        if(schema[i].enums) {
            value = schema[i].enums.find(e => e.id == value)?.title;            
        }
        else if(value === true) value = "✅";
        else if(value === false) value = "❌";
        else if(value !== 0 && value !== false && !value) {
            value = "dle interního nastavení"
        }
        $t += `<div class="parameter-info-item">${schema[i].title}: <b>${value ? value : "-"}</b></div>`;
    };
    $t += "</div>"
    return $t;
}

/* renders the sample statistics for both vector and matrix methods */
function renderSampleSize(bundle) {
    var original = bundle?.parent?.isMatrix ? bundle?.parent?.maxRows() : bundle?.parent?.length;
    var net = bundle?.matrix?.isMatrix ? bundle?.matrix?.maxRows() : bundle?.vector?.length;
    var rejected_abs = original && net ? original - net : null;
    var rejected_rel = rejected_abs ? 1-net/original : null;
    var filterText = bundle.wiki.filter || null;
    var $t = `<div class="sample-info"><div class="box-header">Vzorek</div>`;
    if(net) $t += `<div class="sample-info-item">počet případů: <b>${N(net,{d:0})}</b></div>`;
    if(original >= 0) $t += `<div class="sample-info-item">vstupní soubor: <b>${N(original,{d:0})}</b></div>`;
    if(rejected_abs >=0) $t += `<div class="sample-info-item">vyřazené případy: <b>${N(rejected_abs)}</b> (${N(rejected_rel,{style: "percent"})})</div>`;
    if(filterText) $t += `<div class="sample-info-item">kritérium filtru: ${filterText}</div>`;
    return $t;
}

// #endregion

function activateTab(name, scrollBottom = false, callback) {
    $(`[tab-target="${name}"]`).tab("show").ready(function(){
        $("#output-container").animate({ scrollTop: $(document).height() }, 1000);
        //$("#myTabContent").load(location.href + " #myTabContent");
        callback();
    });
}

// #region analysis results rendering

// #region VECTOR ANALYSIS EVENTS

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
    var vector = source.item($(this).closest("[data-field]").attr("data-field")); //getVectorFromBT($(this).closest("[data-field]").attr("data-field"),$(this).closest("[data-vector-type]").attr("data-vector-type"));
    if($(this).attr("data-model-has-args") == "true") {
        renderVectorFormSchema(vectorModels[method].schema.form, vector, method);
    } else {
        try {
            var analysis = vector.analyze(method).run();
            renderAnalysisResult(analysis);
        } catch(e) {
            msg.error("Chyba", env === "development" ? e.toString() : "", 15000);
            if(env === "development") console.error(e);
            return;
        }
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
    args = args.map(a => a.value);
    var vector = source.item($(this).closest("[data-field]").attr("data-field")); //getVectorFromBT($(this).closest("[data-field]").attr("data-field"),$(this).closest("[data-vector-type]").attr("data-vector-type")); 
    try {
        var bundle = vector.analyze($(this).attr("data-method")).run(...args);
        renderAnalysisResult(bundle)
        $("#modal_vector_analysis_form, #modal_matrix_analysis_form").modal("hide");
    } catch(e) {
        msg.error("Chyba", env === "development" ?  e.toString() : "",null, 15000);
        if(env === "development") console.error(e);
        return;
    } finally {
        $("#modal_vector_analysis_form, #modal_matrix_analysis_form").modal("hide");
    }
    
});

/* removes the result card */
$(document).on("click",".close-card-btn", function(){
    $(this).closest(".card").remove();
});

/* expand the data collapsible and scroll up */
$(document).on("click", ".back-to-data-btn", function(){
    $("#wsCollapseData").collapse("toggle");
    $(document).scrollTop(0);
})

$(document).on("click", ".bt-header-config", function(){
    var field = $(this).closest(`[data-field]`).attr("data-field");
    var type = $(this).closest("[data-vector-type]").attr("data-vector-type");
    /* show vector setup modal form */
    
});

// #endregion

function argsToTextPreview(bundle) {
    var schema = bundle.schema.output;
    var args = bundle.args;
    if(!args || args?.length == 0) return null;
    var t = "<small><u>Parametry</u><ul>"
    for(var i = 0; i < schema.length; i++) {
        value = args.find(a => a.key == schema[i].id)?.value || null;
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

function createAnalysisResultHtml(bundle) {
    if(bundle.schema.output.isSimple) return `<code>${F(bundle.result, bundle.schema.output)}</code>`;
    else if (bundle.schema.output.isObject) {
        var $t = `<table class = "table"><tbody><tr><th>ukazatel</th><th>hodnota</th><tr>`;
        for(let p of bundle.schema.output.properties) {
            $t += `<tr><td>${p.title}</td><td>${F(bundle.result[p.id],p)}</td></tr>`
        }
        $t += "</tbody></table>";
        return $t;
    }
    else if(bundle.schema.output.isArray) {
        var $t = `<table class = "table"><tbody><tr><th>#</th>`;
        for(let h of bundle.schema.output.items)
        {
            $t += `<th data-field = "${h.id}">${h.title}</th>`;
        }
        $t += "</tr>";
        var i = 0;
        for(let r of bundle.result) {
            $t += `<tr><td><small><i>${i+1}</i></small></td>`;
            for(let h of bundle.schema.output.items) {
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
// #endregion

// #region Matrix Analysis tree

function renderMatrixAnalysisMenu()
{
    $("#matrix-method-tree").find("[data-target]").each(function(){
        var method = new MatrixAnalysis($(this).attr("data-target"));
        $(this).attr("data-method", method).append(`<button data-matrix-analysis-form-trigger class="btn" title = "${method.wiki.description}"><b>${method.wiki.title}</b></button>`);
    })
}

$(document).on("click", "[data-matrix-analysis-form-trigger]", function(){
    renderMatrixAnalysisForm($(this).parent().attr("data-target"))
})

function renderMatrixAnalysisForm(method) {
    var analysis = new MatrixAnalysis(method);
    var mconfig = collectVectorConfigsFromBT();
    var $f = `<h5>${analysis.wiki.title}</h5><br><form data-matrix-form action = "javascript:void(0)" data-method = "${method}"><table class="table"><tbody>`;
    var i = 0;
    for(let a of analysis.model.args) {
        var schema = analysis.wiki.arguments.find(_ => _.name == a.name);
        $f += `<tr><td class = "${a.required ? "form-control-required" : ""} ${a.description ? "form-control-tooltip" : ""}" ${a.description ? "title=" + a.description : ""}">${schema.title}</td>`;
        $f += `<td title="${schema.description || ""}">`;
        // argument is vector or matrix
        if(a.class == 1 || a.class ==2) {
            var opts = mconfig.filter(v => (a.type || [1,2,3]).indexOf(v.type) > -1);
            $f += `<select data-arg = ${JSON.stringify(a)} name = "${a.name}" ${a.class == 2 ? "multiple" : ""} class="form-select" ${a.required ? "required" : ""} ${a.multiple ? "multiple" : ""}>`;
            /* prompts select */
            if(!a.required || a.required) $f += `<option value="" disabled selected="true">-- vyberte --</option>`;
            for(let o of opts) {
                $f += `<option value = "${o.name}">${o.name}</option>`;
            }
            $f += "</select>";
        }
        // argument is something else
        else
        {
            if(a.type == "enum") {
                $f += `<select name = "${a.name}" data-arg = ${JSON.stringify(a)} data-control-type="${a.type}" class = "form-select" ${a.required ? "required" : ""}>`
                //$f += `<option value="" disabled ${a.required ? "selected" : ""}>-- vyberte --</option>`;
                for(let e of a.enums.values) {
                    $f += `<option value = ${e.key} ${e.id == a.default ? "selected" : ""}>${analysis.schema.form[i].enums.find(_ => _.id == e.key).title}</option>`
                }
                $f += "</select>";
            }
            else if(a.type == "boolean") {
                $f += `<div class="form-check form-switch"><input data-control-type="${a.type}" checked = ${a.default} ${a.required ? "required" : ""} class="form-check-input" type="checkbox" role="switch" name="${a.id}"></div>`
            }
            else {
                var _type = (a.type == "number" || a.type == "integer" || a.type == "decimal") ? "number" : "text";
                var _step = (a.type == "integer" ? 1 : a.type == "decimal" || a.type == "number" ? 0.001 : null);
                $f += `<input type = "${_type}" data-control-type="${a.type}" ${_step > 0 ? "step=" + _step : null} class="form-control" name = "${a.id}" ${a.default ? "value = " + a.default : ""} ${a.required ? "required" : ""} placeholder = "${a.validatorText}"}>`;
            }
        }
        $f += `</td></tr>`;
        i++;
    }
    $f += `</tbody></table><br><br><button data-matrix-form-args-submit type="submit" class="btn btn-primary">Spočítat</button></form>`;
    $("#modal_matrix_analysis_form").find(".title").text(analysis.wiki.title);
    $("#modal_matrix_analysis_form").find(".modal-body").empty().append($($f));
    $("#modal_matrix_analysis_form").modal("show");
}

/* collects the form data, calculates and renders the matrix analysis method/output */
$(document).on("submit","[data-matrix-form]", function(){
    var fm = new Matrix();
    var args = [];
    $(this).find("[data-arg]").each(function(){
        var arg = JSON.parse($(this).attr("data-arg"));
        var value = $(this).val();
        if(arg.class == 1) {
            if(!arg.required && !value) value = null;
            else if(value) value = source.item(value);
            else {
                msg.error("Povinné");
                return;
            }
            if(value) 
            {
                fm.push(value);
                args.push(value.name());
            } else args.push(null);
        } 
        else if (arg.class == 2) {
            args.push(value);
        } 
        else if (arg.class == 3) {
            if(arg.type == "enum") args.push(Number(value));
            else args.push(value);
        }
    });    
    $("#modal_vector_analysis_form, #modal_matrix_analysis_form").modal("hide");
    var method = $(this).attr("data-method");
    var analysis = fm.analyze(method);
    calculateMatrixAnalysis(analysis, args);
});

function calculateMatrixAnalysis(analysis, args) {
    analysis.run(...args);
    renderAnalysisResult(analysis);
}

function renderAnalysisResult(analysis) {
    var id = srnd();
    var $c = $(createResultCard(id));
    var content = createAnalysisResultHtml(analysis);
    var d = analysis.duration();
    //$c.find(".title").html(`<h5>${analysis.wiki.title}</h5>`)
    $c.find(".title").html(createResultCardTitle(analysis));
    $c.find(".parameters").html(renderAnalysisParameters(analysis));
    $c.find(".sample").html(renderSampleSize(analysis));
    $c.find(".content").append($(content));
    $c.find(".duration").text(`doba výpočtu: ${d < 1000 ? (d) + " ms" : d < 60000 ? N(d/1000) + " sekund" : N(d/60000) + " minut" }`)
    $("#output-container").append($c).ready(function(){
        var $card = $("#output-container").find(`.result-card[id="${id}"]`);
        resultAddons(analysis, $card, function(){
            $(document).find(`[id="output-tab"]`).click();    
        });
    });    
}

function createResultCardTitle(analysis) {
    var $t = `<div class="method-title">${analysis.wiki.title}: </div>`;
    if(analysis.parent.isVector) $t += `<div class="argument-badge-panel"><div class="argument-badge">${analysis.parent.name()}</div></div>`
    else if(analysis.parent.isMatrix) {
        $t += `<div class="argument-badge-panel">`;
        for(var a = 0; a < analysis.args.length; a++) {
            var arg = analysis.args[a];
            if(analysis.model.args[a]?.class == 1) {
                $t += `<div class="argument-badge ${arg.type == 1 ? "text-bg-success" : arg.type == 2 ? "text-bg-warning" : "text-bg-secondary"}">${analysis.parent.item(arg).name()}</div>`;
            }
        };
        $t += "</div>";
    }
    return $t;
}

function collectVectorConfigsFromBT() {
    var vs = [];
    $(tableSelector).find("th[data-field]").each(function(){
        var v = {
            name: $(this).attr("data-field"),
            type: Number($(this).attr("data-vector-type"))
        };
        vs.push(v);
    });
    return vs;
}

// #endregion


// #region Formaters 

/**
 * 
 * @param {*} v value 
 * @param {*} p schema property
 */
function F(v,p) {
    if(v === undefined) return "❔";
    else if(v === null) return "<i>prázdné</i>";
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

function N(v, options) {
    return Number(v).toLocaleString(locale, {style: options?.style || "decimal"})
}

function nullFormatter(v) {
    if(v === null || v === undefined) return `<i style="color: gray" title="prázdná buňka">-</i>`;
    else return v;
}
function srnd(total = 8) {
    return Array(total).fill().map(()=>"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.random()*62)).join("")
}

const msg = {
    error: function(title = "", message = "", timeout = 3000) {
        iziToast.error({
            title: title || "",
            message: message || "",
            timeout: timeout
        });
    },
    ok: function(title = "", message = "", timeout = 3000) {
        iziToast.success({
            title: title || "",
            message: message || "",
            timeout: timeout
        });
    }
}

// #endregion