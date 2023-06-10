$(function(){
    $("[data-source-action]").on("click", function(){
        switch ($(this).attr("data-source-action")) {
            case "open":
                openTableFromFile()
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
    selectFile("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, .sav", function(file){
        if(file.name.match(/.*\.sav/)) {
            msg.info(locale.call("yPAx"))
            return;
            /*
            readBuffer(file, async function(content) {
                var m = await window.IO.readSavBuffer(content);
                debugger;

            })
            */
        }
        else readBinaryString(file, function(content, config = {}){
            try {
                var wb = XLSX.read(content, {type: 'binary'}); 
                showXlsSheetsSelector(wb);
            } catch (e) {
                msg.error("Nepodařilo se importovat soubor");
                if(env == "development") console.error(e);
            }
        })
    });
}

function showXlsSheetsSelector(wb) {
    var $s = $(`<select name = "sheet" class="form-select">${wb.SheetNames.map(n=> "<option>" + n + "</option>")}</select>`);
    $("#modal_xls_sheet_select").find(".selector").empty().append($s);
    $("#modal_xls_sheet_select").find(".confirm").one("click", function(){
        var sheet = $("#modal_xls_sheet_select").find("select").val();
        var hasHeaders = $("#modal_xls_sheet_select").find(".headers-in-first-row").val() == "on";
        if(sheet) showXlsVectorConfig(wb, sheet, hasHeaders);
        $("#modal_xls_sheet_select").modal("hide");
    });
    $("#modal_xls_sheet_select").modal("show");
}

function showXlsVectorConfig(wb, sheet) {
    //    #modal_xls_vector_config
        var ws = wb.Sheets[sheet];
        var r = XLSX.utils.sheet_to_json(ws, {header: 1});
        source = {
            matrix: matrifySheetArray(r, sheet),
            version: "1.0",
            utils: {}
        }
        loadMatrixToTable(null, function(){
            msg.ok("Naimportováno",null,5000);
        });
    }

function matrifySheetArray(arr, sheet) {
    var headers = arr[0];
    var matrix = new Matrix().name(sheet);
    for(var h = 0; h < headers.length; h++) {
        matrix.push(arr.slice(1, arr.length).map(r => r[h]).vectorify().name(headers[h]));
    }
    return matrix;
}

function openTableFromFile() {
    selectFile(".ret", function(file){
        readFile(file, function(content) {
            try {
                content = JSON.parse(content);
                source.matrix = Matrix.deserialize(content);
                source.version = content.version;
                source.utils = content.utils || {};
                loadMatrixToTable(null, function(){
                    msg.ok(`Tabulka ${source.matrix.name() ? source.matrix.name() + " " : ""}nahrána`, "Celkem řádků: " + source.matrix.maxRows())
                });
            } catch (e) {
                msg.error("Nepodařilo se nahrát data.", e.message);
                if(env === "development") console.error(e);
            }
        })
    });
}

function serializeWorkspace() {
    var m = source.matrix.serialize();
    var filters = [];
    $("[data-filter]").each(function() {
        filters.push({
            field: $(this).attr("data-field"),
            type: $(this).attr("data-filter-type"),
            data: $(this).attr("data-filter-type") == "function" ? $(this).attr("data-filter") : JSON.parse($(this).attr("data-filter"))
        })
    });
    return {
        version: version,
        matrix: m.matrix,
        utils: {
            filterOn: filterOn,
            filters: filters,
            actionsLogs: source.utils.actionLogs
        }
    }
}

function saveTableToFile(){
    const blob = new Blob([JSON.stringify(serializeWorkspace())], {type: 'plain/text' });
    const url = URL.createObjectURL(blob);
    var fileName = ($("#table-name").val() ? $("#table-name").val().toLowerCase().replace(/[^a-z0-9+ěščřžýáíéůťňó]/gi, '_') : "retusa_" + new Date().toISOString()) + ".ret";
    $("<a>", {
        href: url,
        download: fileName,
    }).appendTo("body").get(0).click();
    return false;
}

function selectFile(ext, callback = function(a){return a}) {
    var fileDialog = $(`<input type="file" accept="${ext}">`);
    fileDialog.click();
    fileDialog.on("change", function(e){
        var file = $(this)[0].files[0];
        if(file) callback(file);
    });
    return false;
}

function selectFiles(ext, callback = function(a){return a}) {
    var fileDialog = $(`<input type="file" accept="${ext}">`);
    fileDialog.click();
    fileDialog.on("change", function(e){
        var files = $(this)[0].files;
        if(files) callback(files);
    });
    return false;
}

function readFile(file, callback) {
    const reader = new FileReader();
    reader.addEventListener("load", function() {
        if(callback) callback(reader.result);
    });
    reader.readAsText(file);
}

function readBinaryString(file, callback) {
    const reader = new FileReader();
    reader.addEventListener("load", function() {
        if(callback) callback(reader.result);
    });
    reader.readAsBinaryString(file);
}

function readBuffer(file, callback) {
    const reader = new FileReader();
    reader.addEventListener("load", function() {
        if(callback) callback(reader.result);
    });
    //reader.readAsText(file);
    reader.readAsArrayBuffer(file);
}

