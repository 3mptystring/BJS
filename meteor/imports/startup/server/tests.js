import {CompetitionTypes} from "../../api/logic/competition_type";
import {Athlete} from "../../api/logic/athlete";
import {genRandomPassword} from "./pwdgen";

export function tests() {
    console.log(CompetitionTypes[0].object.getSports());

    var p = new Athlete('Hans', 'Peter', 16, true, 'Q#z', 'A0');

    console.log(p.checkPerson());
    console.log(p.getFullName());
    console.log(p.getShortName());

    for (var n in _.range(10)) {
        console.log(genRandomPassword(100))
    }
}