"use strict";

$(function () {
  $("[data-source-action]").on("click", function () {
    switch ($(this).attr("data-source-action")) {
      case "open":
        openTableFromFile();
        break;

      case "save":
        saveTableToFile();
        break;

      case "import":
        importFromFile();
        break;

      default:
        break;
    }
  });
});

function importFromFile() {
  selectFile("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel", function (file) {
    readBinaryString(file, function (content) {
      try {
        var wb = XLSX.read(content, {
          type: 'binary'
        });
        showXlsSheetsSelector(wb);
      } catch (e) {
        msg.error("Nepodařilo se importovat soubor");
        if (env == "development") console.error(e);
      }
    });
  });
}

function showXlsSheetsSelector(wb) {
  var $s = $("<select name = \"sheet\" class=\"form-select\">".concat(wb.SheetNames.map(function (n) {
    return "<option>" + n + "</option>";
  }), "</select>"));
  $("#modal_xls_sheet_select").find(".selector").empty().append($s);
  $("#modal_xls_sheet_select").find(".confirm").one("click", function () {
    var sheet = $("#modal_xls_sheet_select").find("select").val();
    var hasHeaders = $("#modal_xls_sheet_select").find(".headers-in-first-row").val() == "on";
    if (sheet) showXlsVectorConfig(wb, sheet, hasHeaders);
    $("#modal_xls_sheet_select").modal("hide");
  });
  $("#modal_xls_sheet_select").modal("show");
}

function showXlsVectorConfig(wb, sheet) {
  //    #modal_xls_vector_config
  var ws = wb.Sheets[sheet];
  var r = XLSX.utils.sheet_to_json(ws, {
    header: 1
  });
  r = matrifySheetArray(r, sheet);
  loadMatrixToTable(r, function () {
    msg.ok("Naimportováno", null, 5000);
  });
}

function matrifySheetArray(arr, sheet) {
  var headers = arr[0];
  var matrix = new Matrix().name(sheet);

  for (var h = 0; h < headers.length; h++) {
    matrix.push(arr.slice(1, arr.length).map(function (r) {
      return r[h];
    }).vectorify().name(headers[h]));
  }

  return matrix;
}

function openTableFromFile() {
  selectFile(".ret", function (file) {
    readFile(file, function (content) {
      try {
        var o = JSON.parse(content).matrix;
        var m = Matrix.deserialize(o);
        loadMatrixToTable(m, function () {
          msg.ok("Tabulka ".concat(m.name() ? m.name() + " " : "", "nahr\xE1na"), "Celkem řádků: " + m.maxRows());
        });
      } catch (e) {
        msg.error("Nepodařilo se nahrát data.", e.message);
        if (env === "development") console.error(e);
      }
    });
  });
}

function saveTableToFile() {
  var blob = new Blob([JSON.stringify({
    version: version,
    matrix: source.serialize()
  })], {
    type: 'plain/text'
  });
  var url = URL.createObjectURL(blob);
  var fileName = ($("#table-name").val() ? $("#table-name").val().toLowerCase().replace(/[^a-z0-9+ěščřžýáíéůťňó]/gi, '_') : "retusa_" + new Date().toISOString()) + ".ret";
  var dl = $("<a>", {
    href: url,
    download: fileName
  }).appendTo("body").get(0).click();
  return false;
}

function selectFile(ext) {
  var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (a) {
    return a;
  };
  var fileDialog = $("<input type=\"file\" accept=\"".concat(ext, "\">"));
  fileDialog.click();
  fileDialog.on("change", function (e) {
    var file = $(this)[0].files[0];
    if (file) callback(file);
  });
  return false;
}

function selectFiles(ext) {
  var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (a) {
    return a;
  };
  var fileDialog = $("<input type=\"file\" accept=\"".concat(ext, "\">"));
  fileDialog.click();
  fileDialog.on("change", function (e) {
    var files = $(this)[0].files;
    if (files) callback(files);
  });
  return false;
}

function readFile(file, callback) {
  var reader = new FileReader();
  reader.addEventListener("load", function () {
    if (callback) callback(reader.result);
  });
  reader.readAsText(file);
}

function readBinaryString(file, callback) {
  var reader = new FileReader();
  reader.addEventListener("load", function () {
    if (callback) callback(reader.result);
  });
  reader.readAsBinaryString(file);
}