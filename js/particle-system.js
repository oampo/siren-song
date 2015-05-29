var vec3 = require('gl-matrix').vec3;

var Integrator = require('./integrator.js');

var ParticleSystem = function() {
    this.integrator = new Integrator(this);
    this.particles = [];
    this.forces = [];
};

ParticleSystem.prototype.createParticle = function() {
    var particle = new Particle();
    this.particles.push(particle);
    return particle;
};

ParticleSystem.prototype.tick = function(time) {
    this.integrator.step(time);
};

ParticleSystem.prototype.clear = function() {
    this.particles = [];
    this.forces = [];
};

ParticleSystem.prototype.applyForces = function() {
    var particles = this.particles;
    var numberOfParticles = particles.length;

    var forces = this.forces;
    var numberOfForces = forces.length;
    for (var i = 0; i < numberOfForces; i++) {
        forces[i].apply();
    }
};

ParticleSystem.prototype.clearForces = function() {
    var particles = this.particles;
    var numberOfParticles = particles.length;
    for (var i = 0; i < numberOfParticles; i++) {
        vec3.set(particles[i].force, 0, 0, 0);
    }
};

ParticleSystem.prototype.removeParticle = function(particle) {
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

ParticleSystem.prototype.removeForce = function(force) {
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

module.exports = ParticleSystem;
