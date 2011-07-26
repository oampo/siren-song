var GoodGuy = function(app) {
    this.app = app;

    this.radius = 8;
    this.chain = [];
    this.springOut = null;

    var sides = this.app.level.getSides(0);
    var middle = (sides[0] + sides[1]) / 2;
    this.particle = new Particle(1);
    this.particle.position[0] = middle;
    this.app.particleSystem.particles.push(this.particle);

    var numberOfPoints = 80;
    var numberOfSpirals = 3;
    var spacing = 3;

    this.mesh = new Mesh(numberOfPoints, gl.LINE_STRIP, gl.STATIC_DRAW,
                         gl.STATIC_DRAW);
    var vertexBuffer = this.mesh.vertexBuffer.array;
    var colorBuffer = this.mesh.colorBuffer.array;

    for (var i = 0; i < numberOfPoints; i++) {
        var theta = numberOfSpirals * i * 2 * Math.PI / numberOfPoints;
        vertexBuffer[i * 3 + 0] = 5 * theta * Math.sin(theta) / (2 * Math.PI);
        vertexBuffer[i * 3 + 1] = 5 * theta * Math.cos(theta) / (2 * Math.PI);
        vertexBuffer[i * 3 + 2] = 0;
        colorBuffer[i * 4 + 0] = 1;
        colorBuffer[i * 4 + 1] = 1;
        colorBuffer[i * 4 + 2] = 1;
        colorBuffer[i * 4 + 3] = 1;
    }
    this.mesh.vertexBuffer.setValues();
    this.mesh.colorBuffer.setValues();

    this.transformation = new Transformation();
};

GoodGuy.prototype.update = function() {
    var sides = this.app.level.getSides(0);
/*    this.model.rotation.z -= 0.3;
    this.model.update(); */

    if (this.particle.position[0] < -this.app.width / 2 ||
        this.particle.position[0] > this.app.width / 2 ||
        this.particle.position[1] < -this.app.height / 2 ||
        this.particle.position[1] > this.app.height / 2) {
        this.app.stop();
        this.particle.position[0] = (sides[0] + sides[1]) / 2;
        this.particle.velocity[0] = 0;
        this.app.ui.startCountdown();
    }

    if (this.particle.position[0] < sides[0] ||
        this.particle.position[0] > sides[1]) {
        this.app.score.decrease();

    }

    this.handleSirenCollisions();

    vec3.set(this.particle.position, this.transformation.position);
};

GoodGuy.prototype.draw = function() {
    this.app.modelview.pushMatrix();
    this.transformation.apply(this.app.modelview.matrix);
    this.app.renderer.setUniform('uModelviewMatrix', this.app.modelview.matrix);
    this.app.renderer.render(this.mesh);
    this.app.modelview.popMatrix();
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

