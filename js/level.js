var Noise = require('noisejs').Noise;
var Deque = require('double-ended-queue');

var webglet = require('webglet');

var settings = require('./settings');

Math.mod = function(a, b) {
    return ((a % b) + b) % b;
};

var Level = function(app) {
    this.app = app;

    this.simplex = new Noise(Math.random());

    this.resolution = 2048;
    this.top = -this.app.maxHeight() / 2;
    this.offset = 0;

    this.left = new Deque(this.resolution);
    this.right = new Deque(this.resolution);

    /*
    this.leftColors = new Array(this.height);
    this.rightColors = new Array(this.height);

    this.numberOfLeftColors = 0;
    this.numberOfRightColors = 0;
    */

    this.initialOffset = 0.27;
    this.offsetPerPoint = 1 / 400000;
    this.minOffset = 0.1;

    this.initialSlowDeviation = 0.23;
    this.deviationPerPoint = 1 / 600000;
    this.maxSlowDeviation = 0.7;

    this.leftDetails = {
        xOffset: -this.initialOffset,
        slowOffset: 0,
        slowDeviation: this.initialSlowDeviation,
        slowStep: 1.2,
        fastOffset: this.app.maxHeight(),
        fastDeviation: 0.05,
        fastStep: 4
    };

    this.rightDetails = {
        xOffset: this.initialOffset,
        slowOffset: 0,
        slowDeviation: this.initialSlowDeviation,
        slowStep: 1.2,
        fastOffset: this.app.maxHeight() * 2,
        fastDeviation: 0.05,
        fastStep: 4
    };

    for (var i = 0; i < this.resolution; i++) {
        var yPos = i * this.app.maxHeight() / this.resolution;
        this.left.push(this.calculateSide(yPos, this.leftDetails));
        this.right.push(this.calculateSide(yPos, this.rightDetails));
        /*
        this.leftColors[i] = null;
        this.rightColors[i] = null;
        */
    }

    this.leftMesh = new webglet.Mesh(this.app.maxHeightPx(), gl.LINE_STRIP,
                                     gl.STREAM_DRAW, gl.STATIC_DRAW);
    this.rightMesh = new webglet.Mesh(this.app.maxHeightPx(), gl.LINE_STRIP,
                                      gl.STREAM_DRAW, gl.STATIC_DRAW);

    /*
    this.leftColorMesh = new webglet.Mesh(this.height * 2, gl.LINES, gl.STREAM_DRAW,
                                  gl.STREAM_DRAW);
    this.rightColorMesh = new webglet.Mesh(this.height * 2, gl.LINES, gl.STREAM_DRAW,
                                  gl.STREAM_DRAW);
    */
    this.updateModels();
};

Level.prototype.update = function(dt) {
    this.updateDetails();
    this.addToBottom(dt);
    this.updateModels();
};

Level.prototype.updateDetails = function() {
    var score = this.app.score.score;
    var offset = this.initialOffset;
    offset -= score * this.offsetPerPoint;
    if (offset < this.minOffset) {
        offset = this.minOffset;
    }
    this.leftDetails.xOffset = -offset;
    this.rightDetails.xOffset = offset;

    var deviation = this.initialSlowDeviation;
    deviation += score * this.deviationPerPoint;
    if (deviation > this.maxSlowDeviation) {
        deviation = this.maxSlowDeviation;
    }
    this.leftDetails.slowDeviation = deviation;
    this.rightDetails.slowDeviation = deviation;
};


Level.prototype.addToBottom = function(dt) {
    this.offset += settings.velocity * dt;
    this.top -= settings.velocity * dt;
    while (this.top < this.app.maxHeight() / 2) {
        this.left.shift();
        this.right.shift();
        this.left.push(this.calculateSide(this.offset + this.top + this.app.maxHeight(),
                                          this.leftDetails));
        this.right.push(this.calculateSide(this.offset + this.top + this.app.maxHeight(),
                                           this.rightDetails));
        this.top += this.app.maxHeight() / this.resolution;
    }
};

