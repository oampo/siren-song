Math.mod = function(a, b) {
    return ((a % b) + b) % b;
};


var Level = function(app) {
    this.app = app;
    this.width = this.app.width;
    this.height = this.app.height;

    this.particle = this.app.particleSystem.makeParticle();
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

    for (var i=0; i<this.height; i++) {
        this.left[i] = this.calculateSide(i, this.leftDetails);
        this.right[i] = this.calculateSide(i, this.rightDetails);
        this.leftColors[i] = null;
        this.rightColors[i] = null;
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

    this.leftColorModel = new PhiloGL.O3D.Model({
        id: "Left colors",
        dynamic: true,
        drawType: 'LINES'
    });
    this.leftColorModel.dynamic = true;
    this.app.scene.add(this.leftColorModel);

    this.rightColorModel= new PhiloGL.O3D.Model({
        id: "Right colors",
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

    for (var i=0; i<height; i++) {
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
