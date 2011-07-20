var OptimisedIntegrator = function(s) {
    this.s = s;
};

OptimisedIntegrator.prototype.step = function(t) {
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
        if (!p.fixed) {
            /*
            PhiloGL.Vec3.$add(position, velocity);
            PhiloGL.Vec3.$add(position, PhiloGL.Vec3.scale(force, 2.5));
            PhiloGL.Vec3.$add(velocity, force);
            */
            // Do things the old-fashioned way
            position.x += velocity.x + force.x * 2.5;
            position.y += velocity.y + force.y * 2.5;
            position.z += velocity.z + force.z * 2.5;

            velocity.x += force.x;
            velocity.y += force.y;
            velocity.z += force.z;

        }
        p.age += t;
    }
};


