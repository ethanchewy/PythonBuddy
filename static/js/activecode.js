/**
 * Created by bmiller on 3/19/15.
 * Edited by ethanchewy on 7/23/16->.
 */

var isMouseDown = false;
document.onmousedown = function() { isMouseDown = true };
document.onmouseup   = function() { isMouseDown = false };

var edList = {};

ActiveCode.prototype = new RunestoneBase();

// separate into constructor and init

function ActiveCode(opts) {
    if (opts) {
        this.init(opts);
        }
    }

ActiveCode.prototype.init = function(opts) {
    RunestoneBase.apply( this, arguments );  // call parent constructor
    var suffStart = -1;
    var orig = opts.orig;
    this.useRunestoneServices = opts.useRunestoneServices;
    this.python3 = opts.python3;
    this.alignVertical = opts.vertical;
    this.origElem = orig;
    this.divid = orig.id;
    this.code = $(orig).text() || "\n\n\n\n\n";
    this.language = $(orig).data('lang');
    this.timelimit = $(orig).data('timelimit');
    this.includes = $(orig).data('include');
    this.hidecode = $(orig).data('hidecode');
    this.sid = opts.sid;
    this.graderactive = opts.graderactive;
    this.runButton = null;
    this.saveButton = null;
    this.loadButton = null;
    this.outerDiv = null;
    this.output = null; // create pre for output
    this.graphics = null; // create div for turtle graphics
    this.codecoach = null;
    this.codelens = null;
    this.controlDiv = null;
    this.historyScrubber = null;
    this.timestamps = ["Original"]
    this.autorun = $(orig).data('autorun');

    if(this.graderactive) {
        this.hidecode = false;
    }

    if(this.includes !== undefined) {
        this.includes = this.includes.split(/\s+/);
    }

    suffStart = this.code.indexOf('====');
    if (suffStart > -1) {
        this.suffix = this.code.substring(suffStart+5);
        this.code = this.code.substring(0,suffStart);
    }

    this.history = [this.code]
    this.createEditor();
    this.createOutput();
    this.createControls();
    if ($(orig).data('caption')) {
        this.caption = $(orig).data('caption');
    } else {
        this.caption = ""
    }
    this.addCaption();

    if (this.autorun) {
        $(document).ready(this.runProg.bind(this));
    }
};

ActiveCode.prototype.createEditor = function (index) {
    this.containerDiv = document.createElement('div');
    var linkdiv = document.createElement('div')
    linkdiv.id = this.divid.replace(/_/g,'-').toLowerCase();  // :ref: changes _ to - so add this as a target
    $(this.containerDiv).addClass("ac_section alert alert-warning");
    var codeDiv = document.createElement("div");
    $(codeDiv).addClass("ac_code_div col-md-12");
    this.codeDiv = codeDiv;
    this.containerDiv.id = this.divid;
    this.containerDiv.lang = this.language;
    this.outerDiv = this.containerDiv;

    $(this.origElem).replaceWith(this.containerDiv);
    if (linkdiv.id !== this.divid) {  // Don't want the 'extra' target if they match.
        this.containerDiv.appendChild(linkdiv);
    }
    this.containerDiv.appendChild(codeDiv);
    var editor = CodeMirror(codeDiv, {value: this.code, lineNumbers: true,
        mode: this.containerDiv.lang, indentUnit: 4,
        matchBrackets: true, autoMatchParens: true,
        extraKeys: {"Tab": "indentMore", "Shift-Tab": "indentLess"}
    });

    // Make the editor resizable
    $(editor.getWrapperElement()).resizable({
        resize: function() {
            editor.setSize($(this).width(), $(this).height());
            editor.refresh();
        }
    });

    // give the user a visual cue that they have changed but not saved
    editor.on('change', (function () {
        if (editor.acEditEvent == false || editor.acEditEvent === undefined) {
            $(editor.getWrapperElement()).css('border-top', '2px solid #b43232');
            $(editor.getWrapperElement()).css('border-bottom', '2px solid #b43232');
            this.logBookEvent({'event': 'activecode', 'act': 'edit', 'div_id': this.divid});
    }
        editor.acEditEvent = true;
        }).bind(this));  // use bind to preserve *this* inside the on handler.

    this.editor = editor;
    if (this.hidecode) {
        $(this.codeDiv).css("display","none");
    }
};

ActiveCode.prototype.createControls = function () {
    var ctrlDiv = document.createElement("div");
    $(ctrlDiv).addClass("ac_actions");
    $(ctrlDiv).addClass("col-md-12");
    // Run
    var butt = document.createElement("button");
    $(butt).text("Run");
    $(butt).addClass("btn btn-success run-button");
    ctrlDiv.appendChild(butt);
    this.runButton = butt;
    $(butt).click(this.runProg.bind(this));

    if (! this.hidecode) {
        var butt = document.createElement("button");
        $(butt).text("Load History");
        $(butt).addClass("btn btn-default");
        ctrlDiv.appendChild(butt);
        this.histButton = butt;
        $(butt).click(this.addHistoryScrubber.bind(this));
        if (this.graderactive) {
            this.addHistoryScrubber(true);
        }
    }


    if ($(this.origElem).data('gradebutton') && ! this.graderactive) {
        butt = document.createElement("button");
        $(butt).addClass("ac_opt btn btn-default");
        $(butt).text("Show Feedback");
        $(butt).css("margin-left","10px");
        this.gradeButton = butt;
        ctrlDiv.appendChild(butt);
        $(butt).click(this.createGradeSummary.bind(this))
    }
    // Show/Hide Code
    if (this.hidecode) {
        butt = document.createElement("button");
        $(butt).addClass("ac_opt btn btn-default");
        $(butt).text("Show/Hide Code");
        $(butt).css("margin-left", "10px");
        this.showHideButt = butt;
        ctrlDiv.appendChild(butt);
        $(butt).click( (function() { $(this.codeDiv).toggle();
            if (this.historyScrubber == null) {
                this.addHistoryScrubber(true);
            } else {
                $(this.historyScrubber.parentElement).toggle();
            }
        }).bind(this));
    }

    // CodeLens
    if ($(this.origElem).data("codelens") && ! this.graderactive) {
        butt = document.createElement("button");
        $(butt).addClass("ac_opt btn btn-default");
        $(butt).text("Show CodeLens");
        $(butt).css("margin-left", "10px");
        this.clButton = butt;
        ctrlDiv.appendChild(butt);
        $(butt).click(this.showCodelens.bind(this));
    }
    // CodeCoach
    if (this.useRunestoneServices && $(this.origElem).data("coach")) {
        butt = document.createElement("button");
        $(butt).addClass("ac_opt btn btn-default");
        $(butt).text("Code Coach");
        $(butt).css("margin-left", "10px");
        this.coachButton = butt;
        ctrlDiv.appendChild(butt);
        $(butt).click(this.showCodeCoach.bind(this));
    }

    // Audio Tour
    if ($(this.origElem).data("audio")) {
        butt = document.createElement("button");
        $(butt).addClass("ac_opt btn btn-default");
        $(butt).text("Audio Tour");
        $(butt).css("margin-left", "10px");
        this.atButton = butt;
        ctrlDiv.appendChild(butt);
        $(butt).click((function() {new AudioTour(this.divid, this.editor.getValue(), 1, $(this.origElem).data("audio"))}).bind(this));
    }


    $(this.outerDiv).prepend(ctrlDiv);
    this.controlDiv = ctrlDiv;

};

// Activecode -- If the code has not changed wrt the scrubber position value then don't save the code or reposition the scrubber
//  -- still call runlog, but add a parameter to not save the code
// add an initial load history button
// if there is no edit then there is no append   to_save (True/False)

