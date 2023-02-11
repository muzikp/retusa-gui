var chartMaker = function(analysis, $card, callback) {
    if(!vectorChartLibs[analysis.name]) {
        $($card).find(".chart-container").remove();
        //setTimeout((callback || function(){return true})(), 5000)
    }
    else {        
        var eid = getChartContainerId($card);
        var chdata = vectorChartLibs[analysis.name](analysis);
        new Chart(document.getElementById(eid), chdata);
    }
}

const vectorChartLibs = {
    "histogram": function(analysis){
        var curve = [];
        var r = analysis.result;
        var step = r[0].to - r[0].from;
        var avg = analysis.vector?.avg();
        var stdev = analysis.vector?.stdev();
        var min = analysis.vector?.min() // avg - 3*stdev;
        var max = analysis.vector?.max() // avg + 3*stdev;
        while (min <= max) {
            curve.push(utils.distribution.normdist(min, avg, stdev));
            min += step;
        }
        return {
            data: {
                datasets: [{
                    type: 'bar',
                    yAxisID: "pri",
                    label: 'četnost',
                    data: r.map(_ => _.n),
                    barPercentage: 1
                }, {
                    type: 'line',
                    yAxisID: "sec",
                    label: 'normální rozdělení',
                    data: curve,
                    tension: 0.25
                },
                {
                    type: 'line',
                    yAxisID: "tri",
                    label: 'kumulativní četnost v %',
                    data: r.map(_ => _.pc),
                    tension: 0.5
                }],
                labels: r.map(_ => N(_.from) + " - " + N(_.to))
            },
            options: {
                scales: {
                    pri: {
                      type: 'linear',
                      display: true,
                      position: 'left',
                      beginAtZero: true,
                      barPercentage: 3,
                      //ticks: percentTicks,
                      title: {
                        display: true,
                        text: "četnost"
                      }
                    },
                    sec: {
                      type: 'linear',
                      display: false,
                      position: 'right',
                      grid: {
                        drawOnChartArea: false
                      },
                      beginAtZero: true,
                      title: {
                        display: false
                      }
                      //ticks: percentTicks
                    },
                    tri: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                          drawOnChartArea: false
                        },
                        beginAtZero: true,
                        ticks: percentTicks,
                        title: {
                          display: true,
                          text: "kumulativní četnost v %"
                        }
                      }
                },
                plugins: {
                    ...getChartTitle(analysis)
                }
              }
        }
    },
    "frequency": function(analysis){
        var r = analysis.result;
        return {
            data: {
                datasets: [{
                    type: 'bar',
                    label: 'četnost',
                    yAxisID: 'pri',
                    data: r.map(_ => _.frequency)
                }, {
                    type: 'line',
                    label: 'kumulativní četnost v %',
                    yAxisID: 'sec',
                    data: getCumulation(r.map(_ => _.frequency), true),
                }],
                labels: r.map(_ => _.value == null ? "-- prázdné --" : _.value)
            },
            options: {
                plugins: {
                    ...getChartTitle(analysis)
                },
                scales: {
                    pri: {
                      type: 'linear',
                      display: true,
                      position: 'left',
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: "četnost"
                      }
                    },
                    sec: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      grid: {
                        drawOnChartArea: false
                      },
                      beginAtZero: true,
                      ticks: percentTicks,
                      title: {
                        display: true,
                        text: "kumulativní četnost v %"
                      }
                    },
                    sec: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      grid: {
                        drawOnChartArea: false
                      },
                      beginAtZero: true,
                      ticks: percentTicks,
                      title: {
                        display: true,
                        text: "kumulativní četnost v %"
                      }
                    }
                }
            }
        }
    }
}

/* adds and returns a unique ID of the .chart-container element for hosting the ChartJS object */
function getChartContainerId($card) {
    var id = srnd(); //"chart" + Date.now();
    $($card).find(".chart-container").empty().attr("id", id);
    return id;
}

function getChartTitle(analysis) {
    return {
        subtitle: {
            display: !!analysis.wiki.title,
            text: analysis.wiki.title,
            font: {
                size: 18
            }
        },
        title: {
            display: !!analysis.parent?.name(),
            text: analysis.parent?.name(),
            font: {
                size: 24
            }
        }
    };    
}

function getCumulation(arr, percent = false) {

    var _arr = arr.map(function(e, index) {
        if(index > 0) return arr.slice(0, index+1).reduce((a,b) => a + b);
        else return e;
    });
    if(percent) {
        var sum = arr.reduce((a,b) => a + b);
        return _arr.map(_ => _/sum);
    } else return _arr;
}

percentTicks = {
    suggestedMax: 1,
    suggestedMin: 0,
    callback: function(val, index) {
      return N(val, {style: "percent"});
    }
  }