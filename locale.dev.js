"use strict";

function isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _construct(Parent, args, Class) { if (isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

/* global locale */
var _locale = window.localStorage.getItem("language") || navigator.language || navigator.userLanguage || "en-GB";

$(function () {
  resetLanguage();
});

function updateLocale() {
  $(".modal").modal("hide");
  $(document).find("[__text], [__title], [__placeholder], [__href], [__value]").each(function () {
    var tags = _construct(Array, _toConsumableArray(this.attributes)).filter(function (a) {
      return a.name.substring(0, 2) === "__";
    });

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = tags[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var t = _step.value;
        var tn = t.name.replace("__", "");
        var tv = t.value;
        if (tn == "text") $(this).text(locale.call(tv));else if (tn == "value") {
          var v = $(this).attr("__value");
          var type = $(this).attr("data-value-type");
          if (type == "number" || type == "zeroToOneInc" || type == "integer" || type == "uint") $(this).text(N(Number(v)));else if (type == "percent") $(this).text(N(Number(v), {
            style: "percent"
          }));else $(this).text(v);
        } else $(this).attr(tn, locale.call(tv));
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
  });
  $(tableSelector).bootstrapTable("refreshOptions", {
    locale: _locale
  });
  window.localStorage.setItem("language", _locale);
  if (source) loadMatrixToTable(source);
  $(document).ready(function () {
    $(".offcanvas").offcanvas("hide");
    $("#splash").fadeOut(500);
  });
}

$(document).on("click", "button[data-language]", function () {
  _locale = $(this).attr("data-language");
  resetLanguage();
});

function resetLanguage() {
  if (locale.listLanguages().indexOf(_locale) < 0) _locale = "cs-CZ";
  locale.setDefault(_locale).setData(_locale, window.dictionary[_locale], false);
  updateLocale();
}