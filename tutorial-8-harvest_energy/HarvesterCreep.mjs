import { GeneralCreep } from './GeneralCreep';

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

export class HarvesterCreep extends GeneralCreep {
    constructor(creep_object) {
      super(creep_object)
    }

    behavior() {
        var source = utils.getObjectsByPrototype(prototypes.Source)[0];
        var spawn = utils.getObjectsByPrototype(prototypes.StructureSpawn).find(i => i.my);
        if(this.creep_obj.store.getFreeCapacity(constants.RESOURCE_ENERGY)) {
            if(this.creep_obj.harvest(source) == constants.ERR_NOT_IN_RANGE) {
                this.creep_obj.moveTo(source);
            }
        } else {
            if(this.creep_obj.transfer(spawn, constants.RESOURCE_ENERGY) == constants.ERR_NOT_IN_RANGE) {
                this.creep_obj.moveTo(spawn);
            }
        }
    }
}