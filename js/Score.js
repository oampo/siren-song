var Score = function(app) {
    this.app = app;
    this.score = 0;
    this.highScore = 0;
};

Score.prototype.increase = function() {
    this.score += 1;
    if (this.score > this.highScore) {
        this.highScore = this.score;
    }
};

Score.prototype.decrease = function() {
    this.score = Math.floor(this.score * 0.995);
};
