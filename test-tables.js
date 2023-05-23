testTables = {
    muvslinreg: {
        data: new Matrix(
            new NumericVector(180,197,240,210,180,160,179,185,183,150,110,190,170).name("výška"),
            new NumericVector(75,82,100,80,75,60,75,71,77,63,46,81,70).name("váha")
            ),
        args: {x: 0, y: 1, model: 1},
        method: "linreg"
    },
    muvsanova1: {
        data: new Matrix(
            new NumericVector(27,27,27,19,30,31).name("A"),
            new NumericVector(30,30,30,30,30,23).name("B"),
            new NumericVector(19,27,28,25,26,30).name("C"),
            new NumericVector(11,25,28,25,28,28).name("D"),
            new NumericVector(36,32,34,29,25,27).name("E")
        ),
        args: {vectors: [0,1,2,3,4]},
        method: "anovaow"
    },
    muvsanova2: {
        data: new Matrix(
            new NumericVector(27,27,27,19,30,31,30,30,30,30,30,23,19,27,28,25,26,30,11,25,28,25,28,28,36,32,34,29,25,27).name("values"),
            new StringVector("A","A","A","A","A","A","B","B","B","B","B","B","C","C","C","C","C","C","D","D","D","D","D","D","E","E","E","E","E","E").name("group")
        ),
        args: {vectors: [0], factor: 1},
        method: "anovaow"
    },
    plantanovatw: {
        data: new Matrix(
            new StringVector("daily","daily","daily","daily","daily","daily","daily","daily","daily","daily","daily","daily","daily","daily","daily","daily","daily","daily","daily","daily","weekly","weekly","weekly","weekly","weekly","weekly","weekly","weekly","weekly","weekly","weekly","weekly","weekly","weekly","weekly","weekly","weekly","weekly","weekly","weekly").name("watering frequency"),
            new StringVector("none","none","none","none","none","low","low","low","low","low","medium","medium","medium","medium","medium","high","high","high","high","high","none","none","none","none","none","low","low","low","low","low","medium","medium","medium","medium","medium","high","high","high","high","high").name("sunlight exposure"),
            new NumericVector(4.8, 4.4, 3.2, 3.9, 4.4, 5, 5.2, 5.6, 4.3, 4.8, 6.4, 6.2, 4.7, 5.5, 5.8, 6.3, 6.4, 5.6, 4.8, 5.8, 4.4, 4.2, 3.8, 3.7, 3.9, 4.9, 5.3, 5.7, 5.4, 4.8, 5.8, 6.2, 6.3, 6.5, 5.5, 6, 4.9, 4.6, 5.6, 5.5).name("plant growth")
        ),
        args: {f1: 0, f2: 1, v: 2},
        method: "anovatw"
    },
    druganovaowrm: {
        data: new Matrix(
            new StringVector("patient A", "patient B", "patient C", "patient D", "patient E").name("patient"),
            new NumericVector(30,14,24,38,26).name("drug 1"),
            new NumericVector(28,18,20,34,28).name("drug 2"),
            new NumericVector(16,10,18,20,14).name("drug 3")
        ),
        args: {vectors: [1,2,3]},
        method: "anovaowrm"
    },
    muvscontingency1: {
        data: new Matrix(
            new StringVector("ZŠ","ZŠ","ZŠ","ZŠ","SŠ","SŠ","SŠ","SŠ","VŠ","VŠ","VŠ","VŠ").name("dosažené vzdělání"),
            new StringVector("A","B","C","D","A","B","C","D","A","B","C","D").name("skupina"),
            new NumericVector(39,25,25,27,17,30,40,29,12,41,62,53).name("četnost")
        ),
        args: {rows: 0, columns: 1, n: 2},
        method: "contingency"
    },
    kwanova1: {
        data: new Matrix(
            new NumericVector(7,14,14,13,12,9,6,14,12,8).name("fertilizer 1"),
            new NumericVector(15,17,13,15,15,13,9,12,10,8).name("fertilizer 2"),
            new NumericVector(6,8,8,9,5,14,13,8,10,9).name("fertilizer 3")
        ),
        args: {vectors: [0,1,2]},
        method: "kwanova"
    },
    correlmatrix: {
        data: new Matrix(
            new NumericVector(11, 15, 9, 4, 34, 17, 18, 14, 12, 13, 26, 31).name("Czech"),
            new NumericVector(10, 16, 9, 3, 38, 17, 16, 14, 13, 13, 26, 31).name("German"),
            new NumericVector(11, 15, 9, 7, 34, 27, 8, 4, 19, 13, 26, 31).name("French"),
            new NumericVector(-11, -15, -9, -9, -24, -27, -8, -14, -9, -18, -24, -32).name("English")
        ),
        args: {vectors: [0,1,2,3], method: 1},
        method: "correlMatrix"
    },
    anycorrel: function() {
        return new Matrix(
            new NumericVector(1,2,3,4,4,5,6,7,7,8,9,10,11,11,12,13,14,15,16,16).name("proměnná x"),
            new NumericVector(20,19,2,4,5,7,6,8,9,10,10,20,13,12,14,13,19,16,18,6).name("proměnná y"),
            new NumericVector(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20).name("proměnná z"),
            new BooleanVector(0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1).name("binární proměnná")
            );
    },
    contingency1: function() {
        var m = new Matrix();
        var n = 5000;
        var empty = 0;
        m.push(StringVector.generate({total: n, list: ["muži", "ženy", "děti"], nullprob: empty}).name("řádeček"));
        m.push(StringVector.generate({total: n, list: ["ZŠ", "SŠ", "VŠ"], nullprob: empty}).name("sloupeček"));
        return m;
    },
    contingency2: function() {
        var m = new Matrix();
        var n = 5000;
        var empty = 0;
        m.push(StringVector.generate({total: n, list: 50, nullprob: empty}).name("řádeček"));
        m.push(StringVector.generate({total: n, list: 20, nullprob: empty}).name("sloupeček"));
        return m;
    },
    genreg: function(){
        var m = new Matrix().name("Regrese: testovací sada dvou náhoně generovaných vektorů N = 5000");
        var n = 5000;
        var empty = 0;
        m.push(NumericVector.generate({total: n, min: 20, max: 500, nullprob: empty}).name("independent"));
        m.push(NumericVector.generate({total: n, min: 30, max: 50, nullprob: empty}).name("dependent"));
        return m;
    },
    anova1: function(){
        var m = new Matrix();
        var n = 5000;
        var empty = 0.2;
        m.push(NumericVector.generate({total: n, min: 20, max: 500, nullprob: empty}).name("skóre"));
        m.push(StringVector.generate({total: n, list: ["Česká republika", "Německo", "Francie", "Španělsko", "Rusko", "Japonsko"], nullprob: empty}).name("stát"));
        return m;
    },
    anova2: function(){
        var m = new Matrix();
        var n = 5000;
        var empty = 0.01;
        m.push(NumericVector.generate({total: n, min: 20, max: 500, nullprob: empty}).name("Česká republika"));
        m.push(NumericVector.generate({total: n, min: 200, max: 500, nullprob: empty}).name("Německo"));
        m.push(NumericVector.generate({total: n, min: 0, max: 300, nullprob: empty}).name("Francie"));
        m.push(NumericVector.generate({total: n, min: -500, max: 100, nullprob: empty}).name("Španělsko"));
        m.push(NumericVector.generate({total: n, min: 500, max: 800, nullprob: empty}).name("Rusko"));
        return m;
    },
    ttestind1: function(){
        var m = new Matrix();
        var n = 2000;
        var empty = 0.01;
        m.push(StringVector.generate({total: n, list: ["Česká republika", "Německo"], nullprob: empty}).name("stát"));
        m.push(NumericVector.generate({total: n, min: 20, max: 90, nullprob: empty}).name("skóre"));
        return m;
    },
    ttestind2: function(){
        var m = new Matrix();
        var n = 1000;
        var empty = 0.05;
        m.push(NumericVector.generate({total: n * 1.1, min: 20, max: 100, nullprob: empty}).name("Česká republika"));
        m.push(NumericVector.generate({total: n * 1.2, min: 50, max: 120, nullprob: empty}).name("Německo"));
        return m;
    }
}