ActiveCode.prototype.addHistoryScrubber = function (pos_last) {

    var data = {acid: this.divid};
    var deferred = jQuery.Deferred();

    if (this.sid !== undefined) {
        data['sid'] = this.sid;
    }
    jQuery.getJSON(eBookConfig.ajaxURL + 'gethist.json', data, function(data, status, whatever) {
        if (data.history !== undefined) {
            this.history = this.history.concat(data.history);
            for (t in data.timestamps) {
                this.timestamps.push( (new Date(data.timestamps[t])).toLocaleString() )
            }
        }
    }.bind(this))
        .always(function() {
            var scrubberDiv = document.createElement("div");
            $(scrubberDiv).css("display","inline-block");
            $(scrubberDiv).css("margin-left","10px");
            $(scrubberDiv).css("margin-right","10px");
            $(scrubberDiv).width("180px");
            scrubber = document.createElement("div");
            this.slideit = function() {
                this.editor.setValue(this.history[$(scrubber).slider("value")]);
                var curVal = this.timestamps[$(scrubber).slider("value")];
                //this.scrubberTime.innerHTML = curVal;
                var tooltip = '<div class="sltooltip"><div class="sltooltip-inner">' +
                    curVal + '</div><div class="sltooltip-arrow"></div></div>';
                $(scrubber).find(".ui-slider-handle").html(tooltip);
                setTimeout(function () {
                    $(scrubber).find(".sltooltip").fadeOut()
                }, 4000);
            };
            $(scrubber).slider({
                max: this.history.length-1,
                value: this.history.length-1,
                slide: this.slideit.bind(this),
                change: this.slideit.bind(this)
            });
            scrubberDiv.appendChild(scrubber);

            if (pos_last) {
                scrubber.value = this.history.length-1
                this.editor.setValue(this.history[scrubber.value]);
            } else {
                scrubber.value = 0;
            }

            $(this.histButton).remove();
            this.histButton = null;
            this.historyScrubber = scrubber;
            $(scrubberDiv).insertAfter(this.runButton)
            deferred.resolve();
        }.bind(this));
    return deferred;
}


ActiveCode.prototype.createOutput = function () {
    // Create a parent div with two elements:  pre for standard output and a div
    // to hold turtle graphics output.  We use a div in case the turtle changes from
    // using a canvas to using some other element like svg in the future.
    var outDiv = document.createElement("div");
    $(outDiv).addClass("ac_output col-md-5");
    this.outDiv = outDiv;
    this.output = document.createElement('pre');
    this.output.id = this.divid+'_stdout';
    $(this.output).css("visibility","hidden");

    this.graphics = document.createElement('div');
    this.graphics.id = this.divid + "_graphics";
    $(this.graphics).addClass("ac-canvas");
    // This bit of magic adds an event which waits for a canvas child to be created on our
    // newly created div.  When a canvas child is added we add a new class so that the visible
    // canvas can be styled in CSS.  Which a the moment means just adding a border.
    $(this.graphics).on("DOMNodeInserted", 'canvas', (function(e) {
        $(this.graphics).addClass("visible-ac-canvas");
    }).bind(this));

    outDiv.appendChild(this.output);
    outDiv.appendChild(this.graphics);
    this.outerDiv.appendChild(outDiv);

    clearDiv = document.createElement("div");
    $(clearDiv).css("clear","both");  // needed to make parent div resize properly
    this.outerDiv.appendChild(clearDiv);


    var lensDiv = document.createElement("div");
    $(lensDiv).addClass("col-md-6");
    $(lensDiv).css("display","none");
    this.codelens = lensDiv;
    this.outerDiv.appendChild(lensDiv);

    var coachDiv = document.createElement("div")
    $(coachDiv).addClass("col-md-12");
    $(coachDiv).css("display","none");
    this.codecoach = coachDiv;
    this.outerDiv.appendChild(coachDiv);


    clearDiv = document.createElement("div");
    $(clearDiv).css("clear","both");  // needed to make parent div resize properly
    this.outerDiv.appendChild(clearDiv);

};

ActiveCode.prototype.disableSaveLoad = function() {
    $(this.saveButton).addClass('disabled');
    $(this.saveButton).attr('title','Login to save your code');
    $(this.loadButton).addClass('disabled');
    $(this.loadButton).attr('title','Login to load your code');
};

ActiveCode.prototype.addCaption = function() {
    //someElement.parentNode.insertBefore(newElement, someElement.nextSibling);
    var capDiv = document.createElement('p');
    $(capDiv).html(this.caption + " (" + this.divid + ")");
    $(capDiv).addClass("ac_caption");
    $(capDiv).addClass("ac_caption_text");

    this.outerDiv.parentNode.insertBefore(capDiv, this.outerDiv.nextSibling);
};

ActiveCode.prototype.saveEditor = function () {
    var res;
    var saveSuccess = function(data, status, whatever) {
        if (data.redirect) {
            alert("Did not save!  It appears you are not logged in properly")
        } else if (data == "") {
            alert("Error:  Program not saved");
        }
        else {
            var acid = eval(data)[0];
            if (acid.indexOf("ERROR:") == 0) {
                alert(acid);
            } else {
                // use a tooltip to provide some success feedback
                var save_btn = $(this.saveButton);
                save_btn.attr('title', 'Saved your code.');
                opts = {
                    'trigger': 'manual',
                    'placement': 'bottom',
                    'delay': { show: 100, hide: 500}
                };
                save_btn.tooltip(opts);
                save_btn.tooltip('show');
                setTimeout(function () {
                    save_btn.tooltip('destroy')
                }, 4000);

                $('#' + acid + ' .CodeMirror').css('border-top', '2px solid #aaa');
                $('#' + acid + ' .CodeMirror').css('border-bottom', '2px solid #aaa');
            }
        }
    }.bind(this);

    var data = {acid: this.divid, code: this.editor.getValue()};
    data.lang = this.language;
    if (data.code.match(/^\s+$/)) {
        res = confirm("You are about to save an empty program, this will overwrite a previously saved program.  Continue?");
        if (! res) {
            return;
        }
    }
    $(document).ajaxError(function (e, jqhxr, settings, exception) {
        //alert("Request Failed for" + settings.url)
        console.log("Request Failed for" + settings.url);
    });
    jQuery.post(eBookConfig.ajaxURL + 'saveprog', data, saveSuccess);
    if (this.editor.acEditEvent) {
        this.logBookEvent({'event': 'activecode', 'act': 'edit', 'div_id': this.divid}); // Log the run event
        this.editor.acEditEvent = false;
    }
    this.logBookEvent({'event': 'activecode', 'act': 'save', 'div_id': this.divid}); // Log the run event

};

ActiveCode.prototype.loadEditor = function () {
    var loadEditor = (function (data, status, whatever) {
        // function called when contents of database are returned successfully
        var res = eval(data)[0];
        if (res.source) {
            this.editor.setValue(res.source);
            setTimeout(function() {
                this.editor.refresh();
            }.bind(this),500);
            $(this.loadButton).tooltip({'placement': 'bottom',
                             'title': "Loaded your saved code.",
                             'trigger': 'manual'
                            });
        } else {
            $(this.loadButton).tooltip({'placement': 'bottom',
                             'title': "No saved code.",
                             'trigger': 'manual'
                            });
        }
        $(this.loadButton).tooltip('show');
        setTimeout(function () {
            $(this.loadButton).tooltip('destroy')
        }.bind(this), 4000);
    }).bind(this);

    var data = {acid: this.divid};
    if (this.sid !== undefined) {
        data['sid'] = this.sid;
    }
    // This function needs to be chainable for when we want to do things like run the activecode
    // immediately after loading the previous input (such as in a timed exam)
    var dfd = jQuery.Deferred();
    this.logBookEvent({'event': 'activecode', 'act': 'load', 'div_id': this.divid}); // Log the run event
    jQuery.get(eBookConfig.ajaxURL + 'getprog', data, loadEditor).done(function () {dfd.resolve();});
    return dfd;

};

ActiveCode.prototype.createGradeSummary = function () {
    // get grade and comments for this assignment
    // get summary of all grades for this student
    // display grades in modal window
    var showGradeSummary = function (data, status, whatever) {
        var report = eval(data)[0];
        // check for report['message']
        if (report) {
            body = "<h4>Grade Report</h4>" +
                   "<p>This assignment: " + report['grade'] + "</p>" +
                   "<p>" + report['comment'] + "</p>" +
                   "<p>Number of graded assignments: " + report['count'] + "</p>" +
                   "<p>Average score: " +  report['avg'] + "</p>"

        } else {
            body = "<h4>The server did not return any grade information</h4>";
        }
        var html = '<div class="modal fade">' +
            '  <div class="modal-dialog compare-modal">' +
            '    <div class="modal-content">' +
            '      <div class="modal-header">' +
            '        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
            '        <h4 class="modal-title">Assignment Feedback</h4>' +
            '      </div>' +
            '      <div class="modal-body">' +
            body +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '</div>';

        el = $(html);
        el.modal();
    };
    var data = {'div_id': this.divid};
    jQuery.get(eBookConfig.ajaxURL + 'getassignmentgrade', data, showGradeSummary);
};

