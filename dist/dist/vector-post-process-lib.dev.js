"use strict";

var vectorPostProcess = function vectorPostProcess(method, $card) {
  if (!vectorPostProcessLibs[method]) return false;
};

var vectorChartLibs = {
  "histogram": function histogram(bundle, $card) {
    console.log("post process");
  }
};