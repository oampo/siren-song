var SpiralSiren = function(app) {
    Siren.call(this, app);
    this.phase = 0;
    this.frequency = -0.5 + Math.random() * 0.5;
    this.numberOfOutputs = Math.floor(2 + Math.random() * 9);
};
extend(SpiralSiren, Siren);

SpiralSiren.prototype.createParticles = function() {
    for (var i = 0; i < this.numberOfOutputs; i++) {
        var angle = this.phase + i * 2 * Math.PI / this.numberOfOutputs;
        var particle = this.app.cloud.particleSystem.createParticle();
        vec3.set(this.particle.position, particle.position);
        particle.velocity[0] = Math.sin(angle);
        particle.velocity[1] = this.particle.velocity[1] + Math.cos(angle);
    }
    this.phase += this.frequency * 2 * Math.PI;
};

