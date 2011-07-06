function webGLStart() {
    PhiloGL('siren-song', {
        textures: {
            src: ['img/good-guy.png']
        },
        onError: function() {
            alert("There was an error creating the app.");
        },

        onLoad: function(app) {
            // Ortho camera
            var gl = app.gl;

            app.width = app.canvas.width;
            app.height = app.canvas.height;

            gl.clearColor(0, 0, 0, 1);

            gl.viewport(0, 0, app.width, app.height);
            app.camera.projection.ortho(-app.width/2,
                                        app.width/2,
                                        app.height/2,
                                        -app.height/2, -1, 1);
            app.camera.modelView.id();

            app.keys = new Array(512);

            app.particleSystem = new ParticleSystem(0, 0);

            app.level = new Level(app);

            app.goodGuy = new GoodGuy(app);

            app.sirens = [];

            app.cloud = new Cloud(app);

            function handleKeys() {
                if (app.keys[37]) {  // Left
                    app.goodGuy.velocity.x -= 0.2;
                }
                if (app.keys[39]) { // Right
                    app.goodGuy.velocity.x += 0.2;
                } 
            }

            function addSirens() {
                if (Math.random() > 0.98) {
                    app.sirens.push(new Siren(app));    
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

                app.goodGuy.update();
                for (var i=0; i<app.sirens.length; i++) {
                    app.sirens[i].update();
                }

                app.cloud.update();

                gl.clear(gl.COLOR_BUFFER_BIT);
                app.scene.render();
//                PhiloGL.Fx.requestAnimationFrame(draw);
            }

//            draw();
            setInterval(draw, 1000/60);
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
