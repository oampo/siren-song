var glMatrix = require('gl-matrix');
var vec3 = glMatrix.vec3;

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
    var pool = this.app.vec3Pool;

    var a2b = pool.create();
    vec3.subtract(a2b, a.position, b.position);
    var a2bDistance = vec3.length(a2b);

    if (a2bDistance == 0) {
        vec3.set(a2b, 0, 0, 0);
    } else {
        vec3.scale(a2b, a2b, 1 / a2bDistance);
    }

    var springForce = -(a2bDistance - restLength) * springConstant;
    var vA2b = this.app.vec3Pool.create();
    vec3.subtract(vA2b, a.velocity, b.velocity);
    var dampingForce = -damping * vec3.dot(a2b, vA2b);
    var r = springForce + dampingForce;

    vec3.scale(a2b, a2b, r);

    vec3.add(a.force, a.force, a2b);
    // Can negate without a new vec3 as we don't use a2b again
    vec3.negate(a2b, a2b);
    vec3.add(b.force, b.force, a2b);

    pool.recycle(a2b);
    pool.recycle(vA2b);
};

module.exports = Spring;