ActiveCode.prototype.hideCodelens = function (button, div_id) {
    this.codelens.style.display = 'none'
};

ActiveCode.prototype.showCodelens = function () {

    if (this.codelens.style.display == 'none') {
        this.codelens.style.display = 'block';
        this.clButton.innerText = "Hide Codelens";
    } else {
        this.codelens.style.display = "none";
        this.clButton.innerText = "Show in Codelens";
        return;
    }

    var cl = this.codelens.firstChild;
    if (cl) {
        div.removeChild(cl)
    }
    var code = this.editor.getValue();
    var myVars = {};
    myVars.code = code;
    myVars.origin = "opt-frontend.js";
    myVars.cumulative = false;
    myVars.heapPrimitives = false;
    myVars.drawParentPointers = false;
    myVars.textReferences = false;
    myVars.showOnlyOutputs = false;
    myVars.rawInputLstJSON = JSON.stringify([]);
    if (this.python3) {
        myVars.py = 3;
    } else {
        myVars.py = 2;
    }
    myVars.curInstr = 0;
    myVars.codeDivWidth = 350;
    myVars.codeDivHeight = 400;
    var srcURL = '//pythontutor.com/iframe-embed.html';
    var embedUrlStr = $.param.fragment(srcURL, myVars, 2 /* clobber all */);
    var myIframe = document.createElement('iframe');
    myIframe.setAttribute("id", this.divid + '_codelens');
    myIframe.setAttribute("width", "800");
    myIframe.setAttribute("height", "500");
    myIframe.setAttribute("style", "display:block");
    myIframe.style.background = '#fff';
    //myIframe.setAttribute("src",srcURL)
    myIframe.src = embedUrlStr;
    this.codelens.appendChild(myIframe);
    this.logBookEvent({
        'event': 'codelens',
        'act': 'view',
        'div_id': this.divid
    });

};

// <iframe id="%(divid)s_codelens" width="800" height="500" style="display:block"src="#">
// </iframe>


ActiveCode.prototype.showCodeCoach = function () {
    var myIframe;
    var srcURL;
    var cl;
    var div_id = this.divid;
    if (this.codecoach === null) {
        this.codecoach = document.createElement("div");
        this.codecoach.style.display = 'block'
    }

    cl = this.codecoach.firstChild;
    if (cl) {
        this.codecoach.removeChild(cl)
    }

    srcURL = eBookConfig.app + '/admin/diffviewer?divid=' + div_id;
    myIframe = document.createElement('iframe');
    myIframe.setAttribute("id", div_id + '_coach');
    myIframe.setAttribute("width", "800px");
    myIframe.setAttribute("height", "500px");
    myIframe.setAttribute("style", "display:block");
    myIframe.style.background = '#fff';
    myIframe.style.width = "100%";
    myIframe.src = srcURL;
    this.codecoach.appendChild(myIframe);
    $(this.codecoach).show()
    this.logBookEvent({
        'event': 'coach',
        'act': 'view',
        'div_id': this.divid
    });
};


ActiveCode.prototype.toggleEditorVisibility = function () {

};

ActiveCode.prototype.addErrorMessage = function (err) {
    //logRunEvent({'div_id': this.divid, 'code': this.prog, 'errinfo': err.toString()}); // Log the run event
    var errHead = $('<h3>').html('Error');
    this.eContainer = this.outerDiv.appendChild(document.createElement('div'));
    this.eContainer.className = 'error alert alert-danger';
    this.eContainer.id = this.divid + '_errinfo';
    this.eContainer.appendChild(errHead[0]);
    var errText = this.eContainer.appendChild(document.createElement('pre'));
    var errString = err.toString();
    var to = errString.indexOf(":");
    var errName = errString.substring(0, to);
    errText.innerHTML = errString;
    $(this.eContainer).append('<h3>Description</h3>');
    var errDesc = this.eContainer.appendChild(document.createElement('p'));
    errDesc.innerHTML = errorText[errName];
    $(this.eContainer).append('<h3>To Fix</h3>');
    var errFix = this.eContainer.appendChild(document.createElement('p'));
    errFix.innerHTML = errorText[errName + 'Fix'];
    $(this.eContainer).append('<h3>More Resources</h3>');       
    var errRes = this.eContainer.appendChild(document.createElement('div'));        
    errRes.innerHTML = "<a href=" + errorText[errName + "Resource"] + '>' + errorText[errName + "Resource"] +'</a>';
    var moreInfo = '../ErrorHelp/' + errName.toLowerCase() + '.html';
    //console.log("Runtime Error: " + err.toString());
};



var errorText = {};

