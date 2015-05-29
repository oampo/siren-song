var vec3 = require('gl-matrix').vec3;

var Particle = function() {
    this.mass = 1;
    this.position = vec3.create();
    this.velocity = vec3.create();
    this.force = vec3.create();
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
    vec3.set(this.position, 0, 0, 0);
    vec3.set(this.velocity, 0, 0, 0);
    vec3.set(this.force, 0, 0, 0);
    this.age = 0;
};

module.exports = Particle;
