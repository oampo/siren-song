var ObjectPool = function(construct, numberOfObjects) {
    this.construct = construct;
    this.numberOfObjects = numberOfObjects;
    this.objects = [];

    var args = Array.prototype.slice.call(arguments, 2);
    for (var i = 0; i < numberOfObjects; i++) {
        this.objects.push(this.construct.apply(this, args));
    }
};

ObjectPool.prototype.create = function() {
    if (!this.objects.length) {
        this.numberOfObjects *= 3;
        for (var i = 0; i < this.numberOfObjects; i++) {
            this.objects.push(this.construct.apply(this, arguments));
        }
    }

    var object = this.objects.pop();
    return object;
};

ObjectPool.prototype.recycle = function(object) {
    if (typeof object.reset == 'function') {
        object.reset();
    }
    this.objects.push(object);
};