errorText.ParseError = "A parse error means that Python does not understand the syntax on the line the error message points out.  Common examples are forgetting commas beteween arguments or forgetting a : on a for statement";
errorText.ParseErrorFix = "To fix a parse error you just need to look carefully at the line with the error and possibly the line before it.  Make sure it conforms to all of Python's rules.";
errorText.ParseErrorResource = "https://docs.python.org/3/tutorial/errors.html#syntax-errors";
errorText.TypeError = "Type errors most often occur when an expression tries to combine two objects with types that should not be combined.  Like raising a string to a power";
errorText.TypeErrorFix = "To fix a type error you will most likely need to trace through your code and make sure the variables have the types you expect them to have.  It may be helpful to print out each variable along the way to be sure its value is what you think it should be.";
errorText.TypeErrorResource = "https://docs.python.org/2/library/exceptions.html#exceptions.TypeError";
errorText.NameError = "A name error almost always means that you have used a variable before it has a value.  Often this may be a simple typo, so check the spelling carefully.";
errorText.NameErrorFix = "Check the right hand side of assignment statements and your function calls, this is the most likely place for a NameError to be found.";
errorText.NameErrorResource = "https://docs.python.org/2/library/exceptions.html#exceptions.NameError";
errorText.ValueError = "A ValueError most often occurs when you pass a parameter to a function and the function is expecting one type and you pass another.";
errorText.ValueErrorFix = "The error message gives you a pretty good hint about the name of the function as well as the value that is incorrect.  Look at the error message closely and then trace back to the variable containing the problematic value.";
errorText.ValueErrorResource = "https://docs.python.org/2/library/exceptions.html#exceptions.ValueError";
errorText.AttributeError = "This error message is telling you that the object on the left hand side of the dot, does not have the attribute or method on the right hand side.";
errorText.AttributeErrorFix = "The most common variant of this message is that the object undefined does not have attribute X.  This tells you that the object on the left hand side of the dot is not what you think. Trace the variable back and print it out in various places until you discover where it becomes undefined.  Otherwise check the attribute on the right hand side of the dot for a typo.";
errorText.AttributeErrorResource = "https://docs.python.org/2/library/exceptions.html#exceptions.AttributeError";
errorText.TokenError = "Most of the time this error indicates that you have forgotten a right parenthesis or have forgotten to close a pair of quotes.";
errorText.TokenErrorFix = "Check each line of your program and make sure that your parenthesis are balanced.";
errorText.TokenErrorResource = "https://docs.python.org/2/library/exceptions.html#exceptions.TokenError";
errorText.TimeLimitError = "Your program is running too long.  Most programs in this book should run in less than 10 seconds easily. This probably indicates your program is in an infinite loop.";
errorText.TimeLimitErrorFix = "Add some print statements to figure out if your program is in an infinte loop.  If it is not you can increase the run time with sys.setExecutionLimit(msecs)";
errorText.TimeLimitErrorResource = "http://stackoverflow.com/questions/3831341/why-does-this-go-into-an-infinite-loop?rq=1";
errorText.Error = "Your program is running for too long.  Most programs in this book should run in less than 30 seconds easily. This probably indicates your program is in an infinite loop.";
errorText.ErrorFix = "Add some print statements to figure out if your program is in an infinte loop.  If it is not you can increase the run time with sys.setExecutionLimit(msecs)";
errorText.ErrorFixResource = "http://stackoverflow.com/questions/3831341/why-does-this-go-into-an-infinite-loop?rq=1";
errorText.SyntaxError = "This message indicates that Python can't figure out the syntax of a particular statement.  Some examples are assigning to a literal, or a function call";
errorText.SyntaxErrorFix = "Check your assignment statments and make sure that the left hand side of the assignment is a variable, not a literal or a function.";
errorText.SyntaxErrorResource = "https://docs.python.org/3/tutorial/errors.html#syntax-errors";
errorText.IndexError = "This message means that you are trying to index past the end of a string or a list.  For example if your list has 3 things in it and you try to access the item at position 3 or more.";
errorText.IndexErrorFix = "Remember that the first item in a list or string is at index position 0, quite often this message comes about because you are off by one.  Remember in a list of length 3 the last legal index is 2";
errorText.IndexErrorResource = "https://docs.python.org/2/library/exceptions.html#exceptions.IndexError";
errorText.URIError = "";
errorText.URIErrorFix = "";
errorText.URIErrorResource = "http://stackoverflow.com/questions/13221978/getting-error-redirect-uri-mismatch-the-redirect-uri-in-the-request-http-loc";
errorText.ImportError = "This error message indicates that you are trying to import a module that does not exist";
errorText.ImportErrorFix = "One problem may simply be that you have a typo.  It may also be that you are trying to import a module that exists in 'real' Python, but does not exist in this book.  If this is the case, please submit a feature request to have the module added.";
errorText.ImportErrorResource = "https://docs.python.org/2/library/exceptions.html#exceptions.ImportError";
errorText.ReferenceError = "This is most likely an internal error, particularly if the message references the console.";
errorText.ReferenceErrorFix = "Try refreshing the webpage, and if the error continues, submit a bug report along with your code";
errorText.ReferenceErrorResource = "https://docs.python.org/2/library/exceptions.html#exceptions.ReferenceError";
errorText.ZeroDivisionError = "This tells you that you are trying to divide by 0. Typically this is because the value of the variable in the denominator of a division expression has the value 0";
errorText.ZeroDivisionErrorFix = "You may need to protect against dividing by 0 with an if statment, or you may need to rexamine your assumptions about the legal values of variables, it could be an earlier statment that is unexpectedly assigning a value of zero to the variable in question.";
errorText.ZeroDivisionErrorResource = "https://docs.python.org/2/library/exceptions.html#exceptions.ZeroDivisionError";
errorText.RangeError = "This message almost always shows up in the form of Maximum call stack size exceeded.";
errorText.RangeErrorFix = "This always occurs when a function calls itself.  Its pretty likely that you are not doing this on purpose. Except in the chapter on recursion.  If you are in that chapter then its likely you haven't identified a good base case.";
errorText.RangeErrorResource = "https://docs.python.org/2/library/exceptions.html#exceptions.RangeError";
errorText.InternalError = "An Internal error may mean that you've triggered a bug in our Python";
errorText.InternalErrorFix = "Report this error, along with your code as a bug.";
errorText.IndentationError = "This error occurs when you have not indented your code properly.  This is most likely to happen as part of an if, for, while or def statement.";
errorText.IndentationErrorFix = "Check your if, def, for, and while statements to be sure the lines are properly indented beneath them.  Another source of this error comes from copying and pasting code where you have accidentally left some bits of code lying around that don't belong there anymore.";
errorText.IndentationErrorResource = "https://docs.python.org/2/library/exceptions.html#exceptions.IndentationError";
errorText.NotImplementedError = "This error occurs when you try to use a builtin function of Python that has not been implemented in this in-browser version of Python.";
errorText.NotImplementedErrorFix = "For now the only way to fix this is to not use the function.  There may be workarounds.  If you really need this builtin function then file a bug report and tell us how you are trying to use the function.";




ActiveCode.prototype.setTimeLimit = function (timer) {
    var timelimit = this.timelimit;
    if (timer !== undefined ) {
        timelimit = timer
    }
    // set execLimit in milliseconds  -- for student projects set this to
    // 25 seconds -- just less than Chrome's own timer.
    if (this.code.indexOf('ontimer') > -1 ||
        this.code.indexOf('onclick') > -1 ||
        this.code.indexOf('onkey') > -1  ||
        this.code.indexOf('setDelay') > -1 ) {
        Sk.execLimit = null;
    } else {
        if (timelimit === "off") {
            Sk.execLimit = null;
        } else if (timelimit) {
            Sk.execLimit = timelimit;
        } else {
            Sk.execLimit = 25000;
    }
    }

};

ActiveCode.prototype.builtinRead = function (x) {
        if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
            throw "File not found: '" + x + "'";
        return Sk.builtinFiles["files"][x];
};

ActiveCode.prototype.outputfun = function(text) {
    // bnm python 3
    pyStr = function(x) {
        if (x instanceof Array) {
            return '[' + x.join(", ") + ']';
        } else {
            return x
        }
    }

    var x = text;
    if (! this.python3 ) {
        if (x.charAt(0) == '(') {
            x = x.slice(1, -1);
            x = '[' + x + ']';
            try {
                var xl = eval(x);
                xl = xl.map(pyStr);
                x = xl.join(' ');
            } catch (err) {
            }
        }
    }
    $(this.output).css("visibility","visible");
    text = x;
    text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
        $(this.output).append(text);
    };

ActiveCode.prototype.buildProg = function() {
    // assemble code from prefix, suffix, and editor for running.
    var pretext;
    var prog = this.editor.getValue();
    this.pretext = "";
    if (this.includes !== undefined) {
        // iterate over the includes, in-order prepending to prog
        pretext = "";
        for (var x=0; x < this.includes.length; x++) {
            pretext = pretext + edList[this.includes[x]].editor.getValue();
            }
        this.pretext = pretext;
        prog = pretext + prog
    }

    if(this.suffix) {
        prog = prog + this.suffix;
}

    return prog;
};

ActiveCode.prototype.runProg = function() {
        var prog = this.buildProg();
        var saveCode = true;

        $(this.output).text('');

        $(this.eContainer).remove();
        Sk.configure({output : this.outputfun.bind(this),
              read   : this.builtinRead,
              python3: this.python3,
              imageProxy : 'http://image.runestone.academy:8080/320x',
              inputfunTakesPrompt: true,
        });
        Sk.divid = this.divid;
        this.setTimeLimit();
        (Sk.TurtleGraphics || (Sk.TurtleGraphics = {})).target = this.graphics;
        Sk.canvas = this.graphics.id; //todo: get rid of this here and in image
        $(this.runButton).attr('disabled', 'disabled');
        $(this.codeDiv).switchClass("col-md-12","col-md-7",{duration:500,queue:false});
        $(this.outDiv).show({duration:700,queue:false});

        if (this.historyScrubber === null && !this.autorun) {
            dfd = this.addHistoryScrubber();
        } else {
            dfd = jQuery.Deferred();
            dfd.resolve();
        }

        hresolver = jQuery.Deferred();
        dfd.done((function() {
                if (this.historyScrubber && (this.history[$(this.historyScrubber).slider("value")] != this.editor.getValue())) {
                    saveCode = "True";
                    this.history.push(this.editor.getValue());
                    this.timestamps.push((new Date()).toLocaleString());
                    $(this.historyScrubber).slider("option", "max", this.history.length - 1)
                    $(this.historyScrubber).slider("option", "value", this.history.length - 1)
                } else {
                    saveCode = "False";
                }

                if (this.historyScrubber == null) {
                    saveCode = "False";
                }
                hresolver.resolve();
            }).bind(this));


        var myPromise = Sk.misceval.asyncToPromise(function() {

            return Sk.importMainWithBody("<stdin>", false, prog, true);
        });

        // Make sure that the history scrubber is fully initialized AND the code has been run
        // before we start logging stuff.
        Promise.all([myPromise,hresolver]).then((function(mod) { // success
            $(this.runButton).removeAttr('disabled');
            this.logRunEvent({'div_id': this.divid, 'code': this.editor.getValue(), 'errinfo': 'success', 'to_save':saveCode, 'prefix': this.pretext, 'suffix':this.suffix}); // Log the run event
        }).bind(this),
            (function(err) {  // fail
            $(this.runButton).removeAttr('disabled');
            this.logRunEvent({'div_id': this.divid, 'code': this.editor.getValue(), 'errinfo': err.toString(), 'to_save':saveCode, 'prefix': this.pretext, 'suffix':this.suffix}); // Log the run event
            this.addErrorMessage(err)
                }).bind(this));


        if (typeof(allVisualizers) != "undefined") {
            $.each(allVisualizers, function (i, e) {
                e.redrawConnectors();
                });
            }

    };




