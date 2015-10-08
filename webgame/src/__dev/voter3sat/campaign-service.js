voter3sat.service('CampaignService', ['StateFactory', function(StateFactory) {
  var CampaignService = this;

  var _currentBoardIndex = 0;
  
  CampaignService.getCurrentBoardIndex = function() {
    return _currentBoardIndex;
  };
  
  CampaignService.getCurrentBoard = function() {
    return StateFactory[_currentBoardIndex];
  };

  CampaignService.advanceBoard = function() {
    _currentBoardIndex++;
    return CampaignService.getCurrentBoard();
  };
  
}]);
