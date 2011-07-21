var AttractionToGoodGuy = function(a, b, k, distanceMin, distanceMax) {
    this.a = a;
    this.b = b;
    this.k = k;
    this.distanceMin = distanceMin;
    this.distanceMax = distanceMax;

    this.distanceMinSquared = Math.pow(this.distanceMin, 2);
    this.distanceMaxSquared = Math.pow(this.distanceMax, 2);
};

AttractionToGoodGuy.prototype.toString = function() {
    return 'a: ' + this.a +
           '\nb: ' + this.b +
           '\nk: ' + this.k +
           '\ndistanceMin ' + this.distanceMin +
           '\ndistanceMax ' + this.distanceMax;
};

AttractionToGoodGuy.prototype.setMinimumDistance = function(d) {
    this.distanceMin = d;
    this.distanceMinSquared = Math.pow(d, 2);
};

AttractionToGoodGuy.prototype.setMaximumDistance = function(d) {
    this.distanceMax = d;
    this.distanceMaxSquared = Math.pow(d, 2);
};


AttractionToGoodGuy.prototype.apply = function() {
    var a = this.a;
    var b = this.b;
    var k = this.k;
    var distanceMinSquared = this.distanceMinSquared;
    var distanceMaxSquared = this.distanceMaxSquared;

    var a2b = PhiloGL.Vec3.sub(a.position, b.position);
    var a2bDistanceSquared = PhiloGL.Vec3.normSq(a2b);

    if (a2bDistanceSquared < distanceMaxSquared) {
        if (a2bDistanceSquared < distanceMinSquared) {
            a2bDistanceSquared = distanceMinSquared;
        }

        var force = k * a.mass * b.mass / a2bDistanceSquared,
            length = Math.sqrt(a2bDistanceSquared);

        PhiloGL.Vec3.$scale(a2b, 1 / length);

        PhiloGL.Vec3.$scale(a2b, force);

        PhiloGL.Vec3.$add(b.force, a2b);
    }
};

var CloudIntegrator = function(s) {
    this.s = s;
};

CloudIntegrator.prototype.step = function(t) {
    var particles = this.s.particles;
    var numberOfParticles = particles.length;
    for (var i = 0; i < numberOfParticles; i++) {
        var p = particles[i];
        var position = p.position;
        var velocity = p.velocity;

        // Do things the old-fashioned way
        position.x += velocity.x;
        position.y += velocity.y;
        position.z += velocity.z;

        p.age += t;
    }
};


var Cloud = function(app) {
    this.app = app;

    this.particleSystem = new ParticleSystem(0, 0);
    this.particleSystem.integrator = new CloudIntegrator(this.particleSystem);

    this.model = new PhiloGL.O3D.Model({id: 'cloud',
                                        dynamic: true,
                                        drawType: 'POINTS'});
    this.model.dynamic = true;
    this.app.scene.add(this.model);
};

Cloud.prototype.update = function() {
    this.particleSystem.tick();

    var vertices = [];
    var colors = [];

    var halfHeight = this.app.height / 2;
    var level = this.app.level;
    var leftColors = level.leftColors;
    var rightColors = level.rightColors;
    var score = this.app.score;

    var push = Array.prototype.push;

    var particleSystem = this.particleSystem;
    var particles = particleSystem.particles;
    var numberOfParticles = particles.length;
    for (var i = 0; i < numberOfParticles; i++) {
        var index = numberOfParticles - i - 1;
        var particle = particles[index];
        var position = particle.position;

        var xPos = position.x;
        var yPos = position.y;

        var sides = level.getSides(yPos);
        var left = sides[0];
        var right = sides[1];

        var age = particle.age;
        var hue = age % Color.PARTICLE_TABLE.length;
        var color = Color.PARTICLE_TABLE[hue];

        if (age > 1000 ||
            yPos < -halfHeight ||
            yPos > halfHeight ||
            xPos < left ||
            xPos > right) {
            particleSystem.removeParticle(index);
            score.increase();

            if (xPos < left) {
                var index = level.yPosToIndex(yPos);
                leftColors[index] = color;
            }
            else if (xPos > right) {
                var index = level.yPosToIndex(yPos);
                rightColors[index] = color;
            }
        }
        else {
            vertices.push(xPos, yPos, 0);
            push.apply(colors, color);
        }
    }

    this.model.vertices = vertices;
    this.model.colors = colors;
};

