"use strict";

var locale = "cs-CZ";
var matrix;
$(function () {
  // #region Matrix extensions
  Matrix.prototype.readConfig = function () {
    var t = {
      pagination: true,
      search: true,
      columns: []
    };
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = this[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var c = _step.value;
        t.columns.push({
          field: c.name(),
          title: c.name(),
          sortable: true,
          custom: "typeo"
        });
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

    return t;
  };

  Matrix.prototype.readData = function () {
    return this.toTable();
  }; // #endregion


  matrix = new Matrix(StringVector.generate({
    total: 50,
    list: 5
  }).name("groups"), NumericVector.generate({
    total: 50,
    min: 200,
    max: 500
  }).name("score"));
  loadMatrixToTable(matrix);
});

function loadMatrixToTable(matrix) {
  var selector = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "#table";
  $(selector).bootstrapTable(matrix.readConfig());
  $(selector).bootstrapTable("load", matrix.readData());
  $(selector).bootstrapTable("refreshOptions", {
    locale: locale
  });
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = matrix[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var c = _step2.value;
      $(selector).find("[data-field=\"".concat(c.name(), "\"]")).attr("data-vector-type", c.type());
      $(selector).find("[data-field=\"".concat(c.name(), "\"]")).append("<button>prdel</button>");
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
}