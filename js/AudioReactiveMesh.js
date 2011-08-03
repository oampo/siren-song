var AudioReactiveMesh = {};

AudioReactiveMesh.initAudioReactiveMesh = function(lineWidth) {
    this.lastChannel = null;
    this.channelPosition = 0;
    this.framesPerChannel = 0;
    this.lineWidth = lineWidth || 1;

    this.initVertices();
};

AudioReactiveMesh.initVertices = function() {
    var vertexBuffer = this.mesh.vertexBuffer.array;

    var dTheta = 2 * Math.PI / this.numberOfPoints;

    for (var i=0; i < this.lineWidth; i++) {
        var radius = this.radius + i;
        for (var j = 0; j < this.numberOfPoints; j++) {
            var theta = j * dTheta;
            var index = i * this.numberOfPoints * 3 + j * 3;
            vertexBuffer[index + 0] = radius * Math.sin(theta);
            vertexBuffer[index + 1] = radius * Math.cos(theta);
            vertexBuffer[index + 2] = 0;
        }
    }
    this.mesh.vertexBuffer.setValues();
};

AudioReactiveMesh.updateVertices = function(channel, gain) {
    gain = gain || 1;
    if (channel.length < this.numberOfPoints) {
        return;
    }
    var vertexBuffer = this.mesh.vertexBuffer.array;

    if (channel == this.lastChannel) {
        if (this.channelPosition < this.framesPerChannel - 1) {
            this.channelPosition += 1;
        }
    }
    else {
        this.channelPosition = 0;
        var sampleRate = this.app.audiolet.device.sampleRate;
        var blockLength = channel.length / sampleRate;
        var frameRate = 1 / 60;
        this.framesPerChannel = Math.floor(blockLength / frameRate);
        this.framesPerChannel = Math.max(this.framesPerChannel, 1);
    }
    this.lastChannel = channel;

    var dTheta = 2 * Math.PI / this.numberOfPoints;

    var samples = Math.floor(channel.length / this.framesPerChannel);
    var iIndex = this.channelPosition * samples;
    var dIndex = Math.floor(samples / this.numberOfPoints);
    for (var i = 0; i < this.lineWidth; i++) {
        var radius = this.radius + i;
        for (var j = 0; j < this.numberOfPoints; j++) {
            var theta = j * dTheta;
            var index = iIndex + j * dIndex;
            var sample = channel[index] * gain;
            var vertexIndex = i * this.numberOfPoints * 3 + j * 3;
            vertexBuffer[vertexIndex + 0] = radius * (Math.sin(theta) + sample);
            vertexBuffer[vertexIndex + 1] = radius * (Math.cos(theta) + sample);
            vertexBuffer[vertexIndex + 2] = 0;
        }
    }

    this.mesh.vertexBuffer.setValues();
};
