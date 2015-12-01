var Noise = require('noisejs').Noise;
var Deque = require('double-ended-queue');
var vec2 = require('gl-matrix').vec2;

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

    this.leftColors = new Array(this.resolution);
    this.rightColors = new Array(this.resolution);

    this.numberOfLeftColors = 0;
    this.numberOfRightColors = 0;

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
        var yPos = i * this.app.maxHeight() / this.resolution - this.app.maxHeight() / 2;
        this.left.push(this.calculateSide(yPos, this.leftDetails));
        this.right.push(this.calculateSide(yPos, this.rightDetails));
        this.leftColors[i] = null;
        this.rightColors[i] = null;
    }

    this.leftMesh = new webglet.Mesh(this.app.maxHeightPx(), gl.LINE_STRIP,
                                     gl.STREAM_DRAW, gl.STATIC_DRAW);
    this.rightMesh = new webglet.Mesh(this.app.maxHeightPx(), gl.LINE_STRIP,
                                      gl.STREAM_DRAW, gl.STATIC_DRAW);

    this.leftColorMesh = new webglet.Mesh(this.app.maxHeightPx() * 2, gl.LINES,                                           gl.STREAM_DRAW, gl.STREAM_DRAW);
    this.rightColorMesh = new webglet.Mesh(this.app.maxHeightPx() * 2,
                                           gl.LINES, gl.STREAM_DRAW,
                                           gl.STREAM_DRAW);
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
    while (this.top < -this.app.maxHeight() / 2) {
        this.left.shift();
        this.right.shift();
        this.left.push(this.calculateSide(this.offset + this.top + this.app.maxHeight(),
                                          this.leftDetails));
        this.right.push(this.calculateSide(this.offset + this.top + this.app.maxHeight(),
                                           this.rightDetails));
        this.leftColors.shift();
        this.rightColors.shift();
        this.leftColors.push(null);
        this.rightColors.push(null);
        this.top += this.app.maxHeight() / this.resolution;
    }
};

Level.prototype.updateModels = function() {
    var left = this.left;
    var right = this.right;

    var leftColors = this.leftColors;
    var rightColors = this.rightColors;

    var leftVertexBuffer = this.leftMesh.vertexBuffer.array;
    var leftColorBuffer = this.leftMesh.colorBuffer.array;
    var rightVertexBuffer = this.rightMesh.vertexBuffer.array;
    var rightColorBuffer = this.rightMesh.colorBuffer.array;

    var leftBarVertexBuffer = this.leftColorMesh.vertexBuffer.array;
    var leftBarColorBuffer = this.leftColorMesh.colorBuffer.array;
    var rightBarVertexBuffer = this.rightColorMesh.vertexBuffer.array;
    var rightBarColorBuffer = this.rightColorMesh.colorBuffer.array;

    var leftVertexCount = 0;
    var leftColorCount = 0;
    var rightVertexCount = 0;
    var rightColorCount = 0;

    var leftBarVertexCount = 0;
    var leftBarColorCount = 0;
    var rightBarVertexCount = 0;
    var rightBarColorCount = 0;

    var width = this.app.width();
    var halfWidth = width / 2;
    var heightPx = this.app.heightPx();
    var top = -this.app.height() / 2;

    var pool = this.app.vec2Pool;
    var sides = pool.create();
    var colors = Array(2);
    for (var i = 0; i < heightPx; i++) {
        var yPos = top + this.app.pxToLength(i);
        this.getSides(yPos, sides);

        leftVertexBuffer[leftVertexCount++] = sides[0];
        leftVertexBuffer[leftVertexCount++] = yPos;
        leftVertexBuffer[leftVertexCount++] = 0;

        rightVertexBuffer[rightVertexCount++] = sides[1];
        rightVertexBuffer[rightVertexCount++] = yPos;
        rightVertexBuffer[rightVertexCount++] = 0;

        leftColorBuffer[leftColorCount++] = 1;
        leftColorBuffer[leftColorCount++] = 1;
        leftColorBuffer[leftColorCount++] = 1;
        leftColorBuffer[leftColorCount++] = 1;

        rightColorBuffer[rightColorCount++] = 1;
        rightColorBuffer[rightColorCount++] = 1;
        rightColorBuffer[rightColorCount++] = 1;
        rightColorBuffer[rightColorCount++] = 1;


        this.getColors(yPos, colors);
        var leftColor = colors[0];
        var rightColor = colors[1];

        if (leftColor != null) {
            leftBarVertexBuffer[leftBarVertexCount++] = -halfWidth;
            leftBarVertexBuffer[leftBarVertexCount++] = yPos;
            leftBarVertexBuffer[leftBarVertexCount++] = 0;
            leftBarVertexBuffer[leftBarVertexCount++] = sides[0];
            leftBarVertexBuffer[leftBarVertexCount++] = yPos;
            leftBarVertexBuffer[leftBarVertexCount++] = 0;

            leftBarColorBuffer[leftBarColorCount++] = leftColor[0];
            leftBarColorBuffer[leftBarColorCount++] = leftColor[1];
            leftBarColorBuffer[leftBarColorCount++] = leftColor[2];
            leftBarColorBuffer[leftBarColorCount++] = leftColor[3];
            leftBarColorBuffer[leftBarColorCount++] = leftColor[0];
            leftBarColorBuffer[leftBarColorCount++] = leftColor[1];
            leftBarColorBuffer[leftBarColorCount++] = leftColor[2];
            leftBarColorBuffer[leftBarColorCount++ * 8 + 7] = leftColor[3];
        }
        if (rightColor != null) {
            rightBarVertexBuffer[rightBarVertexCount++] = sides[1];
            rightBarVertexBuffer[rightBarVertexCount++] = yPos;
            rightBarVertexBuffer[rightBarVertexCount++] = 0;
            rightBarVertexBuffer[rightBarVertexCount++] = halfWidth;
            rightBarVertexBuffer[rightBarVertexCount++] = yPos;
            rightBarVertexBuffer[rightBarVertexCount++] = 0;

            rightBarColorBuffer[rightBarColorCount++] = rightColor[0];
            rightBarColorBuffer[rightBarColorCount++] = rightColor[1];
            rightBarColorBuffer[rightBarColorCount++] = rightColor[2];
            rightBarColorBuffer[rightBarColorCount++] = rightColor[3];
            rightBarColorBuffer[rightBarColorCount++] = rightColor[0];
            rightBarColorBuffer[rightBarColorCount++] = rightColor[1];
            rightBarColorBuffer[rightBarColorCount++] = rightColor[2];
            rightBarColorBuffer[rightBarColorCount++] = rightColor[3];
        }
    }
    pool.recycle(sides);

    this.leftMesh.vertexBuffer.setValues(null, 0, leftVertexCount);
    this.leftMesh.colorBuffer.setValues(null, 0, leftColorCount);
    this.rightMesh.vertexBuffer.setValues(null, 0, rightVertexCount);
    this.rightMesh.colorBuffer.setValues(null, 0, rightColorCount);

    this.leftColorMesh.vertexBuffer.setValues(null, 0, leftBarVertexCount);
    this.leftColorMesh.colorBuffer.setValues(null, 0, leftBarColorCount);
    this.rightColorMesh.vertexBuffer.setValues(null, 0, rightBarVertexCount);
    this.rightColorMesh.colorBuffer.setValues(null, 0, rightBarColorCount);

    this.numberOfLeftColors = leftBarVertexCount / 6;
    this.numberOfRightColors = rightBarVertexCount / 6;
};

