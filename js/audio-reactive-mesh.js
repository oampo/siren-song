var AudioReactiveMesh = {};

AudioReactiveMesh.initAudioReactiveMesh = function() {
    this.lastChannel = null;
    this.channelPosition = 0;
    this.framesPerChannel = 0;

    this.initVertices();
};

AudioReactiveMesh.initVertices = function() {
    var vertexBuffer = this.mesh.vertexBuffer.array;

    var dTheta = 2 * Math.PI / (this.numberOfPoints - 1);

    for (var i = 0; i < this.numberOfPoints; i++) {
        var theta = i * dTheta;
        var index = i * 3;
        vertexBuffer[index + 0] = this.radius * Math.sin(theta);
        vertexBuffer[index + 1] = this.radius * Math.cos(theta);
        vertexBuffer[index + 2] = 0;
    }
    this.mesh.vertexBuffer.setValues();
};

AudioReactiveMesh.updateVertices = function(channel) {
    var vertexBuffer = this.mesh.vertexBuffer.array;

    var dTheta = 2 * Math.PI / (this.numberOfPoints - 1);

    var zeroCrossing = 0;
    var last = 0;
    while (zeroCrossing < channel.length) {
        var value = channel[zeroCrossing];
        if (channel[zeroCrossing] == 0) {
            break;
        }
        else if (channel[zeroCrossing] < 0) {
            if (last > 0) {
                break;
            }
        }
        last = value;
        zeroCrossing += 1;
    }



    for (var i = 0; i < this.numberOfPoints; i++) {
        var theta = i * dTheta;
        var index = i * 3;
//        var audioIndex = Math.floor(i * channel.length / this.numberOfPoints);
        var audioIndex = Math.floor((zeroCrossing + i) * channel.length / this.numberOfPoints) % channel.length;
        var sample = channel[audioIndex] * 0.1;
        vertexBuffer[index + 0] = this.radius * (Math.sin(theta) + sample);
        vertexBuffer[index + 1] = this.radius * (Math.cos(theta) + sample);
        vertexBuffer[index + 2] = 0;
    }

    this.mesh.vertexBuffer.setValues();
};

module.exports = AudioReactiveMesh;
