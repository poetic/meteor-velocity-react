VelocityComponent = React.createClass({
  displayName: 'VelocityComponent',

  propTypes: {
    animation: React.PropTypes.any,
    children: React.PropTypes.element.isRequired,
    runOnMount: React.PropTypes.bool,
    targetQuerySelector: React.PropTypes.string,
  },

  getDefaultProps: function () {
    return {
      animation: null,
      runOnMount: false,
      targetQuerySelector: null,
    }
  },

  componentDidMount: function () {
    this.runAnimation();

    if (this.props.runOnMount !== true) {
      this._finishAnimation();
    }
  },

  componentWillUpdate: function (newProps, newState) {
    if (!_.isEqual(newProps.animation, this.props.animation)) {
      this._stopAnimation();
      this._scheduleAnimation();
    }
  },

  componentWillUnmount: function () {
    this._stopAnimation();
  },

  runAnimation: function (config) {
    config = config || {};

    this._shouldRunAnimation = false;

    if (!this.isMounted() || this.props.animation == null) {
      return;
    }

    if (config.stop) {
      window.$.Velocity(this._getDOMTarget(), 'stop', true);
    } else if (config.finish) {
      window.$.Velocity(this._getDOMTarget(), 'finishAll', true);
    }

    var opts = _.omit(this.props, _.keys(this.constructor.propTypes));
    window.$.Velocity(this._getDOMTarget(), this.props.animation, opts);
  },

  _scheduleAnimation: function () {
    if (this._shouldRunAnimation) {
      return;
    }

    this._shouldRunAnimation = true;
    setTimeout(this.runAnimation, 0);
  },

  _getDOMTarget: function () {
    var node = ReactDOM.findDOMNode(this);

    if (this.props.targetQuerySelector === 'children') {
      return node.children;
    } else if (this.props.targetQuerySelector != null) {
      return node.querySelectorAll(this.props.targetQuerySelector);
    } else {
      return node;
    }
  },

  _finishAnimation: function () {
    window.$.Velocity(this._getDOMTarget(), 'finishAll', true);
  },

  _stopAnimation: function () {
    window.$.Velocity(this._getDOMTarget(), 'stop', true);
  },

  render: function () {
    return this.props.children;
  }
});

