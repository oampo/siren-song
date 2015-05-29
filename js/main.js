require('components-webfontloader');
var webglet = require('webglet');
var MajorScale = require('audiolet/src/scale/major');
var KeyState = require('keystate');
var glMatrix = require('gl-matrix')
var mat4 = glMatrix.mat4;

var RecyclingParticleSystem = require('./recycling-particle-system');
var OctaveDistributor = require('./octave-distributor');
var Cloud = require('./cloud');
var Level = require('./level');
var GoodGuy = require('./good-guy');
var Score = require('./score');
var UI = require('./ui');
var ObjectPool = require('./object-pool');
var SpiralSiren = require('./spiral-siren');
var generate_ir = require('./impulse-response');
var settings  = require('./settings');

FONT_LOADED = false;
WINDOW_LOADED = false;

WebFont.load({
    google: {
        families: ['Orbitron']
    },
    active: function() {
        if (WINDOW_LOADED) {
            window.app.start();
        }
        FONT_LOADED = true;
    },
    inactive: function() {
        if (WINDOW_LOADED) {
            window.app.start();
        }
        FONT_LOADED = true;
    }
});

var SirenSong = function(options) {
    webglet.App.call(this, options);

    if (!gl) {
        // Hide UI
        document.getElementById('ui').style.display = 'none';
        return;
    }

    this.screenWidth = screen.width;
    this.screenHeight = screen.height;

    var vertexShader = document.getElementById('basic-vert').innerHTML;
    var fragmentShader = document.getElementById('basic-frag').innerHTML;
    this.renderer = new webglet.BasicRenderer(vertexShader, fragmentShader);

    this.projection = new webglet.MatrixStack();

    this.modelview = new webglet.MatrixStack();

    this.keyboard = new KeyState();

    this.context = new AudioContext();
    this.octaveDistributor = new OctaveDistributor();
    this.dcFilter = this.context.createBiquadFilter();
    this.dcFilter.frequency = 20;
    this.dcFilter.type = 'highpass';

    this.delay = this.context.createDelay();
    this.delay.delayTime.value = 4 * 60 / settings.bpm;
    this.feedback = this.context.createGain();
    this.feedback.gain.value = 0.7;
    this.delayDirty = this.context.createGain();
    this.delayDirty.gain.value = 0.2;
    this.delayClean = this.context.createGain();
    this.delayClean.gain.value = 0.8;

    var ir = generate_ir(this.context, 3, 0.8);
    this.reverb = this.context.createConvolver();
    this.reverb.buffer = ir;
    this.reverbDirty = this.context.createGain();
    this.reverbDirty.gain.value = 0.4;
    this.reverbClean = this.context.createGain();
    this.reverbClean.gain.value = 0.6;

    this.bitCrusher = this.context.createWaveShaper();
    var levels = Math.pow(2, settings.bitRate);
    var curve = new Float32Array(Math.pow(2, 16));
    var perLevel = curve.length / levels;
    for (var i=0; i<levels; i++) {
        var value = i / (levels  - 1) * 2 - 1;
        for (var j=0; j<perLevel; j++) {
            curve[i * perLevel + j] = value;
        }
    }
    this.bitCrusher.curve = curve;

    this.dcFilter.connect(this.delay);
    this.delay.connect(this.feedback);
    this.feedback.connect(this.delay);
    this.delay.connect(this.delayDirty);
    this.dcFilter.connect(this.delayClean);
    this.delayClean.connect(this.reverb);
    this.delayDirty.connect(this.reverb);
    this.delayClean.connect(this.reverbClean);
    this.delayDirty.connect(this.reverbClean);
    this.reverb.connect(this.reverbDirty);
    this.reverbClean.connect(this.bitCrusher);
    this.reverbDirty.connect(this.bitCrusher);
    this.bitCrusher.connect(this.context.destination);

    this.octaveDistributor = new OctaveDistributor();
    this.rootFrequency = 16.352;
    this.scale = new MajorScale();

    this.particleSystem = new RecyclingParticleSystem(30);

    this.cloud = new Cloud(this);

    this.level = new Level(this);

    this.goodGuy = new GoodGuy(this);

    this.sirens = [];

    this.chain = [this.goodGuy];

    this.score = new Score(this);

    this.ui = new UI(this);

    this.vec3Pool = new ObjectPool(function(app) {
        return new Float32Array(3);
    }, 30);

    if (FONT_LOADED) {
        this.start();
    }
    WINDOW_LOADED = true;
}
SirenSong.prototype = Object.create(webglet.App.prototype);
SirenSong.prototype.constructor = SirenSong;

