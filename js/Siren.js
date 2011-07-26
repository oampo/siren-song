var Siren = function(app) {
    this.app = app;
    this.radius = 5;
    this.connected = false;
    this.springIn = null;
    this.springOut = null;

    this.synth = null;
    this.durationPattern = null;
    this.frequencyPattern = null;
    this.octave = null;

    var yPos = app.height / 2 - 1;
    var sides = this.app.level.getSides(yPos);
    var xPos = sides[0] + this.radius * 2;
    xPos += (sides[1] - sides[0] - this.radius * 2) * Math.random();
    this.particle = this.app.particleSystem.createParticle();
    this.particle.position[0] = xPos;
    this.particle.position[1] = yPos;
    this.particle.velocity[1] = -3;

    this.attraction = new AttractionToGoodGuy(this.app.goodGuy.particle,
                                              this.particle, 800, 20, 40);
    this.app.particleSystem.forces.push(this.attraction);


    var numberOfPoints = 40;
    var numberOfSpirals = 2;
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

Siren.prototype.update = function() {
/*    this.model.rotation.z -= 0.3;
    this.model.update(); */

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

Siren.prototype.remove = function() {
    this.app.particleSystem.recycleParticle(this.particle);

    var index = this.app.sirens.indexOf(this);
    if (index != -1) {
        this.app.sirens.splice(index, 1);
    }

    if (this.connected) {
        this.connected = false;
        var chain = this.app.goodGuy.chain;
        var chainIndex = chain.indexOf(this);
        var before, after = null;

        if (chainIndex == 0) {
            before = this.app.goodGuy;
        }
        else {
            before = chain[chainIndex - 1];
        }

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
        }

        if (before && after) {
            var spring;
            if (before == this.app.goodGuy) {
                spring = new SpringToGoodGuy(before.particle,
                                             after.particle, 0.05, 0.5, 15);
                this.app.particleSystem.forces.push(spring);
            }
            else {
                spring = new Spring(before.particle, after.particle,
                                    0.05, 0.5, 15);
                this.app.particleSystem.forces.push(spring);
            }
            before.springOut = spring;
            after.springIn = spring;
        }
        chain.splice(chainIndex, 1);

        // Work around a race condition.  If the synth needs to be removed
        // before it has been ticked for the first time, then the envelope
        // never sees that the gate has been turned on, and the onComplete
        // callback is never called.  If we have never ticked we are okay
        // to manually remove the synth though.  Aces.
        if (this.synth.sirenEnv.gateOn) {
            this.synth.sirenEnv.gate.setValue(0);
        }
        else {
            this.synth.removeWithEvent();
        }
    }
    else {
        var index = this.app.particleSystem.removeForce(this.attraction);
    }
};

Siren.prototype.createParticles = function() {
};

Siren.prototype.createSynth = function() {
    this.synth = new SirenSynth(this.app.audiolet);
    this.synth.connect(this.app.delay);

    var frequencies = SirenSynth.FREQUENCIES;
    var index = Math.floor(Math.random() * frequencies.length);
    this.frequencyPattern = new PSequence(frequencies[index], Infinity);

    var durations = SirenSynth.DURATIONS;
    var index = Math.floor(Math.random() * durations.length);
    this.durationPattern = new PSequence([durations[index]], Infinity);
    this.octave = 2 + Math.floor(Math.random() * 5);

    var event = this.app.audiolet.scheduler.play([this.frequencyPattern],
                                                  this.durationPattern,
                                                  this.playNote.bind(this));
    this.synth.event = event;
    this.synth.scheduler = this.app.audiolet.scheduler;
};

Siren.prototype.playNote = function(degree) {
    this.synth.trigger.trigger.setValue(1);
    var frequency = this.app.scale.getFrequency(degree, this.app.rootFrequency,
                                                this.octave);
    this.synth.pulse.frequency.setValue(frequency);
};

