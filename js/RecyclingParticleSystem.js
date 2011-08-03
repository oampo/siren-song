var RecyclingParticleSystem = function(numberOfParticles) {
    ParticleSystem.call(this);
    this.oldParticles = [];
    for (var i = 0; i < numberOfParticles; i++) {
        this.oldParticles.push(new Particle());
    }
};
extend(RecyclingParticleSystem, ParticleSystem);

RecyclingParticleSystem.prototype.createParticle = function() {
    if (!this.oldParticles.length) {
        var numberOfParticles = this.particles.length;
        for (var i = 0; i < numberOfParticles * 3; i++) {
            this.oldParticles.push(new Particle());
        }
    }
    var particle = this.oldParticles.pop();
    this.particles.push(particle);
    return particle;
};

RecyclingParticleSystem.prototype.recycleParticle = function(particle) {
    var particle = this.removeParticle(particle);
    particle.reset();
    this.oldParticles.push(particle);
};

RecyclingParticleSystem.prototype.removeParticle = function(particle) {
    var type = typeof particle;
    if (type == 'number') {
        return this.particles.splice(particle, 1)[0];
    }
    else if (type == 'object') {
        var index = this.particles.indexOf(particle);
        if (index != -1) {
            return this.particles.splice(index, 1)[0];
        }
    }
    return null;
};

RecyclingParticleSystem.prototype.removeForce = function(force) {
    var type = typeof force;
    if (type == 'number') {
        return this.forces.splice(force, 1)[0];
    }
    else if (type == 'object') {
        var index = this.forces.indexOf(force);
        if (index != -1) {
            return this.forces.splice(index, 1)[0];
        }
    }
    return null;
};

