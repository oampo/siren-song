var SpringToGoodGuy = function(a, b, springConstant, damping, restLength) {
    this.a = a;
    this.b = b;
    this.springConstant = springConstant;
    this.damping = damping;
    this.restLength = restLength;
};

SpringToGoodGuy.prototype.toString = function() {
    return 'a: ' + this.a +
           '\nb: ' + this.b +
           '\nspringConstant: ' + this.springConstant +
           '\ndamping: ' + this.damping +
           '\nrestLength: ' + this.restLength;
};

SpringToGoodGuy.prototype.apply = function() {
    var a = this.a;
    var b = this.b;
    var restLength = this.restLength;
    var springConstant = this.springConstant;
    var damping = this.damping;

    var a2b = vec3.create();
    vec3.subtract(a.position, b.position, a2b);
    var a2bDistance = vec3.length(a2b);

    if (a2bDistance == 0) {
        vec3.set([0, 0, 0], a2b);
    } else {
        vec3.scale(a2b, 1 / a2bDistance);
    }

    var springForce = -(a2bDistance - restLength) * springConstant;
    var vA2b = vec3.create();
    vec3.subtract(a.velocity, b.velocity, vA2b);
    var dampingForce = -damping * vec3.dot(a2b, vA2b);
    var r = springForce + dampingForce;

    vec3.scale(a2b, r);

    vec3.add(b.force, vec3.negate(a2b));
};
