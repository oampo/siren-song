var glMatrix = require('gl-matrix');
var vec2 = glMatrix.vec2;

require('./math');
var Siren = require('./siren');
var settings = require('./settings');

var SpiralSiren = function(app) {
    Siren.call(this, app);
    this.phase = 0;
    this.frequency = Math.randomBetween(-0.5, 0.5);
    this.numberOfOutputs = Math.round(Math.randomBetween(1.5, 10.5));
    // Cache values
    this.dTheta = 2 * Math.PI / this.numberOfOutputs;
    this.dPhase = this.frequency * 2 * Math.PI;
};
SpiralSiren.prototype = Object.create(Siren.prototype);
SpiralSiren.prototype.constructor = SpiralSiren;

SpiralSiren.prototype.createParticles = function() {
    for (var i = 0; i < this.numberOfOutputs; i++) {
        var angle = this.phase + i * this.dTheta;
        var particle = this.app.cloud.particleSystem.createParticle();
        vec2.copy(particle.position, this.particle.position);
        particle.velocity[0] = settings.cloudParticleVelocity * Math.sin(angle);
        particle.velocity[1] = this.particle.velocity[1] + settings.cloudParticleVelocity * Math.cos(angle);
    }
    this.phase += this.dPhase;
};

module.exports = SpiralSiren;
