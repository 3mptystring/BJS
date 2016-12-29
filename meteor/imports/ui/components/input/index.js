import {Template} from "meteor/templating";
import "./index.html";
import "./index.css";
import {AccountManagement} from "../../../api/AccountManagement";
import {Log} from "../../../api/log";
import {DBInterface} from "../../../api/database/db_access";
import {arrayify} from "../../../startup/client/helpers";

Meteor.input = {};
Meteor.input.log = new Log();

const input_deps = new Tracker.Dependency();

function getAthletes() {
    const group_account = AccountManagement.retrieveAccounts().Gruppenleiter.account;
    if (!group_account) return [];
    return DBInterface.getAthletesOfAccounts(Meteor.input.log, [group_account], false);
}

function getAthleteIDs() {
    return lodash.map(lodash.sortBy(getAthletes(), 'lastName'), function (athlete) {
        return athlete.id;
    });
}

function getAthleteByID(id) {
    return _.find(getAthletes(), function (a) {
        return a.id == id;
    });
}

export let input_onload = function (page) {

    Template.login.helpers({
        show_login: !AccountManagement.inputPermitted()
    });

    Template.input.helpers({
        athletes: function () {
            Meteor.login_deps.depend();
            const athletes = lodash.sortBy(getAthletes(), 'lastName');

            let athlete_list = [];
            for (let athlete in athletes) {
                if (!athletes.hasOwnProperty(athlete)) continue;
                athlete = athletes[athlete];
                athlete_list.push({id: athlete.id, name: athlete.getFullName()});
            }

            return athlete_list;
        },
        nameByID: function (id) {
            Meteor.login_deps.depend();
            const athlete = getAthleteByID(id);
            if (!athlete) return "";
            return getAthleteByID(id).getFullName();
        },
        athleteByID: function (id) {
            Meteor.login_deps.depend();
            input_deps.depend();
            let sportTypes = {};
            if (!AccountManagement.retrieveAccounts().Station.logged_in) {
                // Return all sport types
                //TODO Filter by ones that already have data
                sportTypes = lodash.map(DBInterface.getCompetitionSportTypes(),
                    DBInterface.getCompetitionType().getSportType);
            } else {
                // Return all sport types that can be written to with the current station account
                const stIDs = AccountManagement.retrieveAccounts().Station.account.score_write_permissions;
                for (let stID in stIDs) {
                    if (!stIDs.hasOwnProperty(stID)) continue;
                    stID = stIDs[stID];
                    sportTypes[stID] = DBInterface.getCompetitionType().getSportType(stID);
                }
            }

            const athlete = getAthleteByID(id);
            if (athlete === undefined) return {};

            console.log("Athlete", athlete);
            // Fetch the measurements
            const read_only_measurements = athlete.getPlain(Meteor.input.log, [AccountManagement.retrieveAccounts().Gruppenleiter.account], false);
            console.log("ROM", read_only_measurements);

            athlete.sportType = {};
            // Insert the metadata for the sportTypes
            if (AccountManagement.retrieveAccounts().Station.account) {
                for (let sportType in sportTypes) {
                    if (!athlete.sportType[sportType]) athlete.sportType[sportType] = {};
                    athlete.sportType[sportType].metadata = sportTypes[sportType];
                    athlete.sportType[sportType].measurements = [];
                }
            }

            // Insert the read_only_measurements into the athlete object
            for (let measurement_block in read_only_measurements) {
                if (!read_only_measurements.hasOwnProperty(measurement_block)) continue;
                measurement_block = read_only_measurements[measurement_block];

                const stID = measurement_block.stID.data;
                athlete.sportType[stID].measurements = lodash.map(measurement_block.measurements.data, function (measurement) {
                    return {read_only: true, value: measurement};
                });
            }

            // Insert the read-write data from the current session
            if (AccountManagement.retrieveAccounts().Station.account && sessionStorage.getItem("measurements")) {
                const measurements = JSON.parse(sessionStorage.getItem("measurements"))[id];
                for (let sportType in measurements) {
                    if (!measurements.hasOwnProperty(sportType)) continue;
                    const data = lodash.map(measurements[sportType], function (entry) {
                        return {read_only: false, value: entry};
                    });
                    athlete.sportType[sportType].measurements = athlete.sportType[sportType].measurements.concat(data);
                }
            }

            console.log(athlete);

            athlete.sportType = arrayify(athlete.sportType);

            return athlete;
        },
        isEmpty: function (arr) {
            return arr.length === 0;
        }
    });

    Template.attempts.helpers({
        length: function (arr) {
            return arr.length;
        },
        empty_measurement: {read_only: false, value: ""}
    });

    Template.attempt.helpers({
        inc: function (i) {
            return ++i;
        },
        isReadOnly: function (measurement) {
            return measurement.read_only ? "disabled" : "";
        },
        athlete_id: function () {
            return FlowRouter.getParam("athlete_id");
        }
    });

    Template.input.events({
        'click li.athlete': function (event) {
            FlowRouter.go("/contest/" + event.target.closest("li").dataset.id);
            Meteor.f7.closePanel();
        },
        'click #link_prev': function () {
            const athleteIDs = getAthleteIDs();
            let prevAthleteID = athleteIDs.indexOf(FlowRouter.getParam("athlete_id")) - 1;
            if (prevAthleteID < 0) prevAthleteID = athleteIDs.length - 1;
            FlowRouter.go("/contest/" + athleteIDs[prevAthleteID]);
        },
        'click #link_next': function () {
            const athleteIDs = getAthleteIDs();
            let prevAthleteID = athleteIDs.indexOf(FlowRouter.getParam("athlete_id")) + 1;
            if (prevAthleteID > athleteIDs.length - 1) prevAthleteID = 0;
            FlowRouter.go("/contest/" + athleteIDs[prevAthleteID]);
        }
    });

    function updateMeasurement(athleteID, stID, attempt, measurement) {
        if (!athleteID || !stID || !attempt || !measurement) return;
        if (!sessionStorage.getItem("measurements")) sessionStorage.setItem("measurements", "{}");

        const measurements = JSON.parse(sessionStorage.getItem("measurements"));
        if (measurements[athleteID] === undefined) measurements[athleteID] = {};
        if (measurements[athleteID][stID] === undefined) measurements[athleteID][stID] = {};
        if (measurements[athleteID][stID][attempt] == measurement) return false;
        measurements[athleteID][stID][attempt] = measurement;

        sessionStorage.setItem("measurements", JSON.stringify(measurements));
        input_deps.changed();

        return true;
    }

    Template.attempt.events({
        'keypress input': function (event) {
            if (event.keyCode == 13) {
                const data = event.target.dataset;
                if (updateMeasurement(data.athleteId, data.stid, data.attempt, event.target.value)) event.target.value = "";
                event.stopPropagation();
                return false;
            }
        },
        'blur input': function (event) {
            const data = event.target.dataset;
            if (updateMeasurement(data.athleteId, data.stid, data.attempt, event.target.value)) event.target.value = "";
        }
    });

    Template.input.onRendered(function () {
        Meteor.f7 = new Framework7({
            swipePanel: 'left'
        });

        DBInterface.waitForReady(function () {
            const athletes = lodash.sortBy(getAthletes(), 'lastName');
            if ((!page.params.athlete_id && athletes[0]) || !lodash.find(athletes, function (athlete) {
                    return athlete.id == page.params.athlete_id;
                }))
                FlowRouter.go('/contest/' + athletes[0].id);
        });
    });
};