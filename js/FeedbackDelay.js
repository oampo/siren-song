var FeedbackDelay = function(audiolet, feedback, mix) {
    AudioletGroup.apply(this, [audiolet, 1, 1]);

    var delayTime = this.audiolet.scheduler.beatLength;
    delayTime /= this.audiolet.device.sampleRate;

    this.delay = new Delay(this.audiolet, delayTime, delayTime);
    this.gain = new Gain(this.audiolet, feedback);
    this.xfade = new CrossFade(this.audiolet, mix);


    this.inputs[0].connect(this.delay);
    this.inputs[0].connect(this.xfade);

    this.delay.connect(this.gain);
    this.gain.connect(this.delay);
    this.delay.connect(this.xfade, 0, 1);
    this.xfade.connect(this.outputs[0]);
};
extend(FeedbackDelay, AudioletGroup);

