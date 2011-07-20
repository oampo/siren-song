var UI = function(app) {
    this.app = app;

    this.scoreBox = document.getElementById('score');
    this.highScoreBox = document.getElementById('high-score');
    this.newHighScoreBox = document.getElementById('new-high-score');
    this.countdownBox = document.getElementById('countdown');

    this.haveShownHighScore = false;

    this.countdown = 0;
    this.flashCount = 0;
    this.flashTimeout = null;
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

    this.scoreBox.textContent = score;
    this.highScoreBox.textContent = highScore;
};

UI.prototype.flashHighScore = function() {
    if (this.flashTimeout) {
        return;
    }
    this.newHighScoreBox.style.visibility == "visible";

    this.flashCount = 0;

    this.flashTimeout = setTimeout(this.doFlashHighScore.bind(this), 500);
};

UI.prototype.doFlashHighScore = function() {
    if (this.newHighScoreBox.style.visibility == "visible") {
        this.newHighScoreBox.style.visibility = "hidden";
    }
    else {
        this.newHighScoreBox.style.visibility = "visible";
    }
    this.flashCount += 1;

    if (this.flashCount < 10) {
        this.flashTimeout = setTimeout(this.doFlashHighScore.bind(this), 500);
    }
    else {
        this.flashTimeout = null;
    }
};

UI.prototype.startCountdown = function() {
    this.countdown = 3;
    this.countdownBox.textContent = this.countdown;
    setTimeout(this.doCountdown.bind(this), 1000);
};

UI.prototype.doCountdown = function() {
    this.countdown -= 1;
    if (this.countdown == 0) {
        this.countdownBox.textContent = "";
        this.app.run();
    }
    else {
        this.countdownBox.textContent = this.countdown;
        setTimeout(this.doCountdown.bind(this), 1000);
    }
};
