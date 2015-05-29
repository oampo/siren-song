var glMatrix = require('gl-matrix');
var vec3 = glMatrix.vec3;

require('./math');
var Siren = require('./siren');
var settings = require('./settings');

var SpiralSiren = function(app) {
    Siren.call(this, app);
    this.phase = 0;
    this.frequency = Math.randomBetween(-0.5, 0.5);
    this.numberOfOutputs = Math.round(Math.randomBetween(1.5, 10.5));
};
SpiralSiren.prototype = Object.create(Siren.prototype);
SpiralSiren.prototype.constructor = SpiralSiren;

SpiralSiren.prototype.createParticles = function() {
    for (var i = 0; i < this.numberOfOutputs; i++) {
        var angle = this.phase + i * 2 * Math.PI / this.numberOfOutputs;
        var particle = this.app.cloud.particleSystem.createParticle();
        vec3.copy(particle.position, this.particle.position);
        particle.velocity[0] = settings.cloudParticleVelocity * Math.sin(angle);
        particle.velocity[1] = this.particle.velocity[1] + settings.cloudParticleVelocity * Math.cos(angle);
    }
    this.phase += this.frequency * 2 * Math.PI;
};

module.exports = SpiralSiren;
