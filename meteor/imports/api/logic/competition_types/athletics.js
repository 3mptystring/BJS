import {Log} from "../../log";

export {Athletics};

let LANG = require('./../../../data/athletics/lang_de.json');
let START_CLASSES = require('./../../../data/start_classes.json');

let Athletics = {
    /**
     * Returns a list of sport types associated with the ct athletics.
     * @returns {{id: string, name: string, category: number, description: string, age_w: number[], age_m: number[]}[]}
     */
    getSports: function () {
        return require('./../../../data/athletics/sports.json');
    },

    /**
     * Returns whether a given athlete can do the sport type with the id st_id.
     * @param athlete
     * @param {string} st_id
     * @returns {*[]}
     */
    canDoSportType: function (athlete, st_id) {

        var log = new Log();

        //collect information
        var base_information = _.find(this.getSports(), function (st) {
            return st.id === st_id;
        });

        if (!base_information) {
            log.addError(st_id + " is not a valid sport type id.");
            return [false, undefined, log];
        }

        let gender_info = athlete.is_male ? base_information.m : base_information.w;
        let handicap_data = gender_info.score_calculation.conversion_factor[athlete.handicap];

        let data_object = {
            st_id: st_id,
            name: base_information.name,
            category: base_information.category,
            gender_info: gender_info,
            conversion_factor: handicap_data === undefined ? 1.0 : handicap_data
        };

        var can_do_sport = true;

        if (_.indexOf(data_object.gender_info.age, athlete.age) == -1) {
            log.addWarning(athlete.getFullName() + " does not have a valid age for " + base_information.name + ".");
            can_do_sport = false;
        }

        if (data_object.conversion_factor === 0.0) {
            log.addWarning(athlete.getFullName() + " can not do " + base_information.name + " because of the start class " + athlete.handicap + ".");
            can_do_sport = false;
        }

        return [can_do_sport, data_object, log];
    },


    /**
     * Validates the data of an athlete and adds more information to it. A copy of the data is returned. Without the write_private_hash the data is just decrypted without a write-permission check.
     * @param athlete
     * @param group_private_hash
     * @param write_private_hash
     * @returns {Array}
     */
    getValidData: function (athlete, group_private_hash, write_private_hash) {
        // let sports = this.getSports();

        var [tmp_data, log] = athlete.data.getPlain(group_private_hash, write_private_hash);

        // filter data with more then on point
        tmp_data = _.filter(tmp_data, function (data_object) {
            return data_object.measurement > 0;
        });

        var that = this; //TODO alternative?

        // Add information
        tmp_data = _.map(tmp_data, function (data_object) {
            let [can_do_sport, new_data_object, new_log] = that.canDoSportType(athlete, data_object.st_id);
            log.merge(new_log);
            if (new_data_object !== undefined) {
                new_data_object.measurement = data_object.measurement;
            }
            return can_do_sport ? new_data_object : undefined;
        });

        // filter undefined
        tmp_data = _.filter(tmp_data, function (data_value) {
            return data_value !== undefined;
        });

        return [tmp_data, log];
    },

    /**
     * Returns whether an athlete is already finished.
     * @param athlete
     * @returns {boolean}
     */
    validate: function (athlete) {
        var [validData, log] = this.getValidData(athlete);
        console.log(validData); //TODO remove
        var categories = [false, false, false, false];
        for (var st in validData) {
            categories[validData[st].category] = true;
        }

        return [
            3 <= _.filter(categories, function (category) {
                return category;
            }).length,
            log
        ];
    },

    /**
     * Calculates the score of one data_object returned by the getValidData function.
     * @param data_object
     * @returns {number}
     */
    calculateOne: function (data_object) {
        var calculate_function;

        switch (data_object.st_id) {
            case "st_sprint_50_el":
            case "st_sprint_75_el":
            case "st_sprint_100_el":
            case "st_endurance_800":
            case "st_endurance_1000":
            case "st_endurance_2000":
            case "st_endurance_3000":
                calculate_function = function (d, m, a, c) {
                    return ((d / m) - a) / c;
                };
                break;
            case "st_sprint_50":
            case "st_sprint_75":
            case "st_sprint_100":
                calculate_function = function (d, m, a, c) {
                    return ((d / (m + 0.24)) - a) / c;
                };
                break;
            default:
                calculate_function = function (d, m, a, c) {
                    return ( Math.sqrt(m) - a) / c;
                };
        }

        return Math.floor(calculate_function(data_object.gender_info.score_calculation.d, data_object.conversion_factor * data_object.measurement, data_object.gender_info.score_calculation.a, data_object.gender_info.score_calculation.c));
    },

    /**
     * Calculates the score archived by a athlete. In case of incomplete data, the function will calculate as much as possible.
     * @param athlete
     * @returns {*[]}
     */
    calculate: function (athlete) {
        var [validData, log] = this.getValidData(athlete);

        var scores = [0, 0, 0, 0];

        for (var vd in validData) {
            let score = this.calculateOne(validData[vd]);
            let category = validData[vd].category;

            log.addInfo(validData[vd].name + ': ' + score);
            if (scores[category] < score) {
                scores[category] = score;
            }
        }

        return [_.reduce(_.sortBy(scores, function (num) {
            return num;
        }).splice(1, 3), function (mem, num) {
            return mem + num;
        }, 0), log];
    },

    /**
     * Returns information about the ct athletics.
     */
    getInformation: function () {
        return require('./../../../data/athletics/information.json');
    },
};