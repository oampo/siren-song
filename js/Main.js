window.onload = function() {
    var SirenSong = function(element, options) {
        App.call(this, element, options);
        this.initKeyEvents();

        this.width = this.canvas.width;
        this.height = this.canvas.height;

        gl.viewport(0, 0, this.width, this.height);

        this.renderer = new BasicRenderer('basic-vert',
                                          'basic-frag');

        this.projection = new MatrixStack();
        mat4.ortho(-this.width / 2, this.width / 2,
                   this.height / 2, -this.height / 2,
                   -1, 1, this.projection.matrix);
        this.renderer.setUniform('uProjectionMatrix',
                                 this.projection.matrix);

        this.modelview = new MatrixStack();
        this.renderer.setUniform('uModelviewMatrix',
                                 this.modelview.matrix);


        this.keys = {};

        this.audiolet = new Audiolet();
        this.scale = new MajorScale();
        this.rootFrequency = 16.352;
        this.dcFilter = new DCFilter(this.audiolet);
        var delayTime = this.audiolet.scheduler.beatLength;
        delayTime /= this.audiolet.device.sampleRate;
        this.delay = new FeedbackDelay(this.audiolet, delayTime,
                                       delayTime, 0.9, 0.2);
        this.reverb = new Reverb(this.audiolet, 0.2, 1, 0.7);
        this.crusher = new BitCrusher(this.audiolet, 8);
        this.dcFilter.connect(this.delay);
        this.delay.connect(this.reverb);
        this.reverb.connect(this.crusher);
        this.crusher.connect(this.audiolet.output);

        this.particleSystem = new RecyclingParticleSystem(30);

        this.cloud = new Cloud(this);

        this.level = new Level(this);

        this.goodGuy = new GoodGuy(this);

        this.sirens = [];

        this.chain = [this.goodGuy];

        this.score = new Score(this);

        this.ui = new UI(this);

        this.synthPool = new ObjectPool(SirenSynth, 10, this);

        this.update();
        this.draw();

        this.shouldUpdate = false;
        this.ui.startCountdown();

        setInterval(this.preUpdate.bind(this), 1000/60);
    }
    extend(SirenSong, App);
    implement(SirenSong, KeyEvents);

    SirenSong.prototype.handleKeys = function() {
        if (this.keys.left || this.keys.a) {
            var dx = Math.min(0.15 + 4E-6 * this.score.score, 0.5);
            this.goodGuy.particle.velocity[0] -= dx;
        }
        if (this.keys.right || this.keys.d) {
            var dx = Math.min(0.15 + 4E-6 * this.score.score, 0.5);
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
        this.handleKeys();
        this.particleSystem.tick();
        this.level.update();

        this.addSirens();

        for (var i = 0; i < this.sirens.length; i++) {
            this.sirens[i].update();
        }

        this.goodGuy.update();

        this.cloud.update();

        this.ui.updateScore();
    };

    SirenSong.prototype.draw = function() {
        this.clear([0, 0, 0, 1]);
        this.renderer.setUniform('uModelviewMatrix',
                                 this.modelview.matrix);
        this.level.draw();
        this.cloud.draw();
        for (var i=0; i<this.sirens.length; i++) {
            this.sirens[i].draw();
        }
        this.goodGuy.draw();
        this.ui.draw();
    };

    SirenSong.prototype.keyPressed = function(key) {
        this.keys[key] = true;
    };

    SirenSong.prototype.keyReleased = function(key) {
        this.keys[key] = false;
    };

    window.app = new SirenSong(document.getElementById('main'), {
                                   width: 800,
                                   height: 600,
                                   antialias: false}
                              );
    window.app.run();
};
