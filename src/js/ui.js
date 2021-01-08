var settings = require('./settings');

var UI = function(app) {
    this.app = app;

    this.canvas = document.getElementById('scores');
    this.context = this.canvas.getContext('2d');

    this.haveShownHighScore = false;

    this.countdown = 3;
    this.countdownInterval = null;
    this.isCountingDown = false;
    this.needDrawCountdown = false;
    this.needClearCountdown = false;

    this.flash = 0;
    this.flashInterval = null;
    this.isFlashing = false;
    this.flashOn = false;
    this.needDrawFlash = false;
    this.needClearFlash = false;

    this.lastScore = -1;
    this.lastHighScore = -1;
};

UI.prototype.draw = function() {
    var score = this.app.score.score;
    var highScore = this.app.score.highScore;

    var needDrawScore = (score != this.lastScore);
    var needDrawHighScore = (highScore != this.lastHighScore);

    if (this.canvas.clientWidth != this.canvas.width ||
        this.canvas.clientHeight != this.canvas.height) {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        needDrawScore = true;
        needDrawHighScore = true;

        this.context.shadowColor = '#000000';
        this.context.shadowOffsetX = 3;
        this.context.shadowOffsetY = 3;
        this.context.textBaseline = 'middle';
    }

    var width = this.canvas.width;
    var halfWidth = width / 2;
    var thirdWidth = width / 3;
    var height = this.canvas.height;
    var halfHeight = height / 2;
    // Clear a little extra on all sides
    var extraClear = 4;

    var scoreSize;
    if (this.canvas.width > settings.scoreFontBreakWidth) {
        scoreSize = settings.scoreFontSizeLarge;
    }
    else {
        scoreSize = settings.scoreFontSizeSmall;
    }
    var halfScoreSize = scoreSize / 2;

    var countdownSize = settings.countdownFontSize;
    var halfCountdownSize = countdownSize / 2;

    if (needDrawScore || needDrawHighScore || this.needDrawFlash) {
        var fontString = scoreSize + 'px \'Orbitron\', sans-serif';
        if (this.context.font != fontString) {
            this.context.font = fontString;
        }
    }

    if (needDrawScore) {
        this.context.clearRect(0, halfScoreSize - extraClear,
                               thirdWidth, scoreSize + 2 * extraClear);
        this.context.textAlign = 'left';
        this.context.fillStyle = '#00FF00';
        this.context.fillText(score.toString(),
                              halfScoreSize, scoreSize);
    }

    if (needDrawHighScore) {
        this.context.clearRect(2 * thirdWidth, halfScoreSize - extraClear,
                               thirdWidth, scoreSize + 2 * extraClear);
        this.context.textAlign = 'right';
        this.context.fillStyle = '#FF0000';
        this.context.fillText(highScore.toString(),
                              width - halfScoreSize, scoreSize);
    }


    if (this.needDrawFlash || this.countdown) {
        this.context.textAlign = 'center';
        this.context.fillStyle = '#FFFFFF';
    }

    if (this.needDrawFlash) {
        this.context.fillText('High Score', halfWidth, scoreSize);
        this.needDrawFlash = false;
    }

    if (this.needClearFlash) {
        this.context.clearRect(thirdWidth, halfScoreSize - extraClear,
                               thirdWidth, scoreSize + 2 * extraClear);
        this.needClearFlash = false;
    }

    if (this.needDrawCountdown ||
        this.needClearCountdown) {
        this.context.clearRect(halfWidth - halfCountdownSize - extraClear,
                               halfHeight - halfCountdownSize - extraClear,
                               countdownSize + 2 * extraClear,
                               countdownSize + 2 * extraClear);
        this.needClearCountdown = false;
    }


    if (this.needDrawCountdown) {
        var fontString = countdownSize + 'px \'Orbitron\', sans-serif';
        if (this.context.font != fontString) {
            this.context.font = fontString;
        }
        this.context.fillText(this.countdown.toString(),
                              halfWidth, halfHeight);
        this.needDrawCountdown = false;
    }

    this.lastScore = score;
    this.lastHighScore = highScore;
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
    if (this.isFlashing) {
        return;
    }
    this.flash = 0;
    this.isFlashing = true;
    this.flashInterval = setInterval(this.doFlashHighScore.bind(this), 500);
};

UI.prototype.doFlashHighScore = function() {
    this.flash += 1;
    this.flashOn = !this.flashOn;
    this.needDrawFlash = this.flashOn;
    this.needClearFlash = !this.flashOn;

    if (this.flash == 10) {
        clearInterval(this.flashInterval);
        this.isFlashing = false;
        this.flashInterval = null;
    }
};

UI.prototype.startCountdown = function() {
    this.app.stopUpdates();
    this.countdown = 3;
    this.isCountingDown = true;
    this.countdownInterval = setInterval(this.doCountdown.bind(this), 1000);
    this.needDrawCountdown = true;
};

UI.prototype.doCountdown = function() {
    this.countdown -= 1;
    this.needDrawCountdown = true;

    if (this.countdown == 0) {
        clearInterval(this.countdownInterval);
        this.isCountingDown = false;
        this.countdownInterval = null;
        this.needDrawCountdown = false;
        this.needClearCountdown = true;

        this.app.startUpdates();
    }
};

module.exports = UI;
