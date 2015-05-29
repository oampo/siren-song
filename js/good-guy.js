var webglet = require('webglet');
var glMatrix = require('gl-matrix');
var vec3 = glMatrix.vec3;
var quat = glMatrix.quat;

var AudioReactiveMesh = require('./audio-reactive-mesh');
var Color = require('./color');

var GoodGuy = function(app) {
    this.app = app;

    this.numberOfPoints = 100;
    this.radius = 0.02;
    this.springOut = null;

    var sides = this.app.level.getSides(0);
    var middle = (sides[0] + sides[1]) / 2;
    this.particle = this.app.particleSystem.createParticle();
    this.particle.position[0] = middle;

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


GoodGuy.prototype.update = function() {
    var sides = this.app.level.getSides(0);

    if (this.particle.position[0] < -this.app.width / 2 ||
        this.particle.position[0] > this.app.width / 2 ||
        this.particle.position[1] < -this.app.height / 2 ||
        this.particle.position[1] > this.app.height / 2) {
        this.app.shouldUpdate = false;
        this.particle.position[0] = (sides[0] + sides[1]) / 2;
        this.particle.velocity[0] = 0;
        this.app.ui.startCountdown();
    }

    if (this.particle.position[0] < sides[0] ||
        this.particle.position[0] > sides[1]) {
        this.app.score.decrease();

    }

    this.handleSirenCollisions();

//    var channel = this.app.crusher.outputs[0].buffer.channels[0];
//    this.updateVertices(channel, 2);

    this.angle += 0.2;
    quat.set(this.transformation.rotation, Math.cos(this.angle / 2), Math.sin(this.angle / 2), 0, 0);
    vec3.copy(this.transformation.position, this.particle.position);
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
    for (var i = 0; i < numberOfSirens; i++) {
        var siren = sirens[i];
        if (!siren.connected) {
            var diff = vec3.create();
            vec3.subtract(diff, position, siren.particle.position);
            var distance = vec3.length(diff);
            if (distance < this.radius + siren.radius) {
                siren.attach();
                this.app.multiplier += 1;
            }
        }
    }
};

module.exports = GoodGuy;