var Color = {};
Color.hsvaToRGBA = function(h, s, v, a) {
    if (s == 0) {
        return [v, v, v, a];
    }
    var i = Math.floor(h * 6);
    var f = (h * 6) - i;
    var p = v * (1 - s);
    var q = v * (1 - s * f);
    var t = v * (1 - s * (1 - f));
    var i = i % 6;
    if (i == 0) {
        return [v, t, p, a];
    }
    if (i == 1) {
        return [q, v, p, a];
    }
    if (i == 2) {
        return [p, v, t, a];
    }
    if (i == 3) {
        return [p, q, v, a];
    }
    if (i == 4) {
        return [t, p, v, a];
    }
    if (i == 5) {
        return [v, p, q, a];
    }
};

var numberOfColors = 100;
Color.PARTICLE_TABLE = [];
for (var i = 0; i < numberOfColors; i++) {
    Color.PARTICLE_TABLE.push(Color.hsvaToRGBA(i / numberOfColors, 1, 1, 1));
}
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

var GoodGuy = function(app) {
    this.app = app;

    this.radius = 8;
    this.chain = [];
    this.springOut = null;

    var sides = this.app.level.getSides(0);
    var middle = (sides[0] + sides[1]) / 2;
    this.particle = new Particle(1);
    this.particle.position.x = middle;
    this.app.particleSystem.particles.push(this.particle);

    var vertices = [];
    var colors = [];
    var numberOfPoints = 80;
    var numberOfSpirals = 3;
    var spacing = 3;
    for (var i = 0; i < numberOfPoints; i++) {
        var theta = numberOfSpirals * i * 2 * Math.PI / numberOfPoints;
        vertices.push(5 * theta * Math.sin(theta) / (2 * Math.PI));
        vertices.push(5 * theta * Math.cos(theta) / (2 * Math.PI));
        vertices.push(0);
        colors.push(1, 1, 1, 1);
    }

    this.model = new PhiloGL.O3D.Model({vertices: vertices,
                                        colors: colors,
                                        drawType: 'LINE_STRIP'});
    this.app.scene.add(this.model);

};

GoodGuy.prototype.update = function() {
    var sides = this.app.level.getSides(0);
    this.model.rotation.z -= 0.3;
    this.model.update();

    if (this.particle.position.x < -this.app.width / 2 ||
        this.particle.position.x > this.app.width / 2 ||
        this.particle.position.y < -this.app.height / 2 ||
        this.particle.position.y > this.app.height / 2) {
        this.app.stop();
        this.particle.position.x = (sides[0] + sides[1]) / 2;
        this.particle.velocity.x = 0;
        this.app.ui.startCountdown();
    }

    if (this.particle.position.x < sides[0] ||
        this.particle.position.x > sides[1]) {
        this.app.score.decrease();

    }

    this.handleSirenCollisions();
    PhiloGL.Vec3.setVec3(this.model.position, this.particle.position);
    this.model.update();
};

GoodGuy.prototype.handleSirenCollisions = function() {
    var sirens = this.app.sirens;
    var numberOfSirens = sirens.length;
    var position = this.particle.position;
    for (var i = 0; i < numberOfSirens; i++) {
        var siren = sirens[i];
        if (!siren.connected &&
            PhiloGL.Vec3.distTo(position, siren.particle.position) <
            this.radius + siren.radius) {
            this.attach(siren);
            this.app.multiplier += 1;
        }
    }
};

