(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('hammerjs'), require('vue')) :
  typeof define === 'function' && define.amd ? define(['exports', 'hammerjs', 'vue'], factory) :
  (factory((global.VueTouch = global.VueTouch || {}),global.Hammer,global.vue));
}(this, (function (exports,Hammer,vue) { 'use strict';

Hammer = 'default' in Hammer ? Hammer['default'] : Hammer;

function createProp() {
  return {
    type: Object,
    default: function () {
      return {};
    },
  };
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
var directions = ['up', 'down', 'left', 'right', 'horizontal', 'vertical', 'all'];
function guardDirections(options) {
  var dir = options.direction;
  if (typeof dir === 'string') {
    var hammerDirection = 'DIRECTION_' + dir.toUpperCase();
    if (directions.indexOf(dir) > -1 && Hammer.hasOwnProperty(hammerDirection)) {
      options.direction = Hammer[hammerDirection];
    } else {
      console.warn('[vue-touch] invalid direction: ' + dir);
    }
  }
  return options;
}


var gestureMap = {
  pan: 'pan',
  panstart: 'pan',
  panmove: 'pan',
  panend: 'pan',
  pancancel: 'pan',
  panleft: 'pan',
  panright: 'pan',
  panup: 'pan',
  pandown: 'pan',
  pinch: 'pinch',
  pinchstart: 'pinch',
  pinchmove: 'pinch',
  pinchend: 'pinch',
  pinchcancel: 'pinch',
  pinchin: 'pinch',
  pinchout: 'pinch',
  press: 'press',
  pressup: 'press',
  rotate: 'rotate',
  rotatestart: 'rotate',
  rotatemove: 'rotate',
  rotateend: 'rotate',
  rotatecancel: 'rotate',
  swipe: 'swipe',
  swipeleft: 'swipe',
  swiperight: 'swipe',
  swipeup: 'swipe',
  swipedown: 'swipe',
  tap: 'tap',
};
var normalizeGesture = function (name) { return gestureMap[name]; };
var objectHasArrayValues = function (value) { return typeof value === 'object' && Object.values(value).every(function (any) { return Array.isArray(any); }); };

var events = {};
var customEvents = function (name) { return (name === undefined ? events : events[name]); };
var register = function (event, options) {
  if ( options === void 0 ) options = {};
  options.event = event;
  events[event] = options;
  if (!(event in Component.props)) {
    Component.props[event] = createProp();
  }
};

var Component = {
  props: {
    options: createProp(),
    tap: createProp(),
    pan: createProp(),
    pinch: createProp(),
    press: createProp(),
    rotate: createProp(),
    swipe: createProp(),
    tag: { type: String, default: 'div' },
    recognizeWith: {
      type: Object,
      default: function () { return ({}); },
      validate: objectHasArrayValues,
    },
    requireFailure: {
      type: Object,
      default: function () { return ({}); },
      validate: objectHasArrayValues,
    },
    enabled: {
      default: true,
      type: [Boolean, Object],
    },
  },
  mounted: function mounted() {
    this._events = Object.keys(this.$attrs)
      .map(function (el, id) {
        if (el.startsWith('on')) {
          return el.replace(/(^on)/gi, '').toLowerCase();
        }
      })
      .filter(function (element) {
        return element !== undefined;
      });
    if (!this.$isServer) {
      this.hammer = new Hammer.Manager(this.$el, this.options);
      this.recognizers = {};
      this.setupRecognizers();
      this.setupRecognizerDependencies();
      this.updateEnabled(this.enabled);
    }
  },
  destroyed: function destroyed() {
    if (!this.$isServer) {
      this.hammer.destroy();
    }
  },
  watch: {
    enabled: {
      deep: true,
      handler: function handler() {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];
        (ref = this).updateEnabled.apply(ref, args);
        var ref;
      },
    },
  },
  methods: {
    setupRecognizers: function setupRecognizers() {
      var this$1 = this;
      for (var i = 0, list = this$1._events; i < list.length; i += 1) {
        var gesture = list[i];
        if (normalizeGesture(gesture)) {
          this$1.addEvent(gesture);
          gesture = normalizeGesture(gesture);
          var options = Object.assign({}, this$1.$options.config[gesture] || {}, this$1[gesture]);
          this$1.addRecognizer(gesture, options);
        } else if (customEvents(gesture)) {
          this$1.addEvent(gesture);
          var options$1 = Object.assign({}, customEvents(gesture), this$1[gesture]);
          this$1.addRecognizer(gesture, options$1, { mainGesture: options$1.type });
        } else {
          throw new Error(("Unknown gesture: " + gesture));
        }
      }
    },
    setupRecognizerDependencies: function setupRecognizerDependencies() {
      var this$1 = this;
      for (var i = 0, list = Object.entries(this$1.recognizeWith); i < list.length; i += 1) {
        var ref = list[i];
        var key = ref[0];
        var value = ref[1];
        this$1.recognizers[key] && this$1.recognizers[key].recognizeWith(value.map(function (name) { return this$1.recognizers[name]; }));
      }
      for (var i$1 = 0, list$1 = Object.entries(this$1.requireFailure); i$1 < list$1.length; i$1 += 1) {
        var ref$1 = list$1[i$1];
        var key$1 = ref$1[0];
        var value$1 = ref$1[1];
        this$1.recognizers[key$1] && this$1.recognizers[key$1].requireFailure(value$1.map(function (name) { return this$1.recognizers[name]; }));
      }
    },
    addRecognizer: function addRecognizer(gesture, options, ref) {
      if ( ref === void 0 ) ref = {};
      var mainGesture = ref.mainGesture;
      if (!this.recognizers[gesture]) {
        this.recognizers[gesture] = new Hammer[capitalize(mainGesture || gesture)](guardDirections(options));
        this.hammer.add(this.recognizers[gesture]);
      }
    },
    addEvent: function addEvent(gesture) {
      var this$1 = this;
      this.hammer.on(gesture, function (e) { return this$1.$emit(gesture, e); });
    },
    updateEnabled: function updateEnabled(newVal, oldVal) {
      var this$1 = this;
      if (newVal === true) {
        this.enableAll();
      } else if (newVal === false) {
        this.disableAll();
      } else if (typeof newVal === 'object') {
        for (var i = 0, list = Object.entries(newVal); i < list.length; i += 1) {
          var ref = list[i];
          var event = ref[0];
          var status = ref[1];
          this$1.recognizers[event] && status ? this$1.enable(event) : this$1.disable(event);
        }
      }
    },
    enable: function enable(gesture) {
      var recognizer = this.recognizers[gesture];
      if (!recognizer.options.enable) {
        recognizer.set({ enable: true });
      }
    },
    disable: function disable(gesture) {
      var recognizer = this.recognizers[gesture];
      if (recognizer.options.enable) {
        recognizer.set({ enable: false });
      }
    },
    toggle: function toggle(gesture) {
      var recognizer = this.recognizers[gesture];
      if (recognizer) {
        recognizer.options.enable ? this.disable(gesture) : this.enable(gesture);
      }
    },
    enableAll: function enableAll() {
      this.setAll({ enable: true });
    },
    disableAll: function disableAll() {
      this.setAll({ enable: false });
    },
    setAll: function setAll(ref) {
      var this$1 = this;
      var enable = ref.enable;
      for (var i = 0, list = Object.values(this$1.recognizers); i < list.length; i += 1) {
        var recognizer = list[i];
        if (recognizer.options.enable !== enable) {
          recognizer.set({ enable: enable });
        }
      }
    },
    isEnabled: function isEnabled(gesture) {
      return this.recognizers[gesture] && this.recognizers[gesture].options.enable;
    },
  },
  render: function render() {
    return vue.h(this.tag, {}, this.$slots.default());
  },
};

var install = function (app, options) {
  if ( options === void 0 ) options = {};
  if (install.installed === true) { return; }
  install.installed = true;
  Component.config = install.config;
  app.component(options.name || 'v-touch', Component);
};
install.config = {};
var registerCustomEvent = function (event, options) {
  if (install.installed) {
    console.warn(("\n      [vue-touch]: Custom Event '" + event + "' couldn't be added to vue-touch.\n      Custom Events have to be registered before installing the plugin.\n      "));
    return;
  }
  register(event, options);
};
var plugin = {
  install: install,
  registerCustomEvent: registerCustomEvent,
};

exports['default'] = plugin;
exports.VTouch = Component;
exports.customEvents = customEvents;

Object.defineProperty(exports, '__esModule', { value: true });

})));
