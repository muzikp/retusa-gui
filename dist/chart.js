var chartMaker = function(analysis, $card) {
    if(!vectorChartLibs[analysis.name]) return false;
    else vectorChartLibs[analysis.name](bundle, $card)
}

const vectorChartLibs = {
    "histogram": function(bundle, $card){
        console.log("post process");
    }
}