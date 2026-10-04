import { Controller } from "@nestjs/common";
import { MasterControllerBase } from "./master.controller";
import { MasterService, type MasterResource } from "./master.service";

@Controller({ path: "categories", version: "1" })
export class CategoriesController extends MasterControllerBase {
  protected readonly resource: MasterResource = "category";
  constructor(service: MasterService) { super(service); }
}

@Controller({ path: "locations", version: "1" })
export class LocationsController extends MasterControllerBase {
  protected readonly resource: MasterResource = "location";
  constructor(service: MasterService) { super(service); }
}

@Controller({ path: "attributes", version: "1" })
export class AttributesController extends MasterControllerBase {
  protected readonly resource: MasterResource = "attributeDefinition";
  constructor(service: MasterService) { super(service); }
}
