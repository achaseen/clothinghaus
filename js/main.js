const LOCAL_URL = "http://127.0.0.1:9292/api";
const CLOUD_URL = "http://tshirt-soap-to-rest.cloudhub.io/api"
var app = angular.module('tshirtApp', ['ngRoute']);

/**
 * Angular router for SPA
 **/
app.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when("/", { templateUrl: "partials/home.html" })
        .when("/reserve", { templateUrl: "partials/reserve.html", controller: "ProductCtrl" })
        .when("/status", { templateUrl: "partials/status.html", controller: "StatusCtrl", activePage: "status" })
        .when("/account", { templateUrl: "partials/account.html", controller: "AccountCtrl", activePage: "account" })
        .otherwise("/", { templateUrl: "partials/home.html" });
}]);