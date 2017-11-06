    /**
 * Product getter / setter
 **/
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

/**
 * Service that performs user manipulation
 **/
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
            console.log('edit resp is', resp);
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