// Override for speed
PhiloGL.O3D.Model.prototype.update = function() {
    var matrix = this.matrix,
        pos = this.position,
        rot = this.rotation,
        scale = this.scale;

    PhiloGL.Mat4.id(matrix);
    PhiloGL.Mat4.$translate(matrix, pos.x, pos.y, pos.z);
    PhiloGL.Mat4.$rotateXYZ(matrix, rot.x, rot.y, rot.z);
    PhiloGL.Mat4.$scale(matrix, scale.x, scale.y, scale.z);
};


function webGLStart() {
    PhiloGL('siren-song', {
        context: {
            antialias: false
        },
        onError: function() {
            alert('There was an error creating the app.');
        },

        onLoad: function(app) {
            // Ortho camera
            var gl = app.gl;

            app.width = app.canvas.width;
            app.height = app.canvas.height;

            app.frameCount = 0;

            gl.clearColor(0, 0, 0, 1);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            gl.viewport(0, 0, app.width, app.height);
            app.camera.projection.ortho(-app.width / 2,
                                        app.width / 2,
                                        app.height / 2,
                                        -app.height / 2, -1, 1);
            app.camera.modelView.id();

            app.keys = new Array(512);

            app.audiolet = new Audiolet();
            app.scale = new MajorScale();
            app.rootFrequency = 16.352;
            app.delay = new FeedbackDelay(app.audiolet, 0.9, 0.2);
            app.reverb = new Reverb(app.audiolet, 0.9, 1, 0.5);
            app.crusher = new BitCrusher(app.audiolet, 8);
            app.delay.connect(app.reverb);
            app.reverb.connect(app.crusher);
            app.crusher.connect(app.audiolet.output);

            app.particleSystem = new ParticleSystem();

            app.cloud = new Cloud(app);

            app.level = new Level(app);

            app.goodGuy = new GoodGuy(app);

            app.sirens = [];

            app.score = new Score(app);

            app.ui = new UI(app);

            app.paused = true;
            draw();
            app.ui.startCountdown();

            function handleKeys() {
                if (app.keys[37] || app.keys[65]) {  // Left or A
                    var dx = Math.min(0.15 + 4E-6 * app.score.score, 0.5);
                    app.goodGuy.particle.velocity.x -= dx;
                }
                if (app.keys[39] || app.keys[68]) { // Right or D
                    var dx = Math.min(0.15 + 4E-6 * app.score.score, 0.5);
                    app.goodGuy.particle.velocity.x += dx;
                }
            }

            function addSirens() {
                if (Math.random() > 0.98) {
                    app.sirens.push(new SpiralSiren(app));
                }
                /*
                if (!app.sirens.length) {
                    app.sirens.push(new Siren(app));
                }
                */
            }

            function draw() {
                handleKeys();
                app.particleSystem.tick();
                app.level.update();

                addSirens();

                for (var i = 0; i < app.sirens.length; i++) {
                    app.sirens[i].update();
                }

                app.goodGuy.update();

                app.cloud.update();

                app.ui.updateScore();

                gl.clear(gl.COLOR_BUFFER_BIT);
                app.scene.render();

                if (!app.paused) {
                    PhiloGL.Fx.requestAnimationFrame(draw);
                }
                app.frameCount += 1;
            }

            app.run = function() {
                PhiloGL.Fx.requestAnimationFrame(draw);
                this.paused = false;
            };

            app.stop = function() {
                this.paused = true;
            };
        },

        events: {
            onKeyDown: function(event) {
                this.keys[event.code] = true;
            },

            onKeyUp: function(event) {
                this.keys[event.event.keyCode] = false;
            }
        }
    });
}
