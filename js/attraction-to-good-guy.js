var glMatrix = require('gl-matrix');
var vec3 = glMatrix.vec3;

var AttractionToGoodGuy = function(app, a, b, k, distanceMin, distanceMax) {
    this.app = app;
    this.a = a;
    this.b = b;
    this.k = k;
    this.distanceMin = distanceMin;
    this.distanceMax = distanceMax;

    this.distanceMinSquared = Math.pow(this.distanceMin, 2);
    this.distanceMaxSquared = Math.pow(this.distanceMax, 2);
};

AttractionToGoodGuy.prototype.toString = function() {
    return 'a: ' + this.a +
           '\nb: ' + this.b +
           '\nk: ' + this.k +
           '\ndistanceMin ' + this.distanceMin +
           '\ndistanceMax ' + this.distanceMax;
};

AttractionToGoodGuy.prototype.setMinimumDistance = function(d) {
    this.distanceMin = d;
    this.distanceMinSquared = Math.pow(d, 2);
};

AttractionToGoodGuy.prototype.setMaximumDistance = function(d) {
    this.distanceMax = d;
    this.distanceMaxSquared = Math.pow(d, 2);
};


AttractionToGoodGuy.prototype.apply = function() {
    var a = this.a;
    var b = this.b;
    var k = this.k;
    var distanceMinSquared = this.distanceMinSquared;
    var distanceMaxSquared = this.distanceMaxSquared;

    var pool = this.app.vec3Pool;

    var a2b = pool.create();
    vec3.subtract(a2b, a.position, b.position);
    var a2bDistance = vec3.length(a2b);
    var a2bDistanceSquared = Math.pow(a2bDistance, 2);

    if (a2bDistanceSquared < distanceMaxSquared) {
        if (a2bDistanceSquared < distanceMinSquared) {
            a2bDistanceSquared = distanceMinSquared;
        }

        var force = k * a.mass * b.mass / (1 + a2bDistanceSquared);
        vec3.scale(a2b, a2b, 1 + a2bDistanceSquared);
        vec3.scale(a2b, a2b, force);

        vec3.add(b.force, b.force, a2b);
    }
    pool.recycle(a2b);
};

module.exports = AttractionToGoodGuy;
