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

import { new_middle_neutral_containers_mostly_full, nearest_buildable_tile, nearest_buildable_tile_exclude_OG_tile } from '../my_utils/map_utils.mjs';

export class constructor_creep extends general_creep {
    constructor(creep_object) {
        super(creep_object);
        this.state_machine_status = "build_regular";
        this.container_construction_site;
        this.target_neutral_container;
        this.target_my_container;
        this.request_energy = false;
        this.support_cost_matrix;
        this.grid_center_local_range = 25;
        this.grid_center = {x:50,y:50};
        this.container_construction_site_coords;
        this.finished_building_container = false;
        this.found_container = false;
        
    }

    behavior() {
        this.update_state();
        switch(this.state_machine_status) {
            case "build_regular":
                this.behavior_build_regular();
                break;

            case "searching_for_local_container":
                this.behavior_searching_for_local_container();
                break;

            case "build_containers":
                this.behavior_build_containers();
                break;

            case "transfer":
                this.behavior_transfer();
                break;

            default:
                break;
        }

    }

    update_state() {
        let construction_sites = utils.getObjectsByPrototype(ConstructionSite).filter(i => i.my); 
        let neutral_container_despawned;
        switch(this.state_machine_status) {
            
            case "build_regular": 
                let no_assigned_construction_sites = construction_sites.length <= 0;
                if(no_assigned_construction_sites) { 
                    this.state_machine_status = "searching_for_local_container";
                }
                break;
            
            case "searching_for_local_container":
                let nearest_neutral_container_full = findClosestByRange(this.grid_center,new_middle_neutral_containers_mostly_full());
                let no_container_in_range = false;
                if(nearest_neutral_container_full) {
                    no_container_in_range = getRange(this.grid_center,nearest_neutral_container_full) > this.grid_center_local_range;
                }
                let non_container_construction_sites = construction_sites.length > 0;

                if(this.found_container && this.container_construction_site) {
                    this.state_machine_status = "build_containers";
                    this.found_container = false;;
                } else if( no_container_in_range && non_container_construction_sites) { 
                    this.state_machine_status = "build_regular";
                    this.found_container = false;
                    this.container_construction_site = undefined;
                }
                break;

            case "build_containers":
                neutral_container_despawned = false;
                if(!this.target_neutral_container.exists) { 
                    neutral_container_despawned = true;
                }
                
                if(neutral_container_despawned) {
                    this.state_machine_status = "searching_for_local_container";
                    this.finished_building_container = false;
                    this.construction_site_coords = undefined;
                    this.container_construction_site.remove();
                    this.container_construction_site = undefined;
                } else if( this.finished_building_container && this.target_my_container ) {
                    this.state_machine_status = "transfer";
                    this.finished_building_container = false;
                }
                break;

            case "transfer":
                neutral_container_despawned = false;
                let neutral_container_empty = false;
                if(!this.target_neutral_container.exists) { 
                    neutral_container_despawned = true;
                    // console.log("Neutral container despawned during transfer");
                } else {
                    neutral_container_empty = this.target_neutral_container.store.getUsedCapacity(RESOURCE_ENERGY) <= 0;
                }
                let no_stored_energy = this.creep_obj.store.getUsedCapacity(RESOURCE_ENERGY) <= 0;
                let my_container_full = this.target_my_container.store.getFreeCapacity(RESOURCE_ENERGY) <= 0;
                // console.log("Neutral container empty: " + neutral_container_empty);
                

                if( (neutral_container_despawned || neutral_container_empty) && (no_stored_energy || my_container_full)) {
                    this.state_machine_status = "build_regular";
                    this.target_my_container = undefined;
                    this.container_construction_site = undefined;
                }
                break;

            default:
                break;
        }
    }

    behavior_build_regular() {
        let construction_sites = utils.getObjectsByPrototype(ConstructionSite).filter(i => i.my);

        if(construction_sites.length > 0) { //non-container construction sites exist and not building construction site
            let closest_construction_site = this.creep_obj.findClosestByRange(construction_sites);
            if(getRange(this.creep_obj,closest_construction_site) > 2) {
                this.creep_obj.moveTo(closest_construction_site, {costMatrix: this.support_cost_matrix, swampCost: 2});
                this.request_energy = this.creep_obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            } else {
                this.creep_obj.build(closest_construction_site);
                this.request_energy = true;
            }
        }
    }

    behavior_searching_for_local_container() {
        this.request_energy = false;
        let nearest_neutral_container_full = findClosestByRange(this.grid_center,new_middle_neutral_containers_mostly_full());
        if(getRange(this.grid_center,nearest_neutral_container_full) < this.grid_center_local_range) {
            let viable_location = nearest_buildable_tile_exclude_OG_tile(nearest_neutral_container_full);
            if(!("err" in viable_location)) {
                this.target_neutral_container = nearest_neutral_container_full;
                this.container_construction_site = utils.createConstructionSite(viable_location["x"],viable_location["y"], StructureContainer).object;
                this.construction_site_coords = {x:viable_location["x"],y:viable_location["y"]};
                this.found_container = true;
            }
        }
        this.creep_obj.moveTo(this.grid_center);
    }

    behavior_build_containers() {
        //create construction site if non-existent
        this.request_energy = false;

        let container_completed = this.find_my_container_at_coords(this.construction_site_coords);
        if(container_completed) {
            this.finished_building_container = true;
            this.target_my_container = container_completed;
        } else {
            if(this.creep_obj.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) { //no energy => withdraw from target neutral container
                if(this.creep_obj.withdraw(this.target_neutral_container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    this.creep_obj.moveTo(this.target_neutral_container, {costMatrix: this.support_cost_matrix, swampCost: 2});
                }
            } else {
                if(getRange(this.creep_obj,this.container_construction_site) > 2) {
                    this.creep_obj.moveTo(this.container_construction_site, {costMatrix: this.support_cost_matrix, swampCost: 2});
                } else {
                    this.creep_obj.build(this.container_construction_site);
                }
            }
        }
    }

    behavior_transfer() {
        this.request_energy = false;
        if(this.creep_obj.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) { //no energy => withdraw from target neutral container
            if(this.creep_obj.withdraw(this.target_neutral_container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.creep_obj.moveTo(this.target_neutral_container, {costMatrix: this.support_cost_matrix, swampCost: 2});
            }
        } else {
            if(this.creep_obj.transfer(this.target_my_container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.creep_obj.moveTo(this.target_my_container, {costMatrix: this.support_cost_matrix, swampCost: 2});
            }
        }
    }

    find_my_container_at_coords(coords) {
        let result_container;
        let my_containers = utils.getObjectsByPrototype(StructureContainer);
        for(let c of my_containers) {
            if(c.x == coords["x"] && c.y == coords["y"]) {
                result_container = c;
            }
        }
        return result_container;
    }

    update_data(variables) {
        if("var_support_cost_matrix" in variables) {this.support_cost_matrix = variables["var_support_cost_matrix"]};
        if("var_grid_center_local_range" in variables) {this.grid_center_local_range = variables["var_grid_center_local_range"]};
        if("var_grid_center" in variables) {this.grid_center = variables["var_grid_center"]};
    }
}