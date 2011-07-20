var SpringToGoodGuy = function(a, b, springConstant, damping, restLength) {
    this.a = a;
    this.b = b;
    this.springConstant = springConstant;
    this.damping = damping;
    this.restLength = restLength;
    this.on = true;
};

SpringToGoodGuy.prototype.toString = function() {
    return 'a: ' + this.a +
           '\nb: ' + this.b +
           '\nspringConstant: ' + this.springConstant +
           '\ndamping: ' + this.damping +
           '\nrestLength: ' + this.restLength;
};

SpringToGoodGuy.prototype.currentLength = function() {
    return PhiloGL.Vec3.distTo(this.a.position, this.b.position);
};


SpringToGoodGuy.prototype.apply = function() {
    var a = this.a;
    var b = this.b;
    var restLength = this.restLength;
    var springConstant = this.springConstant;
    var damping = this.damping;
    if (this.on && (!a.fixed || !b.fixed)) {
        var a2b = PhiloGL.Vec3.sub(a.position, b.position);
        var a2bDistance = PhiloGL.Vec3.norm(a2b);

        if (a2bDistance == 0) {
            PhiloGL.Vec3.set(a2b, 0, 0, 0);
        } else {
            PhiloGL.Vec3.$scale(a2b, 1 / a2bDistance);
        }

        var springForce = -(a2bDistance - restLength) * springConstant,
            vA2b = PhiloGL.Vec3.sub(a.velocity, b.velocity);
            dampingForce = -damping * PhiloGL.Vec3.dot(a2b, vA2b),
            r = springForce + dampingForce;

        PhiloGL.Vec3.$scale(a2b, r);

        if (!b.fixed) {
            PhiloGL.Vec3.$add(b.force, PhiloGL.Vec3.neg(a2b));
        }
    }
};
