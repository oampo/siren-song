var SirenAudio = function(app) {
    this.app = app;

    this.synth = this.app.synthPool.create(this.app);
//    this.synth = new SirenSynth(this.app);
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
    this.synth.pool = this.app.synthPool;
};

SirenAudio.prototype.playNote = function(degree) {
    this.synth.trigger.trigger.setValue(1);
    var frequency = this.app.scale.getFrequency(degree, this.app.rootFrequency,
                                                this.octave);
    this.synth.pulse.frequency.setValue(frequency);
};

SirenAudio.prototype.stop = function() {
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
};

SirenAudio.prototype.getOutputChannel = function() {
    return this.synth.outputs[0].outputs[0].buffer.channels[0];
};

