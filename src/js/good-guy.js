var webglet = require('webglet');
var glMatrix = require('gl-matrix');
var vec2 = glMatrix.vec2;
var quat = glMatrix.quat;

var AudioReactiveMesh = require('./audio-reactive-mesh');
var Color = require('./color');

var GoodGuy = function(app) {
    this.app = app;

    this.numberOfPoints = 100;
    this.radius = 0.02;
    this.springOut = null;

    this.particle = this.app.particleSystem.createParticle();
    this.center();

    this.transformation = new webglet.Transformation();
    this.angle = 0;

    this.mesh = new webglet.Mesh(this.numberOfPoints, gl.LINE_STRIP, gl.STATIC_DRAW,
                         gl.STATIC_DRAW);
    this.initAudioReactiveMesh();
    this.initColors();
};

for (var method in AudioReactiveMesh) {
    GoodGuy.prototype[method] = AudioReactiveMesh[method];
}

GoodGuy.prototype.initColors = function() {
    var colorBuffer = this.mesh.colorBuffer.array;

    var dHue = 1 / this.numberOfPoints;
    for (var i = 0; i < this.numberOfPoints; i++) {
        var hue = i * dHue;
        var color = Color.hsvaToRGBA(hue, 1, 1, 1);
        var index = i * 4;
        colorBuffer[index + 0] = color[0];
        colorBuffer[index + 1] = color[1];
        colorBuffer[index + 2] = color[2];
        colorBuffer[index + 3] = color[3];
    }
    this.mesh.colorBuffer.setValues();
};

GoodGuy.prototype.center = function() {
    var pool = this.app.vec2Pool;
    var sides = pool.create();
    this.app.level.getSides(0, sides);
    this.particle.position[0] = (sides[0] + sides[1]) / 2;
    pool.recycle(sides);
};

GoodGuy.prototype.update = function() {
    var pool = this.app.vec2Pool;
    var sides = pool.create();
    this.app.level.getSides(0, sides);

    var width = this.app.width();
    var height = this.app.height();
    var halfWidth = width / 2;
    var halfHeight = height / 2;
    var left = sides[0];
    var right = sides[1];
    pool.recycle(sides);

    var xPos = this.particle.position[0];
    var yPos = this.particle.position[1];


    if (xPos < -halfWidth || xPos > halfWidth ||
        yPos < -halfHeight || yPos > halfHeight) {
        this.app.shouldUpdate = false;
        this.particle.position[0] = (left + right) / 2;
        this.particle.velocity[0] = 0;
        this.app.ui.startCountdown();
        return;
    }

    if (xPos < left || xPos > right) {
        this.app.score.decrease();
    }

    this.handleSirenCollisions();

    this.angle += 0.2;
    var halfAngle = this.angle / 2;
    quat.set(this.transformation.rotation,
             Math.cos(halfAngle), Math.sin(halfAngle), 0, 0);
    vec2.copy(this.transformation.position, this.particle.position);
};

GoodGuy.prototype.draw = function() {
    gl.lineWidth(3);
    this.app.modelview.pushMatrix();
    this.transformation.apply(this.app.modelview.matrix);
    this.app.renderer.setUniform('uModelviewMatrix', this.app.modelview.matrix);
    this.app.renderer.render(this.mesh);
    this.app.modelview.popMatrix();
    gl.lineWidth(1);
};

GoodGuy.prototype.handleSirenCollisions = function() {
    var sirens = this.app.sirens;
    var numberOfSirens = sirens.length;
    var position = this.particle.position;
    var pool = this.app.vec2Pool;
    var diff = pool.create();
    for (var i = 0; i < numberOfSirens; i++) {
        var siren = sirens[i];
        if (!siren.connected) {
            vec2.subtract(diff, position, siren.particle.position);
            var distance = vec2.length(diff);
            if (distance < this.radius + siren.radius) {
                siren.attach();
                this.app.multiplier += 1;
            }
        }
    }
    pool.recycle(diff);
};

module.exports = GoodGuy;

