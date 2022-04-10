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

import { arenaInfo } from '/game';

export function loop() {
    var creep = utils.getObjectsByPrototype(prototypes.Creep).find(i => i.my);
    if(!creep.store[RESOURCE_ENERGY]) {
        var container = utils.findClosestByPath(creep, utils.getObjectsByPrototype(prototypes.StructureContainer));
        if(creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(container)
        }
    } else {
        var constructionSite = utils.getObjectsByPrototype(prototypes.ConstructionSite).find(i => i.my);
        if(!constructionSite) {
            utils.createConstructionSite({x: 50, y: 55}, StructureTower);
        } else {
            if(creep.build(constructionSite)==ERR_NOT_IN_RANGE) {
                creep.moveTo(constructionSite)
            }
        }
    }
}
