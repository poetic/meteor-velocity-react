const ReactTransitionGroup = React.addons.TransitionGroup;

var VelocityTransitionGroupChild = React.createClass({
  displayName: 'VelocityTransitionGroupChild',

  propTypes: {
    children: React.PropTypes.element.isRequired,
    willAppearFunc: React.PropTypes.func.isRequired,
    willEnterFunc: React.PropTypes.func.isRequired,
    willLeaveFunc: React.PropTypes.func.isRequired,
  },

  componentWillAppear: function (doneFn) {
    this.props.willAppearFunc(ReactDOM.findDOMNode(this), doneFn);
  },

  componentWillEnter: function (doneFn) {
    this.props.willEnterFunc(ReactDOM.findDOMNode(this), doneFn);
  },

  componentWillLeave: function (doneFn) {
    this.props.willLeaveFunc(ReactDOM.findDOMNode(this), doneFn);
  },

  render: function () {
    return React.Children.only(this.props.children);
  },
});

VelocityTransitionGroup = React.createClass({
  displayName: 'VelocityTransitionGroup',

  statics: {
    disabledForTest: false, // global, mutable, for disabling animations during test
  },

  propTypes: {
    runOnMount: React.PropTypes.bool,
    enter: React.PropTypes.any,
    leave: React.PropTypes.any,
    children: React.PropTypes.any,
    enterHideStyle: React.PropTypes.object,
    enterShowStyle: React.PropTypes.object,
  },

  getDefaultProps: function() {
    return {
      runOnMount: false,
      enter: null,
      leave: null,
      enterHideStyle: {
        display: 'none',
      },
      enterShowStyle: {
        display: '',
      },
    };
  },

  componentWillMount: function () {
    this._scheduled = false;
    this._entering = [];
    this._leaving = [];
  },

  componentWillUnmount: function () {
    this._entering = [];
    this._leaving = [];
  },

  render: function () {
    var transitionGroupProps = _.omit(this.props, _.keys(this.constructor.propTypes));

    if (!this.constructor.disabledForTest && !window.$.Velocity.velocityReactServerShim) {
      transitionGroupProps.childFactory = this._wrapChild;
    }

    return React.createElement(ReactTransitionGroup, transitionGroupProps, this.props.children);
  },

  childWillAppear: function (node, doneFn) {
    if (this.props.runOnMount) {
      this.childWillEnter(node, doneFn);
    } else {
      this._finishAnimation(node, this.props.enter);

      var self = this;
      window.setTimeout(function () {
        if (self.isMounted()) {
          doneFn();
        }
      }, 0);
    }
  },

  childWillEnter: function (node, doneFn) {
    if (this._shortCircuitAnimation(this.props.enter, doneFn)) return;

    this._finishAnimation(node, this.props.leave, {complete: undefined});

    _.forEach(this.props.enterHideStyle, function (val, key) {
      window.$.Velocity.CSS.setPropertyValue(node, key, val);
    });

    this._entering.push({
      node: node,
      doneFn: doneFn,
    });

    this._schedule();
  },

  childWillLeave: function (node, doneFn) {
    if (this._shortCircuitAnimation(this.props.leave, doneFn)) return;

    this._leaving.push({
      node: node,
      doneFn: doneFn,
    });

    this._schedule();
  },

  _shortCircuitAnimation: function (animationProp, doneFn) {
    if (document.hidden || (this._parseAnimationProp(animationProp).animation == null)) {
      if (this.isMounted()) {
        doneFn();
      }

      return true;
    } else {
      return false;
    }
  },

  _schedule: function () {
    if (this._scheduled) {
      return;
    }

    this._scheduled = true;

    shimRequestAnimationFrame(this._runAnimations);
  },

  _runAnimations: function () {
    this._scheduled = false;

    this._runAnimation(true, this._entering, this.props.enter);
    this._runAnimation(false, this._leaving, this.props.leave);

    this._entering = [];
    this._leaving = [];
  },

  _parseAnimationProp: function (animationProp) {
    var animation, opts, style;

    if (typeof animationProp === 'string') {
      animation = animationProp;
      style = null;
      opts = {};
    } else {
      animation = (animationProp != null) ? animationProp.animation : null;
      style = (animationProp != null) ? animationProp.style : null;
      opts = _.omit(animationProp, 'animation', 'style');
    }

    return {
      animation: animation,
      style: style,
      opts: opts,
    };
  },

  _runAnimation: function (entering, queue, animationProp) {
    if (!this.isMounted() || queue.length === 0) {
      return;
    }

    var nodes = _.pluck(queue, 'node');
    var doneFns = _.pluck(queue, 'doneFn');

    var parsedAnimation = this._parseAnimationProp(animationProp);
    var animation = parsedAnimation.animation;
    var style = parsedAnimation.style;
    var opts = parsedAnimation.opts;

    if (entering) {
      if (!_.isEqual(this.props.enterShowStyle, {display: ''})
        || !(/^(fade|slide)/.test(animation) || /In$/.test(animation))) {
        style = _.extend({}, this.props.enterShowStyle, style);
      }
    }

    if (style != null) {
      _.each(style, function (value, key) {
        window.$.Velocity.hook(nodes, key, value);
      });
    }

    var self = this;
    var doneFn = function () {
      if (!self.isMounted()) {
        return;
      }

      doneFns.map(function (doneFn) { doneFn(); });
    };

    if (entering) {
      doneFn();
      doneFn = null;
    } else {
      window.$.Velocity(nodes, 'stop');
    }

    var combinedCompleteFn;
    if (doneFn && opts.complete) {
      var optsCompleteFn = opts.complete;
      combinedCompleteFn = function () {
        doneFn();
        optsCompleteFn();
      };
    } else {
      combinedCompleteFn = doneFn || opts.complete;
    }

    shimRequestAnimationFrame(function () {
      window.$.Velocity(nodes, animation, _.extend({}, opts, {
        complete: combinedCompleteFn,
      }));
    });
  },

  _finishAnimation: function (node, animationProp, overrideOpts) {
    var parsedAnimation = this._parseAnimationProp(animationProp);
    var animation = parsedAnimation.animation;
    var style = parsedAnimation.style;
    var opts = _.extend({}, parsedAnimation.opts, overrideOpts);

    if (style != null) {
      _.each(style, function (value, key) {
        window.$.Velocity.hook(node, key, value);
      });
    }

    if (animation != null) {

      window.$.Velocity(node, animation, opts);
      window.$.Velocity(node, 'finishAll', true);
    }
  },

  _wrapChild: function (child) {
    return React.createElement(VelocityTransitionGroupChild, {
      willAppearFunc: this.childWillAppear,
      willEnterFunc: this.childWillEnter,
      willLeaveFunc: this.childWillLeave,
    }, child);
  },
});