GoodGuy.prototype.attach = function(sirenA) {
    if (this.chain.length == 0) {
        // Connect to goodGuy
        this.springOut = new SpringToGoodGuy(this.particle, sirenA.particle,
                                             0.05, 0.5, 15);
        this.app.particleSystem.forces.push(this.springOut);
        sirenA.springIn = this.springOut;
    }
    else {
        var sirenB = this.chain[this.chain.length - 1];
        var spring = new Spring(sirenA.particle, sirenB.particle,
                                 0.05, 0.5, 15);
        this.app.particleSystem.forces.push(spring);
        sirenA.springIn = spring;
        sirenB.springOut = spring;
    }
    var index = this.app.particleSystem.removeForce(sirenA.attraction);
    sirenA.connected = true;
    sirenA.createSynth();
    this.chain.push(sirenA);
};

var Integrator = function(s) {
    this.s = s;
};

Integrator.prototype.step = function(t) {
    var s = this.s;
    s.clearForces();
    s.applyForces();

    var particles = s.particles;
    var numberOfParticles = particles.length;
    for (var i = 0; i < numberOfParticles; i++) {
        var p = particles[i];
        var position = p.position;
        var velocity = p.velocity;
        var force = p.force;

        /*
        PhiloGL.Vec3.$add(position, velocity);
        PhiloGL.Vec3.$add(position, PhiloGL.Vec3.scale(force, 2.5));
        PhiloGL.Vec3.$add(velocity, force);
        */
        // Do things the old-fashioned way
        position.x += velocity.x + force.x * 2.5;
        position.y += velocity.y + force.y * 2.5;
        position.z += velocity.z + force.z * 2.5;

        velocity.x += force.x;
        velocity.y += force.y;
        velocity.z += force.z;

        p.age += t;
    }
};


Math.mod = function(a, b) {
    return ((a % b) + b) % b;
};


var Level = function(app) {
    this.app = app;
    this.width = this.app.width;
    this.height = this.app.height;

    this.particle = new Particle(1);
    this.particle.velocity.y = -3;
    this.app.particleSystem.particles.push(this.particle);
    PhiloGL.Vec3.set(this.particle.velocity, 0, -3, 0);
    this.lastYPos = 0;
    this.zeroPos = 0;

    this.simplex = new SimplexNoise();

    this.left = new Array(this.height);
    this.right = new Array(this.height);

    this.leftColors = new Array(this.height);
    this.rightColors = new Array(this.height);

    this.initialOffset = 0.27;
    this.offsetPerPoint = 1 / 400000;
    this.minOffset = 0.1;

    this.initialSlowDeviation = 0.23;
    this.deviationPerPoint = 1 / 600000;
    this.maxSlowDeviation = 0.7;

    this.leftDetails = {
        xOffset: -this.initialOffset * this.width,
        slowOffset: 0,
        slowDeviation: this.initialSlowDeviation * this.width,
        slowStep: 0.003,
        fastOffset: this.height,
        fastDeviation: 0.05 * this.width,
        fastStep: 0.01
    };

    this.rightDetails = {
        xOffset: this.initialOffset * this.width,
        slowOffset: 0,
        slowDeviation: this.initialSlowDeviation * this.width,
        slowStep: 0.003,
        fastOffset: 2 * this.height,
        fastDeviation: 0.05 * this.width,
        fastStep: 0.01
    };

    for (var i = 0; i < this.height; i++) {
        this.left[i] = this.calculateSide(i, this.leftDetails);
        this.right[i] = this.calculateSide(i, this.rightDetails);
        this.leftColors[i] = null;
        this.rightColors[i] = null;
    }

    this.leftModel = new PhiloGL.O3D.Model({
        id: 'Left side',
        dynamic: true,
        drawType: 'LINE_STRIP'
    });
    this.leftModel.dynamic = true;
    this.app.scene.add(this.leftModel);

    this.rightModel = new PhiloGL.O3D.Model({
        id: 'Right side',
        dynamic: true,
        drawType: 'LINE_STRIP'
    });
    this.rightModel.dynamic = true;
    this.app.scene.add(this.rightModel);

    this.leftColorModel = new PhiloGL.O3D.Model({
        id: 'Left colors',
        dynamic: true,
        drawType: 'LINES'
    });
    this.leftColorModel.dynamic = true;
    this.app.scene.add(this.leftColorModel);

    this.rightColorModel = new PhiloGL.O3D.Model({
        id: 'Right colors',
        dynamic: true,
        drawType: 'LINES'
    });
    this.rightColorModel.dynamic = true;
    this.app.scene.add(this.rightColorModel);
};

