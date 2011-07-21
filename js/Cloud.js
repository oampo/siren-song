var Cloud = function(app) {
    this.app = app;

    this.particleSystem = new ParticleSystem(0, 0);
    this.particleSystem.integrator = new CloudIntegrator(this.particleSystem);

    this.model = new PhiloGL.O3D.Model({id: 'cloud',
                                        dynamic: true,
                                        drawType: 'POINTS'});
    this.model.dynamic = true;
    this.app.scene.add(this.model);
};

Cloud.prototype.update = function() {
    this.particleSystem.tick();

    var vertices = [];
    var colors = [];

    var halfHeight = this.app.height / 2;
    var level = this.app.level;
    var leftColors = level.leftColors;
    var rightColors = level.rightColors;
    var score = this.app.score;

    var push = Array.prototype.push;

    var particleSystem = this.particleSystem;
    var particles = particleSystem.particles;
    var numberOfParticles = particles.length;
    for (var i = 0; i < numberOfParticles; i++) {
        var index = numberOfParticles - i - 1;
        var particle = particles[index];
        var position = particle.position;

        var xPos = position.x;
        var yPos = position.y;

        var sides = level.getSides(yPos);
        var left = sides[0];
        var right = sides[1];

        var age = particle.age;
        var hue = age % Color.PARTICLE_TABLE.length;
        var color = Color.PARTICLE_TABLE[hue];

        if (age > 1000 ||
            yPos < -halfHeight ||
            yPos > halfHeight ||
            xPos < left ||
            xPos > right) {
            particleSystem.removeParticle(index);
            score.increase();

            if (xPos < left) {
                var index = level.yPosToIndex(yPos);
                leftColors[index] = color;
            }
            else if (xPos > right) {
                var index = level.yPosToIndex(yPos);
                rightColors[index] = color;
            }
        }
        else {
            vertices.push(xPos, yPos, 0);
            push.apply(colors, color);
        }
    }

    this.model.vertices = vertices;
    this.model.colors = colors;
};

