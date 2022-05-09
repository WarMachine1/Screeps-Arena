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


import { check_for_structure, local_containers_empty, nearest_buildable_tile, extensions_full } from './map_utils.mjs';

import { arenaInfo } from '/game';


export class construction_manager {
  constructor() {
    

    this.extension_limit = 0;
    this.extension_goal = 12;
    this.tower_limit = 0;
    this.rampart_limit = 3;

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

    this.rampart_locations = [
      {x: 0, y:0},
      {x: this.map_side_multiplier, y:0},
      {x: -this.map_side_multiplier, y:0}];
    
  }  

  update() {
    if(getTicks() < 2) {
      this.update_grid();
    } else {
      this.spawn_construction_sites();
      this.update_limits();
    }
  }

  update_limits() {
    //if no construction sites and extensions at or below limits increase extension limit
    let no_construction_sites = utils.getObjectsByPrototype(ConstructionSite).filter(i => i.my).length <= 0;
    let extensions_built = utils.getObjectsByPrototype(StructureExtension).filter(i => i.my).length;
    // if(extensions_built < this.extension_goal && no_construction_sites) {
    //   this.extension_limit += 1;
    // }

    if(extensions_full() && no_construction_sites) {
      this.extension_goal += 1;
    }
  }

  spawn_construction_sites() {
    //console.log("Spawning construction sites");
    
    let site = this.next_construction_site();
    // console.log("Site payload: " + JSON.stringify(site));
    switch(site["type"]) {
      case "rampart":
        utils.createConstructionSite(site["coordinates"]["x"],site["coordinates"]["y"], StructureRampart);
        break;

      case "extension":
        utils.createConstructionSite(site["coordinates"]["x"],site["coordinates"]["y"], StructureExtension);
        break;
      
      case "tower":
        utils.createConstructionSite(site["coordinates"]["x"],site["coordinates"]["y"], StructureTower);
        break;

      case "container":
        utils.createConstructionSite(site["coordinates"]["x"],site["coordinates"]["y"], StructureContainer);
        break;

      default:
        break;
    }
  }

  next_construction_site() {
    let site;
    let structure_type = "none";
    // let container_site = this.next_container_construction_site();
    let rampart_site = this.next_rampart_construction_site();
    let extension_site = this.next_extension_construction_site();
    let tower_site = this.next_tower_construction_site();
    

    if(rampart_site) {
      site = rampart_site;
      structure_type = "rampart";
    } else if(extension_site) {
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
      if(!("err" in viable_location)) {
        site_coords = viable_location;
        break;
      }
    }
    return site_coords;
  }

  next_rampart_construction_site() {
    let site_coords;
    var spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);
    for(let i = 0; i < this.rampart_limit; i++) {
      let viable_location = nearest_buildable_tile({x:this.rampart_locations[i]["x"]+spawn.x,y:this.rampart_locations[i]["y"]+spawn.y});
      if(!("err" in viable_location)) {
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

      this.rampart_locations = [
        {x: 0, y:0},
        {x: this.map_side_multiplier, y:0},
        {x: -this.map_side_multiplier, y:0}];
  }

  creep_data() {
    return {
      var_grid_center:this.grid_center,
      var_extension_goal:this.extension_goal
    };
  }
  
}