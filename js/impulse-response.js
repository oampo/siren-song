module.exports = function(context, length, decay) {
    var buffer = context.createBuffer(2, length * context.sampleRate,
                                      context.sampleRate);
    var left = buffer.getChannelData(0);
    var right = buffer.getChannelData(1);
    for (var i=0; i<left.length; i++) {
        left[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / left.length, decay);
        right[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / left.length, decay);
    }
    return buffer;
};