Level.prototype.update = function() {
    this.updateDetails();
    this.addToBottom();
    this.updateModels();
};

Level.prototype.updateDetails = function() {
    var score = this.app.score.score;
    var offset = this.initialOffset;
    offset -= score * this.offsetPerPoint;
    if (offset < this.minOffset) {
        offset = this.minOffset;
    }
    this.leftDetails.xOffset = -offset * this.width;
    this.rightDetails.xOffset = offset * this.width;

    var deviation = this.initialSlowDeviation;
    deviation += score * this.deviationPerPoint;
    if (deviation > this.maxSlowDeviation) {
        deviation = this.maxSlowDeviation;
    }
    this.leftDetails.slowDeviation = deviation * this.width;
    this.rightDetails.slowDeviation = deviation * this.width;
};


Level.prototype.addToBottom = function() {
    var width = this.width;
    var height = this.height;

    var left = this.left;
    var leftColors = this.leftColors;
    var right = this.right;
    var rightColors = this.rightColors;

    // Loop through pixels which have fallen off screen and calculate new
    // values for them
    var yPos = this.particle.position.y;
    var loopYPos = this.lastYPos;
    while (loopYPos > yPos) {
        var writePosition = Math.mod(loopYPos, height);
        writePosition = Math.floor(writePosition);
        left[writePosition] = this.calculateSide(loopYPos,
                                                 this.leftDetails);
        right[writePosition] = this.calculateSide(loopYPos,
                                                  this.rightDetails);
        leftColors[writePosition] = null;
        rightColors[writePosition] = null;
        loopYPos -= 1;
    }

    this.lastYPos = yPos;
    this.zeroPos = Math.floor(Math.mod(this.lastYPos, height));
};

Level.prototype.updateModels = function() {
    var width = this.width;
    var height = this.height;

    var left = this.left;
    var right = this.right;
    var leftColors = this.leftColors;
    var rightColors = this.rightColors;

    var leftVertexArray = [];
    var leftColorArray = [];
    var rightVertexArray = [];
    var rightColorArray = [];

    var leftColorVertexArray = [];
    var leftColorColorArray = [];
    var rightColorVertexArray = [];
    var rightColorColorArray = [];

    var startPosition = Math.floor(Math.mod(this.lastYPos, height));

    for (var i = 0; i < height; i++) {
        var readIndex = (startPosition + i + 1) % height;
        var yPos = height / 2 - i;

        var leftVertex = left[readIndex];
        var rightVertex = right[readIndex];

        leftVertexArray.push(leftVertex, yPos, 0);
        rightVertexArray.push(rightVertex, yPos, 0);
        leftColorArray.push(1, 1, 1, 1);
        rightColorArray.push(1, 1, 1, 1);

        var leftColor = leftColors[readIndex];
        var rightColor = rightColors[readIndex];
        if (leftColor != null) {
            leftColorVertexArray.push(-width / 2, yPos, 0,
                                      leftVertex - 1, yPos, 0);
            Array.prototype.push.apply(leftColorColorArray, leftColor);
            Array.prototype.push.apply(leftColorColorArray, leftColor);
        }

        if (rightColor != null) {
            rightColorVertexArray.push(rightVertex + 1, yPos, 0,
                                       width / 2, yPos, 0);
            Array.prototype.push.apply(rightColorColorArray, rightColor);
            Array.prototype.push.apply(rightColorColorArray, rightColor);
        }
    }
    this.leftModel.vertices = leftVertexArray;
    this.rightModel.vertices = rightVertexArray;
    this.leftModel.colors = leftColorArray;
    this.rightModel.colors = rightColorArray;

    this.leftColorModel.vertices = leftColorVertexArray;
    this.rightColorModel.vertices = rightColorVertexArray;
    this.leftColorModel.colors = leftColorColorArray;
    this.rightColorModel.colors = rightColorColorArray;
};

