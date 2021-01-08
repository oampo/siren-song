var OctaveDistributor = function() {
    this.octaves = [];
};

OctaveDistributor.prototype.getOctave = function() {
    if (!this.octaves.length) {
        this.octaves.push(2, 3, 4, 5, 6);
    }
    var index = Math.floor(Math.random() * this.octaves.length);
    return this.octaves.splice(index, 1)[0];
};

module.exports = OctaveDistributor;
