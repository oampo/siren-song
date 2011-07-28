var Siren = function(app) {
    this.app = app;

    this.numberOfPoints = 100;
    this.radius = 8;
    this.connected = false;
    this.springIn = null;
    this.springOut = null;

    var yPos = app.height / 2 - 1;
    var sides = this.app.level.getSides(yPos);
    var xPos = Math.randomBetween(sides[0] + this.radius * 2,
                                  sides[1] - this.radius * 2);
    this.particle = this.app.particleSystem.createParticle();
    this.particle.position[0] = xPos;
    this.particle.position[1] = yPos;
    this.particle.velocity[1] = -3;

    this.transformation = new Transformation();

    this.createAttraction();

    this.mesh = new Mesh(this.numberOfPoints, gl.LINE_STRIP, gl.STATIC_DRAW,
                         gl.STATIC_DRAW);
    this.initAudioReactiveMesh();
    this.initColors();

    this.audio = null;
};
implement(Siren, AudioReactiveMesh);

Siren.prototype.initColors = function() {
    var colorBuffer = this.mesh.colorBuffer.array;

    for (var i = 0; i < this.numberOfPoints; i++) {
        colorBuffer[i * 4 + 0] = 1;
        colorBuffer[i * 4 + 1] = 1;
        colorBuffer[i * 4 + 2] = 1;
        colorBuffer[i * 4 + 3] = 1;
    }
    this.mesh.colorBuffer.setValues();
};

Siren.prototype.createAttraction = function() {
    this.attraction = new AttractionToGoodGuy(this.app.goodGuy.particle,
                                              this.particle, 800, 20, 40);
    this.app.particleSystem.forces.push(this.attraction);
};

Siren.prototype.removeAttraction = function() {
    this.app.particleSystem.removeForce(this.attraction);
};


Siren.prototype.update = function() {
    var position = this.particle.position;
    var sides = this.app.level.getSides(position[1]);
    if (position[1] < -this.app.height / 2 ||
        position[0] < sides[0] ||
        position[0] > sides[1]) {
        this.remove();
    }
    else {
        vec3.set(this.particle.position, this.transformation.position);
        if (this.connected) {
            var channel = this.audio.getOutputChannel();
            this.updateVertices(channel, 3);
            this.createParticles();
        }
    }
};

Siren.prototype.draw = function() {
    this.app.modelview.pushMatrix();
    this.transformation.apply(this.app.modelview.matrix);
    this.app.renderer.setUniform('uModelviewMatrix', this.app.modelview.matrix);
    this.app.renderer.render(this.mesh);
    this.app.modelview.popMatrix();
};

Siren.prototype.attach = function() {
    var chain = this.app.chain;
    var to = chain[chain.length - 1];

    var spring;
    if (to == this.app.goodGuy) {
        // Connect to goodGuy
        spring = new SpringToGoodGuy(to.particle, this.particle, 0.05, 0.5, 15);
    }
    else {
        spring = new Spring(to.particle, this.particle, 0.05, 0.5, 15);
    }
    this.app.particleSystem.forces.push(spring);
    to.springOut = spring;
    this.springIn = spring;

    this.connected = true;
    this.removeAttraction()
    this.audio = new SirenAudio(this.app);
    chain.push(this);
};

Siren.prototype.remove = function() {
    this.app.particleSystem.recycleParticle(this.particle);

    var index = this.app.sirens.indexOf(this);
    if (index != -1) {
        this.app.sirens.splice(index, 1);
    }

    if (this.connected) {
        this.connected = false;
        var chain = this.app.chain;
        var chainIndex = chain.indexOf(this);
        var before = chain[chainIndex - 1]; 
        var after = null;

        if (chainIndex != chainIndex.length - 1) {
            after = chain[chainIndex + 1];
        }

        this.app.particleSystem.removeForce(this.springIn);
        this.springIn = null;
        before.springOut = null;

        if (after) {
            this.app.particleSystem.removeForce(this.springOut);
            this.springOut = null;
            after.springIn = null;
            
            // Create new spring
            var spring;
            if (before == this.app.goodGuy) {
                spring = new SpringToGoodGuy(before.particle,
                                             after.particle, 0.05, 0.5, 15);
            }
            else {
                spring = new Spring(before.particle, after.particle,
                                    0.05, 0.5, 15);
            }
            this.app.particleSystem.forces.push(spring);
            before.springOut = spring;
            after.springIn = spring;
        }
        chain.splice(chainIndex, 1);

        this.audio.stop();
    }
    else {
        this.removeAttraction();
    }
};

Siren.prototype.createParticles = function() {
};

