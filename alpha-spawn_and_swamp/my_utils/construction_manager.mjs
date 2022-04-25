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

import { mover_creep } from '../creep_classes/mover_creep.mjs';
import { constructor_creep } from '../creep_classes/constructor_creep.mjs';
import { defender_creep } from '../creep_classes/defender_creep.mjs';


import { check_for_structure, local_containers_empty, nearest_buildable_tile } from './map_utils.mjs';

import { arenaInfo } from '/game';


export class construction_manager {
  constructor() {
    this.extension_limit = 8;
    this.tower_limit = 0;

    this.ext_grid_center_x_offset = -15; //distance from center of map - positive is towards enemy spawn
    this.map_side_multiplier = 1;
    this.grid_interval = 3;
    this.grid_center = {x:50-(this.ext_grid_center_x_offset*this.map_side_multiplier), y:50};
    this.extension_locations = [
      {x:this.grid_center["x"]+(0*this.grid_interval),y:this.grid_center["y"]+(0*this.grid_interval)},
      {x:this.grid_center["x"]+(1*this.grid_interval),y:this.grid_center["y"]+(-1*this.grid_interval)},
      {x:this.grid_center["x"]+(1*this.grid_interval),y:this.grid_center["y"]+(0*this.grid_interval)},
      {x:this.grid_center["x"]+(1*this.grid_interval),y:this.grid_center["y"]+(1*this.grid_interval)},
      {x:this.grid_center["x"]+(0*this.grid_interval),y:this.grid_center["y"]+(-1*this.grid_interval)},
      {x:this.grid_center["x"]+(0*this.grid_interval),y:this.grid_center["y"]+(1*this.grid_interval)},
      {x:this.grid_center["x"]+(-1*this.grid_interval),y:this.grid_center["y"]+(1*this.grid_interval)},
      {x:this.grid_center["x"]+(-1*this.grid_interval),y:this.grid_center["y"]+(0*this.grid_interval)},
      {x:this.grid_center["x"]+(-1*this.grid_interval),y:this.grid_center["y"]+(-1*this.grid_interval)},
      {x:this.grid_center["x"]+(-1*this.grid_interval),y:this.grid_center["y"]+(-2*this.grid_interval)},
      {x:this.grid_center["x"]+(0*this.grid_interval),y:this.grid_center["y"]+(-2*this.grid_interval)},
      {x:this.grid_center["x"]+(1*this.grid_interval),y:this.grid_center["y"]+(-2*this.grid_interval)},
      {x:this.grid_center["x"]+(-1*this.grid_interval),y:this.grid_center["y"]+(2*this.grid_interval)},
      {x:this.grid_center["x"]+(0*this.grid_interval),y:this.grid_center["y"]+(2*this.grid_interval)},
      {x:this.grid_center["x"]+(1*this.grid_interval),y:this.grid_center["y"]+(2*this.grid_interval)}];
    this.tower_locations = [];
    
    
    

  }

  update() {
    if(getTicks() < 3) {
      this.update_grid();
    } else {
      this.spawn_construction_sites();
    }
  }

  spawn_construction_sites() {
    //console.log("Spawning construction sites");
    
    let site = this.next_construction_site();
    // console.log("Site payload: " + JSON.stringify(site));
    switch(site["type"]) {
      case "extension":
        utils.createConstructionSite(site["coordinates"]["x"],site["coordinates"]["y"], StructureExtension);
        break;
      
      case "tower":
        utils.createConstructionSite(site["coordinates"]["x"],site["coordinates"]["y"], StructureTower);
        break;

      default:
        break;
    }
  }

  next_construction_site() {
    let site;
    let structure_type = "none";
    let extension_site = this.next_extension_construction_site();
    let tower_site = this.next_tower_construction_site();
    if(extension_site) {
      site = extension_site;
      structure_type = "extension";
    } else if (tower_site) {
      site = tower_site;
      structure_type = "tower";
    }
    // console.log("Next Construction Site: " + JSON.stringify({coordinates:site,type:structure_type}));
    return {coordinates:site,type:structure_type};
  }

  next_extension_construction_site() {
    let site_coords;
    for(let i = 0; i < this.extension_limit; i++) {
      let viable_location = nearest_buildable_tile(this.extension_locations[i]);
      // console.log("Viable Location: " + JSON.stringify(viable_location));
      if(!("err" in viable_location)) {
        site_coords = viable_location;
        break;
      }
    }
    return site_coords;
  }

  next_tower_construction_site() {
    let site_coords;
    for(let i = 0; i < this.tower_limit; i++) {
      let viable_location = nearest_buildable_tile(this.tower_locations[i]);
      if(!check_for_structure(viable_location["x"],viable_location["y"])) {
        site_coords = viable_location;
        break;
      }
    }
    return site_coords;
  }

  update_grid() {
    let spawn = utils.getObjectsByPrototype(prototypes.StructureSpawn).find(i => i.my);
    this.map_side_multiplier = spawn.x < 50 ? 1:-1;
    this.grid_interval = 3;
    this.grid_center = {x:50+(this.ext_grid_center_x_offset*this.map_side_multiplier), y:50};
    this.extension_locations = [
      {x:this.grid_center["x"]+(0*this.grid_interval),y:this.grid_center["y"]+(0*this.grid_interval)},
      {x:this.grid_center["x"]+(1*this.grid_interval),y:this.grid_center["y"]+(-1*this.grid_interval)},
      {x:this.grid_center["x"]+(1*this.grid_interval),y:this.grid_center["y"]+(0*this.grid_interval)},
      {x:this.grid_center["x"]+(1*this.grid_interval),y:this.grid_center["y"]+(1*this.grid_interval)},
      {x:this.grid_center["x"]+(0*this.grid_interval),y:this.grid_center["y"]+(-1*this.grid_interval)},
      {x:this.grid_center["x"]+(0*this.grid_interval),y:this.grid_center["y"]+(1*this.grid_interval)},
      {x:this.grid_center["x"]+(-1*this.grid_interval),y:this.grid_center["y"]+(1*this.grid_interval)},
      {x:this.grid_center["x"]+(-1*this.grid_interval),y:this.grid_center["y"]+(0*this.grid_interval)},
      {x:this.grid_center["x"]+(-1*this.grid_interval),y:this.grid_center["y"]+(-1*this.grid_interval)},
      {x:this.grid_center["x"]+(-1*this.grid_interval),y:this.grid_center["y"]+(-2*this.grid_interval)},
      {x:this.grid_center["x"]+(0*this.grid_interval),y:this.grid_center["y"]+(-2*this.grid_interval)},
      {x:this.grid_center["x"]+(1*this.grid_interval),y:this.grid_center["y"]+(-2*this.grid_interval)},
      {x:this.grid_center["x"]+(-1*this.grid_interval),y:this.grid_center["y"]+(2*this.grid_interval)},
      {x:this.grid_center["x"]+(0*this.grid_interval),y:this.grid_center["y"]+(2*this.grid_interval)},
      {x:this.grid_center["x"]+(1*this.grid_interval),y:this.grid_center["y"]+(2*this.grid_interval)}];
  }
  
}