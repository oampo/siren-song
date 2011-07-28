var AudioReactiveMesh = {};

AudioReactiveMesh.initAudioReactiveMesh = function() {
    this.lastChannel = null;
    this.channelPosition = 0;
    this.framesPerChannel = 0;

    this.initVertices();
};

AudioReactiveMesh.initVertices = function() {
    var vertexBuffer = this.mesh.vertexBuffer.array;

    var dTheta = 2 * Math.PI / this.numberOfPoints;

    for (var i = 0; i < this.numberOfPoints; i++) {
        var theta = i * dTheta;
        vertexBuffer[i * 3 + 0] = this.radius * Math.sin(theta);
        vertexBuffer[i * 3 + 1] = this.radius * Math.cos(theta);
        vertexBuffer[i * 3 + 2] = 0;
    }
    this.mesh.vertexBuffer.setValues();
};

AudioReactiveMesh.updateVertices = function(channel, gain) {
    gain = gain || 1;
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
    for (var i = 0; i < this.numberOfPoints; i++) {
        var theta = i * dTheta;
        var index = iIndex + i * dIndex;
        var sample = channel[index] * gain;
        vertexBuffer[i * 3 + 0] = this.radius * (Math.sin(theta) + sample);
        vertexBuffer[i * 3 + 1] = this.radius * (Math.cos(theta) + sample);
        vertexBuffer[i * 3 + 2] = 0;
    };

    this.mesh.vertexBuffer.setValues();
};
