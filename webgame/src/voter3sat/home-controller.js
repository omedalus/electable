voter3sat.controller('HomeCtrl', ['$document', '$location', '$scope', 'CampaignService', 
    function($document, $location, $scope, CampaignService) {
  $scope.CampaignService = CampaignService;
  
  $scope.goToCampaign = function() {
    $location.path('board');
  };
}]);

