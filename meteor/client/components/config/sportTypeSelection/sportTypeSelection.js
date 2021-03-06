import {currentCompID, dbReady} from "../config";
import {DBInterface} from "../../../../imports/api/database/DBInterface";
import {AccountManager} from "../../../../imports/api/account_managment/AccountManager";

const categories = new ReactiveVar([]);

DBInterface.waitForReady(function () {
    Tracker.autorun(function () {
        Meteor.f7.showIndicator();
        dbReady.depend();
        DBInterface.waitForReady(function () {
            const compID = currentCompID.get();
            if (!compID) return;
            const competition = Meteor.COLLECTIONS.Contests.handle.findOne({_id: compID});
            const competitionType = DBInterface.getCompetitionType(compID);
            const sportTypes = competitionType.getSports();
            const cats = lodash.map(competitionType.getInformation().categoryNames, function (name) {
                return {name: name, sportTypes: []};
            });

            for (let sportType in sportTypes) {
                if (!sportTypes.hasOwnProperty(sportType)) continue;
                sportType = sportTypes[sportType];

                // set enabled state for sportType
                if (lodash.includes(competition.sportTypes, sportType.id)) sportType.checked = "checked";

                cats[sportType.category].sportTypes.push(sportType);
            }

            categories.set(cats);

            Tracker.afterFlush(Meteor.f7.hideIndicator);
        });
    });
});

Template.sportTypeSelection.helpers({
    categories: function () {
        return categories.get();
    }
});

Template.sportTypeSelection.events({
    'click .checkbox-sportType': function (event) {
        const checkbox = event.target;
        DBInterface.setSportTypeState(AccountManager.getAdminAccount().account, currentCompID.get(), checkbox.dataset.id, checkbox.checked, function () {
            // console.log("IT WORKED");
        });
    }
});