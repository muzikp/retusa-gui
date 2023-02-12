"use strict";

testTables = {
  contingency: function contingency() {
    var m = new Matrix();
    var n = 5000;
    var empty = 0;
    m.push(StringVector.generate({
      total: n,
      list: ["muži", "ženy", "děti"],
      nullprob: empty
    }).name("řádeček"));
    m.push(StringVector.generate({
      total: n,
      list: ["ZŠ", "SŠ", "VŠ"],
      nullprob: empty
    }).name("sloupeček"));
    return m;
  },
  contingency2: function contingency2() {
    var m = new Matrix();
    var n = 5000;
    var empty = 0;
    m.push(StringVector.generate({
      total: n,
      list: 50,
      nullprob: empty
    }).name("řádeček"));
    m.push(StringVector.generate({
      total: n,
      list: 20,
      nullprob: empty
    }).name("sloupeček"));
    return m;
  },
  genreg: function genreg() {
    var m = new Matrix();
    var n = 5000;
    var empty = 0;
    m.push(NumericVector.generate({
      total: n,
      min: 20,
      max: 500,
      nullprob: empty
    }).name("independent"));
    m.push(NumericVector.generate({
      total: n,
      min: 30,
      max: 50,
      nullprob: empty
    }).name("dependent"));
    return m;
  },
  anova1: function anova1() {
    var m = new Matrix();
    var n = 5000;
    var empty = 0.2;
    m.push(NumericVector.generate({
      total: n,
      min: 20,
      max: 500,
      nullprob: empty
    }).name("skóre"));
    m.push(StringVector.generate({
      total: n,
      list: 5,
      nullprob: empty
    }).name("skupina"));
    return m;
  }
};