JSActiveCode.prototype = new ActiveCode();

function JSActiveCode(opts) {
    if (opts) {
        this.init(opts)
        }
    }

JSActiveCode.prototype.init = function(opts) {
    ActiveCode.prototype.init.apply(this,arguments)
    }

JSActiveCode.prototype.outputfun = function (a) {
    $(this.output).css("visibility","visible");
    var str = "[";
    if (typeof(a) == "object" && a.length) {
        for (var i = 0; i < a.length; i++)
            if (typeof(a[i]) == "object" && a[i].length) {
                str += (i == 0 ? "" : " ") + "[";
                for (var j = 0; j < a[i].length; j++)
                    str += a[i][j] + (j == a[i].length - 1 ?
                    "]" + (i == a.length - 1 ? "]" : ",") + "\n" : ", ");
            } else str += a[i] + (i == a.length - 1 ? "]" : ", ");
        } else {
    try {
            str = JSON.stringify(a);
    } catch (e) {
            str = a;
    }
    }
    return str;
};

JSActiveCode.prototype.runProg = function() {
    var _this = this;
    var prog = this.buildProg();

    var write = function(str) {
        _this.output.innerHTML += _this.outputfun(str);
    };

    var writeln = function(str) {
        if (!str) str="";
        _this.output.innerHTML += _this.outputfun(str)+"<br />";
            };

    $(this.eContainer).remove();
    $(this.output).text('');
    $(this.codeDiv).switchClass("col-md-12","col-md-6",{duration:500,queue:false});
    $(this.outDiv).show({duration:700,queue:false});

    try {
        eval(prog)
    } catch(e) {
        this.addErrorMessage(e);
    }

};

HTMLActiveCode.prototype = new ActiveCode();

function HTMLActiveCode (opts) {
    if (opts) {
        this.init(opts);
    }
}

HTMLActiveCode.prototype.runProg = function () {
    var prog = this.buildProg();

//    $('#'+myDiv+'_iframe').remove();
//    $('#'+myDiv+'_htmlout').show();
//    $('#'+myDiv+'_htmlout').append('<iframe class="activehtml" id="' + myDiv + '_iframe" srcdoc="' +
//        prog.replace(/"/g,"'") + '">' + '</iframe>');
    $(this.output).text('');
    if (! this.alignVertical ) {
        $(this.codeDiv).switchClass("col-md-12", "col-md-6", {duration: 500, queue: false});
    }
    $(this.outDiv).show({duration:700,queue:false});
    prog = "<script type=text/javascript>window.onerror = function(msg,url,line) {alert(msg+' on line: '+line);};</script>" + prog;
    this.output.srcdoc = prog;

};

HTMLActiveCode.prototype.init = function(opts) {
    ActiveCode.prototype.init.apply(this,arguments);
    this.code = $('<textarea />').html(this.origElem.innerHTML).text();
    $(this.runButton).text('Render');
    this.editor.setValue(this.code);
};

HTMLActiveCode.prototype.createOutput = function () {
    var outDiv = document.createElement("div");
    $(outDiv).addClass("ac_output");
    if(this.alignVertical) {
        $(outDiv).addClass("col-md-12");
    } else {
        $(outDiv).addClass("col-md-5");
    }
    this.outDiv = outDiv;
    this.output = document.createElement('iframe');
    $(this.output).css("background-color","white");
    $(this.output).css("position","relative");
    $(this.output).css("height","400px");
    $(this.output).css("width","100%");
    outDiv.appendChild(this.output);
    this.outerDiv.appendChild(outDiv);

    clearDiv = document.createElement("div");
    $(clearDiv).css("clear","both");  // needed to make parent div resize properly
    this.outerDiv.appendChild(clearDiv);

};


String.prototype.replaceAll = function (target, replacement) {
    return this.split(target).join(replacement);
};

AudioTour.prototype = new RunestoneBase();

// function to display the audio tours
function AudioTour (divid, code, bnum, audio_text) {
    this.elem = null; // current audio element playing
    this.currIndex; // current index
    this.len; // current length of audio files for tour
    this.buttonCount; // number of audio tour buttons
    this.aname; // the audio file name
    this.ahash; // hash of the audio file name to the lines to highlight
    this.theDivid; // div id
    this.afile; // file name for audio
    this.playing = false; // flag to say if playing or not
    this.tourName;

    // Replacing has been done here to make sure special characters in the code are displayed correctly
    code = code.replaceAll("*doubleq*", "\"");
    code = code.replaceAll("*singleq*", "'");
    code = code.replaceAll("*open*", "(");
    code = code.replaceAll("*close*", ")");
    code = code.replaceAll("*nline*", "<br/>");
    var codeArray = code.split("\n");

    var audio_hash = new Array();
    var bval = new Array();
    var atype = audio_text.replaceAll("*doubleq*", "\"");
    var audio_type = atype.split("*atype*");
    for (var i = 0; i < audio_type.length - 1; i++) {
        audio_hash[i] = audio_type[i];
        var aword = audio_type[i].split(";");
        bval.push(aword[0]);
    }

    var first = "<pre><div id='" + divid + "_l1'>" + "1.   " + codeArray[0] + "</div>";
    num_lines = codeArray.length;
    for (var i = 1; i < num_lines; i++) {
        if (i < 9) {
            first = first + "<div id='" + divid + "_l" + (i + 1) + "'>" + (i + 1) + ".   " + codeArray[i] + "</div>";
        }
        else if (i < 99) {
            first = first + "<div id='" + divid + "_l" + (i + 1) + "'>" + (i + 1) + ".  " + codeArray[i] + "</div>";
        }
        else {
            first = first + "<div id='" + divid + "_l" + (i + 1) + "'>" + (i + 1) + ". " + codeArray[i] + "</div>";
        }
    }
    first = first + "</pre>";

    //laying out the HTML content

    var bcount = 0;
    var html_string = "<div class='modal-lightsout'></div><div class='modal-profile'><h3>Take an audio tour!</h3><div class='modal-close-profile'></div><p id='windowcode'></p><p id='" + divid + "_audiocode'></p>";
    html_string += "<p id='status'></p>";
    html_string += "<input type='image' src='../_static/first.png' width='25' id='first_audio' name='first_audio' title='Play first audio in tour' alt='Play first audio in tour' onerror=\"this.onerror=null;this.src='_static/first.png'\" disabled/>" +
                   "<input type='image' src='../_static/prev.png' width='25' id='prev_audio' name='prev_audio' title='Play previous audio in tour' alt='Play previous audio in tour' onerror=\"this.onerror=null;this.src='_static/prev.png'\" disabled/>" +
                   "<input type='image' src='../_static/pause.png' width='25' id='pause_audio' name='pause_audio' title='Pause current audio' alt='Pause current audio' onerror=\"this.onerror=null;this.src='_static/pause.png'\" disabled/>" + "" +
                   "<input type='image' src='../_static/next.png' width ='25' id='next_audio' name='next_audio' title='Play next audio in tour' alt='Play next audio in tour' onerror=\"this.onerror=null;this.src='_static/next.png'\" disabled/>" +
                   "<input type='image' src='../_static/last.png' width ='25' id='last_audio' name='last_audio' title='Play last audio in tour' alt='Play last audio in tour' onerror=\"this.onerror=null;this.src='_static/last.png'\" disabled/><br/>";
    for (var i = 0; i < audio_type.length - 1; i++) {
        html_string += "<input type='button' style='margin-right:5px;' class='btn btn-default btn-sm' id='button_audio_" + i + "' name='button_audio_" + i + "' value=" + bval[i] + " />";
        bcount++;
    }
    //html_string += "<p id='hightest'></p><p id='hightest1'></p><br/><br/><p id='test'></p><br/><p id='audi'></p></div>";
    html_string += "</div>";

    var tourdiv = document.createElement('div');
    document.body.appendChild(tourdiv);
    $(tourdiv).html(html_string);
    $('#windowcode').html(first);

    // Position modal box
    $.fn.center = function () {
        this.css("position", "absolute");
        // y position
        this.css("top", ($(window).scrollTop() + $(navbar).height() + 10 + "px"));
        // show window on the left so that you can see the output from the code still
        this.css("left", ($(window).scrollLeft() + "px"));
        return this;
    };

    $(".modal-profile").center();
    $('.modal-profile').fadeIn("slow");
    //$('.modal-lightsout').css("height", $(document).height());
    $('.modal-lightsout').fadeTo("slow", .5);
    $('.modal-close-profile').show();

    // closes modal box once close link is clicked, or if the lights out divis clicked
    $('.modal-close-profile, .modal-lightsout').click( (function () {
        if (this.playing) {
            this.elem.pause();
        }
        //log change to db
        this.logBookEvent({'event': 'Audio', 'act': 'closeWindow', 'div_id': divid});
        $('.modal-profile').fadeOut("slow");
        $('.modal-lightsout').fadeOut("slow");
        document.body.removeChild(tourdiv);
    }).bind(this));

    // Accommodate buttons for a maximum of five tours

    $('#' + 'button_audio_0').click((function () {
        this.tour(divid, audio_hash[0], bcount);
    }).bind(this));
    $('#' + 'button_audio_1').click((function () {
        this.tour(divid, audio_hash[1], bcount);
    }).bind(this));
    $('#' + 'button_audio_2').click((function () {
        this.tour(divid, audio_hash[2], bcount);
    }).bind(this));
    $('#' + 'button_audio_3').click((function () {
        this.tour(divid, audio_hash[3], bcount);
    }).bind(this));
    $('#' + 'button_audio_4').click((function () {
        this.tour(divid, audio_hash[4], bcount);
    }).bind(this));

    // handle the click to go to the next audio
    $('#first_audio').click((function () {
        this.firstAudio();
    }).bind(this));

    // handle the click to go to the next audio
    $('#prev_audio').click((function () {
        this.prevAudio();
    }).bind(this));

    // handle the click to pause or play the audio
    $('#pause_audio').click((function () {
        this.pauseAndPlayAudio();
    }).bind(this));

    // handle the click to go to the next audio
    $('#next_audio').click((function () {
        this.nextAudio();
    }).bind(this));

    // handle the click to go to the next audio
    $('#last_audio').click((function () {
        this.lastAudio();
    }).bind(this));

    // make the image buttons look disabled
    $("#first_audio").css('opacity', 0.25);
    $("#prev_audio").css('opacity', 0.25);
    $("#pause_audio").css('opacity', 0.25);
    $("#next_audio").css('opacity', 0.25);
    $("#last_audio").css('opacity', 0.25);

}

