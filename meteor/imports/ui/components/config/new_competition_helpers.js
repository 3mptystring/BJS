/**
 * Created by noah on 12/29/16.
 */
import {getCompetitionTypeByID} from "../../../api/logic/competition_type";

/**
 * Object containing all information and functions required for creating a new competition.
 * @public
 * @namespace
 */
export let NewCompetition = {
    /** @constant {number} */
    prefix: "new_competition_",

    groupExists: function (name) {
        for (let group in Meteor.groups) {
            if (Meteor.groups[group].name === name) return true;
        }
        return false;
    },

    selectAthlete: function (athleteID) { //TODO Gender and start class
        if (!document.getElementById("in-first-name")) {
            Meteor._currentAthlete = -1;
        } else {
            if ((Meteor._currentAthlete != -1) && (Meteor._currentGroup != -1)) {
                let new_athlete = Meteor.groups[Meteor._currentGroup].athletes[Meteor._currentAthlete];
                new_athlete.firstName = document.getElementById("in-first-name").value;
                new_athlete.lastName = document.getElementById("in-last-name").value;
                new_athlete.ageGroup = document.getElementById("in-year").value;

            }
            Meteor._currentAthlete = athleteID;
            if (athleteID != -1) {
                const new_athlete = Meteor.groups[Meteor._currentGroup].athletes[Meteor._currentAthlete];
                document.getElementById("in-first-name").removeAttribute("disabled");
                document.getElementById("in-last-name").removeAttribute("disabled");
                document.getElementById("in-year").removeAttribute("disabled");
                document.getElementById("pick-gender").removeAttribute("disabled");
                document.getElementById("pick-start_class").removeAttribute("disabled");
                document.getElementById("btn-delete-athlete").removeAttribute("disabled");
                document.getElementById("in-first-name").value = new_athlete.firstName;
                document.getElementById("in-last-name").value = new_athlete.lastName;
                document.getElementById("in-year").value = new_athlete.ageGroup;
                // call it a second time because some browsers have problems with the placeholder
                document.getElementById("in-first-name").value = new_athlete.firstName;
                document.getElementById("in-last-name").value = new_athlete.lastName;
                document.getElementById("in-year").value = new_athlete.ageGroup;
            } else {
                document.getElementById("in-first-name").disabled = true;
                document.getElementById("in-last-name").disabled = true;
                document.getElementById("in-year").disabled = true;
                document.getElementById("pick-gender").disabled = true;//TODO make working
                document.getElementById("pick-start_class").disabled = true;//TODO make working
                document.getElementById("btn-delete-athlete").disabled = true;//TODO make working

                document.getElementById("in-first-name").value = "";
                document.getElementById("in-last-name").value = "";
                document.getElementById("in-year").value = "";
                // call it a second time because some browsers have problems with the placeholder
                document.getElementById("in-first-name").value = "";
                document.getElementById("in-last-name").value = "";
                document.getElementById("in-year").value = "";
            }
        }
        Meteor._athletes_tracker.changed();
    },

    /**
     * Resets sport types.
     */
    resetSportTypes: function () {
        const ct = getCompetitionTypeByID(NewCompetition.getCompetitionTypeID());
        Session.set(
            NewCompetition.prefix + "sport_types",
            JSON.stringify(_.map(ct.getSports(), function (sportObj) {
                return {stID: sportObj.id, activated: true};
            }))
        );
    },

    /**
     * Sets the name of the new competition.
     * @param {string} name - The new name.
     */
    setName: function (name) {
        Session.set(NewCompetition.prefix + "name", name);
    },

    /**
     * Returns the name of the new competition.
     * @returns {string}
     */
    getName: function () {
        Session.setDefault(NewCompetition.prefix + "name", "Unbenannt");
        return Session.get(NewCompetition.prefix + "name");
    },

    /**
     * Sets the competition type id of the new competition.
     * @param {number} id - The new CompetitionTypeID.
     */
    setCompetitionTypeID: function (id) {
        Session.set(NewCompetition.prefix + "competition_type", id.toString());
        NewCompetition.resetSportTypes();
    },

    /**
     * Returns the competition type id of the new competition.
     * @returns {number}
     */
    getCompetitionTypeID: function () {
        Session.setDefault(NewCompetition.prefix + "competition_type", "0");
        return parseInt(Session.get(NewCompetition.prefix + "competition_type"));
    },

    /**
     * Returns the competition type of the new competition.
     * @returns {object}
     */
    getCompetitionType: function () {
        return getCompetitionTypeByID(NewCompetition.getCompetitionTypeID());
    },

    /**
     * @typedef {Object} NewCompetitionSportTypes
     * @property {string} stID - The sport type id.
     * @property {boolean} activated - Sport type is activated or not.
     */

    /**
     * Sets the sport types of the new competition.
     * @param {NewCompetitionSportTypes[]} sports - The new name.
     */
    setSports: function (sports) {
        Session.set(NewCompetition.prefix + "sport_types", JSON.stringify(sports));
    },

    /**
     * Returns the sport types of the new competition.
     * @returns {NewCompetitionSportTypes[]}
     */
    getSports: function () {
        const ct = getCompetitionTypeByID(NewCompetition.getCompetitionTypeID());
        Session.setDefault(
            NewCompetition.prefix + "sport_types",
            JSON.stringify(_.map(ct.getSports(), function (sportObj) {
                return {stID: sportObj.id, activated: true};
            }))
        );
        return JSON.parse(Session.get(NewCompetition.prefix + "sport_types"));
    },

    /**
     * @typedef {Object} ConfigAthlete
     * @property {string} firstName first-name of the athlete
     * @property {string} lastName last-name of the athlete
     * @property {number} ageGroup Age category of the athlete
     * @property {boolean} isMale Whether or not the athlete is male
     * @property {string} handicap Handicap id of the athlete
     */

    /**
     * @typedef {Object} AthleteGroup
     * @property {string} name - The groups name.
     * @property {ConfigAthlete[]} athletes - List of all athletes. It's not a normal athlete but a ConfigAthlete.
     */

    /**
     * Sets the groups of athletes of the new competition.
     * @param {AthleteGroup[]} groups - The new groups.
     */
    setGroups: function (groups) {
        Session.set(NewCompetition.prefix + "groups", JSON.stringify(groups));
    },

    /**
     * Returns the groups of athletes of the new competition.
     * @returns {AthleteGroup[]}
     */
    getGroups: function () {
        Session.setDefault(NewCompetition.prefix + "groups", JSON.stringify([]));
        return JSON.parse(Session.get(NewCompetition.prefix + "groups"));
    }
};