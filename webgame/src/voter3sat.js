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
    
    var ivoter = 0;
    _.each(voters, function(voter) {
      voter.index = ivoter;
      ivoter++;
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

      var winningPlatform = _.clone(platform);
      
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
      GameService.winningPlatform = winningPlatform;
      GameService.flips = {
          permitted: numFlips,
          used: 0
      };
      
      GameService.playerLost = false;
      
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
    GameService.platform[issue.key] = !GameService.platform[issue.key];
    GameService.flips.used++;
    
    if (GameService.didPlayerLose()) {
      GameService.playerLost = true;
    }
  };
  
  this.isVoterVotingForYou = function(voter) {
    return !!voter && _.any(voter.opinions, function(opinion, issuekey) {
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
      return GameService.playerLost || 
          (GameService.flips.used >= GameService.flips.permitted && 
          !GameService.isPlatformWinning());
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
      'blacklivesmatter': {
          key: 'blacklivesmatter', 
          issuetext: 'Black Lives Matter',
          textcon: 'Permitting Cops To Protect Themselves Against Dangerous Thugs', 
          textpro: 'Getting Cops To Stop Shooting Unarmed Black Teens', 
          img: 'img/issues/blacklives.jpg'
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
          textcon: 'A Laissez-Faire Economy', 
          textpro: 'Arresting Predatory Wall Street Fat Cats', 
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
          textcon: 'A Free-Market Medical System', 
          textpro: 'A Single-Payer Government-Funded Health Provider', 
          img: 'img/issues/healthcare.png'
      },
      'israel': {
          key: 'israel', 
          issuetext: 'Israel',
          textcon: 'Ending Our Special Treatment Of Israel', 
          textpro: 'Supporting Israel', 
          img: 'img/issues/israel.png'
      },
      'islam': {
        key: 'islam', 
        issuetext: 'Muslim Outreach',
        textcon: 'Rejecting Islam As Barbaric And Backward', 
        textpro: 'Reaching Out To The Muslim World', 
        img: 'img/issues/islam.gif'
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
        issuetext: 'Addressing The Gender Pay Gap',
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
  
  $scope.doGenerate();
}]);


voter3sat.controller('GameCtrl', ['$document', '$scope', 'GameService', 
    function($document, $scope, GameService) {
  $scope.GameService = GameService;

  $($document).keydown(function(e) {
    switch(e.which) {
      case 37: // left
      $scope.stepIssue(-1);
      break;

      case 38: // up
      $scope.stepVoter(-1);
      break;

      case 39: // right
      $scope.stepIssue(1);
      break;

      case 40: // down
      $scope.stepVoter(1);
      break;

      case 13: // enter
      case 32: // space
      $scope.flip($scope.getCurrentIssue());
      break;
      
      case 27: // escape
      $scope.setCurrentVoter(null);
      break;

      default: return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move caret)    
    $scope.$apply();
  });
  
  $scope.$watch('GameService.sortedIssues', function(sortedIssues) {
    $scope.showSolution = false;
    currentVoter = null;
    currentIssueKey = null;

    if (sortedIssues && _.size(sortedIssues) > 0) {
      $scope.setCurrentIssueKey(sortedIssues[0].key);
    }
  });
  
  $scope.doGenerate = function() {
    $scope.showSolution = false;
    currentVoter = null;
    currentIssueKey = null;
    
    // Start again, with the same # issues.
    GameService.start(GameService.sortedIssues.length);
  };  
  
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
    
    _.defer(function() {
      var expandedRow = $('.voterrow.rowexpanded');
      var vi = $('.voterinterview');
      if (!expandedRow.length) {
        vi.hide();
        return;
      }
      
      var postop = expandedRow.position().top;
      vi.css('top', postop + 'px');
      vi.show();
    });
  };
  
  $scope.getCurrentVoter = function() {
    return currentVoter;
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
  
  $scope.stepVoter = function(stepval) {
    var index;
    var numVoters = GameService.voters.length;

    if (!currentVoter) {
      if (stepval < 0) {
        index = numVoters + stepval;
      }
      else {
        index = stepval - 1;
      }
    }
    else if ((currentVoter.index === 0 && stepval < 0) ||
        (currentVoter.index === numVoters - 1 && stepval > 0)) {
      index = -1;
    }
    else {
      index = currentVoter.index + stepval;
    }
    
    var voter = index >= 0 ? GameService.voters[index] : null;
    $scope.setCurrentVoter(voter);
  };
  
  // Current issue management.
  var currentIssueKey = null; 

  $scope.setCurrentIssueKey = function(issuekey) {
    currentIssueKey = issuekey;
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

  $scope.stepIssue = function(stepval) {
    var issue = $scope.getCurrentIssue();
    if (issue == null) {
      return;
    }

    var currentIssueIndex = issue.index;
    var numIssues = GameService.sortedIssues.length;
    
    currentIssueIndex = (currentIssueIndex + stepval + numIssues) % numIssues;
    currentIssueKey = GameService.sortedIssues[currentIssueIndex].key;
  };

  
  $scope.getVoterIssueOpinionClasses = function(voter, issuekey) {
    var voterAgrees = voter.opinions[issuekey] === GameService.platform[issuekey];
    var voterOpinion = voter.opinions[issuekey];
    var isIssueCurrent = (currentIssueKey === issuekey);
    return {
      voteragreesonissue: voterAgrees,
      voterdisagreesonissue: !voterAgrees,
      platformissuepro: voterOpinion,
      platformissuecon: !voterOpinion,
      currentissue: isIssueCurrent
    }
  };
  
  $scope.getVoterAgreementString = function(voter) {
    if (!voter) {
      return null;
    }
    
    var agreementTexts = [];
    for (var i = 0; i < voter.sortedIssueKeys.length; i++) {
      var issuekey = voter.sortedIssueKeys[i];
      if (voter.opinions[issuekey] === GameService.platform[issuekey]) {
        agreementTexts.push(GameService.issues[issuekey].issuetext);
      }
    }

    switch (agreementTexts.length) {
      case 1:
      return agreementTexts[0];
      
      case 2:
      return agreementTexts[0] + ' and ' + agreementTexts[1];
      
      case 3:
      return agreementTexts[0] + ', ' + agreementTexts[1] + ', and ' + agreementTexts[2];
      
      default:
      return null;
    };
  };
}]);

