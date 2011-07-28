var ObjectPool = function(ObjectType, numberOfObjects) {
    this.ObjectType = ObjectType;
    this.activeObjects = [];
    this.inactiveObjects = [];

    var args = Array.prototype.slice.call(arguments, 2);
    for (var i=0; i<numberOfObjects; i++) {
        this.inactiveObjects.push(this.construct(args));
    }
};

ObjectPool.prototype.create = function() {
    if (!this.inactiveObjects.length) {
        for (var i=0; i<this.activeObjects.length * 3; i++) {
            this.inactiveObjects.push(this.construct(arguments));
        }
    }

    var object = this.inactiveObjects.pop();
    this.activeObjects.push(object);
    return object;
};

ObjectPool.prototype.recycle = function(object) {
    if (typeof object.reset == "function") {
        object.reset();
    }
    var index = this.activeObjects.indexOf(object);
    this.activeObjects.splice(index, 1);
    this.inactiveObjects.push(object);
};

ObjectPool.prototype.delete = function(object) {
    var index = this.activeObjects.indexOf(object);
    this.activeObjects.splice(index, 1);
};

ObjectPool.prototype.construct = function(args) {
    var ObjectType = this.ObjectType;
    function F(args) {
        return ObjectType.apply(this, args);
    }
    F.prototype = this.ObjectType.prototype;

    return new F(args);
};

