var Spring = function(a, b, springConstant, damping, restLength) {
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

Spring.prototype.currentLength = function() {
    return PhiloGL.Vec3.distTo(this.a.position, this.b.position);
};


Spring.prototype.apply = function() {
    var a = this.a;
    var b = this.b;
    var restLength = this.restLength;
    var springConstant = this.springConstant;
    var damping = this.damping;

    var a2b = PhiloGL.Vec3.sub(a.position, b.position);
    var a2bDistance = PhiloGL.Vec3.norm(a2b);

    if (a2bDistance == 0) {
        PhiloGL.Vec3.set(a2b, 0, 0, 0);
    } else {
        PhiloGL.Vec3.$scale(a2b, 1 / a2bDistance);
    }

    var springForce = -(a2bDistance - restLength) * springConstant;
    var vA2b = PhiloGL.Vec3.sub(a.velocity, b.velocity);
    var dampingForce = -damping * PhiloGL.Vec3.dot(a2b, vA2b);
    var r = springForce + dampingForce;

    PhiloGL.Vec3.$scale(a2b, r);

    PhiloGL.Vec3.$add(a.force, a2b);
    PhiloGL.Vec3.$add(b.force, PhiloGL.Vec3.neg(a2b));
};