AudioTour.prototype.tour = function (divid, audio_type, bcount) {
    // set globals
    this.buttonCount = bcount;
    this.theDivid = divid;

    // enable prev, pause/play and next buttons and make visible
    $('#first_audio').removeAttr('disabled');
    $('#prev_audio').removeAttr('disabled');
    $('#pause_audio').removeAttr('disabled');
    $('#next_audio').removeAttr('disabled');
    $('#last_audio').removeAttr('disabled');
    $("#first_audio").css('opacity', 1.0);
    $("#prev_audio").css('opacity', 1.0);
    $("#pause_audio").css('opacity', 1.0);
    $("#next_audio").css('opacity', 1.0);
    $("#last_audio").css('opacity', 1.0);

    // disable tour buttons
    for (var i = 0; i < bcount; i++)
        $('#button_audio_' + i).attr('disabled', 'disabled');

    var atype = audio_type.split(";");
    var name = atype[0].replaceAll("\"", " ");
    this.tourName = name;
    $('#status').html("Starting the " + name);

    //log tour type to db
    this.logBookEvent({'event': 'Audio', 'act': name, 'div_id': divid});

    var max = atype.length;
    var str = "";
    this.ahash = new Array();
    this.aname = new Array();
    for (i = 1; i < max - 1; i++) {
        var temp = atype[i].split(":");
        var temp_line = temp[0];
        var temp_aname = temp[1];

        var akey = temp_aname.substring(1, temp_aname.length);
        var lnums = temp_line.substring(1, temp_line.length);

        //alert("akey:"+akey+"lnum:"+lnums);

        // str+="<audio id="+akey+" preload='auto'><source src='http://ice-web.cc.gatech.edu/ce21/audio/"+
        // akey+".mp3' type='audio/mpeg'><source src='http://ice-web.cc.gatech.edu/ce21/audio/"+akey+
        // ".ogg' type='audio/ogg'>Your browser does not support the audio tag</audio>";

        var dir = "http://media.interactivepython.org/" + eBookConfig.basecourse + "/audio/"
        //var dir = "../_static/audio/"
        str += "<audio id=" + akey + " preload='auto' >";
        str += "<source src='" + dir + akey + ".wav' type='audio/wav'>";
        str += "<source src='" + dir + akey + ".mp3' type='audio/mpeg'>";
        str += "<source src='" + dir + akey + ".wav' type='audio/wav'>";
        str += "<source src='" + dir + akey + ".mp3' type='audio/mpeg'>";
        str +=  "<br />Your browser does not support the audio tag</audio>";
        this.ahash[akey] = lnums;
        this.aname.push(akey);
    }
    var ahtml = "#" + divid + "_audiocode";
    $(ahtml).html(str); // set the html to the audio tags
    this.len = this.aname.length; // set the number of audio file in the tour

    // start at the first audio
    this.currIndex = 0;

    // play the first audio in the tour
    this.playCurrIndexAudio();
};

AudioTour.prototype.handlePlaying = function() {

    // if this.playing audio pause it
    if (this.playing) {

        this.elem.pause();

        // unbind current ended
        $('#' + this.afile).unbind('ended');

        // unhighlight the prev lines
        this.unhighlightLines(this.theDivid, this.ahash[this.aname[this.currIndex]]);
    }

};

AudioTour.prototype.firstAudio = function () {

    // if audio is this.playing handle it
    this.handlePlaying();

    //log change to db
    this.logBookEvent({'event': 'Audio', 'act': 'first', 'div_id': this.theDivid});


    // move to the first audio
    this.currIndex = 0;

    // start at the first audio
    this.playCurrIndexAudio();

};

AudioTour.prototype.prevAudio = function () {

    // if there is a previous audio
    if (this.currIndex > 0) {

        // if audio is this.playing handle it
        this.handlePlaying();

        //log change to db
        this.logBookEvent({'event': 'Audio', 'act': 'prev', 'div_id': this.theDivid});


        // move to previous to the current (but the current index has moved to the next)
        this.currIndex = this.currIndex - 1;

        // start at the prev audio
        this.playCurrIndexAudio();
    }

};

AudioTour.prototype.nextAudio = function () {

    // if audio is this.playing handle it
    this.handlePlaying();

    //log change to db
    this.logBookEvent({'event': 'Audio', 'act': 'next', 'div_id': this.theDivid});

    // if not at the end
    if (this.currIndex < (this.len - 1)) {
        // start at the next audio
        this.currIndex = this.currIndex + 1;
        this.playCurrIndexAudio();
    }
    else if (this.currIndex == (this.len - 1)) {
        this.handleTourEnd();
    }
};

AudioTour.prototype.lastAudio = function () {

    // if audio is this.playing handle it
    this.handlePlaying();

    //log change to db
    this.logBookEvent({'event': 'Audio', 'act': 'last', 'div_id': this.theDivid});

    // move to the last audio
    this.currIndex = this.len - 1;

    // start at last
    this.playCurrIndexAudio();

};

