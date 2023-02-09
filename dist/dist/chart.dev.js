"use strict";

var chartMaker = function chartMaker(analysis, $card) {
  if (!vectorChartLibs[analysis.name]) return false;else vectorChartLibs[analysis.name](bundle, $card);
};

var vectorChartLibs = {
  "histogram": function histogram(bundle, $card) {
    console.log("post process");
  }
};