Level.prototype.draw = function() {
    this.app.renderer.render(this.leftMesh, 0, this.app.heightPx());
    this.app.renderer.render(this.rightMesh, 0, this.app.heightPx());

    this.app.renderer.render(this.leftColorMesh, 0,
                             this.numberOfLeftColors * 2);
    this.app.renderer.render(this.rightColorMesh, 0,
                             this.numberOfRightColors * 2);
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

Level.prototype.getSides = function(yPos, vec) {
    var yPosAsPercentageOfMaxHeight = yPos / this.app.maxHeight() + 0.5;
    var yIndex = yPosAsPercentageOfMaxHeight * this.resolution;

    var yIndexFract = yIndex;
    yIndex = Math.floor(yIndex);
    yIndexFract = yIndexFract - yIndex;

    var leftA = this.left.get(yIndex);
    var leftB = this.left.get(yIndex + 1) || leftA;
    var left = yIndexFract * leftB + (1 - yIndexFract) * leftA;

    var rightA = this.right.get(yIndex);
    var rightB = this.right.get(yIndex + 1) || rightA;
    var right = yIndexFract * rightB + (1 - yIndexFract) * rightA;
    vec2.set(vec, left, right);
};

Level.prototype.getColors = function(yPos, colors) {
    var yPosAsPercentageOfMaxHeight = yPos / this.app.maxHeight() + 0.5;
    var yIndex = Math.floor(yPosAsPercentageOfMaxHeight * this.resolution);
    colors[0] = this.leftColors[yIndex];
    colors[1] = this.rightColors[yIndex];
};

Level.prototype.setLeftColor = function(yPos, color) {
    var yPosAsPercentageOfMaxHeight = yPos / this.app.maxHeight() + 0.5;
    var yIndex = Math.floor(yPosAsPercentageOfMaxHeight * this.resolution);
    this.leftColors[yIndex] = color;
};

Level.prototype.setRightColor = function(yPos, color) {
    var yPosAsPercentageOfMaxHeight = yPos / this.app.maxHeight() + 0.5;
    var yIndex = Math.floor(yPosAsPercentageOfMaxHeight * this.resolution);
    this.rightColors[yIndex] = color;
};

module.exports = Level;
