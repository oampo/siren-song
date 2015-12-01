var vec2 = require('gl-matrix').vec2;

var CloudIntegrator = function(s) {
    this.s = s;
};

CloudIntegrator.prototype.step = function(dt) {
    var particles = this.s.particles;
    var numberOfParticles = particles.length;
    for (var i = 0; i < numberOfParticles; i++) {
        var p = particles[i];
        var position = p.position;
        var velocity = p.velocity;

        // Remove hot function call
        // vec2.scaleAndAdd(position, position, velocity, dt);
        position[0] += velocity[0] * dt;
        position[1] += velocity[1] * dt;
        p.age += dt;
    }
};

module.exports = CloudIntegrator;
