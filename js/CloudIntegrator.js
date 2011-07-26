var CloudIntegrator = function(s) {
    this.s = s;
};

CloudIntegrator.prototype.step = function(t) {
    var particles = this.s.particles;
    var numberOfParticles = particles.length;
    for (var i = 0; i < numberOfParticles; i++) {
        var p = particles[i];
        var position = p.position;
        var velocity = p.velocity;

        // Do things the old-fashioned way
        position[0] += velocity[0];
        position[1] += velocity[1];
        position[2] += velocity[2];

        p.age += t;
    }
};