// play the audio at the current index
AudioTour.prototype.playCurrIndexAudio = function () {

    // set this.playing to false
    this.playing = false;

    // play the current audio and highlight the lines
    this.playaudio(this.currIndex, this.aname, this.theDivid, this.ahash);

};

// handle the end of the tour
AudioTour.prototype.handleTourEnd = function () {

    $('#status').html(" The " + this.tourName + " Ended");

    // disable the prev, pause/play, and next buttons and make them more invisible
    $('#first_audio').attr('disabled', 'disabled');
    $('#prev_audio').attr('disabled', 'disabled');
    $('#pause_audio').attr('disabled', 'disabled');
    $('#next_audio').attr('disabled', 'disabled');
    $('#last_audio').attr('disabled', 'disabled');
    $("#first_audio").css('opacity', 0.25);
    $("#prev_audio").css('opacity', 0.25);
    $("#pause_audio").css('opacity', 0.25);
    $("#next_audio").css('opacity', 0.25);
    $("#last_audio").css('opacity', 0.25);

    // enable the tour buttons
    for (var j = 0; j < this.buttonCount; j++)
        $('#button_audio_' + j).removeAttr('disabled');
};

// only call this one after the first time
AudioTour.prototype.outerAudio = function () {

    // unbind ended
    $('#' + this.afile).unbind('ended');

    // set this.playing to false
    this.playing = false;

    // unhighlight previous lines from the last audio
    this.unhighlightLines(this.theDivid, this.ahash[this.aname[this.currIndex]]);

    // increment the this.currIndex to point to the next one
    this.currIndex++;

    // if the end of the tour reset the buttons
    if (this.currIndex == this.len) {
        this.handleTourEnd();
    }

    // else not done yet so play the next audio
    else {

        // play the audio at the current index
        this.playCurrIndexAudio();
    }
};

// play the audio now that it is ready
AudioTour.prototype.playWhenReady = function (afile, divid, ahash) {
    // unbind current
    $('#' + afile).unbind('canplaythrough');
    //console.log("in playWhenReady " + elem.duration);

    $('#status').html("Playing the " + this.tourName);
    this.elem.currentTime = 0;
    this.highlightLines(divid, ahash[afile]);
    $('#' + afile).bind('ended', (function () {
        this.outerAudio();
    }).bind(this));
    this.playing = true;
    this.elem.play();

};


// play the audio at the specified index i and set the duration and highlight the lines
AudioTour.prototype.playaudio = function (i, aname, divid, ahash) {
    this.afile = aname[i];
    this.elem = document.getElementById(this.afile);

    // if this isn't ready to play yet - no duration yet then wait
    //console.log("in playaudio " + elem.duration);
    if (isNaN(this.elem.duration) || this.elem.duration == 0) {
        // set the status
        $('#status').html("Loading audio.  Please wait.   If it doesn't start soon close this window (click on the red X) and try again");
        $('#' + this.afile).bind('canplaythrough', (function () {
            this.playWhenReady(this.afile, divid, ahash);
        }).bind(this));
    }
    // otherwise it is ready so play it
    else {
        this.playWhenReady(this.afile, divid, ahash);
    }
};

// pause if this.playing and play if paused
AudioTour.prototype.pauseAndPlayAudio = function () {
    var btn = document.getElementById('pause_audio');

    // if paused and clicked then continue from current
    if (this.elem.paused) {
        // calcualte the time left to play in milliseconds
        counter = (this.elem.duration - this.elem.currentTime) * 1000;
        this.elem.play(); // start the audio from current spot
        document.getElementById("pause_audio").src = "../_static/pause.png";
        document.getElementById("pause_audio").title = "Pause current audio";
        //log change to db
        this.logBookEvent({'event': 'Audio', 'act': 'play', 'div_id': this.theDivid});
    }

    // if audio was this.playing pause it
    else if (this.playing) {
        this.elem.pause(); // pause the audio
        document.getElementById("pause_audio").src = "../_static/play.png";
        document.getElementById("pause_audio").title = "Play paused audio";
        //log change to db
        this.logBookEvent({'event': 'Audio', 'act': 'pause', 'div_id': this.theDivid});
    }

};

// process the lines
AudioTour.prototype.processLines = function (divid, lnum, color) {
    var comma = lnum.split(",");

    if (comma.length > 1) {
        for (i = 0; i < comma.length; i++) {
            this.setBackgroundForLines(divid, comma[i], color);
        }
    }
    else {
        this.setBackgroundForLines(divid, lnum, color);
    }
};

// unhighlight the lines - set the background back to transparent
AudioTour.prototype.unhighlightLines = function (divid, lnum) {
    this.processLines(divid, lnum, 'transparent');
};

// highlight the lines - set the background to a yellow color
AudioTour.prototype.highlightLines = function (divid, lnum) {
    this.processLines(divid, lnum, '#ffff99');
};

// set the background to the passed color
AudioTour.prototype.setBackgroundForLines = function (divid, lnum, color) {
    var hyphen = lnum.split("-");

    // if a range of lines
    if (hyphen.length > 1) {
        var start = parseInt(hyphen[0]);
        var end = parseInt(hyphen[1]) + 1;
        for (var k = start; k < end; k++) {
            //alert(k);
            var str = "#" + divid + "_l" + k;
            if ($(str).text() != "") {
                $(str).css('background-color', color);
            }
            //$(str).effect("highlight",{},(dur*1000)+4500);
        }
    }
    else {
        //alert(lnum);
        var str = "#" + divid + "_l" + lnum;
        $(str).css('background-color', color);
        //$(str).effect("highlight",{},(dur*1000)+4500);
    }
};

//
//

LiveCode.prototype = new ActiveCode();

function LiveCode(opts) {
    if (opts) {
        this.init(opts)
        }
    }

LiveCode.prototype.init = function(opts) {
    ActiveCode.prototype.init.apply(this,arguments);

    var orig = opts.orig;
    this.stdin = $(orig).data('stdin');
    this.datafile = $(orig).data('datafile');
    this.sourcefile = $(orig).data('sourcefile');

    this.API_KEY = "67033pV7eUUvqo07OJDIV8UZ049aLEK1";
    this.USE_API_KEY = true;
    this.JOBE_SERVER = 'http://jobe2.cosc.canterbury.ac.nz';
    this.resource = '/jobe/index.php/restapi/runs/';
    this.div2id = {};
    if (this.stdin) {
        this.createInputElement();
    }
    this.createErrorOutput();
    };

LiveCode.prototype.outputfun = function (a) {};

LiveCode.prototype.createInputElement = function () {

    var label = document.createElement('label');
    label.for = this.divid + "_stdin";
    $(label).text("Input for Program");
    var input = document.createElement('input');
    input.id = this.divid + "_stdin";
    input.type = "text";
    input.size = "35";
    input.value = this.stdin;
    this.outerDiv.appendChild(label);
    this.outerDiv.appendChild(input);
    this.stdin_el = input;
};

LiveCode.prototype.createErrorOutput = function () {

};

