import {Athlete} from './../../imports/api/logic/athlete';
import {chai} from 'meteor/practicalmeteor:chai';
import {COMPETITION_TYPES} from '../../imports/api/logic/competition_type';
chai.should();

const ct = COMPETITION_TYPES[0].object;

describe('athlete', function () {
    it('changes the age of an athlete', function () {
        const p = new Athlete('Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge);

        p.age = p.age + 1;

        p.ageGroup.should.be.equal(1999);
    });
});