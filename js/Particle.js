var Particle = function(mass) {
    this.mass = mass;
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

