var vec3 = require('gl-matrix').vec3;

var Integrator = function(s) {
    this.s = s;
};

Integrator.prototype.step = function(dt) {
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
        var mass = p.mass;
        /*
        position[0] += velocity[0] + force[0] * 2.5;
        position[1] += velocity[1] + force[1] * 2.5;
        position[2] += velocity[2] + force[2] * 2.5;

        velocity[0] += force[0];
        velocity[1] += force[1];
        velocity[2] += force[2];

        */
        vec3.scaleAndAdd(velocity, velocity, force, dt / mass);
        vec3.scaleAndAdd(position, position, velocity, dt);
        p.age += dt;
    }
};

module.exports = Integrator;

