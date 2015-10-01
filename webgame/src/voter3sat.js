var voter3sat = angular.module('Voter3SAT', []);

voter3sat.service('GameService', ['$rootScope', 'IssueFactory', function($rootScope, IssueFactory) {
  var GameService = this;

  var generatePlatform = function(issues) {
    var platform = {};
    _.each(issues, function(issue, issuekey) {
      platform[issuekey] = Math.random() > 0.5;
    });
    return platform;
  };
        
  var generateVoters = function(issues, winningPlatform) {
    var voters = [];
    
    // We construct a set of voters by exhaustively iterating through the space
    // of possible platforms. If a platform is accepted by all voters, and it *isn't*
    // our desired winning platform, then we add a voter who would reject that platform.
    
    var winningbitmask = 0;
    var issuekeys = [];
    _.each(issues, function(issue, issuekey) {
      issuekeys[issue.index] = issuekey;
      if (winningPlatform[issuekey]) {
        winningbitmask |= 1 << issue.index;
      }
    });
      
    var numIssues = _.size(issues);
    var platformbitsMax = 1 << numIssues;
    for (var platformbits = 0; platformbits < platformbitsMax; platformbits++) {
      if (platformbits === winningbitmask) {
        continue;
      }
      
      var allVotersAccept = _.all(voters, function(voter) {
        // Does this voter accept this platform?
        return _.any(voter.opinions, function(opinion, issuekey) {
          return opinion === !!((1 << issues[issuekey].index) & platformbits);
        });
      });
      
      if (!allVotersAccept) {
        continue;
      }

      // All voters accept this platform, but this platform isn't the 
      // desired one. Add a rejecting voter.
      
      var voter = {
        opinions: {},
        imageOffset: {
          x: Math.floor(Math.random() * 5),
          y: Math.floor(Math.random() * 4)
        }
      };
        
      // Get all the issues on which this platform differs from the desired one.
      var issuesdifferkeys = [];
      for (var issuebit = 0; issuebit < numIssues; issuebit++) {
        var issuemask = 1 << issuebit;
        if ((winningbitmask & issuemask) !== (platformbits & issuemask)) {
          issuesdifferkeys.push(issuekeys[issuebit]);
        }
      }
        
      // Pick one issue at random on which this platform differs from the desired one.
      // Make this voter agree with the desired platform on this issue (and disagree
      // with the current platform).
      var differkey = issuesdifferkeys[Math.floor(Math.random() * issuesdifferkeys.length)];
      voter.opinions[differkey] = winningPlatform[differkey];
      
      // Pick more issues to add to this voter's opinions, and set them all to the opposite
      // of the current platform. This will make it impossible for this voter to accept
      // this platform, which will rule it out as a possible solution (because it's not
      // equal to the desired platform).
      while (_.size(voter.opinions) < 3) {
        var keysWeHaventUsedYet = _.difference(_.keys(issues), _.keys(voter.opinions));
        var issuekey = keysWeHaventUsedYet[Math.floor(Math.random() * keysWeHaventUsedYet.length)];
        var issue = issues[issuekey];
        voter.opinions[issuekey] = !(platformbits & (1 << issue.index));
      }
          
      voter.sortedIssueKeys = _.chain(voter.opinions).
        keys().
        sortBy(function(issuekey) {
          return issues[issuekey].index;
        }).
        value();
      
      voters.push(voter);
    }
    
    voters = _.sortBy(voters, function(voter) {
      // Generate a sortkey for each voter.
      // The sortkey consists of a code for the voter's pet issues,
      // followed by a code for the voter's stances on those issues.
      var issuesortkey = '';
      var opinionsortkey = '';
      
      _.chain(issues).
        keys().
        sortBy(function(issuekey) {
              return issues[issuekey].index;
          }).
        each(function(issuekey) {
            if (issuekey in voter.opinions) {
                  issuesortkey += '1';
                  opinionsortkey += voter.opinions[issuekey] ? '1' : '0';
              } else {
                  issuesortkey += '0';
              }
        });

      var sortkey = issuesortkey + '-' + opinionsortkey;
      return sortkey;
    });
    return voters;
  };

  // Sanity-check to ensure that there is only one winning platform.
  var checkVictoryConditions = function(winningbitmask) {
    var numOtherWinning = 0;
    var origPlatform = GameService.platform;
    GameService.platform = {};
    
    var numIssues = _.size(GameService.issues);
    var platformbitsMax = 1 << numIssues;
    for (var platformbits = 0; platformbits < platformbitsMax; platformbits++) {
      if (platformbits === winningbitmask) {
        continue;
      }
      
      _.each(GameService.issues, function(issue, issuekey) {
        GameService.platform[issuekey] = !!(platformbits & (1 << issue.index));
      });
      
      if (GameService.isPlatformWinning()) {
        numOtherWinning++;
      }
    }
    
    GameService.platform = origPlatform;
    return numOtherWinning;
  };    
  
  var init = function(numIssues) {
      var issues = IssueFactory.getIssues(numIssues); 
      
      var platform = generatePlatform(issues);
      var voters = generateVoters(issues, platform);
      
      var winningplatformbits = 0;
      _.each(issues, function(issue, issuekey) {
          if (platform[issuekey]) {
              winningplatformbits |= 1 << issue.index;
          }
      });
      
      console.log('=============== NEW GAME ===============================');
      console.log('Winning platform:');
      _.chain(issues).
        sortBy(function(issue, issuekey) {
            return issue.index;
        }).
        each(function(issue) {
            console.log(issue.key + ': ' + platform[issue.key]);
        });
      
      // Make the starting platform be floor(n/2) bits away from the
      // winning platform, to maximize the user's starting entropy
      // (i.e. so that the user has the hardest possible time knowing
      // which bits to flip and which to keep.)
      var numFlips = Math.floor(numIssues / 2);
      _.chain(platform).
        keys().
        shuffle().
        first(numFlips).
        each(function(issuekey) {
            platform[issuekey] = !platform[issuekey];
        });
      
      GameService.issues = issues;
      GameService.sortedIssues = _.sortBy(issues, function(issue, issuekey) {
          return issue.index;
      });
      
      GameService.voters = voters;
      GameService.platform = platform;
      GameService.flips = {
          permitted: numFlips,
          used: 0
      }
      
      // Check ourselves!
      var numOtherWinning = checkVictoryConditions(winningplatformbits);
      if (numOtherWinning) {
          console.log('FAILED self-test! ' + numOtherWinning + ' aberrant winning conditions detected.');
      }
  };
  
  this.start = function(numIssues) {
      // Build it in a loop so that we can try again if we accidentally
      // generate a game in an initial winning condition.
      init(numIssues);
  };
  
  this.flipStance = function(issue) {
      if (!GameService.isGameOn()) {
          return;
      }
      
      GameService.platform[issue.key] = !GameService.platform[issue.key];
      GameService.flips.used++;
  };
  
  this.isVoterVotingForYou = function(voter) {
      return _.any(voter.opinions, function(opinion, issuekey) {
          return opinion === GameService.platform[issuekey];
      });
  };
  
  this.isPlatformWinning = function() {
      return !!GameService.voters &&
          _.all(GameService.voters, function(voter) {
              return GameService.isVoterVotingForYou(voter);
          });
  };
  
  this.didPlayerLose = function() {
      return GameService.flips.used >= GameService.flips.permitted && 
          !GameService.isPlatformWinning();
  };
  
  this.isGameOn = function() {
      return !GameService.isPlatformWinning() && !GameService.didPlayerLose();
  };
}]);

