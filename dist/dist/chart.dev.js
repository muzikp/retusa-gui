"use strict";

var chartMaker = function chartMaker(analysis, $card) {
  if (0 == 1 && !vectorChartLibs[analysis.name]) return false;else {
    var eid = getChartContainerId($card);
    var chdata = vectorChartLibs[analysis.name](analysis);
    var mixedChart = new Chart(document.getElementById(eid), chdata);
  }
};

var vectorChartLibs = {
  "histogram": function histogram(analysis) {
    var r = analysis.result;
    console.dir(r);
    return {
      data: {
        datasets: [{
          type: 'bar',
          label: 'četnost v %',
          data: r.map(function (_) {
            return _.p;
          })
        }, {
          type: 'line',
          label: 'kumulativní četnost v %',
          data: r.map(function (_) {
            return _.pc;
          })
        }],
        labels: r.map(function (_) {
          return _.from + " - " + _.to;
        })
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          title: {
            display: true,
            text: analysis.vector.name() || "Nepojmenovaná proměnná"
          },
          subtitle: {
            display: true,
            text: analysis.wiki.title
          }
        }
      }
    };
  }
};
/* adds and returns a unique ID of the .chart-container element for hosting the ChartJS object */

function getChartContainerId($card) {
  var id = "chart" + Date.now();
  $($card).find(".chart-container").attr("id", id);
  return id;
}

function getTitle(analysis) {
  var k = {
    title: {
      display: true,
      text: analysis.wiki.title
    }
  };
  if (title) k.title = {
    display: true,
    text: title
  };
  if (title) k.subtitle = {
    display: true,
    text: analysis.vector.name()
  };
  return k;
}