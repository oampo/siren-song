var GoodGuy = function(app) {
    this.app = app;

    this.radius = 8;
    this.chain = [];
    this.springOut = null;

    var sides = this.app.level.getSides(0);
    var middle = (sides[0] + sides[1]) / 2;
    this.particle = this.app.particleSystem.makeParticle(1, middle, 0, 0);

    var vertices = [];
    var colors = [];
    var numberOfPoints = 80;
    var numberOfSpirals = 3;
    var spacing = 3;
    for (var i=0; i<numberOfPoints; i++) {
        var theta = numberOfSpirals * i * 2 * Math.PI / numberOfPoints;
        vertices.push(5 * theta * Math.sin(theta) / (2 * Math.PI));
        vertices.push(5 * theta * Math.cos(theta) / (2 * Math.PI));
        vertices.push(0);
        colors.push(1, 1, 1, 1);
    }

    this.model = new PhiloGL.O3D.Model({vertices: vertices,
                                        colors: colors,
                                        drawType: "LINE_STRIP"});
    this.app.scene.add(this.model);

};

GoodGuy.prototype.update = function() {
    var sides = this.app.level.getSides(0);
    this.model.rotation.z -= 0.3;
    this.model.update();

    if (this.particle.position.x < -this.app.width / 2 ||
        this.particle.position.x > this.app.width / 2 ||
        this.particle.position.y < -this.app.height / 2 ||
        this.particle.position.y > this.app.height / 2) {
        this.app.stop();
        this.particle.position.x = (sides[0] + sides[1]) / 2;
        this.particle.velocity.x = 0;
        this.app.ui.startCountdown();
    }
        
    if (this.particle.position.x < sides[0] ||
        this.particle.position.x > sides[1]) {
        this.app.score.decrease();

    }

    this.handleSirenCollisions();
    PhiloGL.Vec3.setVec3(this.model.position, this.particle.position);
    this.model.update();
};

GoodGuy.prototype.handleSirenCollisions = function() {
    var sirens = this.app.sirens;
    var numberOfSirens = sirens.length;
    var position = this.particle.position;
    for (var i=0; i<numberOfSirens; i++) {
        var siren = sirens[i];
        if (!siren.connected &&
            PhiloGL.Vec3.distTo(position, siren.particle.position) < 
            this.radius + siren.radius) {
            this.attach(siren);
            this.app.multiplier += 1;
        }
    }
};

GoodGuy.prototype.attach = function(sirenA) {
    if (this.chain.length == 0) {
        // Connect to goodGuy
        this.springOut = new SpringToGoodGuy(this.particle, sirenA.particle,
                                             0.05, 0.5, 15);
        // Bit of a hack which makes life easier.  Pretend that SpringToGoodGuy
        // is a real spring, so we can remove it in the regular way.
        this.app.particleSystem.springs.push(this.springOut);
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
    var index = this.app.particleSystem.customForces.indexOf(sirenA.attraction);
    this.app.particleSystem.removeCustomForce(index);
    sirenA.connected = true;
    sirenA.createSynth();
    this.chain.push(sirenA);
};

