import {Template} from "meteor/templating";
import "./index.html";
import "./index.css";
import "../../../layouts/views.css";
import {NewCompetition} from "../new_competition_helpers";
import {genRandomCode} from "../../../../api/crypto/pwdgen";
import {Account} from "../../../../api/logic/account";
import {Crypto} from "../../../../api/crypto/crypto";

let loginStations = [];
let loginGroups = [];
let loginCustom = [];

let _login_tracker = new Tracker.Dependency();


Template.codes.helpers({
    login_stations: function () {
        _login_tracker.depend();
        return loginStations;
    },
    login_groups: function () {
        _login_tracker.depend();
        return loginGroups;
    },
    login_custom: function () {
        _login_tracker.depend();
        const ct = NewCompetition.getCompetitionType();
        return _.map(loginCustom, function (accountObject) {
            accountObject.sports = _.map(
                _.filter(NewCompetition.getSports(), function (sportTypeObj) {
                    return sportTypeObj.activated;
                }), function (sportTypeObj) {
                    let stID = sportTypeObj.stID;
                    return {
                        stID: stID,
                        name: ct.getNameOfSportType(stID),
                        checked: ""
                    };
                }
            );

            const score_write_permissions = accountObject.account.score_write_permissions;


            for (let stIDIndex in score_write_permissions) {
                for (let sportObjectIndex in accountObject.sports) {
                    if (score_write_permissions[stIDIndex] === accountObject.sports[sportObjectIndex].stID) {
                        accountObject.sports[sportObjectIndex].checked = "checked";
                        break;
                    }
                }
            }

            return accountObject;
        });
    },
    get_custom_sport_types: function () {
        _login_tracker.depend();
        const ct = NewCompetition.getCompetitionType();
        const all_sport_types = _.map(
            _.filter(NewCompetition.getSports(), function (sportTypeObj) {
                return sportTypeObj.activated;
            }), function (sportTypeObj) {
                let stID = sportTypeObj.stID;
                let name = ct.getNameOfSportType(stID);
                if (name.length > 27) {
                    name = name.slice(0, 24) + "...";
                }
                return {
                    stID: stID,
                    name: name
                };
            }
        );

        const group_permissions = loginCustom[currentCustomLogin].account.group_permissions;

        for (let stIDIndex in group_permissions) {
            for (let sportObjectIndex in all_sport_types) {
                if (group_permissions[stIDIndex] === all_sport_types[sportObjectIndex].stID) {
                    all_sport_types[sportObjectIndex].checked = "checked";
                }
            }
        }

        return all_sport_types;
    }
});

