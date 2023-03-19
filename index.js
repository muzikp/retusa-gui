const version = "1.0";
//const _locale = "en-GB";
const tableSelector = "#table";
const log = [];
const env = "development";
const defTableName = "lastTable";
let source;
var activeAnalysisModalForm;
var filterOn = true;
var userConfig = {
  showOutputNodeTitle: window.localStorage.getItem("showOutputNodeTitle")
};

/* IMPORTANT!! */
$(function() {
  window.locale.setDefault(_locale);
  init();
  renderMatrixAnalysisMenu();
  initContextMenus();
});

function initContextMenus() {
  $(document).ready(function() {
    $(document).on("contextmenu", "[data-field]", function(e) {
        $("body").append(createVectorMenu($(this)));
        $("#context-menu").css({
            display: "block",
            left: e.pageX,
            top: e.pageY
        });
        return false;
    });
    $(document).click(function() {
      $("#context-menu").hide();
      $("#context-menu").remove();
    });
  });
  return false;
}

function createVectorMenu(sender) {
  var vector = source.item($(sender).attr("data-field"));
  var parent = (`<div id="context-menu" class="dropdown-menu" aria-labelledby="dropdownMenuButton">`);
  for(let n of vectorContextMenuTree()) {
    parent += createVectorMenuNode(n,vector,parent);
  }
  parent += "</div>";
  return parent;
}

function createVectorMenuNode(node, vector) {
  if(node.type == "header") {
    return `<li><div class="context-menu-header">${node.value}</div></li>`;
  } 
  else if(node.type == "method") {
    var _m = new VectorAnalysis(node.value);
    return (`<li class="dropdown-item"><button ${(_m.model.type).indexOf(vector.type()) < 0 ? "disabled" : ""} data-field = "${vector.name()}" data-vector-analysis-trigger class="dropdown-item ${_m.unstable ? "unstable" : ""}" type="button" data-model = "${node.value}" data-model-has-args = ${!!_m.model.args}>${_m.title.value}</button></li>`);
  }
  else if(node.type == "parent") {
    var e = `<li class="dropdown"><a class="dropdown-item dropdown-toggle" href="#" id="${node.id}" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">${node.value}</a><ul class="dropdown-menu" aria-labelledby="${node.id}">`;
    for(let ch of node.children || [])
    {
      e += createVectorMenuNode(ch, vector);
    }
    e += "</ul></li>";
    return e;
  }
  else if(node.type == "divider") {
    return `<li><hr class="dropdown-divider"></li>`;
  }
  else if(node.type == "custom") {
    return (`<li class="dropdown-item"><button data-custom-id = "${node.id}" data-vector-name = "${vector.name()}" class="dropdown-item dropdown-item-button" type="button" onclick='vectorContextMenuTree().find(m => m.id == "${node.id}").function(this)'>${node.value}</button></li>`);
  }
  return "";
}

// #region Retusa extensions

