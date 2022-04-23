import * as prototypes from '/game/prototypes';
for (let globalKey in prototypes) { global[globalKey] = prototypes[globalKey];}

import * as constants from '/game/constants';
for (let globalKey in constants) { global[globalKey] = constants[globalKey];}

import * as specConstants from '/arena/constants';
for (let globalKey in specConstants) { global[globalKey] = specConstants[globalKey];}

import * as utils from '/game/utils';
for (let globalKey in utils) { global[globalKey] = utils[globalKey];}

import * as pathing from '/game/path-finder';
for (let globalKey in pathing) { global[globalKey] = pathing[globalKey];}

import * as arenaConstants from '/arena';
for (let globalKey in arenaConstants) { global[globalKey] = arenaConstants[globalKey];}

export function loop() {
    var myCreep = getObjectsByPrototype(Creep).find(creep => creep.my);
    var enemyCreep = getObjectsByPrototype(Creep).find(creep => !creep.my);

    if(myCreep.attack(enemyCreep) == ERR_NOT_IN_RANGE) {
        myCreep.moveTo(enemyCreep);
    }

    console.log(JSON.stringify(searchPath(myCreep,enemyCreep)));
}
