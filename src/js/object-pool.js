var ObjectPool = function(constructor, numberOfObjects) {
    this.constructor = constructor;
    this.objects = [];
};

ObjectPool.prototype.create = function() {
    if (!this.objects.length) {
        var object = new this.constructor();
    }
    else {
        var object = this.objects.pop();
    }
    return object;
};

ObjectPool.prototype.recycle = function(object) {
    this.objects.push(object);
};

module.exports = ObjectPool;
