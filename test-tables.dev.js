"use strict";

testTables = {
  vectorconfig: {
    data: new Matrix(new NumericVector(27, 27, 27, 19, 30, 31, 30, 30, 30, 30, 30, 23, 19, 27, 28, 25, 26, 30, 11, 25, 28, 25, 28, 28, 36, 32, 34, 29, 25, 27).name("values").label("naměřené hodnoty").formatter(function (v, i, a) {
      return v < a.avg() ? "podprůměr" : "nadprůměr";
    }), new StringVector("A", "A", "A", "A", "A", "A", "B", "B", "B", "B", "B", "B", "C", "C", "C", "C", "C", "C", "D", "D", "D", "D", "D", "D", "E", "E", "E", "E", "E", "E").name("group").label("skupina respondentů").formatter({
      "A": "adolescenti",
      "B": "blbci",
      "C": "cisterciáci",
      "D": "debilová",
      "E": "emilové"
    })),
    args: {
      vectors: [0],
      factor: 1
    },
    method: "anovaow"
  },
  correl: {
    data: new Matrix(new NumericVector(180, 197, 240, 210, 180, 160, 179, 185, 183, 150, 110, 190, 170).name("výška"), new NumericVector(75, 82, 100, 80, 75, 60, 75, 71, 77, 63, 46, 81, 70).name("váha")),
    args: {
      x: 0,
      y: 1,
      methods: [1, 2, 4]
    },
    method: "correl"
  },
  muvslinreg: {
    data: new Matrix(new NumericVector(180, 197, 240, 210, 180, 160, 179, 185, 183, 150, 110, 190, 170).name("výška"), new NumericVector(75, 82, 100, 80, 75, 60, 75, 71, 77, 63, 46, 81, 70).name("váha")),
    args: {
      x: 0,
      y: 1,
      model: 1
    },
    method: "linreg"
  },
  muvsanova1: {
    data: new Matrix(new NumericVector(27, 27, 27, 19, 30, 31).name("A").label("Aš"), new NumericVector(30, 30, 30, 30, 30, 23).name("B").label("Brno"), new NumericVector(19, 27, 28, 25, 26, 30).name("C").label("Chlumec nad Cidlinou"), new NumericVector(11, 25, 28, 25, 28, 28).name("D").label("Dobřicovice"), new NumericVector(36, 32, 34, 29, 25, 27).name("E").label("Ejpovice")),
    args: {
      vectors: [0, 1, 2, 3, 4]
    },
    method: "anovaow"
  },
  muvsanova2: {
    data: new Matrix(new NumericVector(27, 27, 27, 19, 30, 31, 30, 30, 30, 30, 30, 23, 19, 27, 28, 25, 26, 30, 11, 25, 28, 25, 28, 28, 36, 32, 34, 29, 25, 27).name("values").label("naměřené hodnoty"), new StringVector("A", "A", "A", "A", "A", "A", "B", "B", "B", "B", "B", "B", "C", "C", "C", "C", "C", "C", "D", "D", "D", "D", "D", "D", "E", "E", "E", "E", "E", "E").name("group").label("skupina").formatter({
      A: "Aš",
      B: "Brno",
      C: "Chlumec na Cidlinou",
      D: "Dobřichovice",
      E: "Ejpovice"
    })),
    args: {
      vectors: [0],
      factor: 1
    },
    method: "anovaow"
  },
  plantanovatw: {
    data: new Matrix(new StringVector("daily", "daily", "daily", "daily", "daily", "daily", "daily", "daily", "daily", "daily", "daily", "daily", "daily", "daily", "daily", "daily", "daily", "daily", "daily", "daily", "weekly", "weekly", "weekly", "weekly", "weekly", "weekly", "weekly", "weekly", "weekly", "weekly", "weekly", "weekly", "weekly", "weekly", "weekly", "weekly", "weekly", "weekly", "weekly", "weekly").name("watering frequency"), new StringVector("none", "none", "none", "none", "none", "low", "low", "low", "low", "low", "medium", "medium", "medium", "medium", "medium", "high", "high", "high", "high", "high", "none", "none", "none", "none", "none", "low", "low", "low", "low", "low", "medium", "medium", "medium", "medium", "medium", "high", "high", "high", "high", "high").name("sunlight exposure"), new NumericVector(4.8, 4.4, 3.2, 3.9, 4.4, 5, 5.2, 5.6, 4.3, 4.8, 6.4, 6.2, 4.7, 5.5, 5.8, 6.3, 6.4, 5.6, 4.8, 5.8, 4.4, 4.2, 3.8, 3.7, 3.9, 4.9, 5.3, 5.7, 5.4, 4.8, 5.8, 6.2, 6.3, 6.5, 5.5, 6, 4.9, 4.6, 5.6, 5.5).name("plant growth")),
    args: {
      f1: 0,
      f2: 1,
      v: 2
    },
    method: "anovatw"
  },
  druganovaowrm: {
    data: new Matrix(new StringVector("patient A", "patient B", "patient C", "patient D", "patient E").name("patient"), new NumericVector(30, 14, 24, 38, 26).name("drug 1"), new NumericVector(28, 18, 20, 34, 28).name("drug 2"), new NumericVector(16, 10, 18, 20, 14).name("drug 3")),
    args: {
      vectors: [1, 2, 3]
    },
    method: "anovaowrm"
  },
  ancova: {
    data: new Matrix(new StringVector("A", "A", "A", "A", "A", "B", "B", "B", "B", "B", "C", "C", "C", "C", "C").name("study technique"), new NumericVector(67, 88, 75, 77, 85, 92, 69, 77, 74, 88, 96, 91, 88, 82, 80).name("Current grade"), new NumericVector(77, 89, 72, 74, 69, 78, 88, 93, 94, 90, 85, 81, 83, 88, 79).name("Exam score")),
    args: {
      factor: 0,
      dependent: 2,
      covariant: 1
    },
    method: "ancova"
  },
  muvscontingency1: {
    data: new Matrix(new StringVector("ZŠ", "ZŠ", "ZŠ", "ZŠ", "SŠ", "SŠ", "SŠ", "SŠ", "VŠ", "VŠ", "VŠ", "VŠ").name("education").label("dosažené vzdělání").formatter({
      "ZŠ": "základní škola",
      "SŠ": "střední škola",
      "VŠ": "vysoká škola"
    }), new StringVector("A", "B", "C", "D", "A", "B", "C", "D", "A", "B", "C", "D").name("skupina"), new NumericVector(39, 25, 25, 27, 17, 30, 40, 29, 12, 41, 62, 53).name("četnost")),
    args: {
      rows: 0,
      columns: 1,
      n: 2
    },
    method: "contingency"
  },
  kwanova1: {
    data: new Matrix(new NumericVector(7, 14, 14, 13, 12, 9, 6, 14, 12, 8).name("F1").label("fertilizer 1"), new NumericVector(15, 17, 13, 15, 15, 13, 9, 12, 10, 8).name("F2").label("fertilizer 2"), new NumericVector(6, 8, 8, 9, 5, 14, 13, 8, 10, 9).name("F3").label("fertilizer 3")),
    args: {
      vectors: [0, 1, 2]
    },
    method: "kwanova"
  },
  correlmatrix: {
    data: new Matrix(new NumericVector(11, 15, 9, 4, 34, 17, 18, 14, 12, 13, 26, 31).name("Czech"), new NumericVector(10, 16, 9, 3, 38, 17, 16, 14, 13, 13, 26, 31).name("German"), new NumericVector(11, 15, 9, 7, 34, 27, 8, 4, 19, 13, 26, 31).name("French"), new NumericVector(-11, -15, -9, -9, -24, -27, -8, -14, -9, -18, -24, -32).name("English")),
    args: {
      vectors: [0, 1, 2, 3],
      method: 1
    },
    method: "correlMatrix"
  }
};

function runMakro(method, matrix, args) {
  loadMatrixToTable(matrix);
  var analysis = source.analyze(method);
  renderAnalysis(analysis, args);
}