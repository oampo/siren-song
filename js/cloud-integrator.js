var vec3 = require('gl-matrix').vec3;

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

        // Do things the old-fashioned way
        vec3.scaleAndAdd(position, position, velocity, dt);
        p.age += dt;
    }
};

module.exports = CloudIntegrator;