Level.prototype.calculateSide = function(yPos, details) {
    var x = 0;
    x += details.xOffset;

    var slowPos = details.slowOffset;
    slowPos += yPos * details.slowStep;
    x += details.slowDeviation * this.simplex.noise(0, slowPos);

    var fastPos = details.fastOffset;
    fastPos += yPos * details.fastStep;
    x += details.fastDeviation * this.simplex.noise(0, fastPos);
    return x;
};

Level.prototype.getSides = function(yPos) {
    var index = this.yPosToIndex(yPos);
    var left = this.left[index];
    var right = this.right[index];
    return [left, right];
};

Level.prototype.yPosToIndex = function(yPos) {
    var height = this.height;
    yPos = this.zeroPos + 2 + height / 2 - yPos;
    yPos = Math.floor(yPos % height);
    return yPos;
};
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
var Particle = function(mass) {
    this.mass = mass;
    this.position = new PhiloGL.Vec3();
    this.velocity = new PhiloGL.Vec3();
    this.force = new PhiloGL.Vec3();
    this.age = 0;
};

Particle.prototype.toString = function() {
    return 'position: ' + this.position +
           '\n velocity: ' + this.velocity +
           '\n force: ' + this.force +
           '\n age: ' + this.age;
};

Particle.prototype.distanceTo = function(p) {
    return PhiloGL.Vec3.distTo(this.position, p.position);
};

Particle.prototype.reset = function() {
    this.age = 0;
    PhiloGL.Vec3.set(this.position, 0, 0, 0);
    PhiloGL.Vec3.set(this.velocity, 0, 0, 0);
    PhiloGL.Vec3.set(this.force, 0, 0, 0);
    this.mass = 1;
};

var ParticleSystem = function() {
    this.integrator = new Integrator(this);
    this.particles = [];
    this.forces = [];
};

ParticleSystem.prototype.tick = function(time) {
    this.integrator.step(time || 1);
};

ParticleSystem.prototype.clear = function() {
    this.particles = [];
    this.forces = [];
};

ParticleSystem.prototype.applyForces = function() {
    var particles = this.particles;
    var numberOfParticles = particles.length;

    var forces = this.forces;
    var numberOfForces = forces.length;
    for (var i = 0; i < numberOfForces; i++) {
        forces[i].apply();
    }
};

ParticleSystem.prototype.clearForces = function() {
    var particles = this.particles;
    var numberOfParticles = particles.length;
    for (var i = 0; i < numberOfParticles; i++) {
        PhiloGL.Vec3.set(particles[i].force, 0, 0, 0);
    }
};

ParticleSystem.prototype.removeParticle = function(particle) {
    var type = typeof particle;
    if (type == 'number') {
        return this.particles.splice(particle, 1)[0];
    }
    else if (type == 'object') {
        var index = this.particles.indexOf(particle);
        if (index != -1) {
            return this.particles.splice(index, 1)[0];
        }
    }
    return null;
};

ParticleSystem.prototype.removeForce = function(force) {
    var type = typeof force;
    if (type == 'number') {
        return this.forces.splice(force, 1)[0];
    }
    else if (type == 'object') {
        var index = this.forces.indexOf(force);
        if (index != -1) {
            return this.forces.splice(index, 1)[0];
        }
    }
    return null;
};

