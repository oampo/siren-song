var vec2 = require('gl-matrix').vec2;

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
        // Remove function calls in hot loops
        //vec2.scaleAndAdd(velocity, velocity, force, dt / mass);
        //vec2.scaleAndAdd(position, position, velocity, dt);
        velocity[0] += force[0] * dt / mass;
        velocity[1] += force[1] * dt / mass;
        position[0] += velocity[0] * dt;
        position[1] += velocity[1] * dt;
        p.age += dt;
    }
};

module.exports = Integrator;

