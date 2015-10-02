
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
    if (numIssues < 3) {
      throw new RangeError('numIssues must be at least 3');
    } else if (numIssues > numIssuesAvailable) {
      throw new RangeError('numIssues must be less than ' + numIssuesAvailable);
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

