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

    var yPos = app.height / 2;
    var sides = this.app.level.getSides(yPos);
    var xPos = sides[0] + this.radius * 2;
    xPos += (sides[1] - sides[0] - this.radius * 2) * Math.random();
    this.particle = this.app.particleSystem.makeParticle(1, xPos, yPos, 0);

    this.attraction = new AttractionToGoodGuy(this.app.goodGuy.particle,
                                              this.particle, 800, 20, 40);
    this.app.particleSystem.addCustomForce(this.attraction);
    
    PhiloGL.Vec3.set(this.particle.velocity, 0, -3, 0);

    var vertices = [];
    var colors = [];
    var numberOfPoints = 40;
    var numberOfSpirals = 2;
    var spacing = 3;
    for (var i=0; i<numberOfPoints; i++) {
        var theta = numberOfSpirals * i * 2 * Math.PI / numberOfPoints;
        vertices.push(5 * theta * Math.sin(theta) / (2 * Math.PI));
        vertices.push(5 * theta * Math.cos(theta) / (2 * Math.PI));
        vertices.push(0);
        colors.push(1, 1, 1, 1);
    }

    this.model = new PhiloGL.O3D.Model({vertices: vertices,
                                        colors: colors,
                                        drawType: "LINE_STRIP"});
    this.app.scene.add(this.model);
};

Siren.prototype.update = function() {
    this.model.rotation.z -= 0.3;
    this.model.update();

    var position = this.particle.position;
    var sides = this.app.level.getSides(position.y);
    if (position.y < -this.app.height / 2 ||
        position.x < sides[0] ||
        position.x > sides[1]) {
        this.remove();
    }
    else {
        PhiloGL.Vec3.setVec3(this.model.position, this.particle.position);
        this.model.update();
        if (this.connected) {
            this.createParticles();
        }
    }
};

Siren.prototype.remove = function() {
    this.app.scene.remove(this.model);
    var index = this.app.particleSystem.particles.indexOf(this.particle);
    if (index != -1) {
        this.app.particleSystem.removeParticle(index);
    }

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

        var index = this.app.particleSystem.springs.indexOf(this.springIn);
        this.app.particleSystem.removeSpring(index);
        this.springIn = null;
        before.springOut = null;

        if (after) {
            var index = this.app.particleSystem.springs.indexOf(this.springOut);
            this.app.particleSystem.removeSpring(index);
            this.springOut = null;
            after.springIn = null;
        }

        if (before && after) {
            var spring;
            if (before == this.app.goodGuy) {
                spring = new SpringToGoodGuy(before.particle,
                                             after.particle, 0.05, 0.5, 15);
                this.app.particleSystem.springs.push(spring);
            }
            else {
                spring = this.app.particleSystem.makeSpring(before.particle,
                                                            after.particle,
                                                            0.05, 0.5, 15);
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
            console.log("me");
            this.synth.removeWithEvent();
        }
    }
    else {
        var index = this.app.particleSystem.customForces.indexOf(this.attraction);
        this.app.particleSystem.removeCustomForce(index);
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

