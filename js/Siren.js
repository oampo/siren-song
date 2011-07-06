var Siren = function(app) {
    this.app = app;
    this.radius = 3;
    this.connected = false;
    this.springIn = null;
    this.springOut = null;

    var yPos = app.height / 2;
    var sides = this.app.level.getSides(yPos);
    var xPos = sides[0] + this.radius * 2;
    xPos += (sides[1] - this.radius * 2) * Math.random();
    this.particle = this.app.particleSystem.makeParticle(1, xPos, yPos, 0);

    
    this.particle.velocity.set(0, -3, 0);
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

Siren.prototype.update = function() {
    var position = this.particle.position;
    var sides = this.app.level.getSides(position.y);
    if (position.y < -this.app.height / 2 ||
        position.x < sides[0] ||
        position.x > sides[1]) {
        this.remove();
    }
    else {
        this.model.position.setVec3(this.particle.position);
        this.model.update();
        if (this.connected) {
            this.createParticles();
        }
    }
};

Siren.prototype.remove = function() {
    this.app.scene.remove(this.model);
    var index = this.app.particleSystem.particles.indexOf(this.particle);
    if (index != -1) {
        this.app.particleSystem.removeParticle(index);
    }

    var index = this.app.sirens.indexOf(this);
    if (index != -1) {
        this.app.sirens.splice(index, 1);
    }

    if (this.connected) {
        var chain = this.app.goodGuy.chain;
        var chainIndex = chain.indexOf(this);
        var before, after = null;

        if (chainIndex == 0) {
            before = this.app.goodGuy;
        }
        else {
            before = chain[chainIndex - 1];
        }

        if (chainIndex != chainIndex.length - 1) {
            after = chain[chainIndex + 1];
        }

        var index = this.app.particleSystem.springs.indexOf(this.springIn);
        this.app.particleSystem.removeSpring(index);
        this.springIn = null;
        before.springOut = null;

        if (after) {
            var index = this.app.particleSystem.springs.indexOf(this.springOut);
            this.app.particleSystem.removeSpring(index);
            this.springOut = null;
            after.springIn = null;
        }

        if (before && after) {
            var spring = this.app.particleSystem.makeSpring(before.particle,
                                                            after.particle,
                                                            0.05, 0.5, 15);
            before.springOut = spring;
            after.springIn = spring;
        }
        chain.splice(chainIndex, 1);
    }
};

Siren.prototype.createParticles = function() {
};

