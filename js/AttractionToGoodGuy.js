var AttractionToGoodGuy = function(a, b, k, distanceMin, distanceMax) {
    this.a = a;
    this.b = b;
    this.k = k;
    this.distanceMin = distanceMin;
    this.distanceMax = distanceMax;

    this.on = true;
    this.distanceMinSquared = Math.pow(this.distanceMin, 2);
    this.distanceMaxSquared = Math.pow(this.distanceMax, 2);
};

AttractionToGoodGuy.prototype.toString = function() {
    return 'a: ' + this.a +
           '\nb: ' + this.b +
           '\nk: ' + this.k +
           '\ndistanceMin ' + this.distanceMin +
           '\ndistanceMax ' + this.distanceMax;
};

AttractionToGoodGuy.prototype.setMinimumDistance = function(d) {
    this.distanceMin = d;
    this.distanceMinSquared = Math.pow(d, 2);
};

AttractionToGoodGuy.prototype.setMaximumDistance = function(d) {
    this.distanceMax = d;
    this.distanceMaxSquared = Math.pow(d, 2);
};


AttractionToGoodGuy.prototype.apply = function() {
    var a = this.a;
    var b = this.b;
    var k = this.k;
    var distanceMinSquared = this.distanceMinSquared;
    var distanceMaxSquared = this.distanceMaxSquared;
    if (this.on && (!a.fixed || !b.fixed)) {
        var a2b = PhiloGL.Vec3.sub(a.position, b.position);
        var a2bDistanceSquared = PhiloGL.Vec3.normSq(a2b);

        if (a2bDistanceSquared < distanceMaxSquared) {
            if (a2bDistanceSquared < distanceMinSquared) {
                a2bDistanceSquared = distanceMinSquared;
            }

            var force = k * a.mass * b.mass / a2bDistanceSquared,
                length = Math.sqrt(a2bDistanceSquared);

            PhiloGL.Vec3.$scale(a2b, 1 / length);

            PhiloGL.Vec3.$scale(a2b, force);

            if (!b.fixed) {
                PhiloGL.Vec3.$add(b.force, a2b);
            }
        }
    }
};