voter3sat.factory('IssueFactory', function() {
  var issues = {
      'abortion': {
          key: 'abortion',
          issuetext: 'Abortion',
          textcon: 'Recognizing That Life Begins At Conception', 
          textpro: 'A Woman\'s Right To Choose', 
          img: 'img/issues/embryo.png'
      },
      'borders': {
          key: 'borders', 
          issuetext: 'Border Control',
          textcon: 'Open Borders And Amnesty For Undocumented Workers', 
          textpro: 'Closing The Borders And Deporting Illegal Aliens', 
          img: 'img/issues/cactus.gif'
      },    
      'co2reg': {
          key: 'co2reg', 
          issuetext: 'CO2 Regulation',
          textcon: 'Bringing Manufacturing Jobs Back To America', 
          textpro: 'Reducing Greenhouse Gas Emissions', 
          img: 'img/issues/co2.png'
      },
      'drugs': {
          key: 'drugs', 
          issuetext: 'Drugs',
          textcon: 'Eliminating Drug Use And Trafficking', 
          textpro: 'Legalization And Deregulation', 
          img: 'img/issues/marijuana.png'
      },    
      'financial': {
          key: 'financial', 
          issuetext: 'Financial Regulation',
          textcon: 'Arresting Predatory Wall Street Fat Cats', 
          textpro: 'A Laissez-Faire Economy', 
          img: 'img/issues/bank_building.png'
      },
      'gaymarriage': {
          key: 'gaymarriage', 
          issuetext: 'Gay Marriage',
          textcon: 'Traditional Marriage', 
          textpro: 'Marriage Equality', 
          img: 'img/issues/gay-marriage.gif'
      },
      'guns': {
          key: 'guns', 
          issuetext: 'Guns',
          textcon: 'Sensible Gun Control', 
          textpro: 'Second Amendment Rights', 
          img: 'img/issues/gun.png'
      },
      'healthcare': {
          key: 'healthcare', 
          issuetext: 'Nationalized Healthcare',
          textcon: 'A Single-Payer Government-Funded Health Provider', 
          textpro: 'A Free-Market Medical System', 
          img: 'img/issues/healthcare.png'
      },
      'israel': {
          key: 'israel', 
          issuetext: 'Israel',
          textcon: 'Ending Our Special Treatment Of Israel', 
          textpro: 'Supporting Israel', 
          img: 'img/issues/israel.png'
      },
      'military': {
          key: 'military', 
          issuetext: 'Military Spending',
          textcon: 'Defunding The Military', 
          textpro: 'A Strong National Defense', 
          img: 'img/issues/tank.png'
      },      
      'minimumwage': {
          key: 'minimumwage', 
          issuetext: 'The Minimum Wage',
          textcon: 'Letting Employers/Employees Negotiate Pay',
          textpro: 'Raising The Minimum Wage', 
          img: 'img/issues/cashier.png'
      },    
      'studentloans': {
          key: 'studentloans',
          issuetext: 'Student Loan Assistance',
          textcon: 'Letting College Students Find Private Lenders', 
          textpro: 'Federally Subsidizing All College Tuition', 
          img: 'img/issues/diploma.png'
      },
      'vaccines': {
          key: 'vaccines', 
          issuetext: 'Vaccination',
          textcon: 'Letting Parents Decide What\'s Best For Their Child', 
          textpro: 'Mandatory Vaccination', 
          img: 'img/issues/vaccination.png'
      },
      'womansalary': {
          key: 'womansalary', 
          issuetext: 'The Gender Pay Gap',
          textcon: 'Letting Employers/Employees Negotiate Pay',
          textpro: 'Enforcing Equal Pay For Women', 
          img: 'img/issues/gender-equality.png'
      },    
  };    

  var factory = {};
  
  factory.getIssues = function(numIssues) {
      numIssues = parseInt(numIssues);
      var numIssuesAvailable = _.keys(issues).length;
      if (numIssues < 2) {
          throw new RangeError('numIssues must be > 2');
      } else if (numIssues > numIssuesAvailable) {
          throw new RangeError('numIssues must be < ' + numIssuesAvailable);
      }
      
      var index = 0;
      var issuesToUse = _.chain(issues).
          keys().
          shuffle().
          first(numIssues).
          map(function(issueKey) { 
                  return issues[issueKey];
              }).
          each(function(issue) {
                 issue.index = index;
                 index++;
              }).
          indexBy('key').
          value();

      return issuesToUse;
  };
  
  return factory;
});



