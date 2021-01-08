var glMatrix = require('gl-matrix');
var vec2 = glMatrix.vec2;

function Touch() {
  this.isDown = false;
  this.screenPosition = vec2.create();
  console.log(this.screenPosition);

  document.addEventListener('touchstart', this.onTouchStart.bind(this));
  document.addEventListener('touchmove', this.onTouchMove.bind(this));
  document.addEventListener('touchend', this.onTouchEnd.bind(this));
  document.addEventListener('mousedown', this.onMouseDown.bind(this));
  document.addEventListener('mousemove', this.onMouseMove.bind(this));
  document.addEventListener('mouseup', this.onMouseUp.bind(this));
}

Touch.prototype.onTouchStart = function(e) {
  e.preventDefault();
  const touch = event.touches[0];
  this.isDown = true;
  vec2.set(this.screenPosition, touch.clientX, touch.clientY);
}

Touch.prototype.onTouchMove = function(e) {
  const touch = event.touches[0];
  vec2.set(this.screenPosition, touch.clientX, touch.clientY);
}

Touch.prototype.onTouchEnd = function(e) {
  this.isDown = false;
}

Touch.prototype.onMouseDown = function(e) {
  this.isDown = true;
  vec2.set(this.screenPosition, event.clientX, event.clientY);
}

Touch.prototype.onMouseMove = function(e) {
  if (!this.isDown) {
    return;
  }
  vec2.set(this.screenPosition, event.clientX, event.clientY);
}

Touch.prototype.onMouseUp = function(e) {
  this.isDown = false;
}

module.exports = Touch;
