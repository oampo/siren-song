// Each siren is a mono-synth, with a global env for fade in on creation,
// and fade-out when we hit a wall
var SirenSynth = function(audiolet) {
    AudioletGroup.apply(this, [audiolet, 0, 1]);
    this.event = null;
    this.scheduler = null;

    // Basic waves
    this.pulse = new Pulse(audiolet, 440);//, 0.2 + Math.random() * 0.7);

    // Note on trigger
    this.trigger = new TriggerControl(audiolet);

    // Note envelope
    this.noteGain = new Gain(audiolet);
    this.noteEnv = new PercussiveEnvelope(audiolet, 0, 0.1, 0.1);
    this.noteEnvMul = new Multiply(audiolet, 0.3);

    // Siren envelope
    this.sirenGain = new Gain(audiolet);
    this.sirenEnv = new ADSREnvelope(audiolet, 1, 2, 0.1, 1, 1,
        function() {
            this.audiolet.scheduler.addRelative(0,
                                            this.removeWithEvent.bind(this));
        }.bind(this)
    );

    this.pulse.connect(this.noteGain);
    this.noteGain.connect(this.sirenGain);
    this.sirenGain.connect(this.outputs[0]);

    this.trigger.connect(this.noteEnv);
    this.noteEnv.connect(this.noteEnvMul);
    this.noteEnvMul.connect(this.noteGain, 0, 1);

    this.sirenEnv.connect(this.sirenGain, 0, 1);
};
extend(SirenSynth, AudioletGroup);

SirenSynth.prototype.removeWithEvent = function() {
    this.remove();
    this.scheduler.stop(this.event);
};

SirenSynth.DURATIONS = [1 / 3, 1 / 4];
SirenSynth.FREQUENCIES = [[0, 1, 2],
                          [0, 1, 2, 3],
                          [0, 1, 2, 3, 4, 5],
                          [0, 1, 2, 3, 4, 5, 6, 7],
                          [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                          [0, 1, 2, 3, 4, 5, 6, 7,
                           8, 9, 10, 11, 12, 13, 14, 15]];
/*
SirenSynth.FREQUENCIES = [[0, 1, 2],
                          [1, 0, 2],
                          [2, 1, 0],
                          [3, 4, 5],
                          [4, 3, 5],
                          [5, 4, 3]];
*/
