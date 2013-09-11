/**
 * Copyright 2013 Red Hat, Inc.
 *
 * This software is licensed to you under the GNU General Public
 * License as published by the Free Software Foundation; either version
 * 2 of the License (GPLv2) or (at your option) any later version.
 * There is NO WARRANTY for this software, express or implied,
 * including the implied warranties of MERCHANTABILITY,
 * NON-INFRINGEMENT, or FITNESS FOR A PARTICULAR PURPOSE. You should
 * have received a copy of GPLv2 along with this software; if not, see
 * http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt.
 */

/**
 * @ngdoc object
 * @name  Bastion.products.controller:DisocveryController
 *
 * @requires $scope
 * @requires Product
 *
 * @description
 *   Provides the functionality for the product details action pane.
 */
angular.module('Bastion.products').controller('DiscoveryController',
    ['$scope', '$q', '$timeout', '$http', 'Task', 'Organization', 'CurrentOrganization',
    function($scope, $q, $timeout, $http, Task, Organization, CurrentOrganization) {
        var transformRows, setDiscoveryDetails;

        //Start discovery Stuff
        $scope.discovery = {url: ''};
        $scope.panel.loading = false;
        $scope.discoveryTable = {rows: []};

        setDiscoveryDetails = function(task) {
            $scope.discovery.url = task.parameters.url;
            $scope.discoveryTable.rows = transformRows(task.result);
            $scope.discovery.pending = task.pending;
        };

        $scope.setupSelected = function() {
            $scope.discovery.selected = $scope.discoveryTable.getSelected();
            $scope.transitionTo('products.discovery.create');
        };

        $scope.defaultName = function(basePath){
            //Remove leading/trailing slash and replace rest with space
            return basePath.replace(/^\//, "").replace(/\/$/, "").replace(/\//g, ' ');
        };

        $scope.cancelDiscovery = function(){
            Organization.cancelRepoDiscover({id: CurrentOrganization});
        };

        transformRows = function(urls) {
            var baseUrl, toRet = [];
            baseUrl = $scope.discovery.url;
            angular.forEach(urls, function(url){
                var path = url.replace(baseUrl, "");
                toRet.push({
                        url: url,
                        path: path,
                        name: $scope.defaultName(path),
                        label: ''
                });
            });
            return _.sortBy(toRet, function(item){
                return item.url;
            });
        };

        Organization.get({id: CurrentOrganization}, function(org){
            if (org['discovery_task_id']) {
                Task.get({id: org['discovery_task_id']}, function(task){
                    setDiscoveryDetails(task);
                });
            }
        });

        $scope.discover = function() {
            $scope.discovery.pending = true;
            $scope.discoveryTable.rows = [];
            $scope.discoveryTable.selectAll(false);
            Organization.repoDiscover({id: CurrentOrganization, url: $scope.discovery.url}, function(response) {
                pollTask(response);
            });
        };

        function pollTask(task) {
            if (task.pending) {
                $timeout(function() {
                    checkTask(task);
                }, 1000);
            } else {
                setDiscoveryDetails(task);
            }
        }

        function checkTask(task) {
            Task.get({id: task.id}, function(response) {
                setDiscoveryDetails(response);
                pollTask(response);
            });
        }
    }]
);
