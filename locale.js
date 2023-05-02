var _locale = window.localStorage.getItem("language") || navigator.language || navigator.userLanguage || "en-GB"

$(function(){
    resetLanguage();
});

function updateLocale() {
    $(".modal").modal("hide");
    $(document).find("[__text], [__title], [__placeholder], [__href], [__value]").each(function(){
        var tags = new Array(...this.attributes).filter(a => a.name.substring(0,2) === "__");
        for(var t of tags) {
            var tn = t.name.replace("__","");
            var tv = t.value;
            if(tn == "text") $(this).text(locale.call(tv));
            else if(tn == "value") {
                var v = $(this).attr("__value");
                var type = $(this).attr("data-value-type");
                if(type == "number" || type == "zeroToOneInc" || type == "integer" || type == "uint") $(this).text(N(Number(v)));
                else if(type == "percent") $(this).text(N(Number(v), {style: "percent"}));
                else $(this).text(v);
            }
            else $(this).attr(tn, locale.call(tv));
        }
    });
    $(tableSelector).bootstrapTable("refreshOptions", {
        locale: _locale
    });
    window.localStorage.setItem("language", _locale);
    if(source) loadMatrixToTable(source);
    $(document).ready(function(){
        $(".offcanvas").offcanvas("hide");
        $("#splash").fadeOut(500);
    })
}

$(document).on("click", "button[data-language]", function(){
    _locale = $(this).attr("data-language");
    resetLanguage();
})

function resetLanguage() {
    if(locale.listLanguages().indexOf(_locale) < 0) _locale = "cs-CZ";
    locale.setDefault(_locale).setData(_locale, window.dictionary[_locale], false);
    updateLocale();
}