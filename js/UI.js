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

    this.createPopups();
};

UI.prototype.draw = function() {
    var score = this.app.score.score;
    var highScore = this.app.score.highScore;

    var needDrawScore = (score != this.lastScore);
    var needDrawHighScore = (highScore != this.lastHighScore);

    if (needDrawScore ||
        needDrawHighScore ||
        this.needDrawFlash) {
        if (this.context.font != '36px \'Orbitron\', sans-serif') {
            this.context.font = '36px \'Orbitron\', sans-serif';
        }
        this.context.textBaseline = 'middle';
    }

    if (needDrawScore) {
        this.context.clearRect(0, 0, this.canvas.width / 3, 40);
        this.context.textAlign = 'left';
        this.context.fillStyle = '#00FF00';
        this.context.fillText(score.toString(), 0, 18);
    }

    if (needDrawHighScore) {
        this.context.clearRect(2 * this.canvas.width / 3, 0,
                               this.canvas.width / 3, 40);
        this.context.textAlign = 'right';
        this.context.fillStyle = '#FF0000';
        this.context.fillText(highScore.toString(),
                              this.canvas.width, 18);
    }


    if (this.needDrawFlash || this.countdown) {
        this.context.textAlign = 'center';
        this.context.fillStyle = '#FFFFFF';
    }

    if (this.needDrawFlash) {
        this.context.fillText('High Score', this.canvas.width / 2, 18);
        this.needDrawFlash = false;
    }

    if (this.needClearFlash) {
        this.context.clearRect(this.canvas.width / 3, 0,
                               this.canvas.width / 3, 40);
        this.needClearFlash = false;
    }

    if (this.needDrawCountdown ||
        this.needClearCountdown) {
        this.context.clearRect(this.canvas.width / 2 - 36,
                               this.canvas.height / 2, 72, 72);
        this.needClearCountdown = false;
    }


    if (this.needDrawCountdown) {
        this.context.textBaseline = 'middle';
        if (this.context.font != '72px \'Orbitron\', sans-serif') {
            this.context.font = '72px \'Orbitron\', sans-serif';
        }
        this.context.fillText(this.countdown.toString(),
                              this.canvas.width / 2,
                              this.canvas.height / 2 + 36);
        this.needDrawCountdown = false;
    }

    this.lastScore = score;
    this.lastHighScore = highScore;
};

UI.prototype.clearCountdown = function() {
    this.context.clearRect(this.canvas.width / 2 - 36,
                           this.canvas.height / 2, 72, 72);
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
    this.countdown = 3;
    this.isCountingDown = true;
    this.countdownInterval = setInterval(this.doCountdown.bind(this), 1000);
    this.needDrawCountdown = true;

    this.app.shouldUpdate = false;
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

        this.app.shouldUpdate = true;
    }
};

UI.prototype.createPopups = function() {
    var aboutLink = document.getElementById('about-link');
    var about = document.getElementById('about');
    aboutLink.onmouseover = function() {
       about.style.display = 'block';
    };
    aboutLink.onmouseout = function() {
        about.style.display = 'none';
    };

    var tipsLink = document.getElementById('tips-link');
    var tips = document.getElementById('tips');
    tipsLink.onmouseover = function() {
        tips.style.display = 'block';
    };
    tipsLink.onmouseout = function() {
        tips.style.display = 'none';
    };
};