LiveCode.prototype.runProg = function() {
        var xhr, stdin;
        var runspec = {};
        var data, host, source, editor;
        var sfilemap = {java: '', cpp: 'test.cpp', c: 'test.c', python3: 'test.py', python2: 'test.py'};

        xhr = new XMLHttpRequest();
        source = this.editor.getValue();

        if (this.stdin) {
            stdin = $(this.stdin_el).val();
        }

        if (! this.sourcefile ) {
            this.sourcefile = sfilemap[this.language];
        }

        runspec = {
            language_id: this.language,
            sourcecode: source,
            sourcefilename: this.sourcefile
        };


        if (stdin) {
            runspec.input = stdin
        }

        if (this.datafile) {
            this.pushDataFile(this.datafile);
            runspec['file_list'] = [[this.div2id[this.datafile],this.datafile]];
        }
        data = JSON.stringify({'run_spec': runspec});
        host = this.JOBE_SERVER + this.resource;

        var odiv = this.output;
        $(this.runButton).attr('disabled', 'disabled');
        $(this.codeDiv).switchClass("col-md-12","col-md-6",{duration:500,queue:false});
        $(this.outDiv).show({duration:700,queue:false});
        $(this.errDiv).remove();
        $(this.output).css("visibility","visible");

        xhr.open("POST", host, true);
        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('X-API-KEY', this.API_KEY);

        xhr.onload = (function () {
            var logresult;
            $(this.runButton).removeAttr('disabled');
            try {
                var result = JSON.parse(xhr.responseText);
            } catch (e) {
                result = {};
                result.outcome = -1;
            }

            if (result.outcome === 15) {
                logresult = 'success';
            } else {
                logresult = result.outcome;
            }
            this.logRunEvent({'div_id': this.divid, 'code': source, 'errinfo': logresult, 'event':'livecode'});
            switch (result.outcome) {
                case 15:
                    $(odiv).html(result.stdout.replace(/\n/g, "<br>"));
                    break;
                case 11: // compiler error
                    $(odiv).html("There were errors compiling your code. See below.");
                    this.addJobeErrorMessage(result.cmpinfo);
                    break;
                case 12:  // run time error
                    $(odiv).html(result.stdout.replace(/\n/g, "<br>"));
                    if (result.stderr) {
                        this.addJobeErrorMessage(result.stderr);
                    }
                    break;
                case 13:  // time limit
                    $(odiv).html(result.stdout.replace(/\n/g, "<br>"));
                    this.addJobeErrorMessage("Time Limit Exceeded on your program");
                    break;
                default:
                    if(result.stderr) {
                        $(odiv).html(result.stderr.replace(/\n/g, "<br>"));
                    } else {
                        this.addJobeErrorMessage("A server error occurred: " + xhr.status + " " + xhr.statusText);
                    }
            }

            // todo: handle server busy and timeout errors too
        }).bind(this);

        ///$("#" + divid + "_errinfo").remove();
        $(this.output).html("Compiling and Running your Code Now...");

        xhr.onerror = function () {
            this.addJobeErrorMessage("Error communicating with the server.");
            $(this.runButton).removeAttr('disabled');
        };

        xhr.send(data);
    };
LiveCode.prototype.addJobeErrorMessage = function (err) {
        var errHead = $('<h3>').html('Error');
        var eContainer = this.outerDiv.appendChild(document.createElement('div'));
        this.errDiv = eContainer;
        eContainer.className = 'error alert alert-danger';
        eContainer.id = this.divid + '_errinfo';
        eContainer.appendChild(errHead[0]);
        var errText = eContainer.appendChild(document.createElement('pre'));
        errText.innerHTML = err;
    };


LiveCode.prototype.pushDataFile = function (datadiv) {

        var file_id = 'runestone'+Math.floor(Math.random()*100000);
        var contents = $(document.getElementById(datadiv)).text();
        var contentsb64 = btoa(contents);
        var data = JSON.stringify({ 'file_contents' : contentsb64 });
        var resource = '/jobe/index.php/restapi/files/' + file_id;
        var host = this.JOBE_SERVER + resource;
        var xhr = new XMLHttpRequest();

        if (this.div2id[datadiv] === undefined ) {
            this.div2id[datadiv] = file_id;

            xhr.open("PUT", host, true);
            xhr.setRequestHeader('Content-type', 'application/json');
            xhr.setRequestHeader('Accept', 'text/plain');
            xhr.setRequestHeader('X-API-KEY', this.API_KEY);

            xhr.onload = function () {
                console.log("successfully sent file " + xhr.responseText);
            };

            xhr.onerror = function () {
                console.log("error sending file" + xhr.responseText);
            };

            xhr.send(data)
        }
    };

ACFactory = {};

ACFactory.createActiveCode = function (orig, lang, addopts) {
    var opts = {'orig' : orig, 'useRunestoneServices': eBookConfig.useRunestoneServices, 'python3' : eBookConfig.python3 };
    if (addopts) {
        for (var attrname in addopts) {
            opts[attrname] = addopts[attrname];
        }
    }
    if (lang === "javascript") {
        return new JSActiveCode(opts);
    } else if (lang === 'htmlmixed') {
        return new HTMLActiveCode(opts);
    } else if (['java', 'cpp', 'c', 'python3', 'python2'].indexOf(lang) > -1) {
        return new LiveCode(opts);
    } else {   // default is python
        return new ActiveCode(opts);
    }

}

// used by web2py controller(s)
ACFactory.addActiveCodeToDiv = function(outerdivid, acdivid, sid, initialcode, language) {
    var  thepre, newac;

    acdiv = document.getElementById(acdivid);
    $(acdiv).empty();
    thepre = document.createElement("textarea");
    thepre['data-component'] = "activecode";
    thepre.id = outerdivid;
    $(thepre).data('lang', language);
    $(acdiv).append(thepre);
    var opts = {'orig' : thepre, 'useRunestoneServices': true };
    addopts = {'sid': sid, 'graderactive':true};
    if(language === 'htmlmixed') {
        addopts['vertical'] = true;
    }
    newac = ACFactory.createActiveCode(thepre,language,addopts);
    savediv = newac.divid;
    //newac.divid = outerdivid;
    //newac.sid = sid;
    // if (! initialcode ) {
    //     newac.loadEditor();
    // } else {
    //     newac.editor.setValue(initialcode);
    //     setTimeout(function() {
    //             newac.editor.refresh();
    //         },500);
    // }
    newac.divid = savediv;
    newac.editor.setSize(500,300);
    setTimeout(function() {
            newac.editor.refresh();
        },500);

};

ACFactory.createScratchActivecode = function() {
    /* set up the scratch Activecode editor in the search menu */
    // use the URL to assign a divid - each page should have a unique Activecode block id.
    // Remove everything from the URL but the course and page name
    // todo:  this could probably be eliminated and simply moved to the template file
    var divid = document.URL.split('#')[0];
    if (divid.indexOf('static') > -1) {
        divid = divid.split('static')[1];
    } else {
        divid = divid.split('/');
        divid = divid.slice(-2).join("");
    }
    divid = divid.split('?')[0];  // remove any query string (e.g ?lastPosition)
    divid = divid.replaceAll('/', '').replace('.html', '').replace(':', '');
    eBookConfig.scratchDiv = divid;
    // generate the HTML
    var html = '<div id="ac_modal_' + divid + '" class="modal fade">' +
        '  <div class="modal-dialog scratch-ac-modal">' +
        '    <div class="modal-content">' +
        '      <div class="modal-header">' +
        '        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
        '        <h4 class="modal-title">Scratch ActiveCode</h4>' +
        '      </div> ' +
        '      <div class="modal-body">' +
        '      <textarea data-component="activecode" id="' + divid + '">' +
        '\n' +
        '\n' +
        '\n' +
        '      </textarea>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>';
    el = $(html);
    $('body').append(el);

    el.on('shown.bs.modal show.bs.modal', function () {
        el.find('.CodeMirror').each(function (i, e) {
            e.CodeMirror.refresh();
            e.CodeMirror.focus();
        });
    });

    //$(document).bind('keypress', '\\', function(evt) {
    //    ACFactory.toggleScratchActivecode();
    //    return false;
    //});
};


ACFactory.toggleScratchActivecode = function () {
    var divid = "ac_modal_" + eBookConfig.scratchDiv;
    var div = $("#" + divid);

    div.modal('toggle');

};

$(document).ready(function() {
    ACFactory.createScratchActivecode();
    $('[data-component=activecode]').each( function(index ) {
        if ($(this.parentNode).data("component") !== "timedAssessment" && $(this.parentNode.parentNode).data("component") !== "timedAssessment") {   // If this element exists within a timed component, don't render it here
            edList[this.id] = ACFactory.createActiveCode(this, $(this).data('lang'));
        }
    });
    if (loggedout) {
        for (k in edList) {
            edList[k].disableSaveLoad();
        }
    }

});

$(document).bind("runestone:login", function() {
    $(".run-button").text("Save & Run");
});

// This seems a bit hacky and possibly brittle, but its hard to know how long it will take to
// figure out the login/logout status of the user.  Sometimes its immediate, and sometimes its
// long.  So to be safe we'll do it both ways..
var loggedout;
$(document).bind("runestone:logout",function() { loggedout=true;});
$(document).bind("runestone:logout",function() {
    for (k in edList) {
        if (edList.hasOwnProperty(k)) {
            edList[k].disableSaveLoad();
        }
    }
});
