testTables = {
    muvslinreg: function() {
        return new Matrix(
            new NumericVector(180,197,240,210,180,160,179,185,183,150,110,190,170).name("proměnná x"),
            new NumericVector(75,82,100,80,75,60,75,71,77,63,46,81,70).name("proměnná y")
            );
    },
    muvsanova1: function(){
        return new Matrix(
            new NumericVector(27,27,27,19,30,31).name("A"),
            new NumericVector(30,30,30,30,30,23).name("B"),
            new NumericVector(19,27,28,25,26,30).name("C"),
            new NumericVector(11,25,28,25,28,28).name("D"),
            new NumericVector(36,32,34,29,25,27).name("E")
        )
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
    muvscontingency: function() {
        return new Matrix(
            new StringVector("ZŠ","ZŠ","ZŠ","ZŠ","SŠ","SŠ","SŠ","SŠ","VŠ","VŠ","VŠ","VŠ").name("dosažené vzdělání"),
            new StringVector("A","B","C","D","A","B","C","D","A","B","C","D").name("skupina"),
            new NumericVector(39,25,25,27,17,30,40,29,12,41,62,53).name("četnost")
        ).name("Kontingence (příklad MÚVS)")
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
        runMakro("anovaow", testTables.anova1(),[[0],1])
    },
    anova2: function(){
        runMakro("anovaow", testTables.anova2(),[[0,1,2,3,4]])
    },
    ttestind1: function(){
        runMakro("ttestind", testTables.ttestind1(),[[1],0])
    },
    muvslinreg: function() {
        runMakro("genreg", testTables.muvslinreg(), [0,1,1]);
    },
    anycorrel: function() {
        runMakro("correlPearson", testTables.anycorrel(), [0,1]);
        runMakro("correlSpearman", testTables.anycorrel(), [0,1]);
        runMakro("correlKendall", testTables.anycorrel(), [0,1]);
        runMakro("correlPartial", testTables.anycorrel(), [0,2,1]);
        runMakro("correlBiserial", testTables.anycorrel(), [3,0]);
    },
    muvscontingency: function(){
        runMakro("contingency", testTables.muvscontingency(),[0,1,2])
    },
};

function runMakro(method, matrix, args) {
    loadMatrixToTable(matrix);
    var analysis = source.analyze(method);
    calculateMatrixAnalysis(analysis, args);
}