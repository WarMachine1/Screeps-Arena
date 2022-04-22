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

import { general_creep } from './general_creep'

import { support_cost_matrix } from '../main.mjs';

export class constructor_creep extends general_creep {
    constructor(creep_object) {
        super(creep_object);
        this.request_energy = false;
    }

    behavior() {
        //console.log("Constructor request status: " + this.request_energy);
        // console.log("Constructor Behavior");
        let construction_sites = utils.getObjectsByPrototype(ConstructionSite).filter(i => i.my);
        // console.log("Construction Sites: " + JSON.stringify(construction_sites));
        let closest_construction_site = this.creep_obj.findClosestByPath(construction_sites);
        // console.log("Closest Construction Site: " + JSON.stringify(closest_construction_site));
        // getRange(this.creep_obj,closest_construction_site) > 3 || 

        console.log("Closest Construction Site: " + JSON.stringify(closest_construction_site));
        console.log("Range to closest consturction site: " + getRange(this.creep_obj,closest_construction_site));
        if(getRange(this.creep_obj,closest_construction_site) > 1) {
            console.log("Move command result: " + this.creep_obj.moveTo(closest_construction_site, {costMatrix: support_cost_matrix}));
            this.request_energy = this.creep_obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        } else {
            console.log("Build command result: " + this.creep_obj.build(closest_construction_site));
            this.request_energy = true;
        }
    }
  }