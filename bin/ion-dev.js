window.IonicDevServer = {
  start: function() {
    this.msgQueue = [];

    this.consoleLog = console.log;
    this.consoleError = console.error;
    this.consoleWarn = console.warn;

    if (IonicDevServerConfig && IonicDevServerConfig.sendConsoleLogs) {
      this.patchConsole();
    }

    console.log('dev server enabled');

    this.openConnection();

    this.bindKeyboardEvents();

    document.addEventListener("DOMContentLoaded", IonicDevServer.domReady);
  },

  handleError: function(err) {
    var self = this;

    console.error('Handling error', err);

    var existing = document.querySelector('._ionic-error-view');
    if(existing) {
      document.body.removeChild(existing);
    }

    this._errorWindow = this._makeErrorWindow(err);
    document.body.appendChild(this._errorWindow);

    setTimeout(function() {
      window.requestAnimationFrame(function() {
        self._errorWindow.classList.add('show');
      });
    }, 500);

  },

  _closeErrorWindow: function() {
    var self = this;
    window.requestAnimationFrame(function() {
      self._errorWindow.classList.remove('show');
      setTimeout(function() {
        document.body.removeChild(self._errorWindow);
        self._errorWindow = null;
      }, 500);
    });
  },

  _makeErrorWindow: function(err) {
    var self = this;

    var isInCordova = !!window.cordova;

    var d = document.createElement('div');
    d.className = '_ionic-error-view';

    if(isInCordova) {
      d.classList.add('_ionic-error-in-cordova');
    }

    d.innerHTML = '<div style="position: relative"><div class="_ionic-error-navbar"><h1 class="_title">App Runtime Error</h1><div class="_close">Close</div></div><div class="_ionic-error-content"><div class="message">' + err.message + '</div><h4>Stacktrace</h4><textarea class="stack">' + err.stack + '</textarea><!--<div class="_button" action="copy">Copy</div>-->' + this._makeErrorButtonsHtml() + '</div></div>';

    d.querySelector('._close').addEventListener('click', function(e) {
      closeWindow(d);
    });
    /*
    d.querySelector('[action="copy"]').addEventListener('click', function(e) {
      if(window.IonicDevtools) {
        window.IonicDevtools.copyErrorToClipboard(err);
      }
    });
    */

    return d;
  },
  _makeErrorButtonsHtml: function() {
    var d = document.createElement('div');
    d.className = '_ion-error-buttons';

    var b1 = document.createElement('button');
    b1.innerHTML = 'Close (ESC)';
    b1.className = '_button';

    var b2 = document.createElement('button');
    b2.innerHTML = 'Reload (&#8984;)';
    b2.className = '_button';

    //d.appendChild(b1);
    //d.appendChild(b2);

    return d.innerHTML;
  },
  reloadApp: function() {
    if(window.cordova) {
      window.location.reload(true);
    }
  },
  showDebugMenu: function() {
    if(window.IonicDevtools) {
      window.IonicDevtools.showDebugMenu();
    }
  },
  bindKeyboardEvents: function() {
    var self = this;

    document.addEventListener('keyup', function(event) {
      var key = event.keyCode || event.charCode || 0;

      if(key == 27 && self._errorWindow) {
        self._closeErrorWindow();
      }
    });
    document.addEventListener('keydown', function(event) {
      var key = event.keyCode || event.charCode || 0;

      // Check for reload command (cmd/ctrl+R)
      if(key == 82 && (event.metaKey || event.ctrlKey)) {
        self.reloadApp();
      }

      // Check for debugger command (cmd/ctrl+D)
      /*
      if(key == 68 && (event.metaKey || event.ctrlKey)) {
        self.showDebugMenu();
      }
      */
    });
  },

  openConnection: function() {
    var self = this;
    this.socket = new WebSocket('ws://' + window.location.hostname + ':' + IonicDevServerConfig.wsPort);

    this.socket.onopen = function(ev) {
      self.socketReady = true;

      self.socket.onmessage = function(ev) {
        try {
          var msg = JSON.parse(ev.data);
          switch (msg.category) {
            case 'buildUpdate':
              self.buildUpdate(msg);
              break;
          }
        } catch (e) {
          self.consoleError('error receiving ws message', e);
        }
      };

      self.socket.onclose = () => {
        self.consoleLog('Dev server logger closed');
      };

      self.drainMessageQueue();
    };
  },

  queueMessageSend: function(msg) {
    this.msgQueue.push(msg);
    this.drainMessageQueue();
  },

  drainMessageQueue: function() {
    if (this.socketReady) {
      var msg;
      while (msg = this.msgQueue.shift()) {
        try {
          this.socket.send(JSON.stringify(msg));
        } catch(e) {
          if(e instanceof TypeError) {

          } else {
            this.consoleError('ws error: ' + e);
          }
        }
      }
    }
  },

  patchConsole: function() {
    var self = this;
    function patchConsole(consoleType) {
      console[consoleType] = (function() {
        var orgConsole = console[consoleType];
        return function() {
          orgConsole.apply(console, arguments);
          var msg = {
            category: 'console',
            type: consoleType,
            data: []
          };
          for (var i = 0; i < arguments.length; i++) {
            msg.data.push(arguments[i]);
          }
          if (msg.data.length) {
            self.queueMessageSend(msg);
          }
        };
      })();
    }

    for (var consoleType in console) {
      if (console.hasOwnProperty(consoleType) && typeof console[consoleType] === 'function') {
        patchConsole(consoleType);
      }
    }
  },

  buildUpdate: function(msg) {
    var status = 'success';

    if (msg.type === 'started') {
      status = 'active';

      var toastEle = document.getElementById('ion-diagnostics-toast');
      if (!toastEle) {
        toastEle = document.createElement('div');
        toastEle.id = 'ion-diagnostics-toast';
        var c = []
        c.push('<div class="ion-diagnostics-toast-content">');
        c.push('<div class="ion-diagnostics-toast-message">Building...</div>');
        c.push('<div class="ion-diagnostics-toast-spinner">');
        c.push('<svg viewBox="0 0 64 64"><circle transform="translate(32,32)" r="26"></circle></svg>');
        c.push('</div>');
        c.push('</div>');
        toastEle.innerHTML = c.join('');
        document.body.insertBefore(toastEle, document.body.firstChild);
      }
      IonicDevServer.toastTimerId = setTimeout(function() {
        var toastEle = document.getElementById('ion-diagnostics-toast');
        if (toastEle) {
          toastEle.classList.add('ion-diagnostics-toast-active');
        }
      }, 50);

    } else {
      status = msg.data.diagnosticsHtml ? 'error' : 'success';

      clearTimeout(IonicDevServer.toastTimerId);

      var toastEle = document.getElementById('ion-diagnostics-toast');
      if (toastEle) {
        toastEle.classList.remove('ion-diagnostics-toast-active');
      }

      var diagnosticsEle = document.getElementById('ion-diagnostics');
      if (diagnosticsEle && !msg.data.diagnosticsHtml) {
        diagnosticsEle.classList.add('ion-diagnostics-fade-out');
        IonicDevServer.diagnosticsTimerId = setTimeout(function() {
          var diagnosticsEle = document.getElementById('ion-diagnostics');
          if (diagnosticsEle) {
            diagnosticsEle.parentElement.removeChild(diagnosticsEle);
          }
        }, 100);

      } else if (msg.data.diagnosticsHtml) {
        clearTimeout(IonicDevServer.diagnosticsTimerId);

        if (!diagnosticsEle) {
          diagnosticsEle = document.createElement('div');
          diagnosticsEle.id = 'ion-diagnostics';
          diagnosticsEle.className = 'ion-diagnostics-fade-out';
          document.body.insertBefore(diagnosticsEle, document.body.firstChild);
          IonicDevServer.diagnosticsTimerId = setTimeout(function() {
            var diagnosticsEle = document.getElementById('ion-diagnostics');
            if (diagnosticsEle) {
              diagnosticsEle.classList.remove('ion-diagnostics-fade-out');
            }
          }, 24);
        }
        diagnosticsEle.innerHTML = msg.data.diagnosticsHtml;
      }
    }

    IonicDevServer.buildStatus(status);
  },

  buildStatus: function (status) {
    var iconLinks = document.querySelectorAll('link[rel="icon"]');
    for (var i = 0; i < iconLinks.length; i++) {
      iconLinks[i].parentElement.removeChild(iconLinks[i]);
    }

    var iconLink = document.createElement('link');
    iconLink.rel = 'icon';
    iconLink.type = 'image/png';
    iconLink.href = '__ion-dev-server/ion-build-' + status + '.png?v=' + IonicDevServerConfig.appScriptsVersion;
    document.head.appendChild(iconLink);
  },

  domReady: function() {
    document.removeEventListener("DOMContentLoaded", IonicDevServer.domReady);
    var diagnosticsEle = document.getElementById('ion-diagnostics');
    if (diagnosticsEle) {
      IonicDevServer.buildStatus('error');
    } else {
      IonicDevServer.buildStatus('success');
    }
  }

};

IonicDevServer.start();
