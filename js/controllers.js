/**
 * Get list of products, populate Product List view
 **/
app.controller('ProductListCtrl', function($scope, $http) {
    $http.get(LOCAL_URL + "/inventory")
        .then(function(response) {
            $scope.products = response.data;
        });
});

/**
 * Expose route for navbar current page CSS 
 **/
app.controller('NavCtrl', function($scope, $route) {
    $scope.$route = $route;
})

/**
 * Initializes product and keeps track of last product viewed
 **/
app.controller('ProductCtrl', function($scope, productService) {

    $scope.init = function(object) {
        $scope.count = object.item.count;
        $scope.description = object.item.description;
        $scope.size = object.item.size;
        $scope.productCode = object.item.productCode;
        $scope.imgUrl = object.dbData[0].imgUrl;
        $scope.msrp = object.dbData[0].msrp;
        $scope.countryOfOrigin = object.dbData[0].countryOfOrigin;
        $scope.addlDesc = object.dbData[0].addlDesc;
    }
    $scope.addProduct = function(product) {
        productService.addProduct(product);
    }

    $scope.getProduct = function() {
        $scope.init(productService.getProduct());
    }
});

/**
 * Initializes PDP, allows user to reserve
 * Listens for user updated broadcast to update form with user info
 **/
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
            if (resp.status == 200) {
                $('#reserveNow').attr("disabled", "disabled");
                $scope.submittedOrder = {
                    orderId: resp.data.OrderTshirtResponse.orderId,
                    email: resp.config.params.email
                };
                $(".error-order").hide();
                $(".success-order").show();
            }
        }, function() {
            $(".success-order").hide();
            $(".error-order").show();
        })
    }
});

/**
 * Gets order status
 **/
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

/**
 * Create, edit, retrieve user accounts
 **/
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