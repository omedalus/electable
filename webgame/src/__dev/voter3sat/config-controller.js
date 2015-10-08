voter3sat.controller('ConfigCtrl', ['$scope', 'BoardService', function($scope, BoardService) {
  $scope.numIssues = 3;
  
  $scope.doGenerate = function() {
    BoardService.start($scope.numIssues);
  };
  
  $scope.doGenerate();
}]);

