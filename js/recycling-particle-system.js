var ParticleSystem = require('./particle-system');
var Particle = require('./particle');

var RecyclingParticleSystem = function() {
    ParticleSystem.call(this);
    this.oldParticles = [];
    this.particles = [];
};
RecyclingParticleSystem.prototype = Object.create(ParticleSystem.prototype);
RecyclingParticleSystem.prototype.constructor = RecyclingParticleSystem;

RecyclingParticleSystem.prototype.createParticle = function() {
    var particle;
    if (!this.oldParticles.length) {
        particle = new Particle();
    }
    else {
        particle = this.oldParticles.pop();
    }
    this.particles.push(particle);
    return particle;
};

RecyclingParticleSystem.prototype.recycleParticle = function(particle) {
    var particle = this.removeParticle(particle);
    particle.reset();
    this.oldParticles.push(particle);
};

RecyclingParticleSystem.prototype.recycleParticleByIndex = function(index) {
    var particle = this.removeParticleByIndex(index);
    particle.reset();
    this.oldParticles.push(particle);
};

RecyclingParticleSystem.prototype.removeParticle = function(particle) {
    var index = this.particles.indexOf(particle);
    if (index != -1) {
        return this.particles.splice(index, 1)[0];
    }
    return null;
};

RecyclingParticleSystem.prototype.removeParticleByIndex = function(index) {
    if (index < this.particles.length) {
        return this.particles.splice(index, 1)[0];
    }
    return null;
};

RecyclingParticleSystem.prototype.removeForce = function(force) {
    var index = this.forces.indexOf(force);
    if (index != -1) {
        return this.forces.splice(index, 1)[0];
    }
    return null;
};

module.exports = RecyclingParticleSystem;

