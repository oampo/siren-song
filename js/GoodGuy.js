var GoodGuy = function(app) {
    this.app = app;

    this.numberOfPoints = 100;
    this.radius = 12;
    this.springOut = null;

    var sides = this.app.level.getSides(0);
    var middle = (sides[0] + sides[1]) / 2;
    this.particle = this.app.particleSystem.createParticle();
    this.particle.position[0] = middle;

    this.transformation = new Transformation();
    this.angle = 0;

    this.mesh = new Mesh(this.numberOfPoints * 3, gl.LINE_STRIP, gl.STATIC_DRAW,
                         gl.STATIC_DRAW);
    this.initAudioReactiveMesh(3);
    this.initColors();
};
implement(GoodGuy, AudioReactiveMesh);

GoodGuy.prototype.initColors = function() {
    var colorBuffer = this.mesh.colorBuffer.array;

    var dHue = 1 / this.numberOfPoints;
    for (var i = 0; i < this.lineWidth; i++) {
        for (var j = 0; j < this.numberOfPoints; j++) {
            var hue = j * dHue;
            var color = Color.hsvaToRGBA(hue, 1, 1, 1);
            var index = i * this.numberOfPoints * 4 + j * 4;
            colorBuffer[index + 0] = color[0];
            colorBuffer[index + 1] = color[1];
            colorBuffer[index + 2] = color[2];
            colorBuffer[index + 3] = color[3];
        }
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

    var channel = this.app.crusher.outputs[0].buffer.channels[0];
    this.updateVertices(channel, 2);

    this.angle += 0.2;
    quat4.set([Math.cos(this.angle / 2), Math.sin(this.angle / 2), 0, 0],
              this.transformation.rotation);
    vec3.set(this.particle.position, this.transformation.position);
};

GoodGuy.prototype.draw = function() {
//    gl.lineWidth(3);
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
            vec3.subtract(position, siren.particle.position, diff);
            var distance = vec3.length(diff);
            if (distance < this.radius + siren.radius) {
                siren.attach();
                this.app.multiplier += 1;
            }
        }
    }
};

