Math.mod = function(a, b) {
    return ((a % b) + b) % b;
};


var Level = function(app) {
    this.app = app;
    this.width = this.app.width;
    this.height = this.app.height;

    this.particle = this.app.particleSystem.makeParticle();
    this.particle.velocity.set(0, -3, 0);
    this.lastYPos = 0;

    this.simplex = new SimplexNoise();

    this.left = new Array(this.height);
    this.right = new Array(this.height);

    this.leftDetails = {
        xOffset: -0.25 * this.width,
        slowOffset: 0,
        slowDeviation: 0.4 * this.width,
        slowStep: 0.003,
        fastOffset: this.height,
        fastDeviation: 0.05 * this.width,
        fastStep: 0.01
    };

    this.rightDetails = {
        xOffset: 0.25 * this.width,
        slowOffset: 0,
        slowDeviation: 0.4 * this.width,
        slowStep: 0.003,
        fastOffset: 2 * this.height,
        fastDeviation: 0.05 * this.width,
        fastStep: 0.01
    };

    for (var i=0; i<this.height; i++) {
        this.left[i] = this.calculateSide(i, this.leftDetails);
        this.right[i] = this.calculateSide(i, this.rightDetails);
    }

    this.leftModel = new PhiloGL.O3D.Model({
        id: "Left side",
        dynamic: true,
        drawType: "LINE_STRIP"
    });
    this.leftModel.dynamic = true;
    this.app.scene.add(this.leftModel);

    this.rightModel = new PhiloGL.O3D.Model({
        id: "Right side",
        dynamic: true,
        drawType: 'LINE_STRIP'
    });
    this.rightModel.dynamic = true;
    this.app.scene.add(this.rightModel);
};

Level.prototype.update = function() {
    var yPos = this.particle.position.y;

    var height = this.height;
    var left = this.left;
    var right = this.right;
    // Loop through pixels which have fallen off screen and calculate new
    // values for them
    var loopYPos = this.lastYPos;
    while (loopYPos > yPos) {
        var writePosition = Math.mod(loopYPos, height);
        writePosition = Math.floor(writePosition);
        left[writePosition] = this.calculateSide(loopYPos,
                                                 this.leftDetails);
        right[writePosition] = this.calculateSide(loopYPos,
                                                  this.rightDetails);
        loopYPos -= 1;
    }
   
    var leftVertices = [];
    var leftColors = [];
    var rightVertices = [];
    var rightColors = [];
    for (var i=0; i<height; i++) {
        // Create model
        var readIndex = (writePosition + i) % height;
        leftVertices.push(left[readIndex], height / 2 - i, 0);
        rightVertices.push(right[readIndex], height / 2 - i, 0);
        leftColors.push(1, 1, 1, 1);
        rightColors.push(1, 1, 1, 1);
    }
    this.leftModel.vertices = leftVertices;
    this.rightModel.vertices = rightVertices;
    this.leftModel.colors = leftColors;
    this.rightModel.colors = rightColors;

    this.lastYPos = yPos;
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
    var height = this.height;
    var zeroPos = Math.mod(this.lastYPos, height);
    zeroPos = Math.floor(zeroPos);

    yPos = zeroPos + height / 2 - yPos;
    yPos = Math.mod(yPos, height);
    yPos = Math.floor(yPos);
    var left = this.left[yPos];
    var right = this.right[yPos];
    return [left, right];
};

