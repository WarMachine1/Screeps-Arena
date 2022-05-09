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

import { my_armed_creeps, my_heal_creeps, enemy_armed_creeps, new_center_neutral_containers_mostly_full, new_middle_neutral_containers_mostly_full, nearest_buildable_tile, nearest_buildable_tile_exclude_OG_tile, nearest_buildable_tile_exclude_OG_tile_structures_include } from '../my_utils/map_utils.mjs';

export class constructor_creep extends general_creep {
    constructor(creep_object) {
        super(creep_object);
        this.state_machine_status = "build_regular";
        
        this.previous_state = "build_regular";

        this.emergency_state_machine_status = "find_energy";
        this.danger_range = 10;
        this.safety_range = 13;
        this.closest_viable_energy;
        this.closest_viable_energy_is_container;
        this.rampart_construction_site;


        this.container_construction_site;
        this.extension_construction_site;
        this.target_neutral_container;
        this.target_my_container;
        this.request_energy = false;
        this.support_cost_matrix;
        this.grid_center_local_range = 25;
        this.grid_center = {x:50,y:50};
        this.container_construction_site_coords;
        this.finished_building_container = false;
        this.found_container = false;

        this.extension_goal = 0;
        this.extension_center = {x:0,y:0};

        this.extension_offset_interval = 1;

        this.local_extension_count = 0;
        this.local_extensions = [];
        
        

        this.extension_offset_coords = [
            {x:1*this.extension_offset_interval,y:1*this.extension_offset_interval},
            {x:0*this.extension_offset_interval,y:1*this.extension_offset_interval},
            {x:-1*this.extension_offset_interval,y:1*this.extension_offset_interval},
            {x:1*this.extension_offset_interval,y:-1*this.extension_offset_interval},
            {x:0*this.extension_offset_interval,y:-1*this.extension_offset_interval},
            {x:-1*this.extension_offset_interval,y:-1*this.extension_offset_interval},
        ];

        this.required_time_on_target = 25;

        this.swamp_cost = 2;
        
    }

