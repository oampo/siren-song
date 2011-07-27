var UI = function(app) {
    this.app = app;

    this.canvas =  document.getElementById("scores");
    this.context = this.canvas.getContext("2d");

    this.haveShownHighScore = false;

    this.countdown = 3;
    this.flashCount = 0;
    this.flashInterval = null;
    this.highScoreOn = false;

    this.draw();
};

UI.prototype.draw = function() {
//    this.canvas.width = this.canvas.width;
    this.context.clearRect(0, 0, this.canvas.width, 36);
    this.context.font = '36px \'Orbitron\', sans-serif';
    this.context.textBaseline = "top";
    this.context.textAlign = 'left';
    this.context.fillStyle = '#00FF00';
    this.context.fillText(this.app.score.score.toString(), 0, 0);

    this.context.clearRect(this.canvas.width / 2 - 36,
                           this.canvas.height / 2 - 36,
                           this.canvas.width / 2 + 36,
                           this.canvas.height / 2 + 36);
    if (this.highScoreOn) {
        this.context.textAlign ='center';
        this.context.fillStyle = '#FFFFFF';
        this.context.fillText("High Score", this.canvas.width / 2, 0);
    }

    this.context.textAlign = 'right';
    this.context.fillStyle = '#FF0000';
    this.context.fillText(this.app.score.highScore.toString(),
                          this.canvas.width, 0);

    if (this.countdown) {
        this.context.textBaseline = "middle";
        this.context.textAlign = 'center';
        this.context.font = '72px \'Orbitron\', sans-serif';
        this.context.fillStyle = '#FFFFFF';
        this.context.fillText(this.countdown.toString(),
                              this.canvas.width / 2,
                              36 + this.canvas.height / 2);
    }
};

UI.prototype.updateScore = function() {
    var score = this.app.score.score;
    var highScore = this.app.score.highScore;

    if (score == highScore && score != 0 && !this.haveShownHighScore) {
        this.haveShownHighScore = true;
        this.flashHighScore();
    }
    if (this.haveShownHighScore && score != highScore) {
        this.haveShownHighScore = false;
    }
};

UI.prototype.flashHighScore = function() {
    if (this.flashInterval) {
        return;
    }
    this.flashCount = 0;

    this.flashInterval = setInterval(this.doFlashHighScore.bind(this), 500);
};

UI.prototype.doFlashHighScore = function() {
    this.flashCount += 1;
    this.highScoreOn = !this.highScoreOn;

    if (this.flashCount == 10) {
        clearInterval(this.flashInterval);
        this.flashInterval = null;
    }
};

UI.prototype.startCountdown = function() {
    this.countdown = 3;
    this.app.shouldUpdate = false;
    this.countdownInterval = setInterval(this.doCountdown.bind(this), 1000);
};

UI.prototype.doCountdown = function() {
    this.countdown -= 1;
    if (this.countdown == 0) {
        clearInterval(this.countdownInterval);
        this.app.shouldUpdate = true;
    }
};
