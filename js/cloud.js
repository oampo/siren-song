var webglet = require('webglet');

var RecyclingParticleSystem = require('./recycling-particle-system');
var CloudIntegrator = require('./cloud-integrator');
var Color = require('./color');

var Cloud = function(app) {
    this.app = app;

    this.particleSystem = new RecyclingParticleSystem();
    this.particleSystem.integrator = new CloudIntegrator(this.particleSystem);

    this.mesh = new webglet.Mesh(100, gl.POINTS,
                                 gl.STREAM_DRAW, gl.STREAM_DRAW);
};

Cloud.prototype.update = function(dt) {
    this.particleSystem.tick(dt);

    var halfMaxHeight = this.app.maxHeight() / 2;
    var halfHeight = this.app.height() / 2;
    var level = this.app.level;
    var score = this.app.score;

    var particleSystem = this.particleSystem;
    var particles = particleSystem.particles;
    var numberOfParticles = particles.length;

    var colors = Color.PARTICLE_TABLE;
    var numberOfColors = colors.length;

    if (numberOfParticles > this.mesh.numVertices) {
        this.mesh = new webglet.Mesh(numberOfParticles * 3, gl.POINTS,
                             gl.STREAM_DRAW, gl.STREAM_DRAW);
    }

    var vertexBuffer = this.mesh.vertexBuffer.array;
    var colorBuffer = this.mesh.colorBuffer.array;

    var vertexCount = 0;
    var colorCount = 0;

    var pool = this.app.vec2Pool;
    var sides = pool.create();
    for (var i = numberOfParticles - 1; i >= 0; i--) {
        var particle = particles[i];
        var position = particle.position;

        var xPos = position[0];
        var yPos = position[1];

        level.getSides(yPos, sides);
        var left = sides[0];
        var right = sides[1];

        // Change age approximately 1 step per frame
        var age = Math.floor(particle.age * 60);
        // Bithack because particle table is power of 2
        //var hue = age % numberOfColors;
        var hue = age & numberOfColors - 1;
        var color = colors[hue];

        if (age > 200 ||
            yPos < -halfHeight ||
            yPos > halfHeight ||
            xPos < left ||
            xPos > right) {
            particleSystem.recycleParticleByIndex(i);
            score.increase();

            if (xPos < left) {
                level.setLeftColor(yPos, color);
            }
            else if (xPos > right) {
                level.setRightColor(yPos, color);
            }
        }
        else {
            vertexBuffer[vertexCount++] = xPos;
            vertexBuffer[vertexCount++] = yPos;
            vertexBuffer[vertexCount++] = 0;
            colorBuffer[colorCount++] = color[0];
            colorBuffer[colorCount++] = color[1];
            colorBuffer[colorCount++] = color[2];
            colorBuffer[colorCount++] = color[3];
        }
    }
    pool.recycle(sides);

//    this.mesh.vertexBuffer.null();
//    this.mesh.colorBuffer.null();
    this.mesh.vertexBuffer.setValues(null, 0, vertexCount);
    this.mesh.colorBuffer.setValues(null, 0, colorCount);
};

Cloud.prototype.draw = function() {
    this.app.renderer.render(this.mesh, 0,
                             this.particleSystem.particles.length);
};

module.exports = Cloud;