function init() {
  readUserConfigFromStorage();
  const applyVectorFilter = function() {
    return source.applyFilters().item(this.name());
  }
  NumericVector.prototype.applyFilter = applyVectorFilter;
  StringVector.prototype.applyFilter = applyVectorFilter;
  BooleanVector.prototype.applyFilter = applyVectorFilter;
  Matrix.prototype.readConfig = function() {
    var t = {
      pagination: true,
      columns: []
    };
    for (let c of this) {
      t.columns.push({
        field: c.name(),
        title: c.name(),
        sortable: true,
        filterControl: "select-multiple",
        formatter: nullFormatter
      })
    }
    return t;
  }
  Matrix.prototype.readData = function(config) {
    return this.toTable(config);
  }
  Matrix.prototype.updateCell = function(index, field, value) {
    try {
      this.item(field)[index] = this.item(field).parse(value);
      return true;
    } catch (e) {
      msg.error("Chybná hodnota", e.message, 3000);
      return false;
    }
  };
  Matrix.prototype.toTable = function(config) {
    var table = [];
    for (var r = config.offset; r <= ((config.offset + config.limit - 1) > this.maxRows() ? this.maxRows() : config.offset + config.limit - 1); r++) {
      var row = {};
      for (var v = 0; v < this.length; v++) {
        row[this[v].name() || v] = this[v][r];
      }
      table.push(row);
    }
    return table;
  }
  Matrix.prototype.toArray = function() {
    var _ = [];
    for (var i = 0; i < this.maxRows(); i++) {
      var r = [];
      for (var c = 0; c < this.length; c++) {
        r.push(this[c][i])
      }
      _.push(r);
    };
    return _;
  }
  Matrix.prototype.toNamedArray = function() {
    var _ = [];
    for (var i = 0; i < this.maxRows(); i++) {
      var r = {};
      for (var c = 0; c < this.length; c++) {
        r[this[c].name()] = this[c][i];
      }
      _.push(r);
    };
    return _;
  }
  Matrix.prototype.ajax = function(p) {    
    var data = [];
    /* try filter first */
    if(filterOn) {
      var filters = collectFiltersFromHeaders();
      if(filters.length > 0) {
        try {
          data = matrixToBSFormat(this.filter(...filters));
        } catch(e){
          console.error(e);
        }      
      }
      else {
        data = matrixToBSFormat(this);
      }
    }
    else {
      data = matrixToBSFormat(this);
    }
  
    /* then sort */
    if (p.data.sort) {
      var order = p.data.order == "asc" ? 1 : -1;
      data = data.sort((a, b) => a[p.data.sort] > b[p.data.sort] ? order : -order);
    }
    /* finally limit - offset */
    data = data.slice(p.data.offset, p.data.limit + p.data.offset);
    return {
      total: source.maxRows(),
      totalNotFiltered: data.length,
      rows: data
    };
  }
  Matrix.prototype.applyFilters = function() {
    if(filterOn) {
      var filters = collectFiltersFromHeaders();
      if(filters.length > 0) return this.filter(...filters);
      else return this;
    } else return this;
  }
  // #region Cell editor
  function matrixToBSFormat(m) {
    var data = [];
    for (var r = 0; r < m.maxRows(); r++) {
      var row = {};
      for (var v = 0; v < m.length; v++) {
        row[m[v].name() || v] = m[v][r];
      }
      data.push(row);
    }
    return data;
  }

  /* render input control on cell doubleclick */
  $(document).one("click-cell.bs.table.bs.table", function(event, field, value, row, $e) {
    onClickCellBs(...arguments)
  }).on("mouseleave", function() {});

  function onClickCellBs(event, field, value, row, $e) {
    var index = Number($e.closest("tr").attr("data-index"));
    var $i = $(`<input bootstrap-table-cell-input data-index = ${index} data-field = "${field}"  data-value = "${value}" style="z-index: 100;" class="form-control" ${nullify(value) ? 'value = "' + nullify(value) + '"' : ""}>`);
    $e.html($i).find("input").focus().select();
  }
  /* update or leave cell on keydown */
  $(document).on("keydown", "[bootstrap-table-cell-input]", function(event) {
    onCellInputKeyDown(this, event)
  });

  function onCellInputKeyDown($e, event) {
    if (event.key == "Escape") $(this).closest("td").empty().text($(this).attr("data-value"));
    /* renders the select control with distinct values */
    else if (event.key == "Control" || event.key == "Tab") {
      var index = Number($($e).attr("data-index"));
      var field = $($e).attr("data-field");
      var value = $($e).attr("data-value");
      var values = source.item(field).distinct().sort((a, b) => a > b ? 1 : -1).filter(_ => (_ !== null && _ !== undefined));
      var $s = `<select bootstrap-table-cell-select class="form-select" data-index = ${index} data-field="${field}" data-value = "${$($e).attr("data-value")}">`;
      for (var v of values) {
        $s += `<option ${v == value ? "selected" : ""}>${v}</option>`
      };
      $s += "</select>";
      $($e).closest("td").empty().html($s).focus().click(function() {
        $("option").slideDown()
      });
    } else if (event.key == "Enter") {
      var field = $($e).attr("data-field");
      var index = Number($($e).attr("data-index"));
      var value = nullify($($e).val());
      if (source.updateCell(index, field, value)) {
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
  $(document).on("mouseleave", "[bootstrap-table-cell-input]", function(e) {
    $(this).closest("td").empty().text($(this).attr("data-value"));
  });
  /* reinitializes the mouseenter event only after the mouse has left the last cell */
  $(document).on("mouseleave", "td", function() {
    $(document).one("click-cell.bs.table.bs.table", function(event, field, value, row, $e) {
      onClickCellBs(...arguments)
    }).on("mouseleave", function() {});
  });
  /* on select control changed/option selected */
  $(document).on("change", "[bootstrap-table-cell-select]", function() {
    var field = $(this).attr("data-field");
    var index = Number($(this).attr("data-index"));
    var value = nullify($(this).val());
    if (source.updateCell(index, field, value)) {
      $(this).closest("td").empty().text(value);
      $("#table").bootstrapTable('updateCell', {
        index: index,
        field: field,
        value: value,
        reinit: false
      });
    }
  });
  $(document).on("mouseleave", "[bootstrap-table-cell-select]", function() {
    var v = nullify($(this).attr("data-value"));
    if (v !== null) $(this).closest("td").empty().text(v);
    else $(this).closest("td").empty();
  })

  function nullify(v) {
    if (v === undefined || v === "undefined") return null;
    else if (v === 0 || v == "0") return 0;
    else if (v === false || v === "false") return false;
    else if (v) return v;
    else return null;
  }
  // #endregion
}

function collectFiltersFromHeaders(dataField) {
  // nahradit ve filtr undefined za null
  if(dataField) {
    var th = $(tableSelector).find(`[data-field="${dataField}"]`);
    var type = th.attr("data-filter-type") || null;
    var filter = th.attr("data-filter") || null;
    if(type != "function") filter = filter ? JSON.parse(filter) : null;
    return {
      type: type,
      filter: filter
    }
  } else {
    var filters = [];
    $(tableSelector).find("[data-field]").each(function(){
      if($(this).attr("data-filter")) {
        filters.push($(this).attr("data-field"));
        var filter = $(this).attr("data-filter");
        if($(this).attr("data-filter-type") == "array") {
          filter = JSON.parse(filter);
          const filterContent = JSON.parse($(this).attr("data-filter"));
          filters.push(function(v,i,a) {return filterContent.indexOf(v) > -1 })
        } 
        else if($(this).attr("data-filter-type") == "numrange") {
          filter = JSON.parse(filter);
          var min = isN(filter.minv) ? Number(filter.minv) : -Number.MAX_SAFE_INTEGER;
          var max = isN(filter.maxv) ? Number(filter.maxv) : Number.MAX_SAFE_INTEGER;
          var fn = (v,i,a) => (filter.minop == 1 ? v > min : filter.minop == 2 ? v >= min : false) && (filter.maxop == 3 ? v < max : filter.maxop == 4 ? v <= max : false);
          filters.push(fn);
        }
        else if($(this).attr("data-filter-type") == "function") {
          filters.push(eval(filter));
        }
      }
    });
    return filters;
  }
}

// returns true if the value is number, incluing zero
function isN(v) {
  if(v === "" || v === undefined || v === null) return false;
  if(Number(v) > 0 || Number(v) < 0) return true;
  else if(v === "0" || v === 0) return true;
  else return false;
}

// #endregion

// #region test datasets & makro

$(document).on("click", "#test-dataset", function() {
  var dataset = testTables[$("#test-dataset-selector").val()].data;
  loadMatrixToTable(dataset);
  $(".offcanvas").offcanvas("hide");
});

$(document).on("click", "#test-makro", function() {
  var dataset = testTables[$("#test-dataset-selector").val()];
  loadMatrixToTable(dataset.data);
  var analysis = source.analyze(dataset.method);
  renderAnalysis(analysis, dataset.args);
  $(".offcanvas").offcanvas("hide");
});

// #endregion

// #region Table rendering

function matrixAJAX(p) {
  if (!source) return;
  else {
    var data = source.ajax(p);
    p.success(data);
  }
}

/* transfer the matrix to the Bootstrap Table */
function loadMatrixToTable(data, callback) {
  //toggleFilteringStatus(false);
  data.isMatrix ? source = data : source = data.matrix;
  $(tableSelector).bootstrapTable('destroy');
  $(tableSelector).empty().bootstrapTable(source.readConfig());
  $(tableSelector).bootstrapTable("refreshOptions", {
    locale: _locale,
    smartDisplay: true
  });
  for (let c of source) {
    $(tableSelector).find(`[data-field="${c.name()}"]`).attr("data-vector-type", c.type()).addClass(c.type() == 1 ? "th-numeric" : c.type() == 2 ? "th-string" : c.type() == 3 ? "th-boolean" : "")
    if(data.utils) {
      (data?.utils?.filters || []).forEach(function(f) {
        $(tableSelector).find(`[data-field="${f.field}"]`).attr("data-filter", f.type == "function" ? f.data : JSON.stringify(f.data)).attr("data-filter-type", f.type);
      });
      filterOn = !!data?.utils?.filterOn;
      toggleFilteringStatus(data?.utils?.filterOn);
    }
  }
  $("#table-name").val(source.name() || "");
  $(document).ready(function() {
    toggleFilteringStatus(data?.utils?.filterOn, true);
    $(document).find(`[id="table-tab"]`).click();
    if (callback) callback($(tableSelector));
  });

}

/** returns HTML layout for the result card */
function createResultCard(id = srnd()) {
  var card = `
    <div id = "${id}" class="card result-card" style="padding-top: 1rem;">
    <div class="card-body">
      <div class="card-header">
        <div class="title v-center" style="display: flex"></div>
        <span class="close-card"> 
            <span style="display: flex;flex-direction: row-reverse;">
              <button title="${locale.call("F9Ey")}" __title = "F9Ey" class="btn close-card-btn" style="display: flex;flex-direction: row-reverse;"><i class="fa-solid fa-trash"></i></button>
              <button title="${locale.call("9be5")}" __title = "9be5" class="btn copy-canvas-layout-btn" style="display: flex;flex-direction: row-reverse;"><i class="fa-solid fa-copy"></i></button>
              <button title="${locale.call("hQFe")}" __title = "hQFe" class="btn collapse-result-card" style="display: flex;flex-direction: row-reverse;"><i class="fa-solid fa-eye"></i></button>
            </span>
          </span>
      </div>
      <div class="result-content">
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
    </div>
  </div>`
  return card
}

/* copy the result card as an image to the clipboard */
$(document).on("click", ".copy-canvas-layout-btn", function() {
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
    const blob = new Blob([byteArray], {
      type: 'image/png'
    });
    navigator.clipboard.write([new ClipboardItem({
      'image/png': blob
    })]).then(function() {
      msg.ok(locale.call("OlK9"), null, 3000);
      copyContainer.remove();
    }).catch(function(error) {
      msg.error(locale.call("2is6"), env == "development" ? e.toString() : "", 3000)
      if (env === "development") console.error(e);
      copyContainer.remove();
    });
  });
})

/* renders the parameter overview for both vector and matrix methods */
function renderAnalysisParameters(analysis) {
  return `<div class="parameter-info"><div class="box-header" __text="W3m6">${locale.call("W3m6")}</div>${analysis.paramOutputHtml()}`;
}

/* renders the sample statistics for both vector and matrix methods */
function renderSampleSize(analysis) {
  return `<div class="sample-info"><div class="box-header" __text="2KsX">${locale.call("2KsX")}</div>${analysis.sampleOutputHtml()}`;
}

// #endregion

function activateTab(name, scrollBottom = false, callback) {
  $(`[tab-target="${name}"]`).tab("show").ready(function() {
    $("#output-container").animate({
      scrollTop: $(document).height()
    }, 1000);
    callback();
  });
}

// #region analysis results rendering

// #region VECTOR ANALYSIS EVENTS

// autoscrolls the the bottom of the page when a new result card is added
$(document).on('shown.bs.collapse', "#wsCollapseOutput", function() {
  $(document).scrollTop($(document).height());
});

function renderVectorFormSchema(method, vector) {
  var analysis = new VectorAnalysis(method);
  var $h = `<div><h5 __test="${analysis.title.key}">${analysis.title.value}`
  if(analysis.description.value) $h += `<button __title = "FfIl" title="${locale.call("FfIl")}" data-btn-method-title = "${analysis.title.key || ""}" data-btn-method-description = "${analysis.description.value || ""}" class="btn"><i class="fa-solid fa-book" style="color: gray;"></i></button>`;
  $h += "</h5></div>";
  $("#modal_vector_analysis_form").find(".method-title").empty().append($($h));
  var $f = "";
  $f += `<form data-vector-form action = "javascript:void(0)" data-vector-type = "${vector.type()}" data-field = "${vector.name()}" data-method = "${method}"><table class="table"><tbody>`;
  var i = 0;
  for (let a of analysis.parameters()) {
    $f += `<tr><td class = "${a.required ? "form-control-required" : ""} ${a.description.value ? "form-control-tooltip" : ""}" ${a.description.value ? "title=\"" + a.description.value : ""}">${a.title?.value}</td>`;
    $f += `<td title="${a.description.value || ""}">`;
    $f += a.html() + `</td></tr>`;
    i++;
  }
  $f += `</tbody></table><br><br><button data-vector-form-args-submit type="submit" class="btn btn-primary">${locale.call("np1p")}</button></form>`;
  //$("#modal_vector_analysis_form").find(".title").text(analysis.title.value);
  $("#modal_vector_analysis_form").find(".modal-body").empty().append($($f));
  $("#modal_vector_analysis_form").modal("show");
}

function renderMatrixAnalysisForm(method) {
  var analysis = new MatrixAnalysis(method);
  var $h = `<div><h5 __test="${analysis.title.key}">${analysis.title.value}`
  if(analysis.description.value) $h += `<button __title = "FfIl" title="${locale.call("FfIl")}" data-btn-method-title = "${analysis.title.key || ""}" data-btn-method-description = "${analysis.description.value || ""}" class="btn"><i class="fa-solid fa-book" style="color: gray;"></i></button>`;
  $h += "</h5></div>";
  $("#modal_matrix_analysis_form").find(".method-title").empty().append($($h));
  var $f = `<form data-matrix-form action = "javascript:void(0)" data-method = "${method}"><table class="table"><tbody>`;
  var i = 0;
  for (let a of analysis.parameters()) {
    $f += `<tr><td class = "${a.required ? "form-control-required" : ""} ${a.description.value ? "form-control-tooltip" : ""}" ${a.description.value ? "title='" + a.description.value : "'"}">${a.title?.value}</td>`;
    $f += `<td title="${a.description.value || ""}">`;
    $f += a.html() + `</td></tr>`;
    i++;
  }
  $f += `</tbody></table><br><br><button data-matrix-form-args-submit type="submit" class="btn btn-primary">${locale.call("np1p")}</button></form>`;
  $("#modal_matrix_analysis_form").find(".modal-body").empty().append($($f));
  $("#modal_matrix_analysis_form").modal("show");
}

/* calculate the vector method (in no argument set or otherwise render the vector method form */
$(document).on("click", "[data-vector-analysis-trigger]", function() {
  var method = $(this).attr("data-model");
  var vector = source.item($(this).attr("data-field"));
  if ($(this).attr("data-model-has-args") == "true") {
    renderVectorFormSchema(method, vector);
  } else {
    try {
      var analysis = vector.applyFilter().analyze(method).run();
      renderAnalysisResult(analysis);
    } catch (e) {
      msg.error(locale.call("VzKZ"), env === "development" ? e.toString() : "", 15000);
      if (env === "development") console.error(e);
      return;
    }
  }
})

function serializeForm(form){
  var args = {};
  $(form).find("[name]").each(function(){
    var name = $(this).attr("name");
    var value = $(this).val();
    var _type = $(this).attr("data-type") || "any";
    if(value === "") args[name] = undefined;
    else if(_type == "number") args[name] = Number(value);
    else if(_type == "boolean") args[name] = !!$(this).prop("checked")
    else args[name] = value;
  });
  return args;
} 

/** calculates a vector method after form is submitted */
$(document).on("submit", "[data-vector-form]", function() {
  activeAnalysisModalForm = $(this);
  var args = serializeForm(this);
  try {
    var analysis = source.applyFilters().item($(this).attr("data-field")).analyze($(this).attr("data-method"), );
    renderAnalysis(analysis, args, $(this));
  } 
  catch(e) 
  {
    msg.error(locale.call("VzKZ"), e.message, 15000);
    if(env === "development") console.error(e);
    toggleCalculationFormState("on");
    return;
  }
});

/* removes the result card */
$(document).on("click", ".close-card-btn", function() {
  $(this).closest(".card").remove();
});

/* expand the data collapsible and scroll up */
$(document).on("click", ".collapse-result-card", function() {
  var $c = $(this).closest(".result-card").find(".result-content");
  var isCollapsed = $c.hasClass("collapsed") ;
  $(this).closest(".result-card").find(".result-content").toggleClass("collapsed");
  if(!isCollapsed) {
    $(this).html(`<i class="fa-solid fa-eye-slash"></i>`);
  } else $(this).html(`<i class="fa-solid fa-eye"></i>`);
})

$(document).on("click", ".bt-header-config", function() {
  var field = $(this).closest(`[data-field]`).attr("data-field");
  var type = $(this).closest("[data-vector-type]").attr("data-vector-type");
  /* show vector setup modal form */

});

// #endregion

function createAnalysisResultHtml(analysis) {
  return Output.html(analysis);  
}
// #endregion

// #region Matrix Analysis tree

function renderMatrixAnalysisMenu() {
  $("#matrix-method-tree").find("[data-target]").each(function() {
    var method = new MatrixAnalysis($(this).attr("data-target"));
    $(this).attr("data-method", method).append(`<button __text = "${method.title.key}" __title = "${method.description.key}" data-matrix-analysis-form-trigger class="btn ${method.unstable ? " unstable" : ""}" title = "${method.description.value}">${method.title.value}</button>`);
  })
}

$(document).on("click", "[data-matrix-analysis-form-trigger]", function() {
  if(!source) return false;
  renderMatrixAnalysisForm($(this).parent().attr("data-target"))
})

$(document).on("click","[data-btn-method-description]", function(){
    msg.info(locale.call($(this).attr("data-btn-method-title")).toUpperCase(), $(this).attr("data-btn-method-description"), 60000);
})

/* collects the form data, calculates and renders the matrix analysis method/output */
$(document).on("submit", "[data-matrix-form]", function() {
  activeAnalysisModalForm = $(this);
  var args = {};
  $(this).find("[name]").each(function(){
    args[$(this).attr("name")] = $(this).val();
  });
  try {
    var analysis = source.applyFilters().analyze($(this).attr("data-method"));
    renderAnalysis(analysis, args, $(this));
  } 
  catch(e) 
  {
    msg.error(locale.call("VzKZ"), e.message, 15000);
    if(env === "development") console.error(e);
    toggleCalculationFormState("on");
    return;
  }
});

function renderAnalysis(analysis, args, sender) {
  activeAnalysisModalForm = sender;
  toggleCalculationFormState("off", function(){
    try {
      if(typeof args == "object" && Object.keys(args).length > 0) analysis.run(args);
      else analysis.run();
      toggleCalculationFormState("on", function(){
        $("#modal_vector_analysis_form, #modal_matrix_analysis_form").modal("hide");
        renderAnalysisResult(analysis);
      });      
    } catch (e) {
      msg.error(locale.call("VzKZ"), e.message, 15000);
      if(env === "development") console.error(e);
      toggleCalculationFormState("on");
      return;
    }
  });
}

function toggleCalculationFormState(state, callback) {
  var sender = $(activeAnalysisModalForm);
  if(state == "off") {
    $(sender).find("[data-arg]").each(() => $(this).prop("disabled", "true"));    
    $(sender).find("[data-matrix-form-args-submit]").html(`<span class="_visually-hidden">${locale.call("KCOc")} </span><div class="spinner-border spinner-border-sm text-light" role="status"></div>`).prop("disabled", true);
  } else {
    $(sender).find("[data-arg]").each(() => $(this).prop("disabled", false));
    $(sender).find("[data-matrix-form-args-submit]").prop("disabled", false).text(locale.call("np1p"));
  }
  $(document).ready(function(){
    setTimeout(function(){if(callback) callback()}, 500);
  })
    
}

function renderAnalysisResult(analysis) {
  var id = srnd();
  var $c = $(createResultCard(id));
  var content = createAnalysisResultHtml(analysis);
  $c.find(".title").html(createResultCardTitle(analysis));
  if(userConfig.showOutputParamsInfo && Object.entries(analysis.args || {}).filter(a => a[1] !== undefined).length > 0) $c.find(".parameters").html(renderAnalysisParameters(analysis));
  else $c.find(".parameters").closest(".col-6").remove();
  if(userConfig.showOutputSampleInfo) $c.find(".sample").html(renderSampleSize(analysis));
  else $c.find(".sample").closest(".col-6").remove();
  $c.find(".content").append($(content));
  if(userConfig.showOutputDuration) $c.find(".duration").append(`<div __text="wWol">${locale.call("wWol")}</div><div>: </div><div __value = ${analysis.duration()}>${N(analysis.duration())}</div><div> ms</div>`);
  else $c.find(".duration").closest(".row").remove();
  $("#output-container").append($c).ready(function() {
    var $card = $("#output-container").find(`.result-card[id="${id}"]`);
    resultAddons(analysis, $card, function() {
      $(document).find(`[id="output-tab"]`).click();
    });
  });
}

function createResultCardTitle(analysis) {
  var $t = `<div class="method-title" __text="${analysis.title.key}">${analysis.title.value}</div>`;
  if (analysis.parent.isVector) {
    $t += `<div class="argument-badge-panel"><div class="argument-badge">${analysis.parent.name()}</div></div>`;
  } else {
    $t += `<div class="argument-badge-panel">`;
    var output = Output.html(analysis, true);
    var ps = analysis.parameters();
    console.dir(ps);
    for (var a = 0; a < ps.length; a++) {
      var arg = ps[a];
      if(arg.isVector && arg.value) {
        if(arg.multiple)
        {
          for(let v of arg.value) {
            $t += `<div class="argument-badge">${v.name() || ""}</div>`;  
          }
        } else
        {
          $t += `<div class="argument-badge">${arg.value.name() || ""}</div>`;
        }

      }

      if (analysis.model.args[a]?.class == 1) {
        $t += `<div class="argument-badge ${arg?.type == 1 ? "text-bg-success" : arg?.type == 2 ? "text-bg-warning" : "text-bg-secondary"}">${analysis.parent.item(arg) ? analysis.parent.item(arg).name() : ""}</div>`;
      } else if (analysis.model.args[a]?.class == 2) {
        for (var v of analysis.args[a]) {
          if (v?.isVector) $t += `<div class="argument-badge ${v?.type == 1 ? "text-bg-success" : v?.type == 2 ? "text-bg-warning" : "text-bg-secondary"}">${v?.name() || "?"}</div>`;
        }
      }
    };
    $t += "</div>";
  }
  return $t;
}

function collectVectorConfigsForMatrixForm() {
  return source.smap(function(v){return {name: v.name(), type: v.type()}});
}

// #endregion


// #region Formaters 

/**
 * 
 * @param {*} v value 
 * @param {*} p schema property
 */
function F(v, p) {
  if (v === undefined) return "❔";
  else if (v === null) return `<i __text="RICH">${locale.call("RICH")}</i>`;
  if (p.type == "boolean") {
    if (!v) return "❌";
    else return "✅"
  } else if (p.type == "integer") {
    return Math.round(v).toLocaleString(_locale, {
      style: "decimal"
    });
  } else if (p.type == "percent") {
    return v.toLocaleString(_locale, {
      style: "percent"
    });
  } else if (p.type == "number") {
    return v.toLocaleString(_locale, {
      style: "decimal"
    })
  } else return v;
}

function N(v, options) {
  return Number(v).toLocaleString(_locale, {
    style: options?.style || "decimal"
  })
}

function nullFormatter(v) {
  if (v === null || v === undefined) return `<i style="color: gray" __title="RICH" title="${locale.call("RICH")}">-</i>`;
  //else if(v === true) return "✅";
  //else if(v === false) return "❌";
  else return v;
}

function srnd(total = 8) {
  return Array(total).fill().map(() => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.random() * 62)).join("")
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
  },
  info: function(title = "", message = "", timeout = 60000) {
    iziToast.info({
      title: title || "",
      message: message || "",
      timeout: timeout,
      position: "bottomCenter",
      theme: "dark",
      color: "black"
    });
  }
}