Level.prototype.updateModels = function() {
    var left = this.left;
    var right = this.right;
    /*
    var leftColors = this.leftColors;
    var rightColors = this.rightColors;
    */

    var leftVertexBuffer = this.leftMesh.vertexBuffer.array;
    var leftColorBuffer = this.leftMesh.colorBuffer.array;
    var rightVertexBuffer = this.rightMesh.vertexBuffer.array;
    var rightColorBuffer = this.rightMesh.colorBuffer.array;

    /*
    var leftColorVertexBuffer = this.leftColorMesh.vertexBuffer.array;
    var leftColorColorBuffer = this.leftColorMesh.colorBuffer.array;
    var rightColorVertexBuffer = this.rightColorMesh.vertexBuffer.array;
    var rightColorColorBuffer = this.rightColorMesh.colorBuffer.array;
    */

    var leftCount = 0;
    var rightCount = 0;

    var heightPx = this.app.heightPx();

    var top = -this.app.height() / 2;
    for (var i = 0; i < heightPx; i++) {
        var yPos = top + this.app.pxToLength(i);
        var sides = this.getSides(yPos);

        leftVertexBuffer[i * 3 + 0] = sides[0];
        leftVertexBuffer[i * 3 + 1] = yPos;
        leftVertexBuffer[i * 3 + 2] = 0;

        rightVertexBuffer[i * 3 + 0] = sides[1];
        rightVertexBuffer[i * 3 + 1] = yPos;
        rightVertexBuffer[i * 3 + 2] = 0;

        leftColorBuffer[i * 4 + 0] = 1;
        leftColorBuffer[i * 4 + 1] = 1;
        leftColorBuffer[i * 4 + 2] = 1;
        leftColorBuffer[i * 4 + 3] = 1;

        rightColorBuffer[i * 4 + 0] = 1;
        rightColorBuffer[i * 4 + 1] = 1;
        rightColorBuffer[i * 4 + 2] = 1;
        rightColorBuffer[i * 4 + 3] = 1;

        /*
        var leftColor = leftColors[readIndex];
        var rightColor = rightColors[readIndex];

        if (leftColor != null) {
            leftColorVertexBuffer[leftCount * 6 + 0] = -width / 2;
            leftColorVertexBuffer[leftCount * 6 + 1] = i - height / 2;
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
        */
    }

    this.leftMesh.vertexBuffer.setValues(null, 0, heightPx * 3);
    this.leftMesh.colorBuffer.setValues(null, 0, heightPx * 4);
    this.rightMesh.vertexBuffer.setValues(null, 0, heightPx * 3);
    this.rightMesh.colorBuffer.setValues(null, 0, heightPx * 4);
    /*
    this.leftColorMesh.vertexBuffer.setValues();
    this.leftColorMesh.colorBuffer.setValues();
    this.rightColorMesh.vertexBuffer.setValues();
    this.rightColorMesh.colorBuffer.setValues();

    this.numberOfLeftColors = leftCount;
    this.numberOfRightColors = rightCount;
    */
};

Level.prototype.draw = function() {
    this.app.renderer.render(this.leftMesh, 0, this.app.heightPx());
    this.app.renderer.render(this.rightMesh, 0, this.app.heightPx());
    /*
    this.app.renderer.render(this.leftColorMesh, 0,
                             this.numberOfLeftColors * 2);
    this.app.renderer.render(this.rightColorMesh, 0,
                             this.numberOfRightColors * 2);
    */
};

Level.prototype.calculateSide = function(yPos, details) {
    var x = 0;
    x += details.xOffset;

    var slowPos = details.slowOffset;
    slowPos += yPos * details.slowStep;
    x += details.slowDeviation * this.simplex.simplex2(0, slowPos);

    var fastPos = details.fastOffset;
    fastPos += yPos * details.fastStep;
    x += details.fastDeviation * this.simplex.simplex2(0, fastPos);
    return x;
};

Level.prototype.getSides = function(yPos) {
    var yPosAsPercentageOfMaxHeight = yPos / this.app.maxHeight() + 0.5;
    var yIndex = yPosAsPercentageOfMaxHeight * this.resolution;

    var yIndexFract = yIndex % 1;
    yIndex = yIndex - yIndexFract;

    var leftA = this.left.get(yIndex);
    var leftB = this.left.get(yIndex + 1) || leftA;
    var left = yIndexFract * leftB + (1 - yIndexFract) * leftA;

    var rightA = this.right.get(yIndex);
    var rightB = this.right.get(yIndex + 1) || rightA;
    var right = yIndexFract * rightB + (1 - yIndexFract) * rightA;
    return [left, right];
};

module.exports = Level;
