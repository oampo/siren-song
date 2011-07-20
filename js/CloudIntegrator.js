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
        position.x += velocity.x;
        position.y += velocity.y;
        position.z += velocity.z;

        p.age += t;
    }
};


