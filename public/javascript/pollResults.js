'use strict';

// import module
//import Chart from 'modules/Chart.min.js';

// define placeholders
var pollData;
var pollUrl;
var pollOptionNames;
var pollOptionVotes;
var backgroundColorGradientObject;
var borderColorGradientObject;

// create url for http request
var pageUrl = window.location.href;
var tempArray = pageUrl.split('/');
var pollID = tempArray.pop();
tempArray.push('json', pollID);
pollUrl = tempArray.join('/');

// http request to get poll data
// 'get()' defined in 'httpRequest.js'
//   - makes an http request as a promise
get(pollUrl).then(function(response) {
  // hide "loading"
  var loading = document.getElementById('loading');
  loading.classList.add('not-visible');
  // build chart
  pollData = JSON.parse(response);
  var pollChoices = getDataFromArray('choice', pollData);
  var pollChoiceVotes = getDataFromArray('votes', pollData);
  createChart(pollData.name, pollChoices, pollChoiceVotes);

}, function(error) {
  pollData = error;
});

// function to create a chart
function createChart(pollName, labelArray, dataArray) {
  // define context and create chart
  var c = document.getElementById('poll-result-visual');
  var context = c.getContext('2d');

  // generate array with a color for each poll option
  var arrayOfBackgroundColors = [];
  var arrayOfBorderColors = [];
  for (var i = 0; i < labelArray.length; i++) {
    var bgCol = generateColorRGBA(0.6);
    var borderCol = generateColorRGBA(1);
    arrayOfBackgroundColors.push(bgCol);
    arrayOfBorderColors.push(borderCol);
  };

  var pollResults = new Chart(context, {

    type: 'bar',

    data: {
      labels: labelArray,
      datasets: [{
        label: pollName,
        backgroundColor: arrayOfBackgroundColors,
        borderColor: arrayOfBorderColors,
        borderWidth: 2,
        data: dataArray
      }]
    },

    options: {
      legend: {
        display: false
      },
      scales: {
        xAxes: [{
          stacked: true
        }],
        yAxes: [{
          stacked: true,
          ticks: {
            beginAtZero: true
                  }
        }]
      }
    }

  });
};

// consolidates data from an array inside an object
// returns a smaller array
function getDataFromArray(stringAttributeToParse, pollObject) {
  var optionArray = [];
  pollObject.options.forEach(function(option) {
    optionArray.push(option[stringAttributeToParse]);
  });
  return optionArray;
};

// returns a random color with transparency
function generateColorRGBA(opacity) {
  var rgba = 'rgba(' + generateColorValue() + ', ' + generateColorValue() + ', ' + generateColorValue() + ', ' + opacity + ')';
  return rgba;
};

// returns a random 0-255 number
function generateColorValue() {
  var num = Math.floor(Math.random() * 255);
  return num;
}