voter3sat.controller('ConfigCtrl', ['$scope', 'GameService', function($scope, GameService) {
  $scope.numIssues = 3;
  
  $scope.doGenerate = function() {
    GameService.start($scope.numIssues);
  };
}]);


voter3sat.controller('GameCtrl', ['$scope', 'GameService', function($scope, GameService) {
  $scope.GameService = GameService;
  
  $scope.$watch('GameService.sortedIssues', function(sortedIssues) {
    if (sortedIssues && _.size(sortedIssues) > 0) {
      $scope.setCurrentIssueKey(sortedIssues[0].key);
    }
  });
  
  $scope.flip = function(issue) {
    GameService.flipStance(issue);
  };
  
  $scope.getFlips = function() {
    var flips = [];
    if (!GameService.flips) {
      return flips;
    }
    
    for (var iflip = 0; iflip < GameService.flips.permitted; iflip++) {
      flips.push(iflip < GameService.flips.used);
    }
    return flips;
  }
  
  $scope.countVotersSecured = function() {
    return _.filter(GameService.voters, function(voter) {
      return GameService.isVoterVotingForYou(voter);
    }).length;
  };
  
  $scope.voterImageStyle = function(voter) {
    return {};
  };
  
  $scope.voterCaresAboutIssue = function(voter, issuekey) {
    return issuekey in voter.opinions;
  };
  
  // Current voter management.
  var currentVoter = null; 

  $scope.setCurrentVoter = function(voter) {
    currentVoter = (currentVoter === voter) ? null : voter;
  };
  
  $scope.isCurrentVoter = function(voter) {
    return (currentVoter === voter);
  };

  $scope.getVoterRowClasses = function(voter) {
    var isVoterVotingForYou = GameService.isVoterVotingForYou(voter);
    return {
      voterisvotingforyou: isVoterVotingForYou,
      voterisnotvotingforyou: !isVoterVotingForYou,
      rowexpanded: (currentVoter === voter)
    };
  };
  
  // Current issue management.
  var currentIssueKey = null; 

  $scope.setCurrentIssueKey = function(issuekey) {
    currentIssueKey = (currentIssueKey === issuekey) ? null : issuekey;
  };
  
  $scope.isCurrentIssueKey = function(issuekey) {
    return (currentIssueKey === issuekey);
  };

  $scope.getCurrentIssue = function() {
    return (!currentIssueKey || !(currentIssueKey in GameService.issues)) ? null :
        GameService.issues[currentIssueKey];
  };

  $scope.getIssueRowClasses = function(issuekey) {
    var isIssueCurrent = (currentIssueKey === issuekey);
    var isPlatformPro = GameService.platform[issuekey];
    return {
      platformissuepro: isPlatformPro,
      platformissuecon: !isPlatformPro,
      currentissue: isIssueCurrent
    };
  };

  
  $scope.getVoterIssueOpinionClasses = function(voter, issuekey) {
    var voterAgrees = voter.opinions[issuekey] === GameService.platform[issuekey];
    var isIssueCurrent = (currentIssueKey === issuekey);
    return {
      voteragreesonissue: voterAgrees,
      voterdisagreesonissue: !voterAgrees,
      currentissue: isIssueCurrent
    }
  };
}]);

