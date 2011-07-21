var Particle = function(mass) {
    this.mass = mass;
    this.position = new PhiloGL.Vec3();
    this.velocity = new PhiloGL.Vec3();
    this.force = new PhiloGL.Vec3();
    this.age = 0;
};

Particle.prototype.toString = function() {
    return 'position: ' + this.position +
           '\n velocity: ' + this.velocity +
           '\n force: ' + this.force +
           '\n age: ' + this.age;
};

Particle.prototype.distanceTo = function(p) {
    return PhiloGL.Vec3.distTo(this.position, p.position);
};

Particle.prototype.reset = function() {
    this.age = 0;
    PhiloGL.Vec3.set(this.position, 0, 0, 0);
    PhiloGL.Vec3.set(this.velocity, 0, 0, 0);
    PhiloGL.Vec3.set(this.force, 0, 0, 0);
    this.mass = 1;
};

