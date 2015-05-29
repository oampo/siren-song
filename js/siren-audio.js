var settings = require('./settings');

var SirenAudio = function(app) {
    this.app = app;
    this.context = this.app.context;

    this.done = false;

    this.scale = this.app.scale;
    this.rootFrequency = this.app.rootFrequency;
    this.octave = this.app.octaveDistributor.getOctave();

    this.schedulerLatency = 0.1;

    var frequencies = SirenAudio.FREQUENCIES;
    var index = Math.floor(Math.random() * frequencies.length);
    this.frequencyPattern = frequencies[index];
    this.frequencyIndex = 0;

    var durations = SirenAudio.DURATIONS;
    var index = Math.floor(Math.random() * durations.length);
    this.durationPattern = durations[index];
    this.durationIndex = 0;

    // TODO: Pulse waves
    var pulseWidths = [0.125, 0.25, 0.5, 0.75];
    var index = Math.floor(Math.random() * pulseWidths.length);

    this.osc = this.context.createOscillator();
    this.osc.type = 'square';

    this.env = this.context.createGain();
    this.osc.connect(this.env);
    this.env.connect(this.app.dcFilter);

    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 256;
    this.outputChannel = new Float32Array(this.analyser.fftSize);
    this.osc.connect(this.analyser);


    this.start();
};

SirenAudio.prototype.start = function() {
    this.playNote(this.context.currentTime);
    this.env.gain.setValueAtTime(0, this.context.currentTime);
    this.env.gain.linearRampToValueAtTime(0.1, this.context.currentTime + 1);
    this.osc.start();
};

SirenAudio.prototype.scheduleNote = function() {
    var nextNoteTime = this.nextNoteTime();
    var schedulerTime = nextNoteTime - this.schedulerLatency;
    var timeoutTime = schedulerTime - this.context.currentTime;
    setTimeout(this.playNote.bind(this, nextNoteTime), timeoutTime * 1000);
};

SirenAudio.prototype.playNote = function(noteTime) {
    if (this.done) {
        return;
    }
    var frequency = this.nextFrequency();
    this.osc.frequency.setValueAtTime(frequency, noteTime);
    this.lastNoteTime = noteTime;
    this.scheduleNote();
};

SirenAudio.prototype.nextFrequency = function() {
    var degree = this.frequencyPattern[this.frequencyIndex];
    var frequency = this.scale.getFrequency(degree, this.rootFrequency,
                                            this.octave);
    this.frequencyIndex += 1;
    this.frequencyIndex %= this.frequencyPattern.length;
    return frequency;
};

SirenAudio.prototype.nextNoteTime = function() {
    var duration = this.durationPattern[this.durationIndex];
    this.durationIndex += 1;
    this.durationIndex %= this.durationPattern.length;
    return this.lastNoteTime + duration * 60 / settings.bpm;
};


SirenAudio.prototype.stop = function() {
    this.env.gain.linearRampToValueAtTime(0, this.context.currentTime + 1);
    setTimeout(function() {
        this.env.disconnect(this.app.dcFilter);
        this.done = true;
    }.bind(this), 2000);
};

SirenAudio.prototype.getOutputChannel = function() {
    this.analyser.getFloatTimeDomainData(this.outputChannel);
    return this.outputChannel;
};

SirenAudio.DURATIONS = [[1 / 4], [1 / 8]];
SirenAudio.FREQUENCIES = [[0, 1, 2],
                          [0, 1, 2, 3],
                          [0, 1, 2, 3, 4, 5],
                          [0, 1, 2, 3, 4, 5, 6, 7],
                          [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                          [0, 1, 2, 3, 4, 5, 6, 7,
                           8, 9, 10, 11, 12, 13, 14, 15]];

module.exports = SirenAudio;
