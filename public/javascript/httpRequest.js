// define function to make an http request using a promise
function get(url) {
  // contain XMLHttpRequest within a promise
  return new Promise(function(resolve, reject) {

    // data for the request
    var request = new XMLHttpRequest();
    request.open('GET', url);

    // promise is fulfilled with either the data or an error
    request.onload = function() {
      if (request.status == 200 && request.readyState == 4) {
        resolve(request.response);
      } else {
        reject(Error(request.statusText));
      }
    };

    // error handling for request
    request.onerror = function() {
      reject(Error("Unable to get data"));
    };

    // send the request
    request.send();
  });
};
