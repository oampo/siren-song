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

    for (var i = 0; i < this.height; i++) {
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
    for (var i = 0; i < this.velocity; i++) {
        left[this.zeroIndex] = this.calculateSide(this.sideIndex,
                                                  this.leftDetails);
        right[this.zeroIndex] = this.calculateSide(this.sideIndex,
                                                   this.rightDetails);
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
