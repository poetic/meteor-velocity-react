Package.describe({
  name: 'poetic:meteor-velocity-react',
  version: '0.0.2',
  summary: "Fabric's Velocity React for Meteor projects",
  git: 'https://github.com/poetic/meteor-velocity-react',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  //api.use('ecmascript');
  api.use('underscore@1.0.4');
  api.use('jquery', 'client');
  api.use('react@0.1.13');
  api.use('poetic:meteor-velocityjs@0.0.1');
  api.addFiles(['velocity-transition-group.js', 'velocity-component.js']);

  api.export('VelocityTransitionGroup');
  api.export('VelocityComponent');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('poetic:meteor-velocity-react');
  api.addFiles('meteor-velocity-react-tests.js');
});
