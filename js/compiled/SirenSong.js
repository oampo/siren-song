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

    var a2b = vec3.create();
    vec3.subtract(a.position, b.position, a2b);
    var a2bDistance = vec3.length(a2b);
    var a2bDistanceSquared = Math.pow(a2bDistance, 2);

    if (a2bDistanceSquared < distanceMaxSquared) {
        if (a2bDistanceSquared < distanceMinSquared) {
            a2bDistanceSquared = distanceMinSquared;
        }

        var force = k * a.mass * b.mass / a2bDistanceSquared;

        vec3.scale(a2b, 1 / a2bDistance);

        vec3.scale(a2b, force);

        vec3.add(b.force, a2b);
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
        position[0] += velocity[0];
        position[1] += velocity[1];
        position[2] += velocity[2];

        p.age += t;
    }
};


var Cloud = function(app) {
    this.app = app;

    this.particleSystem = new RecyclingParticleSystem(300);
    this.particleSystem.integrator = new CloudIntegrator(this.particleSystem);

    this.mesh = new Mesh(100, gl.POINTS,
                          gl.STREAM_DRAW, gl.STREAM_DRAW);
};

Cloud.prototype.update = function() {
    this.particleSystem.tick();

    var halfHeight = this.app.height / 2;
    var level = this.app.level;
    var leftColors = level.leftColors;
    var rightColors = level.rightColors;
    var score = this.app.score;

    var particleSystem = this.particleSystem;
    var particles = particleSystem.particles;
    var numberOfParticles = particles.length;

    if (numberOfParticles > this.mesh.numVertices) {
        this.mesh = new Mesh(numberOfParticles * 3, gl.POINTS,
                             gl.STREAM_DRAW, gl.STREAM_DRAW);
    }

    var vertexBuffer = this.mesh.vertexBuffer.array;
    var colorBuffer = this.mesh.colorBuffer.array;

    var count = 0;
    for (var i = 0; i < numberOfParticles; i++) {
        var index = numberOfParticles - i - 1;
        var particle = particles[index];
        var position = particle.position;

        var xPos = position[0];
        var yPos = position[1];

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
            particleSystem.recycleParticle(index);
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
            vertexBuffer[count * 3 + 0] = xPos;
            vertexBuffer[count * 3 + 1] = yPos;
            vertexBuffer[count * 3 + 2] = 0;
            colorBuffer[count * 4 + 0] = color[0];
            colorBuffer[count * 4 + 1] = color[1];
            colorBuffer[count * 4 + 2] = color[2];
            colorBuffer[count * 4 + 3] = color[3];
            count += 1;
        }
    }

    this.mesh.vertexBuffer.setValues();
    this.mesh.colorBuffer.setValues();
};

Cloud.prototype.draw = function() {
    this.app.renderer.render(this.mesh, 0,
                             this.particleSystem.particles.length);
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
    this.particle = this.app.particleSystem.createParticle();
    this.particle.position[0] = middle;

    var numberOfPoints = 80;
    var numberOfSpirals = 3;
    var spacing = 3;

    this.mesh = new Mesh(numberOfPoints, gl.LINE_STRIP, gl.STATIC_DRAW,
                         gl.STATIC_DRAW);
    var vertexBuffer = this.mesh.vertexBuffer.array;
    var colorBuffer = this.mesh.colorBuffer.array;

    for (var i = 0; i < numberOfPoints; i++) {
        var theta = numberOfSpirals * i * 2 * Math.PI / numberOfPoints;
        vertexBuffer[i * 3 + 0] = 5 * theta * Math.sin(theta) / (2 * Math.PI);
        vertexBuffer[i * 3 + 1] = 5 * theta * Math.cos(theta) / (2 * Math.PI);
        vertexBuffer[i * 3 + 2] = 0;
        colorBuffer[i * 4 + 0] = 1;
        colorBuffer[i * 4 + 1] = 1;
        colorBuffer[i * 4 + 2] = 1;
        colorBuffer[i * 4 + 3] = 1;
    }
    this.mesh.vertexBuffer.setValues();
    this.mesh.colorBuffer.setValues();

    this.transformation = new Transformation();
};