// #endregion

$(document).on("click","#toggle-table-filter", function(){
  toggleFilteringStatus();
})

function toggleFilteringStatus(status = undefined, skipRefresh = false) {
  if(status === undefined) {
    filterOn = !filterOn;
    status = filterOn;
  } else {
    filterOn = !!status;
  }
  if(!status) {
    //filterOn = false;
    $("#toggle-table-filter").removeClass("on").addClass("off").attr("title", locale.call("Aayt")).attr("__title", "Aayt");
    if(!skipRefresh) $(tableSelector).bootstrapTable("refresh");
  } else {
    //filterOn = true;
    $("#toggle-table-filter").removeClass("off").addClass("on").attr("title", locale.call("j3L7")).attr("__title", "j3L7");
    if(!skipRefresh) $(tableSelector).bootstrapTable("refresh");
  }
}

//#region Setting panel events

function readUserConfigFromStorage(){
  ["showOutputNodeTitle", "showOutputSampleInfo", "showOutputParamsInfo", "showOutputDuration", "showOutputPreprocessor"].forEach(function(s){
    userConfig[s] = window.localStorage.getItem(s) == "true" ? true : window.localStorage.getItem(s) == "false" ? false : undefined;
    if(userConfig[s]) $(`[data-settings-output-switch="${s}"]`).prop("checked", true);
  });
}

$(document).on("change", "[data-settings-output-switch]", function(){
  var target = $(this).attr("data-settings-output-switch");
  userConfig[target] = $(this).prop("checked");
  window.localStorage.setItem(target, userConfig[target]);
})

// #endregion