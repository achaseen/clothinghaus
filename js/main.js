const LOCAL_URL = "http://127.0.0.1:9292/api";
const CLOUD_URL = "http://tshirt-soap-to-rest.cloudhub.io/api"
var app = angular.module('tshirtApp', ['ngRoute']);

app.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when("/", { templateUrl: "partials/home.html", controller: "HomepageCtrl" })
        .when("/reserve", { templateUrl: "partials/reserve.html", controller: "ProductCtrl" })
        .when("/status", { templateUrl: "partials/status.html", controller: "StatusCtrl", activePage: "status" })
        .when("/account", { templateUrl: "partials/account.html", controller: "AccountCtrl", activePage: "account" })
        .otherwise("/", { templateUrl: "partials/home.html", controller: "HomepageCtrl" });
}]);

app.controller('HomepageCtrl', function( /* $scope, $location, $http */ ) {});

app.controller('ProductListCtrl', function($scope, $http) {
    $http.get(LOCAL_URL + "/inventory")
        .then(function(response) {
            $scope.products = response.data;
        });
});

app.controller('NavCtrl', function($scope, $route) {
    $scope.$route = $route;
})

app.controller('ProductCtrl', function($scope, productService) {

    $scope.init = function(object) {
        console.log('obj', object);
        $scope.count = object.item.count;
        $scope.description = object.item.description;
        $scope.size = object.item.size;
        $scope.productCode = object.item.productCode;
        $scope.imgUrl = object.dbData[0].imgUrl;
        $scope.msrp = object.dbData[0].msrp;
        $scope.countryOfOrigin = object.dbData[0].countryOfOrigin;
    }
    $scope.addProduct = function(product) {
        productService.addProduct(product);
    }

    $scope.getProduct = function() {
        $scope.init(productService.getProduct());
    }
});

app.service('productService', function() {
    var currentProduct = {};

    var addProduct = function(newObj) {
        currentProduct = newObj;
        localStorage.setItem("currentProduct", JSON.stringify(currentProduct));
    };

    var getProduct = function() {
        if ($.isEmptyObject(currentProduct)) currentProduct = JSON.parse(localStorage.getItem('currentProduct'));
        return currentProduct
    };

    return {
        addProduct: addProduct,
        getProduct: getProduct
    };

});

app.service('userService', function($rootScope, $http) {
    var currentUser = {};

    var addUser = function(newUser) {
        return addUserToSalesforce(newUser);
    }

    var getUser = function(email) {
        if (currentUser.Email == email) return currentUser;
        return getUserFromSalesforce(email);
    }

    var updateUser = function(user) {
        return updateSalesforceUser(user);
    }

    var addUserToSalesforce = function(user) {
        return $http({
            url: LOCAL_URL + "/addContact",
            method: "POST",
            params: {
                email: user.email,
                name: user.name,
                address1: user.address,
                city: user.city,
                stateOrProvince: user.state,
                postalCode: user.zip,
                country: user.country
            }
        }).then(function(resp) {
            if (resp.data.success == "false") return resp;
            var user = {
                id: resp.data.id,
                email: resp.config.params.email,
                name: resp.config.params.name,
                address1: resp.config.params.address1,
                city: resp.config.params.city,
                stateOrProvince: resp.config.params.stateOrProvince,
                postalCode: resp.config.params.postalCode,
                country: resp.config.params.country
            }
            console.log('Added contact to Salesforce', user, resp);
            setCurrentUser(user);
            return resp;
        })

    };

    var getUserFromSalesforce = function(email) {
        return $http({
            url: LOCAL_URL + "/getContact",
            method: "GET",
            params: {
                email: email
            }
        }).then(function(resp) {
            var user = {
                id: resp.data.Id,
                name: resp.data.LastName,
                address1: resp.data.MailingStreet,
                city: resp.data.MailingCity,
                stateOrProvince: resp.data.MailingState,
                postalCode: resp.data.MailingPostalCode,
                country: resp.data.MailingCountry,
                email: resp.data.Email
            }
            console.log('Retrieved contact from Salesforce', user);
            setCurrentUser(user);
            return resp;
        })
    }

    var updateSalesforceUser = function(user) {
        return $http({
            url: LOCAL_URL + "/editContact",
            method: "POST",
            params: {
                id: user.id,
                name: user.name,
                address1: user.address1,
                city: user.city,
                stateOrProvince: user.stateOrProvince,
                postalCode: user.postalCode,
                country: user.country,
                email: user.email
            }
        }).then(function(resp) {
            var user = {
                id: resp.data.id,
                email: resp.config.params.email,
                name: resp.config.params.name,
                address1: resp.config.params.address1,
                city: resp.config.params.city,
                stateOrProvince: resp.config.params.stateOrProvince,
                postalCode: resp.config.params.postalCode,
                country: resp.config.params.country
            }
            console.log('Updated contact in Salesforce', user);
            setCurrentUser(user);
            return resp;
        })
    }

    var setCurrentUser = function(user) {
        currentUser = user;
        $rootScope.$broadcast('user:updated', currentUser);
        console.log("User updated", currentUser);
    }

    var getCurrentUser = function() {
        return currentUser;
    }

    return {
        addUser: addUser,
        getUser: getUser,
        getCurrentUser: getCurrentUser,
        updateUser: updateUser
    }
})

