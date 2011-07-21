var Color = {};
Color.hsvaToRGBA = function(h, s, v, a) {
    if (s == 0) {
        return [v, v, v, a];
    }
    var i = Math.floor(h * 6);
    var f = (h * 6) - i;
    var p = v * (1 - s);
    var q = v * (1 - s * f);
    var t = v * (1 - s * (1 - f));
    var i = i % 6;
    if (i == 0) {
        return [v, t, p, a];
    }
    if (i == 1) {
        return [q, v, p, a];
    }
    if (i == 2) {
        return [p, v, t, a];
    }
    if (i == 3) {
        return [p, q, v, a];
    }
    if (i == 4) {
        return [t, p, v, a];
    }
    if (i == 5) {
        return [v, p, q, a];
    }
};

var numberOfColors = 100;
Color.PARTICLE_TABLE = [];
for (var i = 0; i < numberOfColors; i++) {
    Color.PARTICLE_TABLE.push(Color.hsvaToRGBA(i / numberOfColors, 1, 1, 1));
}