    behavior() {
        this.update_state();
        console.log("Constructor State: " + this.state_machine_status);
        switch(this.state_machine_status) {
            case "build_regular":
                this.behavior_build_regular();
                break;

            case "enemy_pursuing":
                this.behavior_enemy_pursuing();
                break;

            //states for building extensions
            
            case "container_searching":
                this.behavior_container_searching();
                break;
    
            case "dump_energy":
                this.behavior_dump_energy();
                break;
            
            case "build_extensions":
                this.behavior_build_extensions();
                break;
            
            case "fill_extensions":
                this.behavior_fill_extensions();
                break;

            //states once sufficeint extensions are built

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
        // if(this.target_neutral_container) {
        //     console.log("Target Neutral Container: " + JSON.stringify(this.target_neutral_container));
        // } else {
        //     console.log("Target Neutral Container: undefined");
        // }
        console.log("Constructor State before update: " + this.state_machine_status);
        console.log("Armed creep in range: " + this.enemy_armed_creep_in_range(this.danger_range));

        if(this.enemy_armed_creep_in_range(this.danger_range) && this.state_machine_status != "enemy_pursuing") {
            this.previous_state = this.state_machine_status;
            this.state_machine_status = "enemy_pursuing";
            return;
        }

        let construction_sites = utils.getObjectsByPrototype(ConstructionSite).filter(i => i.my); 
        let neutral_container_despawned;
        let non_container_construction_sites = construction_sites.length > 0;
        let resources = getObjectsByPrototype(Resource);

        let resource_depleted = false;
        let target = this.creep_obj.findClosestByRange(resources);
        if(target) {
            resource_depleted = getRange(this.creep_obj,target) > 3;
        } else {
            resource_depleted = true;
        }

        switch(this.state_machine_status) {

            case "build_regular": 
                let no_assigned_construction_sites = construction_sites.length <= 0;
                let my_extension_count = utils.getObjectsByPrototype(StructureExtension).filter(i => i.my); 

                if(no_assigned_construction_sites && my_extension_count >= this.extension_goal) { 
                    this.state_machine_status = "searching_for_local_container";
                } else if (no_assigned_construction_sites) {
                    this.state_machine_status = "container_searching";
                }
                break;
            
            case "enemy_pursuing":
                // console.log("Safety Range: " + this.safety_range);
                // console.log("Enemy Armed Creep in safety range: " + this.enemy_armed_creep_in_range(this.safety_range));
                // console.log("Previous State: " + this.previous_state);
                if(!this.enemy_armed_creep_in_range(this.safety_range)) {
                    // console.log("Attempting to exit pursuing state");
                    this.state_machine_status = this.previous_state;
                    this.emergency_state_machine_status = "find_energy";
                    this.closest_viable_energy = undefined;
                    this.closest_viable_energy_is_container = undefined;
                    this.rampart_construction_site = undefined;
                }

                
                break;

            //states for building extensions

            case "container_searching":
                //move to dump energy when container is in range (probably 30)
                if(this.target_neutral_container) {
                    this.state_machine_status = "dump_energy";
                } else if (non_container_construction_sites) { 
                    this.state_machine_status = "build_regular";
                    this.found_container = false;
                    this.extension_construction_site = undefined;
                }
                break;
    
            case "dump_energy":
                //move to build extensions if target container is empty
                let target_container_empty = false;
                if(this.target_neutral_container && this.target_neutral_container.exists) {
                    target_container_empty = this.target_neutral_container.store[RESOURCE_ENERGY] <= 0;
                }
                
                if(!this.target_neutral_container || !this.target_neutral_container.exists || target_container_empty) {
                    this.state_machine_status = "build_extensions";
                }
                break;
            
            case "build_extensions":
                //move to fill extensions if all extension coords have an extension built
                // console.log("Local Extension Count: " + this.local_extension_count);
                if(resource_depleted) {
                    this.state_machine_status = "build_regular";
                    this.found_container = false;
                    this.target_neutral_container = undefined;
                    this.local_extensions = [];
                    this.extension_construction_site = undefined;
                    this.local_extension_count = 0;
                } else if(this.local_extension_count == this.extension_offset_coords.length && !this.extension_construction_site.exists) {
                    this.state_machine_status = "fill_extensions";
                }
                break;
            
            case "fill_extensions":
                // move back to build regular if
                // -Local extensions full or resources depleted
                let local_extensions_full = true;
                for(let lc of this.local_extensions) {
                    if(lc.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                        local_extensions_full = false;
                    }
                }
                
                if(local_extensions_full || (resource_depleted && this.creep_obj.store.getUsedCapacity(RESOURCE_ENERGY) <= 0)) {
                    this.state_machine_status = "build_regular";
                    this.local_extensions = [];
                    this.extension_construction_site = undefined;
                    this.local_extension_count = 0;
                    this.target_neutral_container = undefined;
                }
                
                break;

            //states once sufficeint extensions are built
            
            case "searching_for_local_container":
                let no_container_in_range = false;
                if(this.target_neutral_container) {
                    no_container_in_range = getRange(this.grid_center,this.target_neutral_container) > this.grid_center_local_range;
                }

                if(this.found_container && this.container_construction_site) {
                    this.state_machine_status = "build_containers";
                    this.found_container = false;
                } else if( (no_container_in_range && non_container_construction_sites) || !this.target_neutral_container) { 
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
        // console.log("Constructor requesting: " + this.request_energy);
        let construction_sites = utils.getObjectsByPrototype(ConstructionSite).filter(i => i.my);

        if(construction_sites.length > 0) { //non-container construction sites exist and not building construction site
            let closest_construction_site = this.creep_obj.findClosestByRange(construction_sites);
            if(getRange(this.creep_obj,closest_construction_site) > 2) {
                this.creep_obj.moveTo(closest_construction_site, {costMatrix: this.support_cost_matrix, swampCost: this.swamp_cost});
                this.request_energy = false;
            } else {
                this.creep_obj.build(closest_construction_site);
                this.request_energy = this.creep_obj.store.getFreeCapacity(RESOURCE_ENERGY) > (this.creep_obj.store.getCapacity()/2);
            }
        }
    }

    

    //functions for extension building

    behavior_container_searching() {
        this.request_energy = false;
        

        let neutral_containers = utils.getObjectsByPrototype(StructureContainer).filter(i => !i.my);
        let middle_containers_full = neutral_containers.filter(function (c) {
          return c.x >= 15 &&
                c.x <= 85 &&
                c.y >= 15 &&
                c.y <= 85 &&
                c.store.energy > 1950;
        });

        let viable_containers = [];
        for(let c of middle_containers_full) {
            
            let ticks_to_reach = this.ticks_to_reach(c,{costMatrix: this.support_cost_matrix, swampCost: this.swamp_cost});
            let ticks_to_decay = c.ticksToDecay;
            let time_on_target = ticks_to_decay-ticks_to_reach;
            // console.log("Container being analyzed: " + JSON.stringify(c));
            // console.log("ticks to reach: " + ticks_to_reach);
            // console.log("time on target: " + time_on_target);

            if(time_on_target > this.required_time_on_target) {
                viable_containers.push(c);
            }
        }

        let nearest_neutral_container_full = this.creep_obj.findClosestByPath(viable_containers);

        if(nearest_neutral_container_full) {
            this.target_neutral_container = nearest_neutral_container_full;
            this.creep_obj.moveTo(this.target_neutral_container,{costMatrix: this.support_cost_matrix, swampCost: this.swamp_cost});
        } else {
            this.creep_obj.moveTo({x:50,y:50});
        }
        this.creep_obj.drop(RESOURCE_ENERGY);
    }

    behavior_dump_energy() {
        if(getRange(this.creep_obj,this.target_neutral_container) > 1) {
            this.creep_obj.moveTo(this.target_neutral_container,{costMatrix: this.support_cost_matrix, swampCost: this.swamp_cost});
        } else {
            if(this.creep_obj.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
                if(this.creep_obj.withdraw(this.target_neutral_container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    this.creep_obj.moveTo(this.target_neutral_container,{costMatrix: this.support_cost_matrix, swampCost: this.swamp_cost});
                }
            } else {
                this.creep_obj.drop(RESOURCE_ENERGY);
            }
        }
        this.extension_center = {x:this.creep_obj.x,y:this.creep_obj.y};
    }

    behavior_build_extensions() {
        if(this.creep_obj.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) { //grab energy
            let resources = getObjectsByPrototype(Resource);
            let target = this.creep_obj.findClosestByRange(resources);
            if (target) {
                if (this.creep_obj.pickup(target) == ERR_NOT_IN_RANGE) {
                    this.creep_obj.moveTo(target,{costMatrix: this.support_cost_matrix, swampCost: this.swamp_cost});
                }
            }
        } else { //build extensions
            //if construction site
                //build it
            //else
                //spawn construction site
                //build it
            // if(this.extension_construction_site) {
            //     // console.log("Construction site defined");
            //     // console.log("Extension construction site: " + JSON.stringify(this.extension_construction_site));
            // } else {
            //     // console.log("Construction site undefined");
            // }

            

            if(this.extension_construction_site && !this.extension_construction_site.exists) {
                this.local_extensions.push(this.extension_construction_site.structure);
                this.local_extension_count += 1;
            }

            // console.log("this.extension_offset_coords.length: " + this.extension_offset_coords.length);

            if(this.local_extension_count <= this.extension_offset_coords.length) {

                if(this.extension_construction_site && this.extension_construction_site.exists) {
                    // console.log("Check 1");
                    let result = this.creep_obj.build(this.extension_construction_site);
                    // console.log("Build command result: " + result);
                    if(result == ERR_NOT_IN_RANGE) {
                        this.creep_obj.moveTo(this.extension_construction_site);
                    }
                } else {
                    let site_coords;
                    // console.log("Check 2");
                    for(let i = 0; i < this.extension_offset_coords.length; i++) {
                        let viable_location = nearest_buildable_tile({x:this.extension_center["x"]+this.extension_offset_coords[i]["x"],y:this.extension_center["y"]+this.extension_offset_coords[i]["y"]});
                        // console.log("Viable Location: " + JSON.stringify(viable_location));
                        if(!("err" in viable_location)) {
                            // console.log("Check 3");
                            site_coords = viable_location;
                            break;
                        }
                    }
                    // console.log("Site: " + JSON.stringify(site_coords));
                    this.extension_construction_site = utils.createConstructionSite(site_coords["x"],site_coords["y"], StructureExtension).object;
                }
            }
        }
    }

    behavior_fill_extensions() {
        // console.log("Local Extensions: " + JSON.stringify(this.local_extensions));
        if(this.creep_obj.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) { //grab energy
            let resources = getObjectsByPrototype(Resource);
            let target;
            if(resources) {
                target = this.creep_obj.findClosestByRange(resources);
            }
            
            if (target) {
                if (this.creep_obj.pickup(target) == ERR_NOT_IN_RANGE) {
                    this.creep_obj.moveTo(target);
                }
            }
        } else {
            let local_extensions_with_capacity = this.local_extensions;
            for( var i = 0; i < local_extensions_with_capacity.length; i++){
                // console.log("Used Capacity: " + containers[i].store.getUsedCapacity())
                if (local_extensions_with_capacity[i].store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
                    local_extensions_with_capacity.splice(i, 1);
                    i--;
                }
            }
            let closest_local_extension = this.creep_obj.findClosestByRange(local_extensions_with_capacity);
            if(this.creep_obj.transfer(closest_local_extension, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.creep_obj.moveTo(closest_local_extension);
            }
        }
    }

    // functions for container building

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
                    this.creep_obj.moveTo(this.target_neutral_container, {costMatrix: this.support_cost_matrix, swampCost: this.swamp_cost});
                }
            } else {
                if(getRange(this.creep_obj,this.container_construction_site) > 2) {
                    this.creep_obj.moveTo(this.container_construction_site, {costMatrix: this.support_cost_matrix, swampCost: this.swamp_cost});
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
                this.creep_obj.moveTo(this.target_neutral_container, {costMatrix: this.support_cost_matrix, swampCost: this.swamp_cost});
            }
        } else {
            if(this.creep_obj.transfer(this.target_my_container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.creep_obj.moveTo(this.target_my_container, {costMatrix: this.support_cost_matrix, swampCost: this.swamp_cost});
            }
        }
    }

    behavior_enemy_pursuing() {
        this.emergency_behavior();
    }

    emergency_behavior() {
        this.update_emergency_state();
        console.log("Emergency State: " + this.emergency_state_machine_status);
        switch(this.emergency_state_machine_status) {
            case "find_energy":
                this.emergency_behavior_find_energy();
                break;
            
            case "dump_energy":
                this.emergency_behavior_dump_energy();
                break;
            
            case "build_rampart":
                this.emergency_behavior_build_rampart();
                break;

            case "occupy_rampart":
                this.emergency_behavior_occupy_rampart();
                break;

            default:
                break;
        }
    }

    update_emergency_state() {

        switch(this.emergency_state_machine_status) {
            case "find_energy":
                let min_range = 20
                let closest_rampart = findClosestByPath(getObjectsByPrototype(StructureRampart).filter(i => i.my));
                let rampart_range = 9999;
                let energy_range = 9999;
                let work_count = this.get_work_part_count();

                if(closest_rampart) {
                    rampart_range = getRange(this.creep_obj,closest_rampart);
                }

                if(this.closest_viable_energy) {
                    energy_range = getRange(this.creep_obj,this.closest_viable_energy);
                }

                if(rampart_range < min_range+200/work_count || energy_range < 20) {
                    if(rampart_range < energy_range + 200/work_count) {
                        this.emergency_state_machine_status = "occupy_rampart";
                    } else {
                        if(getRange(this.creep_obj,this.closest_viable_energy) <= 1) {
                            this.emergency_state_machine_status = "dump_energy";
                        } else {
                            this.creep_obj.moveTo(this.closest_viable_energy);
                        }
                    }
                }
                break;
            
            case "dump_energy":
                let resources = getObjectsByPrototype(Resource);
                let target;
                if(resources) {
                    target = this.creep_obj.findClosestByRange(resources);
                }
                if(target && target.amount > 225 && getRange(this.creep_obj,target) < 3) { //200 for rampart, 25 for decay buffer
                    this.emergency_state_machine_status = "build_rampart";
                }
                break;
            
            case "build_rampart":
                let construction_site_stopped_existing = false;
                if(this.rampart_construction_site && !this.rampart_construction_site.exists) {
                    construction_site_stopped_existing = true;
                }
                if(construction_site_stopped_existing) {
                    this.emergency_state_machine_status = "occupy_rampart";
                }
                break;

            case "occupy_rampart":
                let occupied_rampart = getObjectsByPrototype(StructureRampart).find(i => i.x == this.creep_obj.x && i.y ==  this.creep_obj.y);
                if(occupied_rampart && occupied_rampart.hits < 50) {
                    this.emergency_state_machine_status = "find_energy";
                    this.closest_viable_energy = undefined;
                    this.closest_viable_energy_is_container = undefined;
                    this.rampart_construction_site = undefined;
                }
                break;

            default:
                break;
        }
    }

    emergency_behavior_find_energy() {
        this.closest_viable_energy = this.find_energy_within_ticks(10,250);
        if(this.closest_viable_energy) {
            console.log("Going to energy");
            // console.log("Closest Viable Energy: " + JSON.stringify(this.closest_viable_energy));
            // console.log("Current Position: " + this.creep_obj.x + ", " + this.creep_obj.y);
            if(!(this.creep_obj.x == this.closest_viable_energy.x && this.creep_obj.y == this.closest_viable_energy.y)) {
                this.creep_obj.moveTo(this.closest_viable_energy,{swampCost: this.swamp_cost});
                // console.log("Path: " + JSON.stringify(searchPath(this.creep_obj,this.closest_viable_energy,{swampCost: this.swamp_cost}).path));
            }
        } else {
            console.log("Fleeing");
            let e_armed_creeps = enemy_armed_creeps();
            if(e_armed_creeps.length > 0) {
                let goals = [];
                e_armed_creeps.forEach(enemy_armed_creep=> goals.push({ "pos": enemy_armed_creep, "range": this.safety_range }));
                let path = searchPath(this.creep_obj, goals, { costMatrix: this.support_cost_matrix, flee: true, swampCost: this.swamp_cost });
                this.creep_obj.moveTo(path.path[0]);
            } else {
                this.creep_obj.moveTo({x:50, y:50});
            }
        }

        if(this.closest_viable_energy && this.creep_obj.withdraw(this.closest_viable_energy)!= ERR_INVALID_TARGET) {
            this.closest_viable_energy_is_container = true;
        } else {
            this.closest_viable_energy_is_container = false;
        }
    }

    emergency_behavior_dump_energy() {
        
        if(this.closest_viable_energy_is_container) {

            if(this.creep_obj.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
                if(this.creep_obj.withdraw(this.closest_viable_energy, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    this.creep_obj.moveTo(this.closest_viable_energy,{swampCost: this.swamp_cost});
                }
            } else {
                this.creep_obj.drop(RESOURCE_ENERGY);
            }
        }

    }

    emergency_behavior_build_rampart() {
        if(!this.rampart_construction_site) {
            let nearest_container = this.creep_obj.findClosestByRange(getObjectsByPrototype(StructureContainer));
            let build_coords;
            if(getRange(this.creep_obj,nearest_container) <= 2) {
                build_coords = nearest_buildable_tile_exclude_OG_tile(nearest_container);
            } else {
                build_coords = nearest_buildable_tile_exclude_OG_tile(this.creep_obj);
            }
            this.rampart_construction_site = utils.createConstructionSite(build_coords, StructureRampart).object;
        }
        // console.log("Rampart Construction Site: " + JSON.stringify(this.rampart_construction_site));
        if(this.creep_obj.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
            let resources = getObjectsByPrototype(Resource);
            let target;
            if(resources) {
                target = this.creep_obj.findClosestByRange(resources);
            }
            if(this.creep_obj.pickup(target) == ERR_NOT_IN_RANGE) {
                this.creep_obj.moveTo(target,{swampCost: this.swamp_cost});
            }
        } else {
            if(this.creep_obj.build(this.rampart_construction_site) ==  ERR_NOT_IN_RANGE) {
                this.creep_obj.moveTo(this.rampart_construction_site,{swampCost: this.swamp_cost});
            }
        }
    }

    emergency_behavior_occupy_rampart() {
        let nearest_rampart = this.creep_obj.findClosestByRange(getObjectsByPrototype(StructureRampart).filter(i => i.my && i.hits > 500));
        console.log("Nearest Rampart: " + JSON.stringify(nearest_rampart));
        if(nearest_rampart && !(nearest_rampart.x == this.creep_obj.x && nearest_rampart.y == this.creep_obj.y)) {
            this.creep_obj.moveTo(nearest_rampart,{swampCost: this.swamp_cost});
        }

        let containers = getObjectsByPrototype(StructureContainer);
        let nearest_container = this.creep_obj.findClosestByRange(containers);
        if(getRange(this.creep_obj,nearest_container) <= 1 && nearest_container.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
            if(this.creep_obj.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                this.creep_obj.drop(RESOURCE_ENERGY);
            } else {
                this.creep_obj.withdraw(nearest_container, RESOURCE_ENERGY)
            }
        } else {
            let resource = getObjectsByPrototype(Resource).find(i => i.x == this.creep_obj.x && i.y == this.creep_obj.y);
            
            if(resource && resource.amount > 0) {
                if(this.rampart_construction_site && this.rampart_construction_site.exists) {
                    console.log("Check 1");
                    if(this.creep_obj.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                        this.creep_obj.build(this.rampart_construction_site);
                    } else {
                        this.creep_obj.pickup(resource);
                    }
                } else {
                    console.log("Check 2");
                    let build_coords = nearest_buildable_tile_exclude_OG_tile_structures_include(this.creep_obj);
                    console.log("New Build Coords: " + JSON.stringify(build_coords));
                    this.rampart_construction_site = utils.createConstructionSite(build_coords, StructureRampart).object;
                }
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

    find_energy_within_ticks(ticks_on_station,min_amount) {
        let resources = utils.getObjectsByPrototype(Resource).filter(i => i.amount > min_amount);
        let containers = utils.getObjectsByPrototype(StructureContainer).filter(i => i.store[RESOURCE_ENERGY] > min_amount);

        let viable_energy = [];

        for(let r of resources) {
            let ticks_moving = this.ticks_to_reach(r, {costMatrix: this.support_cost_matrix, swampCost: this.swamp_cost});
            let amount_upon_arrival = r.amount - ((ticks_on_station + ticks_moving)*2);
            if(amount_upon_arrival >= min_amount) {
                viable_energy.push(r);
            }
        }

        for(let c of containers) {
            let ticks_moving = this.ticks_to_reach(c, {costMatrix: this.support_cost_matrix, swampCost: this.swamp_cost});
            let sufficient_decay = true;
            if(c.ticksToDecay) {
                sufficient_decay = c.ticksToDecay > (ticks_moving + ticks_on_station);
            }
            if(sufficient_decay) {
                viable_energy.push(c);
            }
        }

        return this.creep_obj.findClosestByPath(viable_energy);
    }

    update_data(variables) {
        if("var_support_cost_matrix" in variables) {this.support_cost_matrix = variables["var_support_cost_matrix"]};
        if("var_grid_center_local_range" in variables) {this.grid_center_local_range = variables["var_grid_center_local_range"]};
        if("var_grid_center" in variables) {this.grid_center = variables["var_grid_center"]};
        if("var_extension_goal" in variables) {this.extension_goal = variables["var_extension_goal"]};
    }
}