const makro= {
    anova1: function(){
        runMakro("anovaow", testTables.anova1(),{vectors: [0], factor: 1})
    },
    anova2: function(){
        runMakro("anovaow", testTables.anova2(),{vectors: [0,1,2,3,4]})
    },
    ttestind1: function(){
        runMakro("ttestind", testTables.ttestind1(),{vectors: [1],factor: 0})
    },
    muvslinreg: function() {
        runMakro("linreg", testTables.muvslinreg(), {x: 0, y: 1, model: 1});
    },
    anycorrel: function() {
        runMakro("correlPearson", testTables.anycorrel(), [0,1]);
        runMakro("correlSpearman", testTables.anycorrel(), [0,1]);
        runMakro("correlKendall", testTables.anycorrel(), [0,1]);
        runMakro("correlPartial", testTables.anycorrel(), [0,2,1]);
        runMakro("correlBiserial", testTables.anycorrel(), [3,0]);
    },
    correlmatrix: function() {
        runMakro("correlmatrix", testTables.correlmatrix(), {vectors: [0,1,2,3], method: 1});
    },
    muvscontingency: function(){
        runMakro("contingency", testTables.muvscontingency(),{rows: 0, columns: 1, n: 2});
    },
};

function runMakro(method, matrix, args) {
    loadMatrixToTable(matrix);
    var analysis = source.analyze(method);
    renderAnalysis(analysis, args);
}