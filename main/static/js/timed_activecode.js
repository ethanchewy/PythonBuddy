function TimedActiveCode (opts) {
    if (opts) {
        this.timedInit(opts);
    }
}
TimedActiveCode.prototype = new ActiveCode();

TimedActiveCode.prototype.timedInit = function (opts) {
    this.init(opts);
    //this.renderTimedIcon(this.containerDiv); - bje not needed anymore
    this.hideButtons();
    this.needsReinitialization = true;   // the run button click listener needs to be reinitialized
};


TimedActiveCode.prototype.hideButtons = function () {
    var buttonList = [this.saveButton, this.loadButton, this.gradeButton, this.showHideButt, this.clButton, this.coachButton, this.atButton];
    for (var i = 0; i < buttonList.length; i++) {
        if (buttonList[i] !== undefined && buttonList[i] !== null)
            $(buttonList[i]).hide();
    }
};

// bje - not needed anymore
TimedActiveCode.prototype.renderTimedIcon = function (component) {
    // renders the clock icon on timed components.    The component parameter
    // is the element that the icon should be appended to.
    var timeIconDiv = document.createElement("div");
    var timeIcon = document.createElement("img");
    $(timeIcon).attr({
        "src": "../_static/clock.png",
        "style": "width:15px;height:15px"
    });
    timeIconDiv.className = "timeTip";
    timeIconDiv.title = "";
    timeIconDiv.appendChild(timeIcon);
    $(component).prepend(timeIconDiv);
};

TimedActiveCode.prototype.checkCorrectTimed = function () {
    return "I";   // we ignore this in the grading
};

TimedActiveCode.prototype.hideFeedback = function () {
    $(this.output).css("visibility","hidden");
};

TimedActiveCode.prototype.processTimedSubmission = function (logFlag) {
    // Disable input & evaluate component
    if (this.useRunestoneServices) {
        if (logFlag) {
            this.saveEditor();
        } else {
            this.loadEditor().done(this.runProg.bind(this));
        }
    }
    this.runButton.disabled = true;
    $(this.codeDiv).addClass("ac-disabled");
};

TimedActiveCode.prototype.reinitializeListeners = function () {
    // re-attach the run button listener
    $(this.runButton).click(this.runProg.bind(this));
    $(this.histButton).click(this.addHistoryScrubber.bind(this));
    if (this.historyScrubber !== null) {
        $(this.historyScrubber).slider({
            max: this.history.length-1,
            value: this.history.length-1,
            slide: this.slideit.bind(this),
            change: this.slideit.bind(this)
        });
    }
};
