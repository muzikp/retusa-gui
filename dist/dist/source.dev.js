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
  /*
  $("#confirm-paste").on("click", function(){
      parsePastedData()
  });
  $("#confirm-pasted-config").on("click", function(){
      headers = [];
      $("#pasted-data-config-table").find("tr").each(function(){
          var h = {
              name: $(this).find("[data-var-field='name']").val(),
              type: $(this).find("[data-var-field='type']").val()
          };
          headers.push(h);
      });
      matrix = new Matrix();
      var hasError = false;
      for(var i = 0; i < headers.length; i++) {
          var values = data.map(_ => _[i]);
          try {
              if(headers[i].type == 1) {
                  values = parseNumeric(values);
                  matrix.push(new NumericVector(values).name(headers[i].name));
              } 
              else if(headers[i].type == 2)
              {
                  matrix.push(new StringVector(values).name(headers[i].name));
              }
              else if(headers[i].type == 3)
              {
                  values = parseBoolean(values);
                  matrix.push(new NumericVector(values).name(headers[i].name));
              }
          } catch(e) {
              iziToast.error({
                  title: `Nepovolená hodnota v proměnné <b>${headers[i].name}</b>`,
                  message: e.message,
                  timeout: 15000
              });
              hasError = true;
              break;
          } 
      }
      if(!hasError) {
          loadMatrixToTable(matrix);
          iziToast.success({
              title: `Data byla úspěšně nahrána.`,
              message: "Nyní můžete začít s analýzou."
          });
          $(".modal").modal("hide");
          localStorage.setItem(defTableName, JSON.stringify(matrix.serialize()));
      }
      
  });
  $("#confirm-paste-previous").on("click", function(){
      $("#modal_paste_config").modal("hide");
      $("#modal_paste_editor").modal("show");        
  });
  
  
  function parsePastedData(){
      data = $("#pasted-data").val().split(/\n/g).filter(_ => _?.length > 0).map(_ => _.split(/\t/g));
      createPastedDataConfig($("#pasted-data-has-headers").prop("checked"));
  }
  
  function createPastedDataConfig(includeHeaders){ 
      if(includeHeaders) {
          headers = data[0];
          data = data.slice(1,data.length);
      }
      else {
          var mv = Math.max(...data.map(r => Object.keys(r).length));
          headers = Array.from({length: mv}, (_, i) => "VAR" + zeroPad(i + 1, mv > 100 ? 3 : mv > 10 ? 2 : 1))
      }
      var $config = "";
      headers.forEach(function(h) {
          $config += `<tr><td><input class="form-control" type="text" required = true data-var-field="name" value = "${h}"></td><td><select data-var-field = "type" class="form-select"><option value = 1>numerická</option><option value = 2>textová</option><option value = 3>binární</option></select></td></tr>`;
      });
      $("#pasted-data-config-table").empty().append($($config));
      $("#modal_paste_editor").modal("hide");
      $("#modal_paste_config").modal("show");
  }
  
  function parseNumeric(values){
      var containsDots = values.filter(_ => String(_).match(/\./g)).length > 0;
      if(containsDots) {
          values = values.map(v => String(v).replace(/^\d.-]+/g,""));
      } else {
          values = values.map(v => String(v).replace(/\,/,".").replace(/^\d.-]+/g,""));
      }
      return values;
  }
  
  function parseBoolean(values){
      values = values.map(function(v){
          if(["true","pravda","1"].indexOf(String(v).toLowerCase()?.trim()) > -1) return true;
          else if (["false","nepravda","0","-1"].indexOf(String(v).toLowerCase()?.trim()) > -1) return false;
          else return null;
      });
      return values;
  }
  const zeroPad = (num, places) => String(num).padStart(places, '0')
  */
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
    matrix: source.serialize() //createMatrixFromTable().serialize()

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