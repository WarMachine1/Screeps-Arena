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

import { middle_neutral_extensions_mostly_full, nearest_buildable_tile } from '../my_utils/map_utils.mjs';

export class constructor_creep extends general_creep {
    constructor(creep_object) {
        super(creep_object);
        this.request_energy = false;
        this.support_cost_matrix;
        this.grid_center_local_range = 10;
        this.grid_center = {x:50,y:50};
    }

    behavior() {
        //console.log("Constructor request status: " + this.request_energy);
        // console.log("Constructor Behavior");
        let construction_sites = utils.getObjectsByPrototype(ConstructionSite).filter(i => i.my);
        // console.log("Construction Sites: " + JSON.stringify(construction_sites));
        
        // console.log("Closest Construction Site: " + JSON.stringify(closest_construction_site));
        // getRange(this.creep_obj,closest_construction_site) > 3 || 
  
        if(construction_sites.length > 0) {
            let closest_construction_site = this.creep_obj.findClosestByRange(construction_sites);
            // console.log("Closest Construction Site: " + JSON.stringify(closest_construction_site));
            // console.log("Cost Matrix Path: " + JSON.stringify(searchPath(this.creep_obj,closest_construction_site, {costMatrix: this.support_cost_matrix})));
            if(getRange(this.creep_obj,closest_construction_site) > 2) {
                this.creep_obj.moveTo(closest_construction_site, {costMatrix: this.support_cost_matrix});
                this.request_energy = this.creep_obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            } else {
                this.creep_obj.build(closest_construction_site);
                this.request_energy = true;
            }
        } else { //find nearby containers, build new containers adjacent, and transfer energy to my container
            this.request_energy = false;
            let nearest_neutral_container_full = this.grid_center.findClosestByRange(middle_neutral_extensions_mostly_full());
            if(getRange(this.creep_obj,nearest_neutral_container_full < this.grid_center_local_range)) {
                let closest_construction_site_to_container = nearest_neutral_container_full.findClosestByRange(construction_sites);
                if(getRange(nearest_neutral_container_full,closest_construction_site_to_container) > 2) {
                    let viable_location = nearest_buildable_tile(this.extension_locations[i]);
                    if(!("err" in viable_location)) {
                        utils.createConstructionSite(viable_location["x"],viable_location["y"], StructureContainer);
                    }
                }
            }
        }
    }

    update_data(variables) {
        if("var_support_cost_matrix" in variables) {this.support_cost_matrix = variables["var_support_cost_matrix"]};
        if("var_grid_center_local_range" in variables) {this.grid_center_local_range = variables["var_grid_center_local_range"]};
        if("var_grid_center" in variables) {this.grid_center = variables["var_grid_center"]};
    }
}