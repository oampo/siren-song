var Cloud = function(app) {
    this.app = app;

    this.particleSystem = new ParticleSystem(0, 0);
    this.particleSystem.integrator = new CloudIntegrator(this.particleSystem);

    this.mesh = new Mesh(100, gl.POINTS,
                          gl.STREAM_DRAW, gl.STREAM_DRAW);
};

Cloud.prototype.update = function() {
    this.particleSystem.tick();

    var halfHeight = this.app.height / 2;
    var level = this.app.level;
    var leftColors = level.leftColors;
    var rightColors = level.rightColors;
    var score = this.app.score;

    var particleSystem = this.particleSystem;
    var particles = particleSystem.particles;
    var numberOfParticles = particles.length;

    if (numberOfParticles > this.mesh.numVertices) {
        this.mesh = new Mesh(numberOfParticles * 3, gl.POINTS,
                             gl.STREAM_DRAW, gl.STREAM_DRAW);
    }

    var vertexBuffer = this.mesh.vertexBuffer.array;
    var colorBuffer = this.mesh.colorBuffer.array;

    var count = 0;
    for (var i = 0; i < numberOfParticles; i++) {
        var index = numberOfParticles - i - 1;
        var particle = particles[index];
        var position = particle.position;

        var xPos = position[0];
        var yPos = position[1];

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
            vertexBuffer[count * 3 + 0] = xPos;
            vertexBuffer[count * 3 + 1] = yPos;
            vertexBuffer[count * 3 + 2] = 0;
            colorBuffer[count * 4 + 0] = color[0];
            colorBuffer[count * 4 + 1] = color[1];
            colorBuffer[count * 4 + 2] = color[2];
            colorBuffer[count * 4 + 3] = color[3];
            count += 1;
        }
    }

    this.mesh.vertexBuffer.setValues();
    this.mesh.colorBuffer.setValues();
};

Cloud.prototype.draw = function() {
    this.app.renderer.render(this.mesh, 0,
                             this.particleSystem.particles.length);
};