Template.codes.events({
    'click #link_back' (event,instance) {
        loginStations = [];
        loginGroups = [];
        FlowRouter.go('/config/athletes');
    },
    'click #link_start' (event, instance) {
        if (loginGroups.length != Meteor.groups.length) {
            Meteor.f7.alert("Sie müssen erst Zugangscodes automatisch erstellen.", "Hinweiß");
            return;
        }

        //TODO maybe option to reset password and remove confirms
        Meteor.f7.confirm('Nach dem Starten könne keine Änderungen mehr vorgenommen werden. Der neue Wettkampf wird automatisch aktiviert.', 'BJS starten', function () {
            Meteor.f7.confirm('Haben Sie alle Zugangscodes am Besten zwei mal gespeichert? Dafür kann man diese Ausdrucken, als PDF speichern oder abschreiben.', 'BJS starten', function () {
                Meteor.f7.confirm('Nach dem Starten können die Zugangscodes nicht erneut angezeigt werden. Stellen Sie sicher, dass Sie ohne "RunItEasy" Zugriff auf die Zugangscodes haben. Ansonsten müssen Sie einen neuen Wettkampf einrichten!', 'BJS starten', function () {
                    Meteor.f7.confirm('Jetzt starten?', 'BJS starten', function () {
                        const accounts = _.map(loginGroups.concat(loginStations), function (obj) {
                            return obj.account;
                        });

                        NewCompetition.save(accounts);

                        FlowRouter.go('/config');
                    });
                });
            });
        });
    },
    'click #btn-print' (event, instance) {
        window.print();
    },
    'click #btn-new-codes' (event, instance) {
        document.getElementById("btn-new-codes").setAttribute("disabled", "true");
        document.getElementById("btn-print").setAttribute("disabled", "true");
        document.getElementById("link_back").setAttribute("disabled", "true");
        document.getElementById("link_start").setAttribute("disabled", "true");

        // Load UI elements
        const progressBar = document.getElementById("progress-bar");
        const progressText = document.getElementById("progress-text");

        //load data
        const ct = NewCompetition.getCompetitionType();

        const sportTypes = _.map(_.filter(NewCompetition.getSports(), function (obj) {
            return obj.activated;
        }), function (obj) {
            return {
                stID: obj.stID,
                name: ct.getNameOfSportType(obj.stID)
            };
        });

        const accountNumber = Meteor.groups.length + sportTypes.length;

        //Delete old passwords
        loginGroups = [];
        loginStations = [];
        progressText.innerHTML = "0/" + accountNumber;
        Meteor.f7.setProgressbar("#progress-bar", 100);//TODO not working
        _login_tracker.changed();

        let counter = 0;

        const generateNextGroupLogin = function () {
            const groupID = counter - sportTypes.length;
            if (groupID < Meteor.groups.length) {
                const password = genRandomCode();

                const account = new Account(Meteor.groups[groupID].name, [Meteor.groups[groupID].name], [], Crypto.generateAC(password));

                loginGroups.push({
                    password: password,
                    account: account
                });
                Meteor.groups[groupID].account = account;

                counter++;
                _login_tracker.changed();
                progressText.innerHTML = counter + "/" + accountNumber; //TODO add progress bar

                setTimeout(generateNextStationLogin, 0);
            } else {
                document.getElementById("btn-new-codes").removeAttribute("disabled");
                document.getElementById("btn-print").removeAttribute("disabled");
                document.getElementById("link_back").removeAttribute("disabled");
                document.getElementById("link_start").removeAttribute("disabled");
            }
        };

        const generateNextStationLogin = function () {
            if (counter < sportTypes.length) {
                const password = genRandomCode();

                loginStations.push({
                    password: password,
                    account: new Account(sportTypes[counter].name, [], [sportTypes[counter].stID], Crypto.generateAC(password))
                });

                counter++;
                _login_tracker.changed();
                progressText.innerHTML = counter + "/" + accountNumber; //TODO add progress bar

                setTimeout(generateNextStationLogin, 0);
            } else {
                generateNextGroupLogin();
            }
        };

        generateNextStationLogin();
    },
    'click #btn-add-account' (event, instance) {
        const password = genRandomCode();
        const account = new Account('Unbenannt', [], [], Crypto.generateAC(password));

        loginCustom.push({
            password: password,
            account: account
        });
        _login_tracker.changed();

    },
    'change .permission-input' (event, instance) {
        let accountIndex = event.target.dataset.account_index;
        const all_sport_types = _.filter(NewCompetition.getSports(), function (sportTypeObj) {
            return sportTypeObj.activated;
        });

        loginCustom[accountIndex].account.group_permissions = [];

        for (let sportTypeIndex in all_sport_types) {
            let stID = all_sport_types[sportTypeIndex].stID;
            let checkbox = document.getElementById("custom-select-" + stID + "-" + accountIndex);
            if (checkbox) {
                if (checkbox.checked) {
                    loginCustom[accountIndex].account.group_permissions.push(stID);
                }
            }
        }
    },
    'click .btn-remove-account' (event, instance) {
        let accountIndex = event.target.closest(".btn-remove-account").dataset.account_index;
        loginCustom.splice(accountIndex, 1);
        _login_tracker.changed();
    },
    'input .in-custom-name' (event, instance) {
        let accountIndex = event.target.dataset.account_index;
        loginCustom[accountIndex].account.name = event.target.value;
        _login_tracker.changed();
    }
});