app.controller('ReserveCtrl', function($scope, $http, userService) {
    $scope.sizes = ['S', 'M', 'L'];
    $scope.selectedItem = $scope.sizes[0];
    var user = userService.getUser();
    $scope.user = {
        name: user.name,
        address: user.address1,
        city: user.city,
        state: user.stateOrProvince,
        zip: user.postalCode,
        country: user.country,
        email: user.email
    }

    $scope.$on('user:updated', function(event, user) {
        $scope.name = user.name;
        $scope.address = user.address1;
        $scope.city = user.city;
        $scope.state = user.stateOrProvince;
        $scope.zip = user.postalCode;
        $scope.country = user.country;
        $scope.email = user.email;
    });

    $scope.submit = function(user, size) {
        $http({
            url: CLOUD_URL + "/orders",
            method: "POST",
            params: {
                size: size,
                email: user.email,
                name: user.name,
                address1: user.address,
                city: user.city,
                stateOrProvince: user.state,
                postalCode: user.zip,
                country: user.country
            }
        }).then(function(resp) {
            console.log(resp);
            if (resp.status == 200) {
                $('#reserveNow').attr("disabled", "disabled");
                $scope.submittedOrder = {
                    orderId: resp.data.OrderTshirtResponse.orderId,
                    email: resp.config.params.email
                };
                $(".error-order").hide();
                $(".success-order").show();
            }
        }, function(x, y, z, a) {
            $(".success-order").hide();
            $(".error-order").show();
        })
    }
});

app.controller('StatusCtrl', function($scope, $http) {
    $scope.submit = function(order) {
        $http({
            url: CLOUD_URL + "/orders/" + order.orderId + "/status",
            method: "GET",
            params: {
                email: order.email
            }
        }).then(function(resp) {
            console.log(resp);
            if (resp.status == 200) {
                $scope.trackOrder = {
                    orderId: resp.data.TrackOrderResponse.orderId,
                    size: resp.data.TrackOrderResponse.size,
                    status: resp.data.TrackOrderResponse.status
                };
                $(".track-order").show();
            }
        });
    }
});

app.controller('AccountCtrl', function($scope, userService) {

    $("#editBtn").click(function() {
        $("#account-info form input").removeAttr('disabled');
        $("#account-info form input")[0].focus();
        $("#editBtn").hide();
        $("#updateBtn").show();
    });

    $("#retrieveAct, #createAct").click(function() {
        $scope.$apply(function() {
            $scope.crMessage = "";
            $scope.guMessage = "";
        });
    })

    var user = userService.getUser();

    $scope.submit = function(user) {
        userService.addUser(user)
            .then((update) => {
                if (update.data.success == "true") {
                    $scope.crMessage = "Account creation success.";
                    $("#retrieve-form").toggleClass("in");
                    $("#create-form").toggleClass("in");
                } else if (update.data.success == "false") {
                    $scope.crMessage = "Account creation failed.";
                }
            });
    }

    $scope.getUser = function(user) {
        userService.getUser(user.email.toLowerCase())
            .then((user) => {
                if (user && user.data && user.data.Id) {
                    $scope.guMessage = "Account retrieval success.";
                } else {
                    $scope.guMessage = "Account retrieval failed.";
                }

            });
    }

    $scope.update = function(user) {
        currentUser = userService.getCurrentUser();
        currentUser.name = $scope.name
        currentUser.address1 = $scope.address
        currentUser.city = $scope.city
        currentUser.stateOrProvince = $scope.state
        currentUser.postalCode = $scope.zip
        currentUser.country = $scope.country
        currentUser.email = $scope.email

        userService.updateUser(currentUser)
            .then((update) => {
                $("#account-info form input").attr('disabled', true);
                if (update.data.success == "true") {
                    $scope.$apply(function() {
                    $scope.crMessage = "";
                    $scope.guMessage = "";    
                    })
                    
                    $scope.uuMessage = "Account update success.";
                } else if (update.data.success == "false") {
                    $scope.uuMessage = "Account update failed.";
                }
            })
    }

    $scope.$on('user:updated', function(event, user) {
        $scope.name = user.name;
        $scope.address = user.address1;
        $scope.city = user.city;
        $scope.state = user.stateOrProvince;
        $scope.zip = user.postalCode;
        $scope.country = user.country;
        $scope.email = user.email;
        $("#account-info").show();
        $("#editBtn").show();
        $("#updateBtn").hide();
    });

});