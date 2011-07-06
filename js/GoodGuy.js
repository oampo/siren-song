var GoodGuy = function(app) {
    this.app = app;

    this.radius = 5;
    this.chain = [];
    this.springOut = null;

    // Keep two representations of positions and velocity.  One for the
    // particle system, which gets the jitters but keeps it all pretty close,
    // and another for where we display that we are.
    var sides = this.app.level.getSides(0);
    var middle = (sides[0] + sides[1]) / 2;
    this.particle = this.app.particleSystem.makeParticle(1, middle, 0, 0);

    this.velocity = new PhiloGL.Vec3();
    this.position = new PhiloGL.Vec3(middle, 0, 0);

    this.model = new PhiloGL.O3D.Model({//textures: ["img/good-guy.png"],
                                        vertices: [-0.5, -0.5, 0,
                                                   -0.5, 0.5, 0,
                                                   0.5, -0.5, 0,
                                                   0.5, 0.5, 0],
/*                                        texCoords: [0, 0,
                                                    0, 1,
                                                    1, 0,
                                                    1, 1],*/
                                        colors: [1, 1, 1, 1,
                                                 1, 1, 1, 1,
                                                 1, 1, 1, 1,
                                                 1, 1, 1, 1],
                                        drawType: "TRIANGLE_STRIP"});
    this.model.scale.set(this.radius * 2, this.radius * 2, 0);
    this.model.update();
    this.app.scene.add(this.model);
};

GoodGuy.prototype.update = function() {
    // Loosely sync the position of the visible and actual particle
    this.position.$add(this.velocity);
    this.particle.velocity.setVec3(this.velocity);
    this.particle.position.y = 0;

    // If the actual particle has drifted too far from the visible particle
    // then reset it's position.
    if (this.particle.position.distTo(this.position) > 4 * this.radius) {
        this.particle.position.setVec3(this.position);
    }

    this.handleSirenCollisions();
    this.model.position.setVec3(this.position);
    this.model.update();
};

GoodGuy.prototype.handleSirenCollisions = function() {
    var sirens = this.app.sirens;
    var numberOfSirens = sirens.length;
    var position = this.position;
    for (var i=0; i<numberOfSirens; i++) {
        var siren = sirens[i];
        if (!siren.connected &&
            position.distTo(siren.particle.position) < 
            this.radius + siren.radius) {
            this.attach(siren);
        }
    }
};

GoodGuy.prototype.attach = function(sirenA) {
    if (this.chain.length == 0) {
        // Connect to goodGuy
        this.springOut = this.app.particleSystem.makeSpring(this.particle,
                                                            sirenA.particle,
                                                            0.05, 0.5, 15);
        sirenA.springIn = this.springOut;
    }
    else {
        var sirenB = this.chain[this.chain.length - 1];
        var spring = this.app.particleSystem.makeSpring(sirenA.particle,
                                                        sirenB.particle,
                                                        0.05, 0.5, 15);
        sirenA.springIn = spring;
        sirenB.springOut = spring;
    }
    sirenA.connected = true;
    this.chain.push(sirenA);
};