SirenSong.prototype.start = function() {
    this.time = new Date().getTime();
    this.update();
    this.shouldUpdate = false;
    this.ui.startCountdown();

    setInterval(this.preUpdate.bind(this), 1000 / 60);
    this.run();
};

SirenSong.prototype.handleKeys = function() {
    if (this.keyboard.isPressed('left') ||
        this.keyboard.isPressed('a')) {
        var dx = settings.baseTurningSpeed + settings.turningSpeedMultiplier * this.score.score;
        this.goodGuy.particle.velocity[0] -= dx;
    }
    if (this.keyboard.isPressed('right') ||
        this.keyboard.isPressed('d')) {
        var dx = settings.baseTurningSpeed + settings.turningSpeedMultiplier * this.score.score;
        this.goodGuy.particle.velocity[0] += dx;
    }
};

SirenSong.prototype.addSirens = function() {
    if (Math.random() > 0.98) {
        this.sirens.push(new SpiralSiren(this));
    }
};

SirenSong.prototype.preUpdate = function() {
    if (this.shouldUpdate) {
        this.update();
    }
};

SirenSong.prototype.update = function() {
    var time = new Date().getTime();
    var dt = (time - this.time) / 1000;
    this.time = time;

    this.handleKeys();
    this.particleSystem.tick(dt);
    this.level.update(dt);

    this.addSirens();
    for (var i = 0; i < this.sirens.length; i++) {
        this.sirens[i].update();
    }

    this.goodGuy.update();

    this.cloud.update(dt);

    this.ui.updateScore();
};

SirenSong.prototype.draw = function() {
    if (this.canvas.clientWidth != this.canvas.width ||
        this.canvas.clientHeight != this.canvas.height) {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    mat4.ortho(this.projection.matrix, -0.5, 0.5,
               0.5 * this.canvas.height/ this.canvas.width,
               -0.5 * this.canvas.height / this.canvas.width,
               -1, 1);
    this.renderer.setUniform('uProjectionMatrix',
                             this.projection.matrix);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.renderer.setUniform('uModelviewMatrix',
                             this.modelview.matrix);
    this.level.draw();
    this.cloud.draw();
    for (var i = 0; i < this.sirens.length; i++) {
        this.sirens[i].draw();
    }
    this.goodGuy.draw();
    this.ui.draw();
};

SirenSong.prototype.pxToLength = function(px) {
    return px / this.widthPx();
};


SirenSong.prototype.width = function() {
    return 1;
};

SirenSong.prototype.widthPx = function() {
    return this.canvas.width;
};

SirenSong.prototype.height = function() {
    return this.pxToLength(this.heightPx());
};

SirenSong.prototype.heightPx = function() {
    return this.canvas.height;
};

SirenSong.prototype.minWidth = function() {
    return 1;
};

SirenSong.prototype.minWidthPx = function() {
    return 320;
};

SirenSong.prototype.maxWidth = function() {
    return 1;
};

SirenSong.prototype.maxWidthPx = function() {
    return this.screenWidth;
};

SirenSong.prototype.minHeight = function() {
    return 0;
};

SirenSong.prototype.minHeightPx = function() {
    return 0;
};

SirenSong.prototype.maxHeight = function() {
    return this.maxHeightPx() / this.minWidthPx();
};

SirenSong.prototype.maxHeightPx = function() {
    return this.screenHeight;
};

document.addEventListener("DOMContentLoaded", function() {
    var canvas = document.getElementById('game');
    window.app = new SirenSong({canvas: canvas,
                                contextAttributes: {
                                    antialias: false
                                }});
});
