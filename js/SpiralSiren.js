var SpiralSiren = function(app) {
    Siren.call(this, app);
    this.phase = 0;
    this.frequency = 0.05;
    this.numberOfOutputs = 10;
};
extend(SpiralSiren, Siren);

SpiralSiren.prototype.createParticles = function() {
    for (var i=0; i<this.numberOfOutputs; i++) {
        var angle = this.phase + i * 2 * Math.PI / this.numberOfOutputs;
        var particle = this.app.cloud.particleSystem.makeParticle();
        PhiloGL.Vec3.setVec3(particle.position, this.particle.position);
        PhiloGL.Vec3.set(particle.velocity,
                         Math.sin(angle),
                         this.particle.velocity.y + Math.cos(angle),
                         0);
    }
    this.phase += this.frequency * 2 * Math.PI;
};

