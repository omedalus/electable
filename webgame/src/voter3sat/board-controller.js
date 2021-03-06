voter3sat.controller('BoardCtrl', ['$document', '$scope', 'BoardService', 'CampaignService', 'HelpService',
    function($document, $scope, BoardService, CampaignService, HelpService) {
  $scope.BoardService = BoardService;
  $scope.CampaignService = CampaignService;
  $scope.HelpService = HelpService;
  $scope.difficultyLevel = 1;

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
  
  $scope.$watch('BoardService.sortedIssues', function(sortedIssues) {
    $scope.showSolution = false;
    currentVoter = null;
    currentIssueKey = null;

    if (sortedIssues && _.size(sortedIssues) > 0) {
      $scope.setCurrentIssueKey(sortedIssues[0].key);
    }
  });
  
  $scope.doAdvance = function() {
    CampaignService.advanceBoard();
    $scope.doGenerate();
  };
  
  $scope.doGenerate = function() {
    $scope.showSolution = false;
    $scope.begingamesplashDismissed = false;
    $scope.endgamesplashDismissed = false;
    
    currentVoter = null;
    currentIssueKey = null;
    
    // Start again, with the same # issues.
    BoardService.start(CampaignService.getCurrentBoard().numIssues);
    
    // Clear the state splasher.
    setTimeout(function() {
      $scope.$apply(function() {
        $scope.begingamesplashDismissed = true;
      });
    }, 3000);
  };
  
  $scope.flip = function(issue) {
    var wasGameOnBeforeFlip = BoardService.isGameOn();

    BoardService.flipStance(issue);
    
    if (wasGameOnBeforeFlip && !BoardService.isGameOn()) {
      // This flip ended the board. The user will see an end-board overlay.
      // Set up an auto dismisser for it.
      setTimeout(function() {
        $scope.$apply(function() {
          $scope.endgamesplashDismissed = true;
        });
      }, 1000);
    }
  };
  
  $scope.getFlips = function() {
    var flips = [];
    if (!BoardService.flips) {
      return flips;
    }
    
    for (var iflip = 0; iflip < BoardService.flips.permitted; iflip++) {
      flips.push(iflip < BoardService.flips.used);
    }
    return flips;
  }
  
  $scope.countVotersSecured = function() {
    return _.filter(BoardService.voters, function(voter) {
      return BoardService.isVoterVotingForYou(voter);
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
    var isVoterVotingForYou = BoardService.isVoterVotingForYou(voter);
    var isVoterAtRisk = $scope.willWeLoseVoterIfWeFlipOnCurrentIssue(voter);
    
    return {
      voterisvotingforyou: isVoterVotingForYou,
      voterisnotvotingforyou: !isVoterVotingForYou,
      rowexpanded: (currentVoter === voter),
      voterisatrisk: isVoterAtRisk
    };
  };
  
  $scope.stepVoter = function(stepval) {
    var index;
    var numVoters = BoardService.voters.length;

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
    
    var voter = index >= 0 ? BoardService.voters[index] : null;
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
    return (!currentIssueKey || !(currentIssueKey in BoardService.issues)) ? null :
        BoardService.issues[currentIssueKey];
  };

  $scope.getIssueRowClasses = function(issuekey) {
    var isIssueCurrent = (currentIssueKey === issuekey);
    var isPlatformPro = BoardService.platform[issuekey];
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
    var numIssues = BoardService.sortedIssues.length;
    
    currentIssueIndex = (currentIssueIndex + stepval + numIssues) % numIssues;
    currentIssueKey = BoardService.sortedIssues[currentIssueIndex].key;
  };

  
  $scope.getVoterIssueOpinionClasses = function(voter, issuekey) {
    var voterAgrees = voter.opinions[issuekey] === BoardService.platform[issuekey];
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
      if (voter.opinions[issuekey] === BoardService.platform[issuekey]) {
        agreementTexts.push(BoardService.issues[issuekey].issuetext);
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

  
  $scope.willWeLoseVoterIfWeFlipOnCurrentIssue = function(voter) {
    if (!voter) {
      return null;
    }
    
    var issue = $scope.getCurrentIssue();
    if (issue == null) {
      return;
    }

    var numIssuesOnWhichVoterAgrees = 0;
    var doesVoterAgreeOnCurrentIssue = false;
    for (var i = 0; i < voter.sortedIssueKeys.length; i++) {
      var issuekey = voter.sortedIssueKeys[i];
      if (voter.opinions[issuekey] === BoardService.platform[issuekey]) {
        numIssuesOnWhichVoterAgrees++;
        
        if (issuekey === issue.key) {
          doesVoterAgreeOnCurrentIssue = true;
        }
      }
    }
    
    return (doesVoterAgreeOnCurrentIssue && numIssuesOnWhichVoterAgrees === 1);
  }
  
  $scope.doGenerate();
}]);

