var glMatrix = require('gl-matrix');
var vec2 = glMatrix.vec2;

var Spring = function(app, a, b, springConstant, damping, restLength) {
    this.app = app;
    this.a = a;
    this.b = b;
    this.springConstant = springConstant;
    this.damping = damping;
    this.restLength = restLength;
};

Spring.prototype.toString = function() {
    return 'a: ' + this.a +
           '\nb: ' + this.b +
           '\nspringConstant: ' + this.springConstant +
           '\ndamping: ' + this.damping +
           '\nrestLength: ' + this.restLength;
};

Spring.prototype.apply = function() {
    var a = this.a;
    var b = this.b;
    var restLength = this.restLength;
    var springConstant = this.springConstant;
    var damping = this.damping;
    var pool = this.app.vec2Pool;

    var a2b = pool.create();
    vec2.subtract(a2b, a.position, b.position);
    var a2bDistance = vec2.length(a2b);

    if (a2bDistance == 0) {
        vec2.set(a2b, 0, 0);
    } else {
        vec2.scale(a2b, a2b, 1 / a2bDistance);
    }

    var springForce = -(a2bDistance - restLength) * springConstant;
    var vA2b = pool.create();
    vec2.subtract(vA2b, a.velocity, b.velocity);
    var dampingForce = -damping * vec2.dot(a2b, vA2b);
    var r = springForce + dampingForce;

    vec2.scale(a2b, a2b, r);

    vec2.add(a.force, a.force, a2b);
    // Can negate without a new vec2 as we don't use a2b again
    vec2.negate(a2b, a2b);
    vec2.add(b.force, b.force, a2b);

    pool.recycle(a2b);
    pool.recycle(vA2b);
};

module.exports = Spring;