GoodGuy.prototype.update = function() {
    var sides = this.app.level.getSides(0);
/*    this.model.rotation.z -= 0.3;
    this.model.update(); */

    if (this.particle.position[0] < -this.app.width / 2 ||
        this.particle.position[0] > this.app.width / 2 ||
        this.particle.position[1] < -this.app.height / 2 ||
        this.particle.position[1] > this.app.height / 2) {
        this.app.shouldUpdate = false;
        this.particle.position[0] = (sides[0] + sides[1]) / 2;
        this.particle.velocity[0] = 0;
        this.app.ui.startCountdown();
    }

    if (this.particle.position[0] < sides[0] ||
        this.particle.position[0] > sides[1]) {
        this.app.score.decrease();

    }

    this.handleSirenCollisions();

    vec3.set(this.particle.position, this.transformation.position);
};

GoodGuy.prototype.draw = function() {
    this.app.modelview.pushMatrix();
    this.transformation.apply(this.app.modelview.matrix);
    this.app.renderer.setUniform('uModelviewMatrix', this.app.modelview.matrix);
    this.app.renderer.render(this.mesh);
    this.app.modelview.popMatrix();
};

GoodGuy.prototype.handleSirenCollisions = function() {
    var sirens = this.app.sirens;
    var numberOfSirens = sirens.length;
    var position = this.particle.position;
    for (var i = 0; i < numberOfSirens; i++) {
        var siren = sirens[i];
        if (!siren.connected) {
            var diff = vec3.create();
            vec3.subtract(position, siren.particle.position, diff);
            var distance = vec3.length(diff);
            if (distance < this.radius + siren.radius) {
                this.attach(siren);
                this.app.multiplier += 1;
            }
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

        position[0] += velocity[0] + force[0] * 2.5;
        position[1] += velocity[1] + force[1] * 2.5;
        position[2] += velocity[2] + force[2] * 2.5;

        velocity[0] += force[0];
        velocity[1] += force[1];
        velocity[2] += force[2];

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

    this.velocity = 3;

    this.zeroIndex = 0; // Index of the top of the screen
    this.sideIndex = 0;

    this.simplex = new SimplexNoise();

    this.left = new Array(this.height);
    this.right = new Array(this.height);

    this.leftColors = new Array(this.height);
    this.rightColors = new Array(this.height);

    this.numberOfLeftColors = 0;
    this.numberOfRightColors = 0;

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

    for (var i=0; i<this.height; i++) {
        this.left[i] = this.calculateSide(this.sideIndex, this.leftDetails);
        this.right[i] = this.calculateSide(this.sideIndex, this.rightDetails);
        this.sideIndex += 1;
        this.leftColors[i] = null;
        this.rightColors[i] = null;
    }

    this.leftMesh = new Mesh(this.height, gl.LINE_STRIP, gl.STREAM_DRAW,
                             gl.STATIC_DRAW);

    this.rightMesh = new Mesh(this.height, gl.LINE_STRIP, gl.STREAM_DRAW,
                              gl.STATIC_DRAW);

    this.leftColorMesh = new Mesh(this.height * 2, gl.LINES, gl.STREAM_DRAW,
                                  gl.STREAM_DRAW);
    this.rightColorMesh = new Mesh(this.height * 2, gl.LINES, gl.STREAM_DRAW,
                                  gl.STREAM_DRAW);
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
    for (var i=0; i<this.velocity; i++) {
        left[this.zeroIndex] = this.calculateSide(this.sideIndex, this.leftDetails);
        right[this.zeroIndex] = this.calculateSide(this.sideIndex, this.rightDetails);
        leftColors[this.zeroIndex] = null;
        rightColors[this.zeroIndex] = null;
        this.sideIndex += 1;

        this.zeroIndex += 1;
        if (this.zeroIndex >= this.height) {
            this.zeroIndex -= this.height;
        }
    }
};

Level.prototype.updateModels = function() {
    var width = this.width;
    var height = this.height;

    var left = this.left;
    var right = this.right;
    var leftColors = this.leftColors;
    var rightColors = this.rightColors;

    var leftVertexBuffer = this.leftMesh.vertexBuffer.array;
    var leftColorBuffer = this.leftMesh.colorBuffer.array;
    var rightVertexBuffer = this.rightMesh.vertexBuffer.array;
    var rightColorBuffer = this.rightMesh.colorBuffer.array;

    var leftColorVertexBuffer = this.leftColorMesh.vertexBuffer.array;
    var leftColorColorBuffer = this.leftColorMesh.colorBuffer.array;
    var rightColorVertexBuffer = this.rightColorMesh.vertexBuffer.array;
    var rightColorColorBuffer = this.rightColorMesh.colorBuffer.array;

    var leftCount = 0;
    var rightCount = 0;

    var zeroIndex = this.zeroIndex;

    for (var i = 0; i < height; i++) {
        var readIndex = (zeroIndex + i) % height;

        var leftVertex = left[readIndex];
        var rightVertex = right[readIndex];

        leftVertexBuffer[i * 3 + 0] = leftVertex;
        leftVertexBuffer[i * 3 + 1] = i - height / 2;
        leftVertexBuffer[i * 3 + 2] = 0;

        rightVertexBuffer[i * 3 + 0] = rightVertex;
        rightVertexBuffer[i * 3 + 1] = i - height / 2;
        rightVertexBuffer[i * 3 + 2] = 0;

        leftColorBuffer[i * 4 + 0] = 1;
        leftColorBuffer[i * 4 + 1] = 1;
        leftColorBuffer[i * 4 + 2] = 1;
        leftColorBuffer[i * 4 + 3] = 1;

        rightColorBuffer[i * 4 + 0] = 1;
        rightColorBuffer[i * 4 + 1] = 1;
        rightColorBuffer[i * 4 + 2] = 1;
        rightColorBuffer[i * 4 + 3] = 1;

        var leftColor = leftColors[readIndex];
        var rightColor = rightColors[readIndex];

        if (leftColor != null) {
            leftColorVertexBuffer[leftCount * 6 + 0] = -width / 2;
            leftColorVertexBuffer[leftCount * 6 + 1] =  i - height / 2;
            leftColorVertexBuffer[leftCount * 6 + 2] = 0;
            leftColorVertexBuffer[leftCount * 6 + 3] = leftVertex - 1;
            leftColorVertexBuffer[leftCount * 6 + 4] = i - height / 2;
            leftColorVertexBuffer[leftCount * 6 + 5] = 0;

            leftColorColorBuffer[leftCount * 8 + 0] = leftColor[0];
            leftColorColorBuffer[leftCount * 8 + 1] = leftColor[1];
            leftColorColorBuffer[leftCount * 8 + 2] = leftColor[2];
            leftColorColorBuffer[leftCount * 8 + 3] = leftColor[3];
            leftColorColorBuffer[leftCount * 8 + 4] = leftColor[0];
            leftColorColorBuffer[leftCount * 8 + 5] = leftColor[1];
            leftColorColorBuffer[leftCount * 8 + 6] = leftColor[2];
            leftColorColorBuffer[leftCount * 8 + 7] = leftColor[3];

            leftCount += 1;
        }
        if (rightColor != null) {
            rightColorVertexBuffer[rightCount * 6 + 0] = rightVertex + 1;
            rightColorVertexBuffer[rightCount * 6 + 1] = i - height / 2;
            rightColorVertexBuffer[rightCount * 6 + 2] = 0;
            rightColorVertexBuffer[rightCount * 6 + 3] = width / 2;
            rightColorVertexBuffer[rightCount * 6 + 4] = i - height / 2;
            rightColorVertexBuffer[rightCount * 6 + 5] = 0;
                
            rightColorColorBuffer[rightCount * 8 + 0] = rightColor[0];
            rightColorColorBuffer[rightCount * 8 + 1] = rightColor[1];
            rightColorColorBuffer[rightCount * 8 + 2] = rightColor[2];
            rightColorColorBuffer[rightCount * 8 + 3] = rightColor[3];
            rightColorColorBuffer[rightCount * 8 + 4] = rightColor[0];
            rightColorColorBuffer[rightCount * 8 + 5] = rightColor[1];
            rightColorColorBuffer[rightCount * 8 + 6] = rightColor[2];
            rightColorColorBuffer[rightCount * 8 + 7] = rightColor[3];

            rightCount += 1;
        }
    }

    this.leftMesh.vertexBuffer.setValues();
    this.leftMesh.colorBuffer.setValues();
    this.rightMesh.vertexBuffer.setValues();
    this.rightMesh.colorBuffer.setValues();
    this.leftColorMesh.vertexBuffer.setValues();
    this.leftColorMesh.colorBuffer.setValues();
    this.rightColorMesh.vertexBuffer.setValues();
    this.rightColorMesh.colorBuffer.setValues();

    this.numberOfLeftColors = leftCount;
    this.numberOfRightColors = rightCount;
};

Level.prototype.draw = function() {
    this.app.renderer.render(this.leftMesh);
    this.app.renderer.render(this.rightMesh);
    this.app.renderer.render(this.leftColorMesh, 0, this.numberOfLeftColors * 2);
    this.app.renderer.render(this.rightColorMesh, 0, this.numberOfRightColors * 2);
}

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
    var distanceFromTop = yPos + this.height / 2;
    var index = Math.floor(this.zeroIndex + distanceFromTop) % this.height;
    var left = this.left[index];
    var right = this.right[index];
    return [left, right];
};

Level.prototype.yPosToIndex = function(yPos) {
    var distanceFromTop = yPos + this.height / 2;
    var index = Math.floor(this.zeroIndex + distanceFromTop) % this.height;
    return index;
};
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
        this.delay = new FeedbackDelay(this.audiolet, 0.9, 0.2);
        this.reverb = new Reverb(this.audiolet, 0.9, 1, 0.5);
        this.crusher = new BitCrusher(this.audiolet, 8);
        this.delay.connect(this.reverb);
        this.reverb.connect(this.crusher);
        this.crusher.connect(this.audiolet.output);

        this.particleSystem = new RecyclingParticleSystem(30);

        this.cloud = new Cloud(this);

        this.level = new Level(this);

        this.goodGuy = new GoodGuy(this);

        this.sirens = [];

        this.score = new Score(this);

        this.ui = new UI(this);

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
        /*
        if (!this.sirens.length) {
            this.sirens.push(new Siren(this));
        }
        */
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
var Particle = function() {
    this.mass = 1;
    this.position = vec3.create();
    this.velocity = vec3.create();
    this.force = vec3.create();
    this.age = 0;
};

Particle.prototype.toString = function() {
    return 'position: ' + this.position +
           '\n velocity: ' + this.velocity +
           '\n force: ' + this.force +
           '\n age: ' + this.age;
};

Particle.prototype.reset = function() {
    this.mass = 1;
    vec3.set([0, 0, 0], this.position);
    vec3.set([0, 0, 0], this.velocity);
    vec3.set([0, 0, 0], this.force);
    this.age = 0;
};
var ParticleSystem = function() {
    this.integrator = new Integrator(this);
    this.particles = [];
    this.forces = [];
};

ParticleSystem.prototype.createParticle = function() {
    var particle = new Particle();
    this.particles.push(particle);
    return particle;
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
        vec3.set([0, 0, 0], particles[i].force);
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

var RecyclingParticleSystem = function(numberOfParticles) {
    ParticleSystem.call(this);
    this.oldParticles = [];
    for (var i=0; i<numberOfParticles; i++) {
        this.oldParticles.push(new Particle());
    }
};
extend(RecyclingParticleSystem, ParticleSystem);

RecyclingParticleSystem.prototype.createParticle = function() {
    if (!this.oldParticles.length) {
        var numberOfParticles = this.particles.length;
        for (var i=0; i<numberOfParticles * 3; i++) {
            this.oldParticles.push(new Particle());
        }
    }
    var particle = this.oldParticles.pop();
    this.particles.push(particle);
    return particle;
};

RecyclingParticleSystem.prototype.recycleParticle = function(particle) {
    var particle = this.removeParticle(particle);
    particle.reset();
    this.oldParticles.push(particle);
};

RecyclingParticleSystem.prototype.removeParticle = function(particle) {
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

RecyclingParticleSystem.prototype.removeForce = function(force) {
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

    var yPos = app.height / 2 - 1;
    var sides = this.app.level.getSides(yPos);
    var xPos = sides[0] + this.radius * 2;
    xPos += (sides[1] - sides[0] - this.radius * 2) * Math.random();
    this.particle = this.app.particleSystem.createParticle();
    this.particle.position[0] = xPos;
    this.particle.position[1] = yPos;
    this.particle.velocity[1] = -3;

    this.attraction = new AttractionToGoodGuy(this.app.goodGuy.particle,
                                              this.particle, 800, 20, 40);
    this.app.particleSystem.forces.push(this.attraction);


    var numberOfPoints = 40;
    var numberOfSpirals = 2;
    var spacing = 3;

    this.mesh = new Mesh(numberOfPoints, gl.LINE_STRIP, gl.STATIC_DRAW,
                         gl.STATIC_DRAW);
    var vertexBuffer = this.mesh.vertexBuffer.array;
    var colorBuffer = this.mesh.colorBuffer.array;

    for (var i = 0; i < numberOfPoints; i++) {
        var theta = numberOfSpirals * i * 2 * Math.PI / numberOfPoints;
        vertexBuffer[i * 3 + 0] = 5 * theta * Math.sin(theta) / (2 * Math.PI);
        vertexBuffer[i * 3 + 1] = 5 * theta * Math.cos(theta) / (2 * Math.PI);
        vertexBuffer[i * 3 + 2] = 0;

        colorBuffer[i * 4 + 0] = 1;
        colorBuffer[i * 4 + 1] = 1;
        colorBuffer[i * 4 + 2] = 1;
        colorBuffer[i * 4 + 3] = 1;
    }
    this.mesh.vertexBuffer.setValues();
    this.mesh.colorBuffer.setValues();
    this.transformation = new Transformation();
};

Siren.prototype.update = function() {
/*    this.model.rotation.z -= 0.3;
    this.model.update(); */

    var position = this.particle.position;
    var sides = this.app.level.getSides(position[1]);
    if (position[1] < -this.app.height / 2 ||
        position[0] < sides[0] ||
        position[0] > sides[1]) {
        this.remove();
    }
    else {
        vec3.set(this.particle.position, this.transformation.position);
        if (this.connected) {
            this.createParticles();
        }
    }
};

Siren.prototype.draw = function() {
    this.app.modelview.pushMatrix();
    this.transformation.apply(this.app.modelview.matrix);
    this.app.renderer.setUniform('uModelviewMatrix', this.app.modelview.matrix);
    this.app.renderer.render(this.mesh);
    this.app.modelview.popMatrix();
};

Siren.prototype.remove = function() {
    this.app.particleSystem.recycleParticle(this.particle);

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
//    this.frequency = 0.05;
    this.frequency = -0.5 + Math.random() * 0.5;
//    this.numberOfOutputs = 10;
    this.numberOfOutputs = Math.floor(2 + Math.random() * 9);
};
extend(SpiralSiren, Siren);

SpiralSiren.prototype.createParticles = function() {
    for (var i = 0; i < this.numberOfOutputs; i++) {
        var angle = this.phase + i * 2 * Math.PI / this.numberOfOutputs;
        var particle = this.app.cloud.particleSystem.createParticle();
        vec3.set(this.particle.position, particle.position);
        particle.velocity[0] = Math.sin(angle);
        particle.velocity[1] = this.particle.velocity[1] + Math.cos(angle);
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

Spring.prototype.apply = function() {
    var a = this.a;
    var b = this.b;
    var restLength = this.restLength;
    var springConstant = this.springConstant;
    var damping = this.damping;

    var a2b = vec3.create();
    vec3.subtract(a.position, b.position, a2b);
    var a2bDistance = vec3.length(a2b);

    if (a2bDistance == 0) {
        vec3.set([0, 0, 0], a2b);
    } else {
        vec3.scale(a2b, 1 / a2bDistance);
    }

    var springForce = -(a2bDistance - restLength) * springConstant;
    var vA2b = vec3.create();
    vec3.subtract(a.velocity, b.velocity, vA2b);
    var dampingForce = -damping * vec3.dot(a2b, vA2b);
    var r = springForce + dampingForce;

    vec3.scale(a2b, r);

    vec3.add(a.force, a2b);
    // Can negate without a new vec3 as we don't use a2b again
    vec3.add(b.force, vec3.negate(a2b));
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

SpringToGoodGuy.prototype.apply = function() {
    var a = this.a;
    var b = this.b;
    var restLength = this.restLength;
    var springConstant = this.springConstant;
    var damping = this.damping;

    var a2b = vec3.create();
    vec3.subtract(a.position, b.position, a2b);
    var a2bDistance = vec3.length(a2b);

    if (a2bDistance == 0) {
        vec3.set([0, 0, 0], a2b);
    } else {
        vec3.scale(a2b, 1 / a2bDistance);
    }

    var springForce = -(a2bDistance - restLength) * springConstant;
    var vA2b = vec3.create();
    vec3.subtract(a.velocity, b.velocity, vA2b);
    var dampingForce = -damping * vec3.dot(a2b, vA2b);
    var r = springForce + dampingForce;

    vec3.scale(a2b, r);

    vec3.add(b.force, vec3.negate(a2b));
};
var UI = function(app) {
    this.app = app;

    this.canvas =  document.getElementById("scores");
    this.context = this.canvas.getContext("2d");

    this.haveShownHighScore = false;

    this.countdown = 3;
    this.flashCount = 0;
    this.flashInterval = null;
    this.highScoreOn = false;

    this.draw();
};

UI.prototype.draw = function() {
//    this.canvas.width = this.canvas.width;
    this.context.clearRect(0, 0, this.canvas.width, 36);
    this.context.font = '36px \'Orbitron\', sans-serif';
    this.context.textBaseline = "top";
    this.context.textAlign = 'left';
    this.context.fillStyle = '#00FF00';
    this.context.fillText(this.app.score.score.toString(), 0, 0);

    this.context.clearRect(this.canvas.width / 2 - 36,
                           this.canvas.height / 2 - 36,
                           this.canvas.width / 2 + 36,
                           this.canvas.height / 2 + 36);
    if (this.highScoreOn) {
        this.context.textAlign ='center';
        this.context.fillStyle = '#FFFFFF';
        this.context.fillText("High Score", this.canvas.width / 2, 0);
    }

    this.context.textAlign = 'right';
    this.context.fillStyle = '#FF0000';
    this.context.fillText(this.app.score.highScore.toString(),
                          this.canvas.width, 0);

    if (this.countdown) {
        this.context.textBaseline = "middle";
        this.context.textAlign = 'center';
        this.context.font = '72px \'Orbitron\', sans-serif';
        this.context.fillStyle = '#FFFFFF';
        this.context.fillText(this.countdown.toString(),
                              this.canvas.width / 2,
                              36 + this.canvas.height / 2);
    }
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
};

UI.prototype.flashHighScore = function() {
    if (this.flashInterval) {
        return;
    }
    this.flashCount = 0;

    this.flashInterval = setInterval(this.doFlashHighScore.bind(this), 500);
};

UI.prototype.doFlashHighScore = function() {
    this.flashCount += 1;
    this.highScoreOn = !this.highScoreOn;

    if (this.flashCount == 10) {
        clearInterval(this.flashInterval);
        this.flashInterval = null;
    }
};

UI.prototype.startCountdown = function() {
    this.countdown = 3;
    this.app.shouldUpdate = false;
    this.countdownInterval = setInterval(this.doCountdown.bind(this), 1000);
};

UI.prototype.doCountdown = function() {
    this.countdown -= 1;
    if (this.countdown == 0) {
        clearInterval(this.countdownInterval);
        this.app.shouldUpdate = true;
    }
};
