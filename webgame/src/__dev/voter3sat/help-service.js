voter3sat.service('HelpService', [function() {
  var HelpService = this;

  var _isHelpShowing = false;
  
  HelpService.isHelpShowing = function() {
    return _isHelpShowing;
  };
  
  HelpService.setHelpShowing = function(toShow) {
    _isHelpShowing = toShow;
  };
  
  HelpService.showHelp = function() {
    _isHelpShowing = true;
  };

  HelpService.hideHelp = function() {
    _isHelpShowing = false;
  };

  HelpService.toggleHelp = function() {
    _isHelpShowing = !_isHelpShowing;
  };
}]);
