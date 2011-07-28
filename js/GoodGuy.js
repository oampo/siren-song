var GoodGuy = function(app) {
    this.app = app;

    this.radius = 12;
    this.chain = [];
    this.springOut = null;

    var sides = this.app.level.getSides(0);
    var middle = (sides[0] + sides[1]) / 2;
    this.particle = this.app.particleSystem.createParticle();
    this.particle.position[0] = middle;

    this.numberOfPoints = 100;

    this.mesh = new Mesh(this.numberOfPoints, gl.LINE_STRIP, gl.STATIC_DRAW,
                         gl.STATIC_DRAW);
    var vertexBuffer = this.mesh.vertexBuffer.array;
    var colorBuffer = this.mesh.colorBuffer.array;

    var dTheta = 2 * Math.PI / this.numberOfPoints;
    var dHue = 1 / this.numberOfPoints;
    for (var i = 0; i < this.numberOfPoints; i++) {
        var theta = i * dTheta;
        var hue = i * dHue;
        vertexBuffer[i * 3 + 0] = this.radius * Math.sin(theta);
        vertexBuffer[i * 3 + 1] = this.radius * Math.cos(theta);
        vertexBuffer[i * 3 + 2] = 0;

        var color = Color.hsvaToRGBA(hue, 1, 1, 1);
        colorBuffer[i * 4 + 0] = color[0];
        colorBuffer[i * 4 + 1] = color[1];
        colorBuffer[i * 4 + 2] = color[2];
        colorBuffer[i * 4 + 3] = color[3];
    }
    this.mesh.vertexBuffer.setValues();
    this.mesh.colorBuffer.setValues();

    this.transformation = new Transformation();

    this.lastChannel = null;
    this.channelPosition = 0;
    this.framesPerChannel = 0;
    this.angle = 0;
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

    this.updateMesh();

    this.angle += 0.2;
    quat4.set([Math.cos(this.angle / 2), Math.sin(this.angle / 2), 0, 0],
              this.transformation.rotation);
    vec3.set(this.particle.position, this.transformation.position);
};

GoodGuy.prototype.updateMesh = function() {
    var channel = this.app.crusher.outputs[0].buffer.channels[0];
    if (channel == this.lastChannel) {
        if (this.channelPosition < this.framesPerChannel - 1) {
            this.channelPosition += 1;
        }
    }
    else {
        this.channelPosition = 0;
        var sampleRate = this.app.audiolet.device.sampleRate;
        var blockLength = channel.length / sampleRate;
        var frameRate = 1 / 60;
        this.framesPerChannel = Math.floor(blockLength / frameRate);
        this.framesPerChannel = Math.max(this.framesPerChannel, 1);
    }
    this.lastChannel = channel;

    var vertexBuffer = this.mesh.vertexBuffer.array;

    var dTheta = 2 * Math.PI / this.numberOfPoints;

    var samples = Math.floor(channel.length / this.framesPerChannel);
    var iIndex = this.channelPosition * samples;
    var dIndex = Math.floor(samples / this.numberOfPoints);
    for (var i = 0; i < this.numberOfPoints; i++) {
        var theta = i * dTheta;
        var index = iIndex + i * dIndex;
        var sample = channel[index] * 3;
        vertexBuffer[i * 3 + 0] = this.radius * (Math.sin(theta) + sample);
        vertexBuffer[i * 3 + 1] = this.radius * (Math.cos(theta) + sample);
        vertexBuffer[i * 3 + 2] = 0;
    };
    this.mesh.vertexBuffer.setValues();
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
            vec3.subtract(position, siren.particle.position, diff);
            var distance = vec3.length(diff);
            if (distance < this.radius + siren.radius) {
                this.attach(siren);
                this.app.multiplier += 1;
            }
        }
    }
};

GoodGuy.prototype.attach = function(sirenA) {
    if (this.chain.length == 0) {
        // Connect to goodGuy
        this.springOut = new SpringToGoodGuy(this.particle, sirenA.particle,
                                             0.05, 0.5, 15);
        this.app.particleSystem.forces.push(this.springOut);
        sirenA.springIn = this.springOut;
    }
    else {
        var sirenB = this.chain[this.chain.length - 1];
        var spring = new Spring(sirenA.particle, sirenB.particle,
                                 0.05, 0.5, 15);
        this.app.particleSystem.forces.push(spring);
        sirenA.springIn = spring;
        sirenB.springOut = spring;
    }
    var index = this.app.particleSystem.removeForce(sirenA.attraction);
    sirenA.connected = true;
    sirenA.createSynth();
    this.chain.push(sirenA);
};

