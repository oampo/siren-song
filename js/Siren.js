var Siren = function(app) {
    this.app = app;
    this.radius = 8;
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


    this.numberOfPoints = 100;
    this.mesh = new Mesh(this.numberOfPoints, gl.LINE_STRIP, gl.STATIC_DRAW,
                         gl.STATIC_DRAW);
    var vertexBuffer = this.mesh.vertexBuffer.array;
    var colorBuffer = this.mesh.colorBuffer.array;

    var dTheta = 2 * Math.PI / (this.numberOfPoints - 1);
    for (var i = 0; i < this.numberOfPoints; i++) {
        var theta = i * dTheta;
        vertexBuffer[i * 3 + 0] = this.radius * Math.sin(theta);
        vertexBuffer[i * 3 + 1] = this.radius * Math.cos(theta);
        vertexBuffer[i * 3 + 2] = 0;

        colorBuffer[i * 4 + 0] = 1;
        colorBuffer[i * 4 + 1] = 1;
        colorBuffer[i * 4 + 2] = 1;
        colorBuffer[i * 4 + 3] = 1;
    }
    this.mesh.vertexBuffer.setValues();
    this.mesh.colorBuffer.setValues();
    this.transformation = new Transformation();

    this.lastChannel = null;
    this.channelPosition = 0;
    this.framesPerChannel = 0;
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
            this.updateMesh();
            this.createParticles();
        }
    }
};

Siren.prototype.updateMesh = function() {
    var channel = this.synth.outputs[0].outputs[0].buffer.channels[0];
    if (channel == this.lastChannel) {
        this.channelPosition += 1;
        if (this.channelPosition >= this.framesPerChannel) {
            this.channelPosition = this.framesPerChannel - 1;
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

    var dTheta = 2 * Math.PI / (this.numberOfPoints - 1);

    var samples = Math.floor(channel.length / this.framesPerChannel);
    var iIndex = this.channelPosition * samples; 
    var dIndex = Math.floor(samples / this.numberOfPoints);
    for (var i = 0; i < this.numberOfPoints; i++) {
        var theta = i * dTheta;
        var index = iIndex + i * dIndex;
        var sample = channel[index];
        vertexBuffer[i * 3 + 0] = this.radius * (Math.sin(theta) +
                                                 sample);
        vertexBuffer[i * 3 + 1] = this.radius * (Math.cos(theta) +
                                                 sample);
        vertexBuffer[i * 3 + 2] = 0;
    };
    this.mesh.vertexBuffer.setValues();
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

