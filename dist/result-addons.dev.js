"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _construct(Parent, args, Class) { if (isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

$(function () {});

var resultAddons = function resultAddons(analysis, $card, callback) {
  if (!addonLibs[analysis.name]) {//$($card).find(".chart-container").remove();
    //setTimeout((callback || function(){return true})(), 5000)
  } else {
    //var eid = getChartContainerId($card);
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = addonLibs[analysis.name][Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var addon = _step.value;

        if (addon.type == "chart") {
          var chdata = addon.data(analysis);
          createChartContainer($card, function (chid) {
            $(new Chart(document.getElementById(chid), chdata)).ready(function () {
              console.log("redmnde");
            });
          });
        } else if (addon.type == "table") {
          var tdata = addon.data(analysis);
          $($card).find(".result-addons").append(tdata);
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }
};

function createChartContainer($card, callback) {
  /* adds and returns a unique ID of the .chart-container element for hosting the ChartJS object */
  var chid = srnd();
  $($card).find(".result-addons").append("<canvas id = \"".concat(chid, "\"></canvas>")).ready(function () {
    callback(chid);
  });
}

function createTableContainer($card, callback) {
  var t = srnd();
  $($card).find(".result-addons").append("<canvas id = \"".concat(chid, "\"></canvas>")).ready(function () {
    callback(chid);
  });
}

var addonLibs = {
  "histogram": [{
    type: "chart",
    data: function data(analysis) {}
  }],
  "genreg": [{
    type: "calculator",
    render: function render(analysis) {}
  }, {
    type: "chart",
    data: function data(analysis) {
      var maxPointsToDisplay = 200;

      var _data = (analysis.matrix.maxRows() > maxPointsToDisplay ? analysis.matrix.select(analysis.args[0], analysis.args[1]).sample(maxPointsToDisplay) : analysis.matrix.select(analysis.args[0], analysis.args[1])).toArray();

      var cdata = _construct(Array, _toConsumableArray(_data));

      console.dir(cdata);

      _data.map(function (e) {
        switch (analysis.args[2]) {
          case 2:
            e[0] = Math.log(e[0]);
            break;

          case 3:
            e[0] = 1 / e[0];
            break;

          case 4:
            e[1] = Math.log(e[1]);
            break;

          case 5:
            e[0] = Math.log(e[0]);
            e[0] = Math.log(e[1]);
            break;
        }

        return {
          x: e[0],
          y: e[1]
        };
      });

      var xmin = cdata.map(function (_) {
        return _.x;
      }).min();
      var xmax = cdata.map(function (_) {
        return _.x;
      }).max();
      var subtitle = analysis.matrix.maxRows() > maxPointsToDisplay ? "zobrazen n\xE1hodn\xFD v\xFDb\u011Br ".concat(maxPointsToDisplay, " ").concat(_data.length > 2 ? "bodů" : "bodu") : null;
      var cvals = [];
      var clabel = [];

      for (var c = xmin; c <= xmax; c += (xmax - xmin) / _data.length) {
        cvals.push({
          x: c,
          y: analysis.result.beta0 + analysis.result.beta1 * c
        }); //cvals.push({x: c, y: Math.log(c)})
      }

      return {
        type: 'scatter',
        data: {
          datasets: [{
            type: "scatter",
            xAxisID: "x",
            data: cvals,
            label: "y = f(x)",
            borderColor: null,
            borderWidth: 0,
            pointRadius: 1,
            pointHoverRadius: 0,
            fill: false,
            tension: 0,
            showLine: true
          }, {
            type: "scatter",
            xAxisID: "x",
            label: "pozorovan\xE9 p\u0159\xEDpady".concat(subtitle ? " (výběr)" : ""),
            data: _data
          }]
        },
        options: {
          scales: {
            x: {
              type: 'linear',
              position: 'bottom'
            }
          },
          plugins: _objectSpread({}, ch_Title("".concat(analysis.wiki.title, " (").concat(analysis.schema.form[2].enums.find(function (e) {
            return e.id == analysis.args[2];
          }).title, " model)"), subtitle))
        }
      };
    }
  }],
  "contingency": [{
    type: "table",
    data: function data(analysis) {
      var _analysis$matrix;

      var rowLabels = analysis.matrix.item(analysis.args[0]).distinct().asc();
      var columnLabels = analysis.matrix.item(analysis.args[1]).distinct().asc();

      var na = (_analysis$matrix = analysis.matrix).select.apply(_analysis$matrix, _toConsumableArray(analysis.args)).toArray(); //if(rowLabels.length * columnLabels.length > 30) return "<p>pro zobrazení kontingenční tabulky je struktura tabulky příliš velká</p>";


      var $t = "<div class=\"result-addon-table-container\"><div class=\"table-title\">Kontingen\u010Dn\xED tabulka (abs. \u010Detnosti)</div>\n                <div class=\"table-responsive\"><table class=\"table table-bordered\"><tbody><tr><th></th>";
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = columnLabels[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var cl = _step2.value;
          $t += "<th>".concat(cl, "</th>");
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
            _iterator2["return"]();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      ;
      $t += "<th>CELKEM</th></tr>";
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        var _loop = function _loop() {
          var r = _step3.value;
          $t += "<tr><th>".concat(r, "</th>");
          rowTotal = 0;
          columnLabels.forEach(function (cl) {
            var n = na.filter(function (o) {
              return o[0] == r && o[1] == cl;
            }).length;
            rowTotal += n;
            $t += "<td>".concat(N(n), "</td>");
          });
          $t += "<th>".concat(N(rowTotal), "</th></tr>");
        };

        for (var _iterator3 = rowLabels[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var rowTotal;

          _loop();
        }
        /* bottom summary */

      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
            _iterator3["return"]();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      $t += "<tr><th>CELKEM</th>";
      columnLabels.forEach(function (cl) {
        var n = na.filter(function (o) {
          return o[1] == cl;
        }).length;
        $t += "<th>".concat(N(n), "</th>");
      });
      $t += "</tr>";
      $t += "</tbody></table></div></div>";
      console.log($t);
      return $t;
    }
  }]
};

function ch_Title(title, subtitle) {
  var t = {};

  if (title) {
    t.title = {
      display: true,
      text: title,
      font: {
        size: 24
      }
    };
  }

  if (subtitle) {
    t.subtitle = {
      display: true,
      text: subtitle,
      font: {
        size: 18
      }
    };
  }

  return t;
}