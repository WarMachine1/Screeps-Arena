import { } from '/game/utils';
import { } from '/game/prototypes';
import { } from '/game/constants';
import { } from '/arena';
import { getObjectsByPrototype } from '/game/utils';
import { Creep, Flag, StructureSpawn } from '/game/prototypes';
import { MOVE } from '/game/constants';


var creep1, creep2;

export function loop() {
    var flags = getObjectsByPrototype(Flag);
    var spawn = getObjectsByPrototype(StructureSpawn)[0];

    if(!creep1) {
        creep1 = spawn.spawnCreep([MOVE]).object;
    } else {
        creep1.moveTo(flags[0]);

        if(!creep2) {
            creep2 = spawn.spawnCreep([MOVE]).object;
        } else {
            creep2.moveTo(flags[1]);
        }
    }
}
