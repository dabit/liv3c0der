// Generated by CoffeeScript 1.6.2
(function() {
  var ImageList, LeapObserver, State,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  window.LC = {};

  LC.NOTES = [16.35, 17.32, 18.35, 19.45, 20.6, 21.83, 23.12, 24.5, 25.96, 27.5, 29.14, 30.87, 32.7, 34.65, 36.71, 38.89, 41.2, 43.65, 46.25, 49, 51.91, 55, 58.27, 61.74, 65.41, 69.3, 73.42, 77.78, 82.41, 87.31, 92.5, 98, 103.83, 110, 116.54, 123.47, 130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185, 196, 207.65, 220, 233.08, 246.94, 261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392, 415.3, 440, 466.16, 493.88, 523.25, 554.37, 587.33, 622.25, 659.26, 698.46, 739.99, 783.99, 830.61, 880, 932.33, 987.77, 1046.5, 1108.73, 1174.66, 1244.51, 1318.51, 1396.91, 1479.98, 1567.98, 1661.22, 1760, 1864.66, 1975.53, 2093, 2217.46, 2349.32, 2489.02, 2637.02, 2793.83, 2959.96, 3135.96, 3322.44, 3520, 3729.31, 3951.07, 4186.01, 4434.92, 4698.64, 4978];

  LC.clamp = function(v, min, max) {
    return Math.min(Math.max(v, min), max);
  };

  LC.hsla = function(h, s, l, a) {
    if (a == null) {
      a = 1.0;
    }
    h = h % 360;
    return "hsla(" + h + "," + s + "%," + l + "%," + a + ")";
  };

  LC.cls = function(c) {
    return c.clearRect(0, 0, c.width, c.height);
  };

  LC.centerText = function(c, text) {
    var m, x, y;

    c.textBaseline = "middle";
    m = c.measureText(text);
    x = (c.width / 2) - (m.width / 2);
    y = c.height / 2;
    return c.fillText(text, x, y, c.width);
  };

  LeapObserver = (function() {
    function LeapObserver() {
      this.listeners = [];
    }

    LeapObserver.prototype.reset = function() {
      return this.listeners = [];
    };

    LeapObserver.prototype.traverse = function(obj, path) {
      var nextobj, nextpath;

      nextobj = obj[path[0]];
      if (!nextobj) {
        return null;
      }
      nextpath = path.slice(1);
      if (nextpath.length === 0) {
        return nextobj;
      }
      return this.traverse(nextobj, nextpath);
    };

    LeapObserver.prototype.attach = function(obj, attr, framepath, factor, min, max) {
      return this.listeners.push({
        object: obj,
        attribute: attr,
        framepath: framepath,
        factor: factor,
        min: min,
        max: max
      });
    };

    LeapObserver.prototype.frame = function(frame) {
      var listener, value, _i, _len, _ref, _results;

      this.lastFrame = frame;
      _ref = this.listeners;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        listener = _ref[_i];
        value = this.traverse(frame, listener.framepath);
        if (value == null) {
          continue;
        }
        if (listener.min >= 0) {
          value = Math.abs(value);
        }
        value = LC.clamp(value * listener.factor, listener.min, listener.max);
        _results.push(listener.object[listener.attribute].value = value);
      }
      return _results;
    };

    return LeapObserver;

  })();

  ImageList = (function() {
    ImageList.prototype.imageLocations = {
      'badge': 'images/moz-shadow-badge.png',
      'book': 'images/tspa_jumpstart.jpg'
    };

    function ImageList() {
      var name, url, _ref;

      _ref = this.imageLocations;
      for (name in _ref) {
        url = _ref[name];
        this[name] = new Image();
        this[name].src = url;
      }
    }

    return ImageList;

  })();

  State = (function() {
    function State() {
      this.init = __bind(this.init, this);
    }

    State.prototype.init = function(k, v) {
      if (this[k] == null) {
        return this[k] = v;
      }
    };

    return State;

  })();

  new Lawnchair({
    name: 'livecoder',
    adapter: 'dom'
  }, function(db) {
    return LC.LiveCoder = (function() {
      function LiveCoder(editor, canvas, keylist, samplelist) {
        this.removeMessage = __bind(this.removeMessage, this);
        this.displayMessage = __bind(this.displayMessage, this);
        this.canvasRunLoop = __bind(this.canvasRunLoop, this);
        this.keydown = __bind(this.keydown, this);
        this.reload = __bind(this.reload, this);
        this.activate = __bind(this.activate, this);
        this.deactivate = __bind(this.deactivate, this);
        this.sampleError = __bind(this.sampleError, this);
        this.samplesFinished = __bind(this.samplesFinished, this);
        this.load_from_hash = __bind(this.load_from_hash, this);        this.$el = $(editor);
        this.$canvas = $(canvas);
        this.$keylist = $(keylist);
        this.$samplelist = $(samplelist);
        this.drawMethod = null;
        this.oldDrawMethod = null;
        this.deactTimeout = null;
        this.state = new State();
        this.analyserData = new Uint8Array(16);
        if (typeof Leap !== "undefined" && Leap !== null) {
          this.leapController = new Leap.Controller();
        }
        AE.Instance = this.audioEngine = new AE.Engine(this.state, this.sampleProgress, this.samplesFinished, this.sampleError);
        $('#progress').addClass('in-progress');
        $('#progress-label').text("Loading Samples");
        this.initEditor();
        this.initCanvas();
        this.updateKeyList();
      }

      LiveCoder.prototype.load_from_hash = function() {
        var key;

        console.log("load from hash " + location.hash);
        if (location.hash !== '') {
          key = location.hash.substr(1);
          return this.load(key);
        } else {
          return this.load('default');
        }
      };

      LiveCoder.prototype.sampleProgress = function(percent) {
        $('#progress-meter').val(percent);
        return console.log("Sample Progress", percent);
      };

      LiveCoder.prototype.samplesFinished = function() {
        var key, _i, _len, _ref, _results;

        console.log("All Samples Loaded");
        $('#progress').removeClass('in-progress');
        this.$samplelist.append("<li data-action='hide'>&gt;&gt;&gt;</li>");
        _ref = AE.S.names;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          key = _ref[_i];
          _results.push(this.$samplelist.append("<li>" + key + "</li>"));
        }
        return _results;
      };

      LiveCoder.prototype.sampleError = function(msg) {
        $('#progress').removeClass('in-progress');
        return this.displayMessage(msg);
      };

      LiveCoder.prototype.initEditor = function() {
        var _this = this;

        this.editor = ace.edit("editor");
        this.editor.setTheme("ace/theme/monokai");
        this.editor.getSession().setMode("ace/mode/javascript");
        this.editor.container.addEventListener("keydown", this.keydown, true);
        this.editor.on('focus', this.activate);
        this.load_from_hash();
        this.$samplelist.on('click', "li[data-action='hide']", function(e) {
          _this.$samplelist.toggleClass('hidden');
          return _this.editor.focus();
        });
        this.$keylist.on('click', "li[data-action='hide']", function(e) {
          _this.$keylist.toggleClass('hidden');
          return _this.editor.focus();
        });
        return $(window).bind('hashchange', this.load_from_hash);
      };

      LiveCoder.prototype.load = function(key) {
        var _this = this;

        return db.get(key, function(data) {
          if (data) {
            _this.editor.setValue(data.code);
            return _this.editor.focus();
          }
        });
      };

      LiveCoder.prototype.updateKeyList = function() {
        var _this = this;

        this.$keylist.html("<li data-action='hide'>&lt;&lt;&lt;</li>");
        return db.keys(function(keys) {
          return keys.forEach(function(key) {
            return _this.$keylist.append("<li data-key='" + key + "'><a href='#" + key + "'>" + key + "</a></li>");
          });
        });
      };

      LiveCoder.prototype.save = function() {
        var code, group, name;

        code = this.editor.getValue();
        group = code.match(/NAME: {0,1}([\w _\-]+)?\n/);
        if (group) {
          name = group[1];
        } else {
          name = "foobar_" + (Math.round(Math.random() * 1000));
        }
        db.save({
          key: name,
          code: code
        });
        return this.updateKeyList();
      };

      LiveCoder.prototype.deactivate = function() {};

      LiveCoder.prototype.activate = function() {
        this.$el.addClass('active');
        if (this.deactTimeout) {
          clearTimeout(this.deactTimeout);
        }
        this.deactTimeout = setTimeout(this.deactivate, 4000);
        return true;
      };

      LiveCoder.prototype.reload = function() {
        var code, exception;

        this.save();
        code = this.editor.getValue();
        try {
          eval(code);
          if (this.drawMethod) {
            this.oldDrawMethod = this.drawMethod;
          }
          if (draw) {
            this.drawMethod = draw;
          }
          if (pattern) {
            return this.audioEngine.setPatternMethod(pattern);
          }
        } catch (_error) {
          exception = _error;
          return console.log(exception, exception.message);
        }
      };

      LiveCoder.prototype.keydown = function(e) {
        if (e.metaKey) {
          if (e.keyCode === 13) {
            this.reload();
          }
          if (e.keyCode === 83) {
            e.preventDefault();
            this.save();
          }
        }
        return this.activate();
      };

      LiveCoder.prototype.initCanvas = function() {
        var _this = this;

        $(window).bind('resize', function() {
          _this.$canvas.width(window.innerWidth).height(window.innerHeight);
          _this.$canvas[0].width = window.innerWidth;
          _this.$canvas[0].height = window.innerHeight;
          _this.context.width = _this.$canvas.width();
          return _this.context.height = _this.$canvas.height();
        });
        this.context = this.$canvas[0].getContext('2d');
        this.$canvas[0].width = window.innerWidth;
        this.$canvas[0].height = window.innerHeight;
        this.context.width = this.$canvas.width();
        this.context.height = this.$canvas.height();
        this.context.font = "bold 200px 'Courier New'";
        LC.I = new ImageList();
        if (typeof Leap !== "undefined" && Leap !== null) {
          this.leapController.on('animationFrame', this.canvasRunLoop);
          this.leapController.connect();
        } else {
          this.canvasRunLoop();
        }
        return LC.LO = this.leapObserver = new LeapObserver();
      };

      LiveCoder.prototype.canvasRunLoop = function(frame) {
        var exception;

        if (typeof Leap !== "undefined" && Leap !== null) {
          this.leapObserver.frame(frame);
        }
        if (this.drawMethod) {
          try {
            this.audioEngine.getAnalyserData(this.analyserData);
            this.drawMethod(this.context, this.state, this.analyserData, frame);
          } catch (_error) {
            exception = _error;
            this.displayMessage(exception.toString() + ": " + exception.message);
            if (this.oldDrawMethod) {
              this.drawMethod = this.oldDrawMethod;
              this.drawMethod(this.context, this.state, this.analyserData);
            }
          }
        }
        if (typeof Leap === "undefined" || Leap === null) {
          return (requestAnimationFrame || webkitRequestAnimationFrame || mozRequestAnimationFrame)(this.canvasRunLoop);
        }
      };

      LiveCoder.prototype.displayMessage = function(message) {
        console.log("new Message: ", message);
        if ($('.message').length === 0) {
          $('body').append($("<div class='message'></div>"));
        }
        $('.message').append("<p>" + message + "</p>");
        return setTimeout(this.removeMessage, 5000);
      };

      LiveCoder.prototype.removeMessage = function() {
        if ($('.message p').length > 1) {
          return $('.message p:first-child').remove();
        } else {
          return $('.message').remove();
        }
      };

      return LiveCoder;

    })();
  });

}).call(this);
