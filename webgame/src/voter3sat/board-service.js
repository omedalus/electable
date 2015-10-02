voter3sat.service('BoardService', ['$rootScope', 'IssueFactory', function($rootScope, IssueFactory) {
  var BoardService = this;

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
    var origPlatform = BoardService.platform;
    BoardService.platform = {};
    
    var numIssues = _.size(BoardService.issues);
    var platformbitsMax = 1 << numIssues;
    for (var platformbits = 0; platformbits < platformbitsMax; platformbits++) {
      if (platformbits === winningbitmask) {
        continue;
      }
      
      _.each(BoardService.issues, function(issue, issuekey) {
        BoardService.platform[issuekey] = !!(platformbits & (1 << issue.index));
      });
      
      if (BoardService.isPlatformWinning()) {
        numOtherWinning++;
      }
    }
    
    BoardService.platform = origPlatform;
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
      
      BoardService.issues = issues;
      BoardService.sortedIssues = _.sortBy(issues, function(issue, issuekey) {
          return issue.index;
      });
      
      BoardService.voters = voters;
      BoardService.platform = platform;
      BoardService.winningPlatform = winningPlatform;
      BoardService.flips = {
          permitted: numFlips,
          used: 0
      };
      
      BoardService.playerLost = false;
      
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
    BoardService.platform[issue.key] = !BoardService.platform[issue.key];
    BoardService.flips.used++;
    
    if (BoardService.didPlayerLose()) {
      BoardService.playerLost = true;
    }
  };
  
  this.isVoterVotingForYou = function(voter) {
    return !!voter && _.any(voter.opinions, function(opinion, issuekey) {
      return opinion === BoardService.platform[issuekey];
    });
  };
  
  this.isPlatformWinning = function() {
      return !!BoardService.voters &&
          _.all(BoardService.voters, function(voter) {
            return BoardService.isVoterVotingForYou(voter);
          });
  };
  
  this.didPlayerLose = function() {
      return BoardService.playerLost || 
          (BoardService.flips &&
          BoardService.flips.used >= BoardService.flips.permitted && 
          !BoardService.isPlatformWinning());
  };
  
  this.isGameOn = function() {
      return !BoardService.isPlatformWinning() && !BoardService.didPlayerLose();
  };
}]);
