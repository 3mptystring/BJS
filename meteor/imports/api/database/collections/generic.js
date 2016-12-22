import {Collection} from './collection';

export let Generic = new Collection('Generic', false, true);

Generic.createMockData = function () {
    this.handle.insert({
        dbVersion: Meteor.config.dbVersion,
        cleanDB: true,
        activeContest: "bjs2016"
    });
};