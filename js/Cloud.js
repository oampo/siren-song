var Cloud = function(app) {
    this.app = app;

    this.particleSystem = new ParticleSystem(0, 0);
    
    this.model = new PhiloGL.O3D.Model({id: "cloud",
                                        dynamic: true,
                                        drawType: "POINTS"});
    this.model.dynamic = true;
    this.app.scene.add(this.model);
};

Cloud.prototype.update = function() {
    this.particleSystem.tick();

    var vertices = [];
    var colors = [];

    var particles = this.particleSystem.particles;
    var numberOfParticles = particles.length;
    for (var i=0; i<numberOfParticles; i++) {
        var particle = particles[i];
        var position = particle.position;
        if (position.y < -height / 2 ||
            position.y > height / 2 ||
            position.x < sides[0] ||
            position.x > sides[1]) {
            this.particleSystem.removeParticle(i);
        }
        else {
            vertices.push(position.x, position.y, 0);
            colors.push(1, 0, 0, 1);
        }
    }
    
    this.model.vertices = vertices;
    this.model.colors = colors;
};