// From https://gist.github.com/304522
// Ported from Stefan Gustavson's java implementation
// http://staffwww.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf
// Read Stefan's excellent paper for details on how this code works.
//
// Sean McCullough banksean@gmail.com

/**
 * You can pass in a random number generator object if you like.
 * It is assumed to have a random() method.
 */
var SimplexNoise = function(r) {
    if (r == undefined) r = Math;
    this.grad3 = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
                  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
                  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]];
    this.p = [];
    for (var i = 0; i < 256; i++) {
        this.p[i] = Math.floor(r.random() * 256);
    }
    // To remove the need for index wrapping, double the permutation table
    // length
    this.perm = [];
    for (var i = 0; i < 512; i++) {
        this.perm[i] = this.p[i & 255];
    }

    // A lookup table to traverse the simplex around a given point in 4D.
    // Details can be found where this table is used, in the 4D noise method.
    this.simplex = [[0, 1, 2, 3], [0, 1, 3, 2], [0, 0, 0, 0], [0, 2, 3, 1],
                    [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [1, 2, 3, 0],
                    [0, 2, 1, 3], [0, 0, 0, 0], [0, 3, 1, 2], [0, 3, 2, 1],
                    [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [1, 3, 2, 0],
                    [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
                    [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
                    [1, 2, 0, 3], [0, 0, 0, 0], [1, 3, 0, 2], [0, 0, 0, 0],
                    [0, 0, 0, 0], [0, 0, 0, 0], [2, 3, 0, 1], [2, 3, 1, 0],
                    [1, 0, 2, 3], [1, 0, 3, 2], [0, 0, 0, 0], [0, 0, 0, 0],
                    [0, 0, 0, 0], [2, 0, 3, 1], [0, 0, 0, 0], [2, 1, 3, 0],
                    [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
                    [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
                    [2, 0, 1, 3], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
                    [3, 0, 1, 2], [3, 0, 2, 1], [0, 0, 0, 0], [3, 1, 2, 0],
                    [2, 1, 0, 3], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
                    [3, 1, 0, 2], [0, 0, 0, 0], [3, 2, 0, 1], [3, 2, 1, 0]];
};

SimplexNoise.prototype.dot = function(g, x, y) {
    return g[0] * x + g[1] * y;
};

SimplexNoise.prototype.noise = function(xin, yin) {
    var n0, n1, n2; // Noise contributions from the three corners
    // Skew the input space to determine which simplex cell we're in
    var F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    var s = (xin + yin) * F2; // Hairy factor for 2D
    var i = Math.floor(xin + s);
    var j = Math.floor(yin + s);
    var G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    var t = (i + j) * G2;
    var X0 = i - t; // Unskew the cell origin back to (x,y) space
    var Y0 = j - t;
    var x0 = xin - X0; // The x,y distances from the cell origin
    var y0 = yin - Y0;
    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
    if (x0 > y0) {
        i1 = 1; j1 = 0; // lower triangle, XY order: (0,0)->(1,0)->(1,1)
    }
    else {
        i1 = 0; j1 = 1; // upper triangle, YX order: (0,0)->(0,1)->(1,1)
    }
    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6
    // Offsets for middle corner in (x,y) unskewed coords
    var x1 = x0 - i1 + G2;
    var y1 = y0 - j1 + G2;
    // Offsets for last corner in (x,y) unskewed coords
    var x2 = x0 - 1.0 + 2.0 * G2;
    var y2 = y0 - 1.0 + 2.0 * G2;
    // Work out the hashed gradient indices of the three simplex corners
    var ii = i & 255;
    var jj = j & 255;
    var gi0 = this.perm[ii + this.perm[jj]] % 12;
    var gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12;
    var gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12;
    // Calculate the contribution from the three corners
    var t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) {
        n0 = 0.0;
    }
    else {
        t0 *= t0;
        // (x,y) of grad3 used for 2D gradient
        n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);
    }
    var t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) {
        n1 = 0.0;
    }
    else {
        t1 *= t1;
        n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
    }
    var t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) {
        n2 = 0.0;
    }
    else {
        t2 *= t2;
        n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70.0 * (n0 + n1 + n2);
};

var Score = function(app) {
    this.app = app;
    this.score = 0;
    this.highScore = 0;
};

Score.prototype.increase = function() {
    this.score += 1;
    if (this.score > this.highScore) {
        this.highScore = this.score;
    }
};

Score.prototype.decrease = function() {
    this.score = Math.floor(this.score * 0.995);
};
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
    this.particle = new Particle(1);
    this.particle.position.x = xPos;
    this.particle.position.y = yPos;
    this.particle.velocity.y = -3;
    this.app.particleSystem.particles.push(this.particle);

    this.attraction = new AttractionToGoodGuy(this.app.goodGuy.particle,
                                              this.particle, 800, 20, 40);
    this.app.particleSystem.forces.push(this.attraction);

    var vertices = [];
    var colors = [];
    var numberOfPoints = 40;
    var numberOfSpirals = 2;
    var spacing = 3;
    for (var i = 0; i < numberOfPoints; i++) {
        var theta = numberOfSpirals * i * 2 * Math.PI / numberOfPoints;
        vertices.push(5 * theta * Math.sin(theta) / (2 * Math.PI));
        vertices.push(5 * theta * Math.cos(theta) / (2 * Math.PI));
        vertices.push(0);
        colors.push(1, 1, 1, 1);
    }

    this.model = new PhiloGL.O3D.Model({vertices: vertices,
                                        colors: colors,
                                        drawType: 'LINE_STRIP'});
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
    this.app.particleSystem.removeParticle(this.particle);

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
            console.log('me');
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
var SpiralSiren = function(app) {
    Siren.call(this, app);
    this.phase = 0;
    this.frequency = 0.05;
    this.numberOfOutputs = 10;
};
extend(SpiralSiren, Siren);

SpiralSiren.prototype.createParticles = function() {
    for (var i = 0; i < this.numberOfOutputs; i++) {
        var angle = this.phase + i * 2 * Math.PI / this.numberOfOutputs;
        var particle = new Particle(1);
        this.app.cloud.particleSystem.particles.push(particle);
        PhiloGL.Vec3.setVec3(particle.position, this.particle.position);
        particle.velocity.x = Math.sin(angle);
        particle.velocity.y = this.particle.velocity.y + Math.cos(angle);
    }
    this.phase += this.frequency * 2 * Math.PI;
};

var Spring = function(a, b, springConstant, damping, restLength) {
    this.a = a;
    this.b = b;
    this.springConstant = springConstant;
    this.damping = damping;
    this.restLength = restLength;
};

Spring.prototype.toString = function() {
    return 'a: ' + this.a +
           '\nb: ' + this.b +
           '\nspringConstant: ' + this.springConstant +
           '\ndamping: ' + this.damping +
           '\nrestLength: ' + this.restLength;
};

Spring.prototype.currentLength = function() {
    return PhiloGL.Vec3.distTo(this.a.position, this.b.position);
};


Spring.prototype.apply = function() {
    var a = this.a;
    var b = this.b;
    var restLength = this.restLength;
    var springConstant = this.springConstant;
    var damping = this.damping;

    var a2b = PhiloGL.Vec3.sub(a.position, b.position);
    var a2bDistance = PhiloGL.Vec3.norm(a2b);

    if (a2bDistance == 0) {
        PhiloGL.Vec3.set(a2b, 0, 0, 0);
    } else {
        PhiloGL.Vec3.$scale(a2b, 1 / a2bDistance);
    }

    var springForce = -(a2bDistance - restLength) * springConstant;
    var vA2b = PhiloGL.Vec3.sub(a.velocity, b.velocity);
    var dampingForce = -damping * PhiloGL.Vec3.dot(a2b, vA2b);
    var r = springForce + dampingForce;

    PhiloGL.Vec3.$scale(a2b, r);

    PhiloGL.Vec3.$add(a.force, a2b);
    PhiloGL.Vec3.$add(b.force, PhiloGL.Vec3.neg(a2b));
};
var SpringToGoodGuy = function(a, b, springConstant, damping, restLength) {
    this.a = a;
    this.b = b;
    this.springConstant = springConstant;
    this.damping = damping;
    this.restLength = restLength;
};

SpringToGoodGuy.prototype.toString = function() {
    return 'a: ' + this.a +
           '\nb: ' + this.b +
           '\nspringConstant: ' + this.springConstant +
           '\ndamping: ' + this.damping +
           '\nrestLength: ' + this.restLength;
};

SpringToGoodGuy.prototype.currentLength = function() {
    return PhiloGL.Vec3.distTo(this.a.position, this.b.position);
};


SpringToGoodGuy.prototype.apply = function() {
    var a = this.a;
    var b = this.b;
    var restLength = this.restLength;
    var springConstant = this.springConstant;
    var damping = this.damping;

    var a2b = PhiloGL.Vec3.sub(a.position, b.position);
    var a2bDistance = PhiloGL.Vec3.norm(a2b);

    if (a2bDistance == 0) {
        PhiloGL.Vec3.set(a2b, 0, 0, 0);
    } else {
        PhiloGL.Vec3.$scale(a2b, 1 / a2bDistance);
    }

    var springForce = -(a2bDistance - restLength) * springConstant;
    var vA2b = PhiloGL.Vec3.sub(a.velocity, b.velocity);
    var dampingForce = -damping * PhiloGL.Vec3.dot(a2b, vA2b);
    var r = springForce + dampingForce;

    PhiloGL.Vec3.$scale(a2b, r);

    PhiloGL.Vec3.$add(b.force, PhiloGL.Vec3.neg(a2b));
};
var UI = function(app) {
    this.app = app;

    this.scoreBox = document.getElementById('score');
    this.highScoreBox = document.getElementById('high-score');
    this.newHighScoreBox = document.getElementById('new-high-score');
    this.countdownBox = document.getElementById('countdown');

    this.haveShownHighScore = false;

    this.countdown = 0;
    this.flashCount = 0;
    this.flashTimeout = null;
};

UI.prototype.updateScore = function() {
    var score = this.app.score.score;
    var highScore = this.app.score.highScore;

    if (score == highScore && score != 0 && !this.haveShownHighScore) {
        this.haveShownHighScore = true;
        this.flashHighScore();
    }
    if (this.haveShownHighScore && score != highScore) {
        this.haveShownHighScore = false;
    }

    this.scoreBox.textContent = score;
    this.highScoreBox.textContent = highScore;
};

UI.prototype.flashHighScore = function() {
    if (this.flashTimeout) {
        return;
    }
    this.newHighScoreBox.style.visibility == 'visible';

    this.flashCount = 0;

    this.flashTimeout = setTimeout(this.doFlashHighScore.bind(this), 500);
};

UI.prototype.doFlashHighScore = function() {
    if (this.newHighScoreBox.style.visibility == 'visible') {
        this.newHighScoreBox.style.visibility = 'hidden';
    }
    else {
        this.newHighScoreBox.style.visibility = 'visible';
    }
    this.flashCount += 1;

    if (this.flashCount < 10) {
        this.flashTimeout = setTimeout(this.doFlashHighScore.bind(this), 500);
    }
    else {
        this.flashTimeout = null;
    }
};

UI.prototype.startCountdown = function() {
    this.countdown = 3;
    this.countdownBox.textContent = this.countdown;
    setTimeout(this.doCountdown.bind(this), 1000);
};

UI.prototype.doCountdown = function() {
    this.countdown -= 1;
    if (this.countdown == 0) {
        this.countdownBox.textContent = '';
        this.app.run();
    }
    else {
        this.countdownBox.textContent = this.countdown;
        setTimeout(this.doCountdown.bind(this), 1000);
    }
};
