
voter3sat.factory('StateFactory', function() {
  var states = [{
    name: 'Wyoming',
    numIssues: 3,
    img: 'img/states/WY.gif',
  }, {
    name: 'North Dakota',
    numIssues: 3,
    img: 'img/states/ND.gif',
  }, {
    name: 'Vermont',
    numIssues: 3,
    img: 'img/states/VT.gif',
  }, {
    name: 'Rhode Island',
    numIssues: 4,
    img: 'img/states/RI.gif',
  }, {
    name: 'New Hampshire',
    numIssues: 4,
    img: 'img/states/NH.gif',
  }, {
    name: 'Maine',
    numIssues: 4,
    img: 'img/states/ME.gif',
  }, {
    name: 'West Virginia',
    numIssues: 5,
    img: 'img/states/WV.gif',
  }, {
    name: 'New Mexico',
    numIssues: 5,
    img: 'img/states/NM.gif',
  }, {
    name: 'Nebraska',
    numIssues: 5,
    img: 'img/states/NE.gif',
  }, {
    name: 'Utah',
    numIssues: 6,
    img: 'img/states/UT.gif',
  }, {
    name: 'Kansas',
    numIssues: 6,
    img: 'img/states/KS.gif',
  }, {
    name: 'Iowa',
    numIssues: 6,
    img: 'img/states/IA.gif',
  }, {
    name: 'Arkansas',
    numIssues: 7,
    img: 'img/states/AR.gif',
  }, {
    name: 'Oregon',
    numIssues: 7,
    img: 'img/states/OR.gif',
  }, {
    name: 'Connecticut',
    numIssues: 7,
    img: 'img/states/CT.gif',
  }, {
    name: 'Louisiana',
    numIssues: 8,
    img: 'img/states/LA.gif',
  }, {
    name: 'Kentucky',
    numIssues: 8,
    img: 'img/states/KY.gif',
  }, {
    name: 'Delaware',
    numIssues: 8,
    img: 'img/states/DE.gif',
  }, {
    name: 'South Carolina',
    numIssues: 9,
    img: 'img/states/SC.gif',
  }, {
    name: 'Colorado',
    numIssues: 9,
    img: 'img/states/CO.gif',
  }, {
    name: 'Montana',
    numIssues: 9,
    img: 'img/states/MT.gif',
  }, {
    name: 'Wisconsin',
    numIssues: 10,
    img: 'img/states/WI.gif',
  }, {
    name: 'Missouri',
    numIssues: 10,
    img: 'img/states/MO.gif',
  }, {
    name: 'Minnesota',
    numIssues: 10,
    img: 'img/states/MN.gif',
  }];
  
  var iState = 0;
  _.each(states, function(state) {
    state.index = iState;
    iState++;
  });

  return states;
});

