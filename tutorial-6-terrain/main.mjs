import { } from '/game/utils';
import { } from '/game/prototypes';
import { } from '/game/constants';
import { } from '/arena';
import { getObjectsByPrototype, findClosestByPath } from '/game/utils';
import { Creep, Flag } from '/game/prototypes';

export function loop() {
    var Creeps = getObjectsByPrototype(Creep).filter(i => i.my)
    var flags = getObjectsByPrototype(Flag);
    for(var creep of Creeps) {
        var closestFlag = creep.findClosestByPath(flags);
        creep.moveTo(closestFlag)
    }
    
}
