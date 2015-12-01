var vec2 = require('gl-matrix').vec2;

var Particle = function() {
    this.mass = 1;
    this.position = vec2.create();
    this.velocity = vec2.create();
    this.force = vec2.create();
    this.age = 0;
};

Particle.prototype.toString = function() {
    return 'position: ' + this.position +
           '\n velocity: ' + this.velocity +
           '\n force: ' + this.force +
           '\n age: ' + this.age;
};

Particle.prototype.reset = function() {
    this.mass = 1;
    vec2.set(this.position, 0, 0);
    vec2.set(this.velocity, 0, 0);
    vec2.set(this.force, 0, 0);
    this.age = 0;
};

module.exports = Particle;
