var Integrator = function(s) {
    this.s = s;
};

Integrator.prototype.step = function(t) {
    var s = this.s;
    s.clearForces();
    s.applyForces();

    var particles = s.particles;
    var numberOfParticles = particles.length;
    for (var i = 0; i < numberOfParticles; i++) {
        var p = particles[i];
        var position = p.position;
        var velocity = p.velocity;
        var force = p.force;

        position[0] += velocity[0] + force[0] * 2.5;
        position[1] += velocity[1] + force[1] * 2.5;
        position[2] += velocity[2] + force[2] * 2.5;

        velocity[0] += force[0];
        velocity[1] += force[1];
        velocity[2] += force[2];

        p.age += t;
    }
};


